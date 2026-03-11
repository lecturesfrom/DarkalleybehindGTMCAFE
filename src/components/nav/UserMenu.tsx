'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { LogOut, User, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface UserMenuProps {
  name: string | null | undefined
  image: string | null | undefined
}

export function UserMenu({ name, image }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150"
        style={{ color: '#9494A8' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#F0F0F5' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#9494A8' }}
      >
        {/* Avatar */}
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name ?? 'User'} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ backgroundColor: '#222238', color: '#00FF88' }}
          >
            {initials}
          </span>
        )}
        <span className="hidden sm:block max-w-[120px] truncate" style={{ color: '#F0F0F5', fontSize: '0.8125rem' }}>
          {name ?? 'Member'}
        </span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div
            className="absolute right-0 top-full mt-1 w-44 rounded-lg py-1 z-20"
            style={{ backgroundColor: '#222238', border: '1px solid #2A2A3E', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
          >
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-100"
              style={{ color: '#9494A8' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#F0F0F5' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9494A8' }}
            >
              <User size={14} />
              Profile
            </Link>
            <div className="my-1 h-px" style={{ backgroundColor: '#2A2A3E' }} />
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-100"
              style={{ color: '#9494A8' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FF4757' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9494A8' }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
