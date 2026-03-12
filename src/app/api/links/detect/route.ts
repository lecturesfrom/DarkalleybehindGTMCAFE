import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { resolveUrl, inferProduct } from '@/lib/links'

const schema = z.object({
  url: z.string().url().max(2048),
})

/**
 * POST /api/links/detect
 * Resolves a URL and attempts to infer the product.
 * Used by the /submit form before the confirmation step.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const finalUrl = await resolveUrl(parsed.data.url)
  if (!finalUrl) {
    return NextResponse.json(
      { error: 'Unreachable' },
      { status: 422 },
    )
  }

  const product = await inferProduct(finalUrl)

  return NextResponse.json({ finalUrl, product })
}
