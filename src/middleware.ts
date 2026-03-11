import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const session = req.auth
  const { pathname } = req.nextUrl

  // Public routes — always allow through
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/pending' ||
    pathname === '/suspended' ||
    pathname.startsWith('/r/') ||
    pathname.startsWith('/api/auth/')
  ) {
    return NextResponse.next()
  }

  // No session → redirect to login
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { status, role } = session.user as { status?: string; role?: string }

  // PENDING → redirect to pending page (account under review)
  if (status === 'PENDING') {
    return NextResponse.redirect(new URL('/pending', req.url))
  }

  // SUSPENDED → redirect to suspended page
  if (status === 'SUSPENDED') {
    return NextResponse.redirect(new URL('/suspended', req.url))
  }

  // Admin routes → ADMIN role required
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return new NextResponse(null, { status: 403 })
  }

  return NextResponse.next()
})

export const config = {
  // Match all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
