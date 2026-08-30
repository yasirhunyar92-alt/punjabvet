/**
 * Generates public/sitemap.xml (and public/robots.txt's referenced sitemap)
 * before `vite dev` and `vite build`, so /sitemap.xml is a real static file on
 * the deployed site instead of depending on host rewrites.
 *
 * Static routes come from src/App.tsx's route table; products and blog posts
 * are pulled live from the database with the public (anon) key.
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'

const BASE_URL = 'https://punjabveterinary.com'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

interface Entry {
  path: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: string
}

/** Public, indexable static routes. Admin/auth/cart/checkout/profile excluded. */
const staticEntries: Entry[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/shipping', changefreq: 'yearly', priority: '0.3' },
  { path: '/refund', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
]

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const day = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : undefined

async function rest<T>(table: string, query: string): Promise<T[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return []
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    if (!res.ok) {
      console.warn(`sitemap: ${table} returned ${res.status}`)
      return []
    }
    return (await res.json()) as T[]
  } catch (err) {
    console.warn(`sitemap: could not fetch ${table} —`, (err as Error).message)
    return []
  }
}

async function dynamicEntries(): Promise<Entry[]> {
  const [products, posts, categories] = await Promise.all([
    rest<{ id: string; slug: string | null; updated_at: string | null }>(
      'products',
      'select=id,slug,updated_at&limit=5000',
    ),
    rest<{ slug: string; updated_at: string | null; published: boolean }>(
      'blog_posts',
      'select=slug,updated_at&published=eq.true&limit=2000',
    ),
    rest<{ slug: string }>('categories', 'select=slug&limit=200'),
  ])

  return [
    ...categories
      .filter((c) => c.slug)
      .map<Entry>((c) => ({
        path: `/products?category=${encodeURIComponent(c.slug)}`,
        changefreq: 'weekly',
        priority: '0.7',
      })),
    ...products.map<Entry>((p) => ({
      path: `/product/${p.slug || p.id}`,
      lastmod: day(p.updated_at),
      changefreq: 'weekly',
      priority: '0.8',
    })),
    ...posts
      .filter((p) => p.slug)
      .map<Entry>((p) => ({
        path: `/blog/${p.slug}`,
        lastmod: day(p.updated_at),
        changefreq: 'monthly',
        priority: '0.7',
      })),
  ]
}

function render(entries: Entry[]) {
  const seen = new Set<string>()
  const urls = entries
    .filter((e) => (seen.has(e.path) ? false : (seen.add(e.path), true)))
    .map((e) =>
      [
        '  <url>',
        `    <loc>${escapeXml(`${BASE_URL}${e.path}`)}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n'),
    )

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

const entries = [...staticEntries, ...(await dynamicEntries())]
writeFileSync(resolve('public/sitemap.xml'), render(entries))
console.log(`sitemap.xml written (${entries.length} entries)`)
