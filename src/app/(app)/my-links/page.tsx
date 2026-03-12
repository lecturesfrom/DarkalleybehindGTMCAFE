import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LinkCard } from '@/components/my-links/LinkCard'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function MyLinksPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const links = await prisma.referralLink.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { id: true, name: true, logoUrl: true, slug: true, category: true } },
      _count: { select: { serves: true } },
    },
  })

  // Attach click counts
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
        status: link.status as 'ACTIVE' | 'PAUSED' | 'FLAGGED' | 'EXPIRED',
        revealed: link.revealed,
        note: link.note,
        serveCount: link._count.serves,
        clickCount,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString(),
      }
    }),
  )

  const activeCount = linksWithStats.filter((l) => l.status === 'ACTIVE').length
  const totalServes = linksWithStats.reduce((sum, l) => sum + l.serveCount, 0)
  const totalClicks = linksWithStats.reduce((sum, l) => sum + l.clickCount, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0F0F5' }}>My Links</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9494A8' }}>
            {linksWithStats.length === 0
              ? 'No links yet'
              : `${activeCount} active · ${linksWithStats.length} total`}
          </p>
        </div>
        <Link
          href="/submit"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-all duration-150"
          style={{ backgroundColor: '#00FF88', color: '#0A0A0F' }}
        >
          <Plus size={15} />
          Drop a Link
        </Link>
      </div>

      {/* Stats bar */}
      {linksWithStats.length > 0 && (
        <div
          className="grid grid-cols-3 gap-px rounded-lg overflow-hidden mb-6"
          style={{ border: '1px solid #2A2A3E', backgroundColor: '#2A2A3E' }}
        >
          {[
            { label: 'Links dropped', value: linksWithStats.length },
            { label: 'Times served', value: totalServes },
            { label: 'Clicks tracked', value: totalClicks },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3 text-center" style={{ backgroundColor: '#141420' }}>
              <p className="text-xl font-bold" style={{ color: '#00FF88' }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9494A8' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Links list */}
      {linksWithStats.length === 0 ? (
        <div
          className="rounded-xl py-16 flex flex-col items-center gap-4 text-center"
          style={{ border: '1px dashed #2A2A3E' }}
        >
          <p className="text-base font-medium" style={{ color: '#F0F0F5' }}>
            You haven&apos;t dropped any links yet.
          </p>
          <p className="text-sm" style={{ color: '#9494A8' }}>
            Drop your referral links to help the community and earn raffle credits.
          </p>
          <Link
            href="/submit"
            className="mt-2 flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: '#00FF88', color: '#0A0A0F' }}
          >
            <Plus size={15} />
            Drop your first link
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {linksWithStats.map((link) => (
            <LinkCard key={link.id} link={link} />
          ))}
        </div>
      )}
    </div>
  )
}
