import { SignOutButton } from '@/components/auth/SignOutButton'
import { Clock } from 'lucide-react'

export default function PendingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0A0A0F' }}>
      <div
        className="w-full max-w-md rounded-xl p-8 flex flex-col items-center gap-6"
        style={{ backgroundColor: '#141420', border: '1px solid #2A2A3E' }}
      >
        {/* Status badge */}
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase"
          style={{ backgroundColor: 'rgba(255, 184, 0, 0.12)', color: '#FFB800', border: '1px solid rgba(255, 184, 0, 0.25)' }}
        >
          <Clock size={12} />
          Pending Review
        </span>

        {/* Message */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-2xl font-bold" style={{ color: '#F0F0F5' }}>
            You&apos;re in line.
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#9494A8' }}>
            Your account is pending admin review. You&apos;ll get a Slack DM once you&apos;re approved.
          </p>
          <p className="text-xs mt-1" style={{ color: '#5C5C72' }}>
            Usually takes less than 24 hours.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px" style={{ backgroundColor: '#2A2A3E' }} />

        {/* What to expect */}
        <div
          className="w-full rounded-lg p-4 text-sm"
          style={{ backgroundColor: '#0A0A0F', border: '1px solid #2A2A3E' }}
        >
          <p className="font-medium mb-2" style={{ color: '#F0F0F5' }}>While you wait:</p>
          <ul className="flex flex-col gap-1.5" style={{ color: '#9494A8' }}>
            <li className="flex items-center gap-2">
              <span style={{ color: '#00FF88' }}>→</span>
              Start collecting your referral links
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: '#00FF88' }}>→</span>
              Once approved, drop them to help the community
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: '#00FF88' }}>→</span>
              Request referrals from other members
            </li>
          </ul>
        </div>

        {/* Sign out */}
        <SignOutButton />
      </div>
    </main>
  )
}
