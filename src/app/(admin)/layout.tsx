import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Package, Link2, ArrowLeft } from 'lucide-react'

const adminLinks = [
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/links', label: 'Links', icon: Link2 },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Sidebar */}
      <aside
        className="w-52 shrink-0 flex flex-col border-r"
        style={{ backgroundColor: '#141420', borderColor: '#2A2A3E' }}
      >
        {/* Admin header */}
        <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: '#2A2A3E' }}>
          <span
            className="text-sm font-semibold tracking-widest uppercase"
            style={{ color: '#FFB800', fontFamily: 'var(--font-mono, monospace)' }}
          >
            Admin
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 p-2 flex-1">
          {adminLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-150"
              style={{ color: '#9494A8' }}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Back to app */}
        <div className="p-2 border-t" style={{ borderColor: '#2A2A3E' }}>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors duration-150"
            style={{ color: '#5C5C72' }}
          >
            <ArrowLeft size={13} />
            Back to app
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
