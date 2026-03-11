import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserMenu } from '@/components/nav/UserMenu'
import { BottomBar } from '@/components/nav/BottomBar'
import { LayoutDashboard, Plus, Shuffle, Link2 } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/submit', label: 'Drop a Link', icon: Plus },
  { href: '/request', label: 'Raffle', icon: Shuffle },
  { href: '/my-links', label: 'My Links', icon: Link2 },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) redirect('/login')
  if (session.user.status === 'PENDING') redirect('/pending')
  if (session.user.status === 'SUSPENDED') redirect('/login')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Top nav */}
      <header
        className="sticky top-0 z-20 h-14 flex items-center px-4 md:px-6 border-b"
        style={{ backgroundColor: '#141420', borderColor: '#2A2A3E' }}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 mr-8 shrink-0"
          style={{ textDecoration: 'none' }}
        >
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: '#00FF88', fontFamily: 'var(--font-mono, monospace)' }}
          >
            GTM Raffle
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-md text-sm transition-colors duration-150"
              style={{ color: '#9494A8' }}
              onMouseEnter={undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* User menu (right) */}
        <div className="ml-auto">
          <UserMenu name={session.user.name} image={session.user.image} />
        </div>
      </header>

      {/* Page content */}
      <main className="pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile bottom bar */}
      <BottomBar />
    </div>
  )
}
