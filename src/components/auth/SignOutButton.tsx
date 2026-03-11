'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-xs transition-colors duration-150"
      style={{ color: '#5C5C72' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#9494A8' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#5C5C72' }}
    >
      Sign out
    </button>
  )
}
