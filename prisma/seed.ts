/**
 * Seed script — DEVELOPMENT / DEMO DATA ONLY
 *
 * These products are example entries to make the app testable.
 * In production, products are community-driven: members drop links for
 * whatever tools they actually use. No endorsement is implied.
 *
 * Run: npm run seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Example product catalog — demo only, reflects common GTM tools members might share
const demoProducts = [
  { name: 'HeyReach', slug: 'heyreach', domain: 'heyreach.io', category: 'LinkedIn Automation' },
  { name: 'Smartlead', slug: 'smartlead', domain: 'smartlead.ai', category: 'Cold Email' },
  { name: 'OutboundSync', slug: 'outboundsync', domain: 'outboundsync.com', category: 'Sales Automation' },
  { name: 'The Deal Lab', slug: 'the-deal-lab', domain: 'thedeallab.io', category: 'Deal Intelligence' },
  { name: 'Ocean.io', slug: 'ocean-io', domain: 'ocean.io', category: 'Data Enrichment' },
  { name: 'BetterContact', slug: 'bettercontact', domain: 'bettercontact.io', category: 'Data Enrichment' },
  { name: 'IcyPeas', slug: 'icypeas', domain: 'icypeas.com', category: 'Lead Generation' },
  { name: 'Prospeo', slug: 'prospeo', domain: 'prospeo.io', category: 'Email Finding' },
  { name: 'Trigify', slug: 'trigify', domain: 'trigify.io', category: 'Signal-Based Selling' },
  { name: 'ScaledMail', slug: 'scaledmail', domain: 'scaledmail.com', category: 'Email Infrastructure' },
  { name: 'RevyOps', slug: 'revyops', domain: 'revyops.com', category: 'Revenue Operations' },
  { name: 'SaaSyDB', slug: 'saasydb', domain: 'saasydb.com', category: 'Database' },
  { name: 'TitanX', slug: 'titanx', domain: 'titanx.ai', category: 'Outbound Platform' },
  { name: 'Mailpool', slug: 'mailpool', domain: 'mailpool.app', category: 'Email Infrastructure' },
]

async function main() {
  console.log('Seeding demo products...')

  for (const product of demoProducts) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { domain: product.domain, category: product.category },
      create: product,
    })
  }

  console.log(`✓ ${demoProducts.length} demo products seeded`)
  console.log('')
  console.log('Note: Admin user (Kellen) will be set automatically after first Slack sign-in.')
  console.log('      Run: npx prisma studio → find the user → set role to ADMIN.')
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
