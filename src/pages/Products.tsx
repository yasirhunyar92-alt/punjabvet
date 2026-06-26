import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from '@/components/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

const ANIMAL_TYPES = ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Poultry', 'Horse', 'Dog', 'Cat'];

const Products = () => {
  const { t, isUrdu } = useLanguage();
  const fontClass = isUrdu ? 'font-urdu' : '';
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'all');
  const [selectedAnimal, setSelectedAnimal] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*');
      return data || [];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Extract all unique tags from products
  const allTags = useMemo(() => {
    if (!products) return [];
    const tagSet = new Set<string>();
    products.forEach(p => (p.tags || []).forEach((t: string) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [products]);

  // Filter and sort products client-side
  const filtered = useMemo(() => {
    if (!products) return [];
    let result = [...products];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.name_ur || '').includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.tags || []).some((t: string) => t.toLowerCase().includes(q)) ||
        (p.brand || '').toLowerCase().includes(q)
      );
    }

    // Category
    if (selectedCategory !== 'all') result = result.filter(p => p.category_id === selectedCategory);

    // Animal type
    if (selectedAnimal !== 'all') result = result.filter(p => (p.animal_type || []).includes(selectedAnimal));

    // Tag
    if (selectedTag !== 'all') result = result.filter(p => (p.tags || []).includes(selectedTag));

    // Price range
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    if (!isNaN(min)) result = result.filter(p => (p.discount_price ?? p.price) >= min);
    if (!isNaN(max)) result = result.filter(p => (p.discount_price ?? p.price) <= max);

    // Sort
    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);

    return result;
  }, [products, searchQuery, selectedCategory, selectedAnimal, selectedTag, sortBy, priceMin, priceMax]);

  const hasActiveFilters = selectedCategory !== 'all' || selectedAnimal !== 'all' || selectedTag !== 'all' || searchQuery.trim() || priceMin || priceMax;

  const clearFilters = () => {
    setSelectedCategory('all'); setSelectedAnimal('all'); setSelectedTag('all'); setSearchQuery(''); setPriceMin(''); setPriceMax('');
  };

  return (
    <div className="container py-6">
      <SEOHead title="Products" description="Browse quality veterinary medicines, vaccines and supplements at Punjab Vet Sillanwali." url="/products" />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">{t('breadcrumbHome')}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{t('products')}</span>
      </nav>

      <h1 className={`text-2xl font-bold text-foreground mb-4 ${fontClass}`}>{t('products')}</h1>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('search')}
          className={`pl-10 ${fontClass}`} />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filters Toggle + Sort */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
          <SlidersHorizontal size={14} /> {t('filters')}
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
        </Button>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className={`w-44 h-9 ${fontClass}`}><SelectValue placeholder={t('sortBy')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('newest')}</SelectItem>
            <SelectItem value="price-low">{t('priceLowHigh')}</SelectItem>
            <SelectItem value="price-high">{t('priceHighLow')}</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">{t('clearFilters')}</Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-card border rounded-lg p-4 mb-4 space-y-3">
          <div>
            <p className={`text-xs font-semibold mb-1.5 ${fontClass}`}>{t('category')}</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setSelectedCategory('all')}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedCategory === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                {t('allProducts')}
              </button>
              {categories?.map(c => (
                <button key={c.id} onClick={() => setSelectedCategory(c.id)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedCategory === c.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                  {isUrdu && c.name_ur ? c.name_ur : c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={`text-xs font-semibold mb-1.5 ${fontClass}`}>{t('filterByAnimal')}</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setSelectedAnimal('all')}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedAnimal === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                All
              </button>
              {ANIMAL_TYPES.map(a => (
                <button key={a} onClick={() => setSelectedAnimal(a)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedAnimal === a ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {allTags.length > 0 && (
            <div>
              <p className={`text-xs font-semibold mb-1.5 ${fontClass}`}>{t('filterByTag')}</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setSelectedTag('all')}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedTag === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                  All
                </button>
                {allTags.map(tag => (
                  <button key={tag} onClick={() => setSelectedTag(tag)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedTag === tag ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className={`text-xs font-semibold mb-1.5 ${fontClass}`}>{isUrdu ? 'قیمت کی حد (روپے)' : 'Price Range (PKR)'}</p>
            <div className="flex items-center gap-2">
              <Input type="number" min="0" placeholder={isUrdu ? 'کم سے کم' : 'Min'} value={priceMin}
                onChange={e => setPriceMin(e.target.value)} className="h-8 w-28 text-xs" />
              <span className="text-muted-foreground text-xs">—</span>
              <Input type="number" min="0" placeholder={isUrdu ? 'زیادہ سے زیادہ' : 'Max'} value={priceMax}
                onChange={e => setPriceMax(e.target.value)} className="h-8 w-28 text-xs" />
            </div>
          </div>
        </div>
      )}
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setSelectedTag('all')}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedTag === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                  All
                </button>
                {allTags.map(tag => (
                  <button key={tag} onClick={() => setSelectedTag(tag)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedTag === tag ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card border rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <div className="p-3 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-5 bg-muted rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map(p => (
            <ProductCard key={p.id} id={p.id} name={p.name} nameUr={p.name_ur} price={p.price}
              discountPrice={p.discount_price} imageUrl={p.image_url} inStock={p.in_stock ?? true}
              featured={p.featured ?? false} tags={p.tags} rating={p.rating} ratingCount={p.rating_count} />
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
