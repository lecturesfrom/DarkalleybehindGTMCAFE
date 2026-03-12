import NextAuth from "next-auth";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import Slack from "next-auth/providers/slack";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { WebClient } from "@slack/web-api";
import { prisma } from "@/lib/prisma";
import type { UserRole, UserStatus } from "@prisma/client";

// ─── Type augmentation ───────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: UserStatus;
      slackUserId: string | null;
    } & DefaultSession["user"];
  }
}

// ─── Slack profile shape ─────────────────────────────────────────────────────

interface SlackProfile {
  "https://slack.com/user_id": string;
  "https://slack.com/team_id": string;
  name: string;
  email: string;
  picture: string;
  [key: string]: unknown;
}

// ─── Auth.js configuration ────────────────────────────────────────────────────

export const authConfig = {
  adapter: PrismaAdapter(prisma),

  providers: [
    // Auth.js v5 Slack provider uses Slack's OIDC flow by default.
    // Profile claims are namespaced: https://slack.com/user_id, https://slack.com/team_id
    // Default scopes (openid email profile) include team_id claim — don't override.
    Slack({
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    /**
     * Fires after OAuth succeeds, before session is created.
     * Used for:
     *   1. Workspace gate — reject non-GTM-Cafe members
     *   2. Activity check — auto-approve accounts > 30 days old
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "slack" || !profile) return false;

      const slackProfile = profile as SlackProfile;
      const teamId = slackProfile["https://slack.com/team_id"];
      const slackUserId = slackProfile["https://slack.com/user_id"];

      // 1. Workspace gate — only GTM Cafe members allowed
      if (teamId !== process.env.SLACK_WORKSPACE_ID) {
        console.warn(
          `[auth] Rejected sign-in: team ${teamId} !== expected ${process.env.SLACK_WORKSPACE_ID}`,
        );
        return false;
      }

      // 2. Sync Slack fields onto user record
      await prisma.user.upsert({
        where: { email: user.email! },
        update: {
          slackUserId,
          slackUsername: slackProfile.name,
          image: slackProfile.picture,
          name: slackProfile.name,
        },
        create: {
          email: user.email!,
          name: slackProfile.name,
          image: slackProfile.picture,
          slackUserId,
          slackUsername: slackProfile.name,
          // status defaults to PENDING (from schema)
        },
      });

      // 3. Activity check — only for new users that are still PENDING
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
        select: { status: true },
      });

      if (dbUser?.status === "PENDING" && process.env.SLACK_BOT_TOKEN) {
        try {
          const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
          const info = await slack.users.info({ user: slackUserId });

          // Slack returns created as a Unix epoch (seconds)
          const created = (info.user as { created?: number } | undefined)
            ?.created;

          if (created) {
            const ageMs = Date.now() - created * 1000;
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

            if (ageMs > thirtyDaysMs) {
              await prisma.user.update({
                where: { email: user.email! },
                data: { status: "ACTIVE" },
              });
            }
          }
        } catch (err) {
          // Non-fatal — user stays PENDING, admin reviews
          console.error("[auth] Slack users.info failed:", err);
        }
      }

      return true;
    },

    /**
     * Attach role, status, slackUserId to JWT token so middleware
     * can check permissions without a DB round-trip per request.
     *
     * Triggers:
     *   "signIn" / "signUp" → full hydration from DB
     *   undefined (token refresh) → re-read role/status so admin changes propagate
     */
    async jwt({ token, trigger }) {
      if (trigger === "signIn" || trigger === "signUp") {
        // Full hydration on first sign-in
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { id: true, role: true, status: true, slackUserId: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.slackUserId = dbUser.slackUserId;
        }
      } else if (token.id) {
        // On subsequent refreshes, re-read role/status so admin changes take effect
        // without requiring a full sign-out/sign-in cycle.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, status: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      }

      return token;
    },

    /**
     * Expose role, status, slackUserId on the client-readable session object.
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as UserStatus;
        session.user.slackUserId = token.slackUserId as string | null;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
