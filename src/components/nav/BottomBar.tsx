'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Plus, Shuffle, Link2 } from 'lucide-react'

const tabs = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/submit', icon: Plus, label: 'Drop' },
  { href: '/request', icon: Shuffle, label: 'Raffle' },
  { href: '/my-links', icon: Link2, label: 'My Links' },
]

export function BottomBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 flex md:hidden items-center justify-around h-16 border-t"
      style={{ backgroundColor: '#141420', borderColor: '#2A2A3E' }}
    >
      {tabs.map(({ href, icon: Icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors duration-150"
            style={{ color: active ? '#00FF88' : '#5C5C72' }}
          >
            <Icon
              size={20}
              style={{
                color: active ? '#00FF88' : '#5C5C72',
                filter: active ? 'drop-shadow(0 0 4px rgba(0,255,136,0.5))' : undefined,
              }}
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
