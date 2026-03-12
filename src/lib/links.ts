import { nanoid } from 'nanoid'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// ─── Validation schema ──────────────────────────────

export const submitLinkSchema = z.object({
  url: z.string().url('Invalid URL format').max(2048, 'URL too long'),
  productId: z.string().cuid('Invalid product ID').optional(),
  note: z.string().max(500, 'Note too long').optional(),
  revealed: z.boolean().default(true),
})

export type SubmitLinkInput = z.infer<typeof submitLinkSchema>

// ─── URL resolution ─────────────────────────────────

/**
 * Follow redirects server-side and return the final URL.
 * Times out after 10s. Returns null if unreachable.
 */
export async function resolveUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)

    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      // Don't download the body — we only need the final URL
      headers: { 'Range': 'bytes=0-0' },
    })

    clearTimeout(timer)
    return res.url
  } catch {
    return null
  }
}

// ─── Domain extraction ──────────────────────────────

export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// ─── Product inference ──────────────────────────────

/**
 * Given a final URL, attempt to match it against known products by domain.
 * Returns the matched Product or null.
 */
export async function inferProduct(finalUrl: string) {
  const domain = extractDomain(finalUrl)
  if (!domain) return null

  return prisma.product.findFirst({
    where: {
      OR: [
        { domain: { contains: domain } },
        { domains: { has: domain } },
      ],
      verified: true,
    },
    select: { id: true, name: true, logoUrl: true, category: true },
  })
}

// ─── Duplicate check ────────────────────────────────

export async function checkDuplicate(
  userId: string,
  finalUrl: string,
): Promise<boolean> {
  const existing = await prisma.referralLink.findFirst({
    where: { userId, finalUrl },
    select: { id: true },
  })
  return existing !== null
}

// ─── Rate limit check ───────────────────────────────

/**
 * Returns true if user has hit the submission rate limit (10/day).
 */
export async function isSubmitRateLimited(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const count = await prisma.referralLink.count({
    where: { userId, createdAt: { gte: since } },
  })
  return count >= 10
}

/**
 * Returns true if user has hit the raffle rate limit (3/day).
 */
export async function isRaffleRateLimited(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const count = await prisma.linkServe.count({
    where: { requesterId: userId, createdAt: { gte: since } },
  })
  return count >= 3
}

// ─── Short code ─────────────────────────────────────

export function generateShortCode(): string {
  return nanoid(10)
}
