import { SignInButton } from '@/components/auth/SignInButton'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0A0A0F' }}>
      <div
        className="w-full max-w-md rounded-xl p-8 flex flex-col items-center gap-6"
        style={{ backgroundColor: '#141420', border: '1px solid #2A2A3E' }}
      >
        {/* Logo / wordmark */}
        <div className="text-center">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: '#5C5C72', fontFamily: 'var(--font-mono, monospace)' }}>
            GTM Cafe
          </p>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: '#00FF88', fontFamily: 'var(--font-mono, monospace)' }}
          >
            Raffle
          </h1>
          <p className="mt-3 text-sm" style={{ color: '#9494A8' }}>
            Member-only referral links, raffled fairly.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px" style={{ backgroundColor: '#2A2A3E' }} />

        {/* Sign in */}
        <div className="w-full flex flex-col items-center gap-4">
          <SignInButton />
          <p className="text-xs text-center" style={{ color: '#5C5C72' }}>
            GTM Cafe workspace members only.
          </p>
        </div>

        {/* Atmosphere */}
        <p className="text-xs mt-2" style={{ color: '#5C5C72', fontFamily: 'var(--font-mono, monospace)' }}>
          &#47;&#47; the dark alley behind gtm cafe
        </p>
      </div>
    </main>
  )
}
