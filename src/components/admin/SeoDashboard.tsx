import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ExternalLink, Rocket, AlertTriangle, CheckCircle2 } from 'lucide-react';

const SITE = 'https://punjabveterinary.com';

const SeoDashboard = () => {
  const [pinging, setPinging] = useState(false);

  const { data: audit } = useQuery({
    queryKey: ['seo-audit'],
    queryFn: async () => {
      const [{ data: products }, { data: posts }] = await Promise.all([
        supabase.from('products').select('id, name, slug, seo_title, seo_description, image_url').limit(1000),
        supabase.from('blog_posts').select('id, title, slug, seo_title, seo_description, cover_image, published').limit(500),
      ]);
      return {
        products: (products || []).filter(p => !p.seo_title || !p.seo_description || !p.slug || !p.image_url),
        posts: (posts || []).filter(p => !p.seo_title || !p.seo_description || !p.cover_image),
        totalProducts: products?.length || 0,
        totalPosts: posts?.length || 0,
      };
    },
  });

  const ping = async () => {
    setPinging(true);
    const { data, error } = await supabase.functions.invoke('seo-ping', { body: {} });
    setPinging(false);
    if (error) return toast.error('Submission failed — check function logs');
    toast.success(data?.message || 'Submitted to search engines');
  };

  const links = [
    { label: 'Sitemap index', href: `${SITE}/sitemap.xml` },
    { label: 'RSS feed', href: `${SITE}/rss.xml` },
    { label: 'robots.txt', href: `${SITE}/robots.txt` },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5">
        <h3 className="font-bold text-slate-800 mb-1">Instant indexing</h3>
        <p className="text-sm text-slate-500 mb-4">
          Push every product and blog URL to IndexNow (Bing, Yandex, Seznam, Naver). Google discovers
          the same URLs through the sitemap automatically.
        </p>
        <Button onClick={ping} disabled={pinging} className="font-semibold">
          <Rocket className="w-4 h-4" /> {pinging ? 'Submitting…' : 'Submit all URLs now'}
        </Button>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h3 className="font-bold text-slate-800 mb-3">Feeds & crawler files</h3>
        <div className="flex flex-wrap gap-2">
          {links.map(l => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm rounded-full border px-3 py-1.5 text-slate-600 hover:border-primary hover:text-primary">
              {l.label} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h3 className="font-bold text-slate-800 mb-3">SEO health</h3>
        {!audit ? (
          <p className="text-sm text-slate-400">Checking…</p>
        ) : audit.products.length === 0 && audit.posts.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> All {audit.totalProducts} products and {audit.totalPosts} posts have complete SEO fields.
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            {audit.products.length > 0 && (
              <div>
                <p className="flex items-center gap-2 font-semibold text-amber-600 mb-1">
                  <AlertTriangle className="w-4 h-4" /> {audit.products.length} products missing SEO title, description, slug or image
                </p>
                <ul className="text-slate-500 list-disc ps-5 space-y-0.5">
                  {audit.products.slice(0, 10).map(p => <li key={p.id}>{p.name}</li>)}
                </ul>
              </div>
            )}
            {audit.posts.length > 0 && (
              <div>
                <p className="flex items-center gap-2 font-semibold text-amber-600 mb-1">
                  <AlertTriangle className="w-4 h-4" /> {audit.posts.length} blog posts missing SEO meta or cover image
                </p>
                <ul className="text-slate-500 list-disc ps-5 space-y-0.5">
                  {audit.posts.slice(0, 10).map(p => <li key={p.id}>{p.title}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeoDashboard;
