import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { checkSlackActivity } from "@/lib/slack";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider !== "slack") return true;

      const workspaceId = process.env.SLACK_WORKSPACE_ID;
      if (!workspaceId) {
        return true;
      }

      const slackProfile = profile as { team_id?: string } | undefined;
      if (slackProfile?.team_id !== workspaceId) {
        return false;
      }

      return true;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "slack" && user.id) {
        const existing = await prisma.user
          .findUnique({
            where: { id: user.id },
            select: { slackUserId: true, status: true },
          })
          .catch(() => null);

        const slackUserId = account.providerAccountId ?? undefined;
        const slackUsername =
          (profile as { name?: string } | undefined)?.name ?? undefined;

        if (!existing?.slackUserId) {
          const status = await checkSlackActivity(slackUserId ?? "");
          await prisma.user
            .update({
              where: { id: user.id },
              data: { slackUserId, slackUsername, status },
            })
            .catch((err: unknown) =>
              console.warn("Failed to set initial user status:", err),
            );
        } else {
          await prisma.user
            .update({
              where: { id: user.id },
              data: { slackUserId, slackUsername },
            })
            .catch((err: unknown) =>
              console.warn("Failed to sync Slack fields:", err),
            );
        }
      }
    },
  },
});
