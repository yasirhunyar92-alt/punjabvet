import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Pill, Syringe, Beef, Milk } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from '@/components/ProductCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const categoryIcons: Record<string, React.ReactNode> = {
  medicines: <Pill size={32} />,
  vaccines: <Syringe size={32} />,
  supplements: <Beef size={32} />,
  dairy: <Milk size={32} />,
};

const Index = () => {
  const { t, isUrdu } = useLanguage();
  const fontClass = isUrdu ? 'font-urdu' : '';

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*');
      return data || [];
    },
  });

  const { data: featuredProducts } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('featured', true).limit(8);
      return data || [];
    },
  });

  const { data: allProducts } = useQuery({
    queryKey: ['all-products-home'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(12);
      return data || [];
    },
  });

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="hero-gradient py-12 px-4">
        <div className="container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className={`text-3xl md:text-4xl font-bold text-primary-foreground mb-3 ${fontClass}`}>
              {t('heroTitle')}
            </h2>
            <p className={`text-primary-foreground/90 text-lg mb-6 ${fontClass}`}>
              {t('heroSubtitle')}
            </p>
            <Link to="/products">
              <Button size="lg" variant="secondary" className={`text-base font-semibold ${fontClass}`}>
                {t('shopNow')} <ArrowRight size={18} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-8">
        <h2 className={`text-xl font-bold text-foreground mb-5 ${fontClass}`}>{t('categories')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(categories && categories.length > 0 ? categories : [
            { id: '1', name: 'Medicines', name_ur: 'ادویات' },
            { id: '2', name: 'Vaccines', name_ur: 'ویکسین' },
            { id: '3', name: 'Supplements', name_ur: 'جانوروں کی خوراک' },
            { id: '4', name: 'Dairy Products', name_ur: 'ڈیری مصنوعات' },
          ]).map((cat, i) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="bg-card border rounded-lg p-4 text-center card-elevated"
            >
              <div className="text-primary mb-2 flex justify-center">
                {Object.values(categoryIcons)[i % 4]}
              </div>
              <h3 className={`text-sm font-semibold text-foreground ${fontClass}`}>
                {isUrdu && cat.name_ur ? cat.name_ur : cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="container py-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className={`text-xl font-bold text-foreground ${fontClass}`}>{t('featuredProducts')}</h2>
            <Link to="/products?featured=true">
              <Button variant="ghost" size="sm" className={fontClass}>{t('viewAll')} <ArrowRight size={14} /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredProducts.map(p => (
              <ProductCard key={p.id} id={p.id} name={p.name} nameUr={p.name_ur} price={p.price} imageUrl={p.image_url} inStock={p.in_stock ?? true} featured={p.featured ?? false} />
            ))}
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-xl font-bold text-foreground ${fontClass}`}>{t('allProducts')}</h2>
          <Link to="/products">
            <Button variant="ghost" size="sm" className={fontClass}>{t('viewAll')} <ArrowRight size={14} /></Button>
          </Link>
        </div>
        {allProducts && allProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allProducts.map(p => (
              <ProductCard key={p.id} id={p.id} name={p.name} nameUr={p.name_ur} price={p.price} imageUrl={p.image_url} inStock={p.in_stock ?? true} featured={p.featured ?? false} />
            ))}
          </div>
        ) : (
          <div className={`text-center py-12 text-muted-foreground ${fontClass}`}>
            <p className="text-lg">🐄</p>
            <p>{t('noResults')}</p>
            <p className="text-sm mt-1">Products will appear here once added by admin</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
