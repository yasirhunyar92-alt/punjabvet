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

/* ------------------------------------------------------------------ */
/* National (Pakistan-wide) SEO helpers                                */
/* ------------------------------------------------------------------ */

/**
 * Auto-generated product metadata built only from real database fields.
 * Never invents ingredients, dosage, claims, brands or certifications.
 */
export const productMeta = (p: {
  name: string;
  description?: string | null;
  category?: string | null;
  brand?: string | null;
  animalTypes?: string[] | null;
  price?: number | null;
  discountPrice?: number | null;
}) => {
  const price = p.discountPrice && p.price && p.discountPrice < p.price ? p.discountPrice : p.price;
  const animals = (p.animalTypes ?? []).filter(Boolean).slice(0, 3).join(', ');

  // Keep the "Pakistan" signal but shorten gracefully for long product names.
  const suffix = p.name.length > 34 ? 'Pakistan' : 'Veterinary Medicine Pakistan';
  const title = clampMeta(`${p.name} | ${suffix}`, 62);

  const parts = [
    `Buy ${p.name}${p.category ? ` (${p.category})` : ''} online in Pakistan`,
    price ? `Price Rs. ${price}.` : '',
    animals ? `Suitable for ${animals}.` : '',
    p.description ? p.description : 'Order from Punjab Veterinary Medical Store with delivery across Pakistan.',
  ].filter(Boolean);

  return {
    title,
    description: clampMeta(parts.join(' '), 158),
    imageAlt: clampMeta(`${p.name}${p.category ? ` ${p.category}` : ''} veterinary product Pakistan`, 110),
    slug: slugify(p.name),
  };
};

export interface CategorySeo {
  title: string;
  description: string;
  heading: string;
  intro: string;
}

/** Keyword-mapped copy for the main category facets, matched on category name. */
const CATEGORY_SEO: { match: RegExp; seo: CategorySeo }[] = [
  {
    match: /vaccin/i,
    seo: {
      title: 'Veterinary Vaccines in Pakistan — Livestock & Poultry',
      description:
        'Buy veterinary vaccines for cattle, buffalo, goats, sheep and poultry online in Pakistan. Cold-chain handled and delivered nationwide.',
      heading: 'Veterinary Vaccines in Pakistan',
      intro:
        'Vaccines help protect herds and flocks from preventable disease. Choose products with your veterinarian, and follow the vaccination schedule and storage instructions supplied with each pack.',
    },
  },
  {
    match: /supplement|feed|mineral|vitamin|calcium/i,
    seo: {
      title: 'Livestock & Cattle Supplements in Pakistan',
      description:
        'Livestock supplements, cattle minerals, calcium tonics and vitamins for dairy and meat animals. Order online in Pakistan from Punjab Veterinary.',
      heading: 'Livestock & Cattle Supplements in Pakistan',
      intro:
        'Supplements support milk production, growth and general condition when the base ration is short of minerals or vitamins. Feeding rates vary by animal weight and stage, so ask a qualified veterinarian before starting a new product.',
    },
  },
  {
    match: /poultry|chicken|broiler/i,
    seo: {
      title: 'Poultry Veterinary Medicines in Pakistan',
      description:
        'Poultry medicines, vaccines and supplements for broiler and layer flocks. Buy online in Pakistan with delivery to farms nationwide.',
      heading: 'Poultry Veterinary Medicines in Pakistan',
      intro:
        'Flock health depends on clean water, biosecurity and timely treatment. Use poultry products strictly as labelled and observe any withdrawal periods before eggs or meat enter the food chain.',
    },
  },
  {
    match: /goat|sheep|bakri/i,
    seo: {
      title: 'Goat & Sheep Medicines in Pakistan',
      description:
        'Medicines, dewormers and supplements for goats and sheep. Order online in Pakistan from Punjab Veterinary Medical Store.',
      heading: 'Goat & Sheep Medicines in Pakistan',
      intro:
        'Small ruminants need dosing by bodyweight and regular parasite control. Confirm the diagnosis and dose with a veterinarian before treating a flock.',
    },
  },
  {
    match: /cattle|cow|buffalo|dairy/i,
    seo: {
      title: 'Cattle & Buffalo Medicines in Pakistan',
      description:
        'Cattle and buffalo medicines, tonics and dairy health products for farms across Pakistan. Buy online from Punjab Veterinary.',
      heading: 'Cattle & Buffalo Medicines in Pakistan',
      intro:
        'Dairy and beef animals need correct dosing, milk withdrawal awareness and a clear diagnosis. Your veterinarian can confirm which product suits the case.',
    },
  },
  {
    match: /pet|dog|cat/i,
    seo: {
      title: 'Pet Medicines in Pakistan — Dogs & Cats',
      description:
        'Pet medicines, dewormers, tick treatments and supplements for dogs and cats. Order online in Pakistan from Punjab Veterinary.',
      heading: 'Pet Medicines in Pakistan',
      intro:
        'Pet products are dosed by weight and species — never split livestock products for a dog or cat. A veterinarian can advise the right size and strength.',
    },
  },
  {
    match: /medicine|dawa|antibiotic|treatment/i,
    seo: {
      title: 'Veterinary Medicines in Pakistan — Buy Online',
      description:
        'Veterinary medicines for cattle, buffalo, goats, sheep and poultry. Buy animal medicines online in Pakistan from Punjab Veterinary Medical Store.',
      heading: 'Veterinary Medicines in Pakistan',
      intro:
        'Browse veterinary medicines used on livestock and poultry farms across Pakistan. Treatment choice, dose and duration should always be confirmed by a qualified veterinarian.',
    },
  },
];

export const categorySeo = (name?: string | null): CategorySeo | null => {
  if (!name) return null;
  const hit = CATEGORY_SEO.find((c) => c.match.test(name));
  if (hit) return hit.seo;
  return {
    title: `${name} — Animal Health Products in Pakistan`,
    description: clampMeta(
      `Shop ${name} online in Pakistan. Veterinary and animal health products delivered nationwide by Punjab Veterinary Medical Store.`,
    ),
    heading: `${name} in Pakistan`,
    intro: `Products in our ${name} range, available to order online across Pakistan. Speak to a qualified veterinarian for advice on choosing and using any animal health product.`,
  };
};

/** Homepage LocalBusiness node — keeps the Sillanwali signal beside the national one. */
export const localBusinessSchema = () => ({
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}/#localbusiness`,
  name: SITE_NAME,
  url: SITE_URL,
  image: SITE_LOGO,
  telephone: SITE_PHONE,
  priceRange: 'Rs.',
  currenciesAccepted: 'PKR',
  parentOrganization: { '@id': `${SITE_URL}/#organization` },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Main Bazaar, Sillanwali',
    addressLocality: 'Sillanwali',
    addressRegion: 'Punjab',
    postalCode: '40430',
    addressCountry: 'PK',
  },
  areaServed: [
    { '@type': 'Country', name: 'Pakistan' },
    { '@type': 'City', name: 'Sillanwali' },
    { '@type': 'City', name: 'Sargodha' },
  ],
});
