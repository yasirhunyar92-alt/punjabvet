/**
 * Sitemap Generator API
 * Generates a valid XML sitemap according to sitemap.org standards
 * Handles products, categories, blog posts, and static pages
 * Deployed as a Vercel serverless function
 */

import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SITE_URL = process.env.SITE_URL || 'https://punjabveterinary.com';
const ITEMS_PER_SITEMAP = 50000; // Max items per sitemap per Google spec

// Initialize Supabase with service role key (for server-side queries)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Generate XML sitemap entry
 */
const generateSitemapUrl = (entry: SitemapEntry): string => {
  const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : '';
  const changefreq = entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : '';
  const priority = entry.priority !== undefined ? `<priority>${entry.priority}</priority>` : '';

  return `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    ${lastmod}
    ${changefreq}
    ${priority}
  </url>`;
};

/**
 * Escape special XML characters
 */
const escapeXml = (str: string): string => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Format date to ISO 8601 (YYYY-MM-DD)
 */
const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

/**
 * Fetch all products from database
 */
const fetchProducts = async (): Promise<SitemapEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, slug, updated_at')
      .eq('in_stock', true)
      .limit(10000);

    if (error) throw error;

    return (data || []).map(product => ({
      url: `${SITE_URL}/product/${product.slug || product.id}`,
      lastmod: product.updated_at ? formatDate(product.updated_at) : undefined,
      changefreq: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

/**
 * Fetch all categories from database
 */
const fetchCategories = async (): Promise<SitemapEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, created_at')
      .limit(1000);

    if (error) throw error;

    return (data || []).map(category => ({
      url: `${SITE_URL}/products?category=${category.id}`,
      lastmod: formatDate(category.created_at),
      changefreq: 'monthly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Fetch published blog posts from database
 */
const fetchBlogPosts = async (): Promise<SitemapEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, slug, updated_at, published_at')
      .eq('published', true)
      .limit(10000);

    if (error) throw error;

    return (data || []).map(post => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastmod: post.updated_at ? formatDate(post.updated_at) : formatDate(post.published_at || new Date()),
      changefreq: 'weekly' as const,
      priority: 0.75,
    }));
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
};

/**
 * Static pages that should be included
 */
const getStaticPages = (): SitemapEntry[] => {
  const now = new Date().toISOString().split('T')[0];
  return [
    { url: `${SITE_URL}/`, changefreq: 'daily', priority: 1.0, lastmod: now },
    { url: `${SITE_URL}/products`, changefreq: 'daily', priority: 0.9, lastmod: now },
    { url: `${SITE_URL}/blog`, changefreq: 'weekly', priority: 0.8, lastmod: now },
    { url: `${SITE_URL}/about`, changefreq: 'monthly', priority: 0.6, lastmod: now },
    { url: `${SITE_URL}/contact`, changefreq: 'monthly', priority: 0.6, lastmod: now },
    { url: `${SITE_URL}/privacy`, changefreq: 'yearly', priority: 0.3, lastmod: now },
    { url: `${SITE_URL}/terms`, changefreq: 'yearly', priority: 0.3, lastmod: now },
    { url: `${SITE_URL}/shipping`, changefreq: 'monthly', priority: 0.4, lastmod: now },
    { url: `${SITE_URL}/refund`, changefreq: 'monthly', priority: 0.4, lastmod: now },
  ];
};

/**
 * Deduplicate URLs
 */
const deduplicateUrls = (urls: SitemapEntry[]): SitemapEntry[] => {
  const seen = new Set<string>();
  return urls.filter(entry => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
};

/**
 * Generate main sitemap index (if more than 50k URLs)
 */
const generateSitemapIndex = (sitemapCount: number): string => {
  const sitemaps = Array.from({ length: sitemapCount }, (_, i) => {
    const now = new Date().toISOString().split('T')[0];
    return `  <sitemap>
    <loc>${SITE_URL}/api/sitemap-${i}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;
};

/**
 * Generate single sitemap XML
 */
const generateSitemapXml = (entries: SitemapEntry[]): string => {
  const urls = entries.map(generateSitemapUrl).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
};

/**
 * Main handler
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Check for specific sitemap file (e.g., /api/sitemap-0.xml)
    const sitemapMatch = req.url?.match(/sitemap-(\d+)\.xml/);

    // Fetch all data in parallel
    const [products, categories, blogPosts] = await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchBlogPosts(),
    ]);

    // Combine all entries with static pages
    let allEntries = [
      ...getStaticPages(),
      ...products,
      ...categories,
      ...blogPosts,
    ];

    // Deduplicate URLs
    allEntries = deduplicateUrls(allEntries);

    // Sort by URL for consistency
    allEntries.sort((a, b) => a.url.localeCompare(b.url));

    // Handle sitemap index request
    if (!sitemapMatch && allEntries.length > ITEMS_PER_SITEMAP) {
      const sitemapCount = Math.ceil(allEntries.length / ITEMS_PER_SITEMAP);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.status(200).send(generateSitemapIndex(sitemapCount));
      return;
    }

    // Handle specific sitemap file request
    if (sitemapMatch) {
      const sitemapIndex = parseInt(sitemapMatch[1], 10);
      const start = sitemapIndex * ITEMS_PER_SITEMAP;
      const end = start + ITEMS_PER_SITEMAP;
      const sitemapEntries = allEntries.slice(start, end);

      if (sitemapEntries.length === 0) {
        res.status(404).send('Sitemap not found');
        return;
      }

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(200).send(generateSitemapXml(sitemapEntries));
      return;
    }

    // Single sitemap response (for smaller sites)
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(generateSitemapXml(allEntries));

  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
}
