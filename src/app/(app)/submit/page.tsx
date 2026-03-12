import { prisma } from '@/lib/prisma'
import { SubmitForm } from '@/components/submit/SubmitForm'

export default async function SubmitPage() {
  const products = await prisma.product.findMany({
    where: { verified: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, logoUrl: true, slug: true },
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#F0F0F5' }}>
          Drop a Link
        </h1>
        <p className="text-sm" style={{ color: '#9494A8' }}>
          Paste your referral URL. We&apos;ll detect the product and add it to the raffle pool.
        </p>
      </div>

      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: '#141420', border: '1px solid #2A2A3E' }}
      >
        <SubmitForm allProducts={products} />
      </div>

      <p className="text-xs text-center mt-4" style={{ color: '#5C5C72' }}>
        Your link is only served when another member requests it via raffle.
      </p>
    </div>
  )
}
