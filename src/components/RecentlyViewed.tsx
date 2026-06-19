import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from './ProductCard';

interface Props { excludeId?: string }

const RecentlyViewed = ({ excludeId }: Props) => {
  const { ids } = useRecentlyViewed();
  const { t, isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';
  const filtered = ids.filter(id => id !== excludeId).slice(0, 8);

  const { data: products } = useQuery({
    queryKey: ['recently-viewed', filtered.join(',')],
    queryFn: async () => {
      if (filtered.length === 0) return [];
      const { data } = await supabase.from('products').select('*').in('id', filtered);
      if (!data) return [];
      return filtered.map(id => data.find(p => p.id === id)).filter(Boolean) as any[];
    },
    enabled: filtered.length > 0,
  });

  if (!products || products.length === 0) return null;

  return (
    <section className="container py-5">
      <h2 className={`text-lg font-bold text-foreground mb-3 ${f}`}>{t('recentlyViewed')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.map(p => (
          <ProductCard key={p.id} id={p.id} name={p.name} nameUr={p.name_ur} price={p.price}
            discountPrice={p.discount_price} imageUrl={p.image_url} inStock={p.in_stock ?? true}
            tags={p.tags} rating={p.rating} ratingCount={p.rating_count} />
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
