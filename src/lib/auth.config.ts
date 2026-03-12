import type { NextAuthConfig, DefaultSession } from 'next-auth'
import Slack from 'next-auth/providers/slack'

// Extend Auth.js types with our custom user fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      status: string
    } & DefaultSession['user']
  }

  interface User {
    role?: string
    status?: string
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string
    role?: string
    status?: string
  }
}

export const authConfig = {
  providers: [
    Slack({
      clientId: process.env.SLACK_CLIENT_ID ?? '',
      clientSecret: process.env.SLACK_CLIENT_SECRET ?? '',
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      // On first sign-in, `user` is populated from the adapter/profile
      if (user) {
        token.id = user.id
        token.role = user.role ?? 'MEMBER'
        token.status = user.status ?? 'PENDING'
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string | undefined) ?? ''
        session.user.role = (token.role as string | undefined) ?? 'MEMBER'
        session.user.status = (token.status as string | undefined) ?? 'PENDING'
      }
      return session
    },
  },
} satisfies NextAuthConfig
