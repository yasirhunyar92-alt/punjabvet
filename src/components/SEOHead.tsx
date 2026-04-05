import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
}

const SEOHead = ({ title, description, keywords, image, url, type = 'website', jsonLd }: SEOHeadProps) => {
  const siteName = 'Punjab Veterinary Medical Store';
  const defaultDesc = 'Quality veterinary medicines, vaccines & dairy supplements in Sillanwali. Call 03065757283 — trusted by local farmers & pet owners.';
  const baseUrl = 'https://punjabvet.lovable.app';

  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} | Vet Medicines & Vaccines – Sillanwali`;
  const metaDesc = description || defaultDesc;
  const metaUrl = url ? `${baseUrl}${url}` : baseUrl;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={metaUrl} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      {image && <meta name="twitter:image" content={image} />}

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;
