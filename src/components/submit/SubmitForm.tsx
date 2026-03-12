'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'

type Product = {
  id: string
  name: string
  logoUrl: string | null
  slug: string
}

type Step = 'input' | 'detecting' | 'confirm' | 'select-product' | 'done'

type DetectResult =
  | { product: Product; finalUrl: string }
  | { product: null; finalUrl: string; products: Product[] }

export function SubmitForm({ allProducts }: { allProducts: Product[] }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detected, setDetected] = useState<DetectResult | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [note, setNote] = useState('')
  const [revealed, setRevealed] = useState(true)

  const handleUrlSubmit = useCallback(async () => {
    if (!url.trim()) return
    setError(null)
    setStep('detecting')

    try {
      // Pre-validate format
      new URL(url)
    } catch {
      setError("That doesn't look like a valid URL.")
      setStep('input')
      return
    }

    // Ask the API to resolve + infer product
    try {
      const res = await fetch('/api/links/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = (await res.json()) as { finalUrl?: string; product?: Product; error?: string }

      if (!res.ok) {
        if (res.status === 422) {
          setError("We couldn't reach that URL. Double-check it?")
        } else {
          setError(data.error ?? 'Something went wrong.')
        }
        setStep('input')
        return
      }

      const finalUrl = data.finalUrl ?? url
      if (data.product) {
        setDetected({ product: data.product, finalUrl })
        setSelectedProduct(data.product)
        setStep('confirm')
      } else {
        setDetected({ product: null, finalUrl, products: allProducts })
        setStep('select-product')
      }
    } catch {
      setError('Network error. Try again.')
      setStep('input')
    }
  }, [url, allProducts])

  const handleConfirm = useCallback(async () => {
    if (!detected || !selectedProduct) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        productId: selectedProduct.id,
        note: note.trim() || undefined,
        revealed,
      }),
    })

    const data = (await res.json()) as { error?: string; message?: string }

    if (!res.ok) {
      setError(data.message ?? data.error ?? 'Failed to save link.')
      setLoading(false)
      return
    }

    setLoading(false)
    setStep('done')
    setTimeout(() => router.push('/my-links'), 1200)
  }, [detected, selectedProduct, url, note, revealed, router])

  // ── Render ──────────────────────────────────────

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle size={40} style={{ color: '#00FF88' }} />
        <p className="font-semibold" style={{ color: '#F0F0F5' }}>Link dropped!</p>
        <p className="text-sm" style={{ color: '#9494A8' }}>It&apos;s in the raffle. Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* URL input step */}
      {(step === 'input' || step === 'detecting') && (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium" style={{ color: '#F0F0F5' }}>
            Paste your referral link
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: '#5C5C72' }}
              />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="https://app.tool.com?ref=yourcode"
                disabled={step === 'detecting'}
                className="w-full rounded-md pl-9 pr-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  backgroundColor: '#0A0A0F',
                  border: '1px solid #2A2A3E',
                  color: '#F0F0F5',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00FF88'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,255,136,0.15)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#2A2A3E'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <button
              onClick={handleUrlSubmit}
              disabled={step === 'detecting' || !url.trim()}
              className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-40"
              style={{ backgroundColor: '#00FF88', color: '#0A0A0F' }}
            >
              {step === 'detecting' ? <Loader2 size={15} className="animate-spin" /> : null}
              {step === 'detecting' ? 'Checking...' : 'Continue'}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm rounded-md px-3 py-2" style={{ backgroundColor: 'rgba(255,71,87,0.1)', color: '#FF4757', border: '1px solid rgba(255,71,87,0.2)' }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Product selector (no match found) */}
      {step === 'select-product' && detected && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: '#F0F0F5' }}>
              What product is this for?
            </p>
            <p className="text-xs" style={{ color: '#5C5C72', fontFamily: 'monospace' }}>
              {detected.finalUrl}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
            {allProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProduct(p); setStep('confirm') }}
                className="text-left rounded-lg px-3 py-2.5 text-sm transition-all duration-100"
                style={{
                  backgroundColor: '#141420',
                  border: '1px solid #2A2A3E',
                  color: '#F0F0F5',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00FF88' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2A3E' }}
              >
                {p.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setStep('input'); setError(null) }}
            className="text-xs self-start transition-colors"
            style={{ color: '#5C5C72' }}
          >
            ← Back
          </button>
        </div>
      )}

      {/* Confirmation step */}
      {step === 'confirm' && detected && selectedProduct && (
        <div className="flex flex-col gap-5">
          {/* Detected product */}
          <div className="rounded-lg p-4 flex items-center gap-3" style={{ backgroundColor: '#0A0A0F', border: '1px solid #2A2A3E' }}>
            {selectedProduct.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedProduct.logoUrl} alt={selectedProduct.name} className="w-8 h-8 rounded object-contain" />
            ) : (
              <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#222238', color: '#00FF88' }}>
                {selectedProduct.name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#F0F0F5' }}>{selectedProduct.name}</p>
              <p className="text-xs truncate" style={{ color: '#5C5C72', fontFamily: 'monospace' }}>{detected.finalUrl}</p>
            </div>
            <button
              onClick={() => setStep('select-product')}
              className="text-xs shrink-0 transition-colors"
              style={{ color: '#5C5C72' }}
            >
              Change
            </button>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: '#9494A8' }}>
              Note <span style={{ color: '#5C5C72' }}>(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Personal referral, gives 20% off first month"
              rows={2}
              maxLength={500}
              className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none transition-all"
              style={{ backgroundColor: '#0A0A0F', border: '1px solid #2A2A3E', color: '#F0F0F5' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#00FF88' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#2A2A3E' }}
            />
          </div>

          {/* Visibility toggle */}
          <button
            onClick={() => setRevealed((r) => !r)}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-left transition-all"
            style={{ backgroundColor: '#0A0A0F', border: `1px solid ${revealed ? 'rgba(0,255,136,0.3)' : '#2A2A3E'}` }}
          >
            <div
              className="w-9 h-5 rounded-full relative transition-colors duration-200"
              style={{ backgroundColor: revealed ? '#00FF88' : '#2A2A3E' }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                style={{ backgroundColor: '#0A0A0F', left: revealed ? '18px' : '2px' }}
              />
            </div>
            <div>
              <p style={{ color: '#F0F0F5' }}>
                {revealed ? 'Show my name when this link is raffled' : 'Stay anonymous'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#5C5C72' }}>
                {revealed ? 'Contributors are credited by name and avatar' : 'Your identity stays hidden'}
              </p>
            </div>
          </button>

          {error && (
            <div className="flex items-center gap-2 text-sm rounded-md px-3 py-2" style={{ backgroundColor: 'rgba(255,71,87,0.1)', color: '#FF4757', border: '1px solid rgba(255,71,87,0.2)' }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-all disabled:opacity-40"
              style={{ backgroundColor: '#00FF88', color: '#0A0A0F' }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Dropping...' : 'Drop it'}
            </button>
            <button
              onClick={() => { setStep('input'); setError(null) }}
              className="rounded-md px-4 py-2.5 text-sm transition-colors"
              style={{ border: '1px solid #2A2A3E', color: '#9494A8' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
