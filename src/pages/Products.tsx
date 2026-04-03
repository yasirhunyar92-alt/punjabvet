import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from '@/components/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

const Products = () => {
  const { t, isUrdu } = useLanguage();
  const fontClass = isUrdu ? 'font-urdu' : '';
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const searchQuery = searchParams.get('search');
  const [sortBy, setSortBy] = useState('newest');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*');
      return data || [];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', categoryFilter, searchQuery, sortBy],
    queryFn: async () => {
      let query = supabase.from('products').select('*');
      if (categoryFilter) query = query.eq('category_id', categoryFilter);
      if (searchQuery) query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      if (sortBy === 'price-low') query = query.order('price', { ascending: true });
      else if (sortBy === 'price-high') query = query.order('price', { ascending: false });
      else query = query.order('created_at', { ascending: false });
      const { data } = await query;
      return data || [];
    },
  });

  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'all');

  return (
    <div className="container py-6">
      <h1 className={`text-2xl font-bold text-foreground mb-4 ${fontClass}`}>{t('products')}</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={selectedCategory} onValueChange={(v) => {
          setSelectedCategory(v);
          const url = v === 'all' ? '/products' : `/products?category=${v}`;
          window.history.replaceState(null, '', url);
        }}>
          <SelectTrigger className={`w-40 ${fontClass}`}>
            <SelectValue placeholder={t('category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className={fontClass}>{t('allProducts')}</SelectItem>
            {categories?.map(c => (
              <SelectItem key={c.id} value={c.id} className={fontClass}>
                {isUrdu && c.name_ur ? c.name_ur : c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className={`w-44 ${fontClass}`}>
            <SelectValue placeholder={t('sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest" className={fontClass}>{t('newest')}</SelectItem>
            <SelectItem value="price-low" className={fontClass}>{t('priceLowHigh')}</SelectItem>
            <SelectItem value="price-high" className={fontClass}>{t('priceHighLow')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card border rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-5 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map(p => (
            <ProductCard key={p.id} id={p.id} name={p.name} nameUr={p.name_ur} price={p.price} imageUrl={p.image_url} inStock={p.in_stock ?? true} featured={p.featured ?? false} />
          ))}
        </div>
      ) : (
        <div className={`text-center py-16 text-muted-foreground ${fontClass}`}>
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg">{t('noResults')}</p>
        </div>
      )}
    </div>
  );
};

export default Products;
