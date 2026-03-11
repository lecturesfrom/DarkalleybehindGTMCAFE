import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/lib/auth.config'

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
      // Sync Slack-specific fields to User record after successful sign-in
      if (account?.provider === 'slack' && user.id) {
        await prisma.user
          .update({
            where: { id: user.id },
            data: {
              // providerAccountId is always the Slack user ID (e.g. U1234567890)
              slackUserId: account.providerAccountId ?? undefined,
              // Slack normalized profile has `name` from identity.basic scope
              slackUsername: (profile as { name?: string } | undefined)?.name ?? undefined,
            },
          })
          .catch((err) => {
            // Non-fatal: user record may not exist yet on first sign-in
            console.warn('Failed to sync Slack fields:', err)
          })
      }
    },
  },
})
