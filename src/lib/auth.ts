import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/lib/auth.config'
import { checkSlackActivity } from '@/lib/slack'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      // Only run workspace check for Slack OAuth (not for other providers)
      if (account?.provider !== 'slack') return true

      const workspaceId = process.env.SLACK_WORKSPACE_ID
      if (!workspaceId) {
        // No workspace ID configured — skip check (safe for development)
        return true
      }

      // Slack profile includes team_id with the identity.team scope
      const slackProfile = profile as { team_id?: string } | undefined
      if (slackProfile?.team_id !== workspaceId) {
        return false
      }

      return true
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'slack' && user.id) {
        // Check if this is a first-time sign-in (slackUserId not yet set)
        const existing = await prisma.user
          .findUnique({ where: { id: user.id }, select: { slackUserId: true, status: true } })
          .catch(() => null)

        const slackUserId = account.providerAccountId ?? undefined
        const slackUsername = (profile as { name?: string } | undefined)?.name ?? undefined

        if (!existing?.slackUserId) {
          // First sign-in — run activity check to auto-approve or set pending
          const status = await checkSlackActivity(slackUserId ?? '')
          await prisma.user
            .update({ where: { id: user.id }, data: { slackUserId, slackUsername, status } })
            .catch((err) => console.warn('Failed to set initial user status:', err))
        } else {
          // Returning user — sync profile fields only
          await prisma.user
            .update({ where: { id: user.id }, data: { slackUserId, slackUsername } })
            .catch((err) => console.warn('Failed to sync Slack fields:', err))
        }
      }
    },
  },
})
