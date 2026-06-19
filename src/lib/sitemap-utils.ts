/**
 * Sitemap Utilities
 * Helper functions for sitemap generation and URL management
 */

import { Tables } from '@/integrations/supabase/types';

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Format date to ISO 8601 (YYYY-MM-DD)
 */
export const formatDateISO = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

/**
 * Escape special XML characters
 */
export const escapeXml = (str: string): string => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Generate product sitemap entries
 */
export const generateProductEntries = (
  products: Tables<'products'>[],
  baseUrl: string = 'https://punjabveterinary.com'
): SitemapEntry[] => {
  return products
    .filter(p => p.in_stock)
    .map(product => ({
      url: `${baseUrl}/product/${product.slug || product.id}`,
      lastmod: product.updated_at ? formatDateISO(product.updated_at) : undefined,
      changefreq: 'weekly' as const,
      priority: 0.8,
    }));
};

/**
 * Generate category sitemap entries
 */
export const generateCategoryEntries = (
  categories: Tables<'categories'>[],
  baseUrl: string = 'https://punjabveterinary.com'
): SitemapEntry[] => {
  return categories.map(category => ({
    url: `${baseUrl}/products?category=${category.id}`,
    lastmod: formatDateISO(category.created_at),
    changefreq: 'monthly' as const,
    priority: 0.7,
  }));
};

/**
 * Generate blog post sitemap entries
 */
export const generateBlogEntries = (
  posts: Tables<'blog_posts'>[],
  baseUrl: string = 'https://punjabveterinary.com'
): SitemapEntry[] => {
  return posts
    .filter(p => p.published)
    .map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastmod: post.updated_at ? formatDateISO(post.updated_at) : formatDateISO(post.published_at || new Date()),
      changefreq: 'weekly' as const,
      priority: 0.75,
    }));
};

/**
 * Get static page entries
 */
export const getStaticPageEntries = (
  baseUrl: string = 'https://punjabveterinary.com'
): SitemapEntry[] => {
  const now = new Date().toISOString().split('T')[0];
  return [
    { url: `${baseUrl}/`, changefreq: 'daily', priority: 1.0, lastmod: now },
    { url: `${baseUrl}/products`, changefreq: 'daily', priority: 0.9, lastmod: now },
    { url: `${baseUrl}/blog`, changefreq: 'weekly', priority: 0.8, lastmod: now },
    { url: `${baseUrl}/about`, changefreq: 'monthly', priority: 0.6, lastmod: now },
    { url: `${baseUrl}/contact`, changefreq: 'monthly', priority: 0.6, lastmod: now },
    { url: `${baseUrl}/privacy`, changefreq: 'yearly', priority: 0.3, lastmod: now },
    { url: `${baseUrl}/terms`, changefreq: 'yearly', priority: 0.3, lastmod: now },
    { url: `${baseUrl}/shipping`, changefreq: 'monthly', priority: 0.4, lastmod: now },
    { url: `${baseUrl}/refund`, changefreq: 'monthly', priority: 0.4, lastmod: now },
  ];
};

/**
 * Deduplicate sitemap entries by URL
 */
export const deduplicateSitemapEntries = (entries: SitemapEntry[]): SitemapEntry[] => {
  const seen = new Set<string>();
  return entries.filter(entry => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
};

/**
 * Check if URL should be excluded from sitemap
 */
export const isUrlExcluded = (url: string): boolean => {
  const excludedPaths = ['/admin', '/auth', '/profile', '/cart', '/checkout', '/reset-password', '/api'];
  return excludedPaths.some(path => url.includes(path));
};

/**
 * Generate XML for single sitemap entry
 */
export const generateXmlEntry = (entry: SitemapEntry): string => {
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
