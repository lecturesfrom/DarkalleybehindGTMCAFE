'use client'

import { useState } from 'react'
import { Pause, Play, Eye, EyeOff, Copy, Check, ExternalLink } from 'lucide-react'

type LinkStatus = 'ACTIVE' | 'PAUSED' | 'FLAGGED' | 'EXPIRED'

type LinkData = {
  id: string
  product: { id: string; name: string; logoUrl: string | null; slug: string; category: string | null }
  originalUrl: string
  shortCode: string
  redirectUrl: string
  status: LinkStatus
  revealed: boolean
  note: string | null
  serveCount: number
  clickCount: number
  createdAt: string
}

const STATUS_STYLES: Record<LinkStatus, { label: string; bg: string; color: string; border: string }> = {
  ACTIVE:  { label: 'Active',   bg: 'rgba(0,255,136,0.1)',  color: '#00FF88', border: 'rgba(0,255,136,0.25)'  },
  PAUSED:  { label: 'Paused',   bg: 'rgba(148,148,168,0.1)', color: '#9494A8', border: 'rgba(148,148,168,0.25)' },
  FLAGGED: { label: 'Flagged',  bg: 'rgba(255,71,87,0.1)',  color: '#FF4757', border: 'rgba(255,71,87,0.25)'  },
  EXPIRED: { label: 'Expired',  bg: 'rgba(92,92,114,0.1)',  color: '#5C5C72', border: 'rgba(92,92,114,0.25)'  },
}

export function LinkCard({ link: initial }: { link: LinkData }) {
  const [link, setLink] = useState(initial)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const patch = async (data: Partial<{ status: 'ACTIVE' | 'PAUSED'; revealed: boolean }>) => {
    setLoading(true)
    const res = await fetch(`/api/links/${link.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = (await res.json()) as { link: LinkData }
      setLink((prev) => ({ ...prev, ...json.link }))
    }
    setLoading(false)
  }

  const handleCopy = () => {
    const url = `${window.location.origin}${link.redirectUrl}`
    void navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const s = STATUS_STYLES[link.status]
  const canTogglePause = link.status === 'ACTIVE' || link.status === 'PAUSED'

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-3 transition-all duration-150"
      style={{ backgroundColor: '#141420', border: '1px solid #2A2A3E' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3A3A5A' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2A3E' }}
    >
      {/* Top row: product + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {link.product.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={link.product.logoUrl} alt={link.product.name} className="w-7 h-7 rounded object-contain shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: '#222238', color: '#00FF88' }}>
              {link.product.name[0]}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#F0F0F5' }}>{link.product.name}</p>
            {link.product.category && (
              <p className="text-xs" style={{ color: '#5C5C72' }}>{link.product.category}</p>
            )}
          </div>
        </div>

        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
        >
          {s.label}
        </span>
      </div>

      {/* URL */}
      <p
        className="text-xs truncate px-2 py-1.5 rounded"
        style={{ backgroundColor: '#0A0A0F', color: '#5C5C72', fontFamily: 'monospace' }}
      >
        {link.originalUrl}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs" style={{ color: '#9494A8' }}>
        <span>
          <span className="font-semibold" style={{ color: '#F0F0F5' }}>{link.serveCount}</span> served
        </span>
        <span>
          <span className="font-semibold" style={{ color: '#F0F0F5' }}>{link.clickCount}</span> clicked
        </span>
        <span className="ml-auto" style={{ color: '#5C5C72' }}>
          {new Date(link.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Note */}
      {link.note && (
        <p className="text-xs italic" style={{ color: '#9494A8' }}>&ldquo;{link.note}&rdquo;</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: '#2A2A3E' }}>
        {/* Copy tracked link */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition-all duration-150"
          style={{ backgroundColor: copied ? 'rgba(0,255,136,0.1)' : '#222238', color: copied ? '#00FF88' : '#9494A8' }}
          title="Copy tracked link"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy link'}
        </button>

        {/* Open original */}
        <a
          href={link.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition-colors"
          style={{ backgroundColor: '#222238', color: '#9494A8' }}
          title="Open original URL"
        >
          <ExternalLink size={12} />
        </a>

        {/* Visibility toggle */}
        <button
          onClick={() => patch({ revealed: !link.revealed })}
          disabled={loading}
          className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition-colors ml-auto disabled:opacity-40"
          style={{ backgroundColor: '#222238', color: link.revealed ? '#9494A8' : '#5C5C72' }}
          title={link.revealed ? 'Currently visible — click to go anonymous' : 'Currently anonymous — click to reveal'}
        >
          {link.revealed ? <Eye size={12} /> : <EyeOff size={12} />}
          {link.revealed ? 'Visible' : 'Anonymous'}
        </button>

        {/* Pause / Resume */}
        {canTogglePause && (
          <button
            onClick={() => patch({ status: link.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' })}
            disabled={loading}
            className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition-colors disabled:opacity-40"
            style={{ backgroundColor: '#222238', color: '#9494A8' }}
            title={link.status === 'ACTIVE' ? 'Pause this link' : 'Resume this link'}
          >
            {link.status === 'ACTIVE' ? <Pause size={12} /> : <Play size={12} />}
            {link.status === 'ACTIVE' ? 'Pause' : 'Resume'}
          </button>
        )}
      </div>
    </div>
  )
}
