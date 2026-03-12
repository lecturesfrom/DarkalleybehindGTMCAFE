import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  submitLinkSchema,
  resolveUrl,
  inferProduct,
  checkDuplicate,
  isSubmitRateLimited,
  generateShortCode,
} from '@/lib/links'

// ─── POST /api/links — Submit a referral link ───────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Account not active' }, { status: 403 })
  }

  if (await isSubmitRateLimited(session.user.id)) {
    return NextResponse.json(
      { error: 'Rate limited', message: 'Slow down! Max 10 links per day.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = submitLinkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { url, productId, note, revealed } = parsed.data

  const finalUrl = await resolveUrl(url)
  if (!finalUrl) {
    return NextResponse.json(
      { error: 'Unreachable', message: "We couldn't reach that URL. Double-check it?" },
      { status: 422 },
    )
  }

  if (await checkDuplicate(session.user.id, finalUrl)) {
    return NextResponse.json(
      { error: 'Duplicate', message: "You've already dropped this link." },
      { status: 409 },
    )
  }

  let resolvedProductId = productId
  if (!resolvedProductId) {
    const inferred = await inferProduct(finalUrl)
    if (inferred) resolvedProductId = inferred.id
  }

  if (!resolvedProductId) {
    return NextResponse.json(
      { error: 'NoProduct', message: 'Could not detect product. Please select one.' },
      { status: 400 },
    )
  }

  // Generate short code with collision guard
  let shortCode = generateShortCode()
  for (let i = 0; i < 5; i++) {
    const collision = await prisma.referralLink.findUnique({
      where: { shortCode },
      select: { id: true },
    })
    if (!collision) break
    shortCode = generateShortCode()
  }

  const link = await prisma.referralLink.create({
    data: {
      userId: session.user.id,
      productId: resolvedProductId,
      originalUrl: url,
      finalUrl,
      shortCode,
      note,
      revealed,
    },
    include: {
      product: { select: { id: true, name: true, logoUrl: true, slug: true } },
    },
  })

  return NextResponse.json(
    {
      id: link.id,
      shortCode: link.shortCode,
      redirectUrl: `/r/${link.shortCode}`,
      product: link.product,
      status: link.status,
    },
    { status: 201 },
  )
}

// ─── GET /api/links — User's links with stats ───────

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Account not active' }, { status: 403 })
  }

  const links = await prisma.referralLink.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { id: true, name: true, logoUrl: true, slug: true, category: true } },
      _count: { select: { serves: true } },
    },
  })

  const linksWithStats = await Promise.all(
    links.map(async (link) => {
      const clickCount = await prisma.linkClick.count({
        where: { linkServe: { referralLinkId: link.id } },
      })
      return {
        id: link.id,
        product: link.product,
        originalUrl: link.originalUrl,
        finalUrl: link.finalUrl,
        shortCode: link.shortCode,
        redirectUrl: `/r/${link.shortCode}`,
        status: link.status,
        revealed: link.revealed,
        note: link.note,
        serveCount: link._count.serves,
        clickCount,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
      }
    }),
  )

  return NextResponse.json({ links: linksWithStats })
}
