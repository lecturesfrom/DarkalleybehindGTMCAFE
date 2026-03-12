import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const patchSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED']).optional(),
  note: z.string().max(500).nullable().optional(),
  revealed: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const link = await prisma.referralLink.findUnique({
    where: { id: params.id },
    select: { userId: true },
  })

  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (link.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const updated = await prisma.referralLink.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.note !== undefined && { note: parsed.data.note }),
      ...(parsed.data.revealed !== undefined && { revealed: parsed.data.revealed }),
    },
    include: {
      product: { select: { id: true, name: true, logoUrl: true, slug: true } },
    },
  })

  return NextResponse.json({ link: updated })
}
