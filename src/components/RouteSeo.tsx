import { useLocation } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { graph, organizationSchema, websiteSchema } from '@/lib/seo';

/**
 * Route-level SEO defaults for every page in the app.
 *
 * Rendered once inside the router. Pages that render their own <SEOHead />
 * (home, products, product detail, blog) override these values because nested
 * Helmet instances mount later and win the dedupe.
 *
 * Private routes are marked noindex so they never reach the search index, and
 * any unknown path (the 404 page) is noindex too.
 */

interface RouteMeta {
  title?: string;
  description?: string;
  noindex?: boolean;
}

const EXACT: Record<string, RouteMeta> = {
  '/': {
    description:
      'Quality veterinary medicines, vaccines and dairy supplements in Sillanwali. Call 0306-5757283 — trusted by local farmers and pet owners.',
  },
  '/products': {
    title: 'Veterinary Products — Medicines, Vaccines & Supplements',
    description:
      'Browse veterinary medicines, vaccines, dairy supplements and pet care products for cattle, buffalo, goats, poultry, dogs and cats.',
  },
  '/about': {
    title: 'About Us — Veterinary Store in Sillanwali',
    description:
      'Punjab Veterinary Medical Store has served farmers and livestock owners in Sillanwali for years with certified animal health products.',
  },
  '/contact': {
    title: 'Contact Us — Call or WhatsApp 0306-5757283',
    description:
      'Contact Punjab Veterinary Medical Store in Sillanwali, Punjab. Call or WhatsApp 0306-5757283 for medicine advice, prices and orders.',
  },
  '/blog': {
    title: 'Veterinary Blog — Animal Health Guides',
    description:
      'Practical guides on livestock health, vaccination schedules, dairy nutrition and disease prevention from Punjab Veterinary Medical Store.',
  },
  '/shipping': {
    title: 'Shipping & Delivery Information',
    description:
      'How we pack and deliver veterinary medicines across Pakistan, delivery timelines and order tracking information.',
  },
  '/refund': {
    title: 'Return & Refund Policy',
    description:
      'Our return, replacement and refund policy for veterinary medicines, vaccines and supplements ordered online.',
  },
  '/privacy': {
    title: 'Privacy Policy',
    description:
      'How Punjab Veterinary Medical Store collects, stores and protects your personal information when you order online.',
  },
  '/terms': {
    title: 'Terms & Conditions',
    description:
      'The terms that apply when you browse, order or pay for veterinary products on Punjab Veterinary Medical Store.',
  },

  // Private / transactional — must never be indexed.
  '/cart': { title: 'Your Cart', noindex: true },
  '/checkout': { title: 'Checkout', noindex: true },
  '/auth': { title: 'Sign In or Create Account', noindex: true },
  '/profile': { title: 'My Profile', noindex: true },
  '/admin': { title: 'Admin Dashboard', noindex: true },
  '/reset-password': { title: 'Reset Password', noindex: true },
};

/** Dynamic route prefixes that stay indexable (pages supply their own meta). */
const INDEXABLE_PREFIXES = ['/product/', '/blog/'];

const RouteSeo = () => {
  const { pathname } = useLocation();
  // Normalise trailing slashes so /about/ and /about share one canonical.
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';

  const exact = EXACT[path];
  const isDynamic = INDEXABLE_PREFIXES.some((p) => path.startsWith(p));
  const meta: RouteMeta = exact ?? (isDynamic ? {} : { title: 'Page Not Found', noindex: true });

  return (
    <SEOHead
      title={meta.title}
      description={meta.description}
      // Canonical always drops query strings (?sort=, ?category=, ?search=)
      // so filtered variants never create duplicate URLs.
      url={path}
      noindex={meta.noindex}
      jsonLd={path === '/' ? graph(organizationSchema(), websiteSchema()) : undefined}
    />
  );
};

export default RouteSeo;
