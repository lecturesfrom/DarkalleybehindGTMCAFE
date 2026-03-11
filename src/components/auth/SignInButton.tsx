'use client'

import { signIn } from 'next-auth/react'

export function SignInButton() {
  return (
    <button
      onClick={() => signIn('slack', { callbackUrl: '/dashboard' })}
      className="w-full flex items-center justify-center gap-3 rounded-md px-5 py-3 text-sm font-semibold transition-all duration-150 active:scale-95"
      style={{
        backgroundColor: '#00FF88',
        color: '#0A0A0F',
        boxShadow: '0 0 16px rgba(0, 255, 136, 0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#00CC6A'
        e.currentTarget.style.boxShadow = '0 0 24px rgba(0, 255, 136, 0.5)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#00FF88'
        e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 255, 136, 0.3)'
      }}
    >
      {/* Slack logo mark */}
      <SlackIcon />
      Sign in with Slack
    </button>
  )
}

function SlackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.7 31.2a3.3 3.3 0 0 1-3.3 3.3 3.3 3.3 0 0 1-3.3-3.3 3.3 3.3 0 0 1 3.3-3.3h3.3v3.3z" fill="#0A0A0F" />
      <path d="M21.3 31.2a3.3 3.3 0 0 1 3.3-3.3 3.3 3.3 0 0 1 3.3 3.3v8.3a3.3 3.3 0 0 1-3.3 3.3 3.3 3.3 0 0 1-3.3-3.3v-8.3z" fill="#0A0A0F" />
      <path d="M24.6 19.7a3.3 3.3 0 0 1-3.3-3.3 3.3 3.3 0 0 1 3.3-3.3 3.3 3.3 0 0 1 3.3 3.3v3.3h-3.3z" fill="#0A0A0F" />
      <path d="M24.6 21.3a3.3 3.3 0 0 1 3.3 3.3 3.3 3.3 0 0 1-3.3 3.3h-8.3a3.3 3.3 0 0 1-3.3-3.3 3.3 3.3 0 0 1 3.3-3.3h8.3z" fill="#0A0A0F" />
      <path d="M36.3 24.6a3.3 3.3 0 0 1 3.3-3.3 3.3 3.3 0 0 1 3.3 3.3 3.3 3.3 0 0 1-3.3 3.3h-3.3v-3.3z" fill="#0A0A0F" />
      <path d="M34.7 24.6a3.3 3.3 0 0 1-3.3 3.3 3.3 3.3 0 0 1-3.3-3.3v-8.3a3.3 3.3 0 0 1 3.3-3.3 3.3 3.3 0 0 1 3.3 3.3v8.3z" fill="#0A0A0F" />
      <path d="M31.4 36.3a3.3 3.3 0 0 1 3.3 3.3 3.3 3.3 0 0 1-3.3 3.3 3.3 3.3 0 0 1-3.3-3.3v-3.3h3.3z" fill="#0A0A0F" />
      <path d="M31.4 34.7a3.3 3.3 0 0 1-3.3-3.3 3.3 3.3 0 0 1 3.3-3.3h8.3a3.3 3.3 0 0 1 3.3 3.3 3.3 3.3 0 0 1-3.3 3.3h-8.3z" fill="#0A0A0F" />
    </svg>
  )
}
