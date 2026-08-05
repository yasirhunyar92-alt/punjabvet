/**
 * SEO helpers: JSON-LD builders, reading time, table of contents,
 * automatic internal linking and metadata sanitisation.
 * Shared by every public page so structured data stays consistent.
 */

export const SITE_URL = 'https://punjabveterinary.com';
export const SITE_NAME = 'Punjab Veterinary Medical Store';
export const SITE_PHONE = '+923065757283';
export const SITE_LOGO = `${SITE_URL}/placeholder.svg`;

export const absoluteUrl = (path = '/') =>
  path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** Trim text to a length that renders fully in Google results. */
export const clampMeta = (text: string | null | undefined, max = 158) => {
  const clean = (text ?? '').replace(/\s+/g, ' ').replace(/[#*_`>]/g, '').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/[,;:\s]\S*$/, '')}…`;
};

export const readingMinutes = (content: string | null | undefined) =>
  Math.max(1, Math.round((content ?? '').trim().split(/\s+/).filter(Boolean).length / 200));

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

/* ------------------------------------------------------------------ */
/* Table of contents                                                   */
/* ------------------------------------------------------------------ */

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Extract markdown `##` / `###` headings from a post body. */
export const extractToc = (content: string | null | undefined): TocItem[] => {
  const items: TocItem[] = [];
  const seen = new Set<string>();
  for (const line of (content ?? '').split('\n')) {
    const m = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (!m) continue;
    const text = m[2].replace(/\*\*/g, '').trim();
    let id = slugify(text) || `section-${items.length + 1}`;
    while (seen.has(id)) id = `${id}-${items.length}`;
    seen.add(id);
    items.push({ id, text, level: m[1].length === 2 ? 2 : 3 });
  }
  return items;
};

/* ------------------------------------------------------------------ */
/* Automatic internal linking                                          */
/* ------------------------------------------------------------------ */

export interface LinkTarget {
  phrase: string;
  href: string;
}

/**
 * Link the first mention of each phrase inside an HTML fragment.
 * Skips text already inside a tag or an existing anchor.
 */
export const autoInternalLinks = (html: string, targets: LinkTarget[], max = 6) => {
  let out = html;
  let used = 0;
  const sorted = [...targets].sort((a, b) => b.phrase.length - a.phrase.length);

  for (const { phrase, href } of sorted) {
    if (used >= max) break;
    if (!phrase || phrase.length < 4) continue;
    if (out.includes(`href="${href}"`)) continue;
    const safe = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // (?![^<]*>) keeps us out of tag attributes; (?![^<]*<\/a>) keeps us out of links.
    const re = new RegExp(`(?<![\\w-])(${safe})(?![\\w-])(?![^<]*>)(?![^<]*<\\/a>)`, 'i');
    if (!re.test(out)) continue;
    out = out.replace(
      re,
      `<a href="${href}" class="text-primary underline underline-offset-2 font-medium">$1</a>`,
    );
    used += 1;
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* JSON-LD builders                                                    */
/* ------------------------------------------------------------------ */

export const organizationSchema = () => ({
  '@type': 'VeterinaryCare',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: SITE_LOGO,
  image: SITE_LOGO,
  telephone: SITE_PHONE,
  priceRange: 'Rs.',
  currenciesAccepted: 'PKR',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Main Bazaar, Sillanwali',
    addressLocality: 'Sillanwali',
    addressRegion: 'Punjab',
    postalCode: '40430',
    addressCountry: 'PK',
  },
  areaServed: { '@type': 'Country', name: 'Pakistan' },
  founder: { '@type': 'Person', name: 'Qaiser Hussain' },
  sameAs: [`https://wa.me/${SITE_PHONE.replace('+', '')}`],
});

export const websiteSchema = () => ({
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: ['en', 'ur'],
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/products?search={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
});

export const breadcrumbSchema = (trail: { name: string; path: string }[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: absoluteUrl(c.path),
  })),
});

export const faqSchema = (faqs: { question: string; answer: string }[]) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
});

export const articleSchema = (post: {
  title: string;
  description?: string | null;
  slug: string;
  image?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  category?: string | null;
  wordCount?: number;
  author?: string | null;
}) => ({
  '@type': 'BlogPosting',
  '@id': `${SITE_URL}/blog/${post.slug}#article`,
  headline: clampMeta(post.title, 110),
  description: clampMeta(post.description, 200),
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
  url: `${SITE_URL}/blog/${post.slug}`,
  image: post.image ? [absoluteUrl(post.image)] : [SITE_LOGO],
  datePublished: post.publishedAt ?? undefined,
  dateModified: post.updatedAt ?? post.publishedAt ?? undefined,
  articleSection: post.category ?? undefined,
  wordCount: post.wordCount,
  inLanguage: 'en',
  author: { '@type': 'Organization', name: post.author || SITE_NAME, url: SITE_URL },
  publisher: { '@id': `${SITE_URL}/#organization` },
});

export const productSchema = (product: {
  id: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  images?: string[];
  brand?: string | null;
  sku?: string | null;
  price: number;
  discountPrice?: number | null;
  inStock?: boolean | null;
  rating?: number | null;
  ratingCount?: number | null;
  category?: string | null;
}) => {
  const url = `${SITE_URL}/product/${product.slug || product.id}`;
  const price = product.discountPrice && product.discountPrice < product.price
    ? product.discountPrice
    : product.price;

  const schema: Record<string, unknown> = {
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    description: clampMeta(product.description || `${product.name} available at ${SITE_NAME}.`, 300),
    image: (product.images ?? []).filter(Boolean).map(absoluteUrl),
    sku: product.sku || product.id,
    category: product.category ?? undefined,
    brand: { '@type': 'Brand', name: product.brand || SITE_NAME },
    offers: {
      '@type': 'Offer',
      url,
      price,
      priceCurrency: 'PKR',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock === false
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: { '@id': `${SITE_URL}/#organization` },
    },
  };

  if (product.rating && product.ratingCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.rating.toFixed(1)),
      reviewCount: product.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
};

/** Wrap one or more schema nodes in a single @graph document. */
export const graph = (...nodes: (Record<string, unknown> | null | undefined)[]) => ({
  '@context': 'https://schema.org',
  '@graph': nodes.filter(Boolean),
});
