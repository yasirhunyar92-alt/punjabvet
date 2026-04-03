import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, Shield, Clock, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from '@/components/ProductCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
    <div className="min-h-screen bg-muted/30">
      {/* Hero Banner — Daraz/Amazon style full-width */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />
        <div className="container relative py-10 px-4 md:py-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="max-w-lg"
          >
            <div className="inline-flex items-center gap-1.5 bg-primary-foreground/15 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
              <Zap size={14} className="text-accent-foreground" />
              <span className="text-xs font-medium text-primary-foreground">{t('trustedStore')}</span>
            </div>
            <h1 className={`text-2xl md:text-4xl font-extrabold text-primary-foreground mb-3 leading-tight ${fontClass}`}>
              {t('heroTitle')}
            </h1>
            <p className={`text-primary-foreground/85 text-sm md:text-base mb-6 leading-relaxed ${fontClass}`}>
              {t('heroSubtitle')}
            </p>
            <div className="flex gap-3">
              <Link to="/products">
                <Button size="lg" variant="secondary" className={`font-bold shadow-lg ${fontClass}`}>
                  {t('shopNow')} <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="https://wa.me/923065757283" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  WhatsApp
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges — Amazon style */}
      <section className="bg-card border-b">
        <div className="container py-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: <Truck size={18} />, label: t('freeDelivery') },
              { icon: <Shield size={18} />, label: t('genuineProducts') },
              { icon: <Clock size={18} />, label: t('fastService') },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-1">
                <div className="text-primary">{item.icon}</div>
                <span className={`text-[10px] md:text-xs font-medium text-muted-foreground ${fontClass}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories — Horizontal scroll like Daraz */}
      <section className="container py-5">
        <h2 className={`text-lg font-bold text-foreground mb-3 ${fontClass}`}>{t('categories')}</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {(categories && categories.length > 0 ? categories : [
            { id: '1', name: 'Medicines', name_ur: 'ادویات', image_url: null },
            { id: '2', name: 'Vaccines', name_ur: 'ویکسین', image_url: null },
            { id: '3', name: 'Supplements', name_ur: 'جانوروں کی خوراک', image_url: null },
            { id: '4', name: 'Dairy Products', name_ur: 'ڈیری مصنوعات', image_url: null },
          ]).map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="flex-shrink-0 w-20 md:w-24 group"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-accent border-2 border-transparent group-hover:border-primary transition-colors flex items-center justify-center overflow-hidden">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🐄</span>
                )}
              </div>
              <p className={`text-[11px] md:text-xs text-center mt-1.5 font-medium text-foreground line-clamp-2 ${fontClass}`}>
                {isUrdu && cat.name_ur ? cat.name_ur : cat.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Flash Deal / Featured — Daraz-style section header */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="container py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-destructive text-destructive-foreground px-2.5 py-1 rounded-md">
                <Star size={14} className="inline mr-1" />
                <span className={`text-xs font-bold uppercase tracking-wider ${fontClass}`}>{t('featuredProducts')}</span>
              </div>
            </div>
            <Link to="/products?featured=true">
              <Button variant="ghost" size="sm" className={`text-primary text-xs ${fontClass}`}>{t('viewAll')} <ArrowRight size={12} /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featuredProducts.map(p => (
              <ProductCard key={p.id} id={p.id} name={p.name} nameUr={p.name_ur} price={p.price} imageUrl={p.image_url} inStock={p.in_stock ?? true} featured={p.featured ?? false} />
            ))}
          </div>
        </section>
      )}

      {/* Promotional Banner */}
      <section className="container py-3">
        <div className="bg-gradient-to-r from-primary/10 via-accent to-primary/5 rounded-xl p-5 md:p-8 border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className={`font-bold text-foreground text-base md:text-lg mb-1 ${fontClass}`}>{t('whatsappOrder')}</h3>
              <p className={`text-xs md:text-sm text-muted-foreground ${fontClass}`}>{t('whatsappOrderDesc')}</p>
            </div>
            <a href="https://wa.me/923065757283" target="_blank" rel="noopener noreferrer">
              <Button className="whatsapp-green border-0 shadow-md font-bold text-xs md:text-sm">
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* All Products — Grid like Amazon */}
      <section className="container py-5 pb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-bold text-foreground ${fontClass}`}>{t('allProducts')}</h2>
          <Link to="/products">
            <Button variant="ghost" size="sm" className={`text-primary text-xs ${fontClass}`}>{t('viewAll')} <ArrowRight size={12} /></Button>
          </Link>
        </div>
        {allProducts && allProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {allProducts.map(p => (
              <ProductCard key={p.id} id={p.id} name={p.name} nameUr={p.name_ur} price={p.price} imageUrl={p.image_url} inStock={p.in_stock ?? true} featured={p.featured ?? false} />
            ))}
          </div>
        ) : (
          <div className={`text-center py-16 text-muted-foreground ${fontClass}`}>
            <p className="text-4xl mb-3">🐄</p>
            <p className="font-medium">{t('noResults')}</p>
            <p className="text-sm mt-1">Products will appear here once added by admin</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
