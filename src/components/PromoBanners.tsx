import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

function useCountdown(target?: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [target]);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

const PromoBanners = () => {
  const { isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';
  const [idx, setIdx] = useState(0);

  const { data: banners } = useQuery({
    queryKey: ['active-banners'],
    queryFn: async () => {
      const { data } = await supabase.from('banners').select('*').eq('active', true).order('sort_order');
      return data || [];
    },
  });

  useEffect(() => {
    if (!banners || banners.length < 2) return;
    const i = setInterval(() => setIdx(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(i);
  }, [banners]);

  const b = banners?.[idx];
  const countdown = useCountdown(b?.countdown_to);
  if (!banners || banners.length === 0 || !b) return null;
  const title = isUrdu && b.title_ur ? b.title_ur : b.title;
  const subtitle = isUrdu && b.subtitle_ur ? b.subtitle_ur : b.subtitle;

  const inner = (
    <div className="relative h-32 md:h-44 rounded-xl overflow-hidden border bg-gradient-to-r from-primary/90 to-primary/60">
      {b.image_url && <img src={b.image_url} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-60" />}
      <div className="relative h-full flex flex-col justify-center px-4 md:px-6 text-primary-foreground">
        <h3 className={`text-base md:text-xl font-bold ${f}`}>{title}</h3>
        {subtitle && <p className={`text-xs md:text-sm opacity-90 mt-1 ${f}`}>{subtitle}</p>}
        {countdown && (
          <div className="flex items-center gap-1.5 mt-2 text-xs font-mono bg-black/30 backdrop-blur-sm rounded px-2 py-1 w-fit">
            <Clock size={12} />
            <span>{countdown.d}d {String(countdown.h).padStart(2,'0')}:{String(countdown.m).padStart(2,'0')}:{String(countdown.s).padStart(2,'0')}</span>
          </div>
        )}
        {b.cta_text && <span className="mt-2 text-xs font-semibold underline w-fit">{b.cta_text} →</span>}
      </div>
      {banners.length > 1 && (
        <>
          <button onClick={(e) => { e.preventDefault(); setIdx((idx - 1 + banners.length) % banners.length); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1">
            <ChevronLeft size={16} />
          </button>
          <button onClick={(e) => { e.preventDefault(); setIdx((idx + 1) % banners.length); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1">
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {banners.map((_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1 bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <section className="container py-3">
      {b.link_url ? <Link to={b.link_url}>{inner}</Link> : inner}
    </section>
  );
};

export default PromoBanners;
