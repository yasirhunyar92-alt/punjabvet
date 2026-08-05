import { Helmet } from 'react-helmet-async';
import { SITE_NAME, SITE_URL, absoluteUrl, clampMeta } from '@/lib/seo';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  imageAlt?: string;
  /** Path only, e.g. "/blog/my-post" — becomes canonical + og:url. */
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  noindex?: boolean;
  locale?: 'en_PK' | 'ur_PK';
  publishedTime?: string | null;
  modifiedTime?: string | null;
  section?: string | null;
  tags?: string[];
  /** One schema object, or several — all rendered as separate JSON-LD blocks. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const DEFAULT_DESC =
  'Quality veterinary medicines, vaccines & dairy supplements in Sillanwali. Call 0306-5757283 — trusted by local farmers & pet owners.';

const SEOHead = ({
  title,
  description,
  keywords,
  image,
  imageAlt,
  url,
  type = 'website',
  noindex = false,
  locale = 'en_PK',
  publishedTime,
  modifiedTime,
  section,
  tags,
  jsonLd,
}: SEOHeadProps) => {
  const fullTitle = title
    ? `${clampMeta(title, 62)} | ${SITE_NAME}`
    : `${SITE_NAME} | Vet Medicines & Vaccines – Sillanwali`;
  const metaDesc = clampMeta(description || DEFAULT_DESC);
  const metaUrl = url ? absoluteUrl(url) : SITE_URL;
  const metaImage = image ? absoluteUrl(image) : undefined;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={metaUrl} />
      <meta
        name="robots"
        content={
          noindex
            ? 'noindex, nofollow'
            : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        }
      />
      <meta name="googlebot" content={noindex ? 'noindex' : 'index, follow'} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={locale} />
      {metaImage && <meta property="og:image" content={metaImage} />}
      {metaImage && <meta property="og:image:secure_url" content={metaImage} />}
      {metaImage && <meta property="og:image:width" content="1200" />}
      {metaImage && <meta property="og:image:height" content="630" />}
      {metaImage && <meta property="og:image:alt" content={imageAlt || title || SITE_NAME} />}

      {/* Article specifics */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && (modifiedTime || publishedTime) && (
        <meta property="article:modified_time" content={modifiedTime || publishedTime!} />
      )}
      {type === 'article' && section && <meta property="article:section" content={section} />}
      {type === 'article' &&
        (tags ?? []).slice(0, 8).map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

      {/* Twitter */}
      <meta name="twitter:card" content={metaImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      {metaImage && <meta name="twitter:image" content={metaImage} />}
      {metaImage && <meta name="twitter:image:alt" content={imageAlt || title || SITE_NAME} />}

      {/* Local business signals */}
      <meta name="geo.region" content="PK-PB" />
      <meta name="geo.placename" content="Sillanwali, Sargodha, Punjab" />
      <meta name="author" content={SITE_NAME} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
