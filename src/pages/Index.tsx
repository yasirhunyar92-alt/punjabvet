import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, Shield, Clock, Star, Zap, Phone, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from '@/components/ProductCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import heroBanner from '@/assets/hero-banner.jpg';
import medicinesImg from '@/assets/medicines-category.jpg';
import vaccinesImg from '@/assets/vaccines-category.jpg';
import supplementsImg from '@/assets/supplements-category.jpg';

const categoryImages: Record<string, string> = {
  medicines: medicinesImg, vaccines: vaccinesImg, supplements: supplementsImg,
};

const Index = () => {
  const { t, isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const { data } = await supabase.from('categories').select('*'); return data || []; },
  });

  const { data: featuredProducts } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => { const { data } = await supabase.from('products').select('*').eq('featured', true).limit(8); return data || []; },
  });

  const { data: allProducts } = useQuery({
    queryKey: ['all-products-home'],
    queryFn: async () => { const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(12); return data || []; },
  });

  const testimonials = [
    { name: isUrdu ? 'محمد اکرم' : 'Muhammad Akram', text: isUrdu ? 'پنجاب ویٹ سے ہمیشہ اصلی دوائیں ملتی ہیں۔ بہترین سروس!' : 'Always get genuine medicines from Punjab Vet. Excellent service!', location: 'Sillanwali' },
    { name: isUrdu ? 'عبداللہ خان' : 'Abdullah Khan', text: isUrdu ? 'واٹس ایپ سے آرڈر کرنا بہت آسان ہے۔ فوری ڈیلیوری ملتی ہے۔' : 'Ordering via WhatsApp is so convenient. Fast delivery every time.', location: 'Sargodha' },
    { name: isUrdu ? 'حافظ نعیم' : 'Hafiz Naeem', text: isUrdu ? 'میرے مویشیوں کی صحت میں بہت بہتری آئی۔ شکریہ پنجاب ویٹ!' : 'My livestock health improved significantly. Thank you Punjab Vet!', location: 'Bhalwal' },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={heroBanner} alt={isUrdu ? 'سیلنوالی میں پنجاب ویٹرنری میڈیکل سٹور' : 'Punjab Veterinary Medical Store Sillanwali'} className="w-full h-64 md:h-96 object-cover" width={1920} height={800} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-lg">
              <div className="inline-flex items-center gap-1.5 bg-primary-foreground/15 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
                <Zap size={14} className="text-accent-foreground" />
                <span className={`text-xs font-medium text-primary-foreground ${f}`}>{t('trustedStore')}</span>
              </div>
              <h1 className={`text-xl md:text-4xl font-extrabold text-primary-foreground mb-2 leading-tight ${f}`}>
                {isUrdu ? 'آپ کے مویشیوں اور پالتو جانوروں کے لیے قابل اعتماد ویٹرنری حل' : 'Trusted Veterinary Solutions for Your Livestock & Pets'}
              </h1>
              <p className={`text-primary-foreground/85 text-xs md:text-sm mb-4 leading-relaxed ${f}`}>
                {isUrdu ? 'معیاری ادویات، ویکسینز اور سپلیمنٹس — سیلنوالی سے آپ کی دہلیز تک' : 'Quality medicines, vaccines & supplements — from Sillanwali to your doorstep'}
              </p>
              <div className="flex gap-2">
                <Link to="/products"><Button size="lg" variant="secondary" className={`font-bold shadow-lg text-sm ${f}`}>{isUrdu ? 'ابھی آرڈر کریں' : 'Order Now'} <ArrowRight size={16} /></Button></Link>
                <Link to="/contact"><Button size="lg" variant="outline" className={`border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-sm ${f}`}>{t('contactUs')}</Button></Link>
              </div>
              <div className="mt-4 flex items-center gap-2 text-primary-foreground/80">
                <Phone size={14} /><span className="text-xs font-medium">0306-5757283</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
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
                <span className={`text-[10px] md:text-xs font-medium text-muted-foreground ${f}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container py-6">
        <h2 className={`text-lg font-bold text-foreground mb-4 text-center ${f}`}>{isUrdu ? 'ہماری خدمات' : 'Our Services'}</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { img: vaccinesImg, title: isUrdu ? 'ویکسینز' : 'Vaccines', alt: isUrdu ? 'سیلنوالی میں پنجاب ویٹ کی ویکسینز' : 'Veterinary vaccines at Punjab Vet Sillanwali' },
            { img: medicinesImg, title: isUrdu ? 'ادویات' : 'Medicines', alt: isUrdu ? 'پنجاب ویٹ کی جانوروں کی ادویات' : 'Animal medicines at Punjab Vet' },
            { img: supplementsImg, title: isUrdu ? 'سپلیمنٹس' : 'Supplements', alt: isUrdu ? 'مویشیوں کے سپلیمنٹس' : 'Animal health supplements' },
          ].map((s, i) => (
            <Link key={i} to="/products" className="group">
              <div className="rounded-xl overflow-hidden border bg-card card-elevated">
                <img src={s.img} alt={s.alt} className="w-full h-24 md:h-36 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" width={512} height={512} />
                <p className={`text-center py-2 text-xs md:text-sm font-bold text-foreground ${f}`}>{s.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-5">
        <h2 className={`text-lg font-bold text-foreground mb-3 ${f}`}>{t('categories')}</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {(categories && categories.length > 0 ? categories : [
            { id: '1', name: 'Medicines', name_ur: 'ادویات', image_url: null },
            { id: '2', name: 'Vaccines', name_ur: 'ویکسین', image_url: null },
            { id: '3', name: 'Supplements', name_ur: 'جانوروں کی خوراک', image_url: null },
          ]).map((cat) => (
            <Link key={cat.id} to={`/products?category=${cat.id}`} className="flex-shrink-0 w-20 md:w-24 group">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-accent border-2 border-transparent group-hover:border-primary transition-colors flex items-center justify-center overflow-hidden">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <img src={categoryImages[cat.name.toLowerCase()] || medicinesImg} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                )}
              </div>
              <p className={`text-[11px] md:text-xs text-center mt-1.5 font-medium text-foreground line-clamp-2 ${f}`}>
                {isUrdu && cat.name_ur ? cat.name_ur : cat.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="container py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-destructive text-destructive-foreground px-2.5 py-1 rounded-md">
                <Star size={14} className="inline mr-1" />
                <span className={`text-xs font-bold uppercase tracking-wider ${f}`}>{t('featuredProducts')}</span>
              </div>
            </div>
            <Link to="/products"><Button variant="ghost" size="sm" className={`text-primary text-xs ${f}`}>{t('viewAll')} <ArrowRight size={12} /></Button></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featuredProducts.map(p => (
              <ProductCard key={p.id} id={p.id} name={p.name} nameUr={p.name_ur} price={p.price}
                discountPrice={p.discount_price} imageUrl={p.image_url} inStock={p.in_stock ?? true}
                featured={p.featured ?? false} tags={p.tags} rating={p.rating} ratingCount={p.rating_count} />
            ))}
          </div>
        </section>
      )}

      {/* WhatsApp Banner */}
      <section className="container py-3">
        <div className="bg-gradient-to-r from-primary/10 via-accent to-primary/5 rounded-xl p-5 md:p-8 border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className={`font-bold text-foreground text-base md:text-lg mb-1 ${f}`}>{t('whatsappOrder')}</h3>
              <p className={`text-xs md:text-sm text-muted-foreground ${f}`}>{t('whatsappOrderDesc')}</p>
            </div>
            <a href="https://wa.me/923065757283" target="_blank" rel="noopener noreferrer">
              <Button className="whatsapp-green border-0 shadow-md font-bold text-xs md:text-sm">WhatsApp</Button>
            </a>
          </div>
        </div>
      </section>

      {/* All Products */}
      <section className="container py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-bold text-foreground ${f}`}>{t('allProducts')}</h2>
          <Link to="/products"><Button variant="ghost" size="sm" className={`text-primary text-xs ${f}`}>{t('viewAll')} <ArrowRight size={12} /></Button></Link>
        </div>
        {allProducts && allProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {allProducts.map(p => (
              <ProductCard key={p.id} id={p.id} name={p.name} nameUr={p.name_ur} price={p.price}
                discountPrice={p.discount_price} imageUrl={p.image_url} inStock={p.in_stock ?? true}
                featured={p.featured ?? false} tags={p.tags} rating={p.rating} ratingCount={p.rating_count} />
            ))}
          </div>
        ) : (
          <div className={`text-center py-16 text-muted-foreground ${f}`}>
            <p className="text-4xl mb-3">🐄</p>
            <p className="font-medium">{t('noResults')}</p>
            <p className="text-sm mt-1">{isUrdu ? 'ایڈمن مصنوعات شامل کرنے کے بعد یہاں نظر آئیں گی' : 'Products will appear here once added by admin'}</p>
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="container py-6 pb-10">
        <h2 className={`text-lg font-bold text-foreground mb-4 text-center ${f}`}>{isUrdu ? 'ہمارے گاہکوں کی رائے' : 'What Our Customers Say'}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-5 border shadow-sm">
              <Quote size={20} className="text-primary/30 mb-2" />
              <p className={`text-sm text-muted-foreground italic mb-3 ${f}`}>"{item.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{item.name.charAt(0)}</div>
                <div>
                  <p className={`text-sm font-semibold text-foreground ${f}`}>{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
