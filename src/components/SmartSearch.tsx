import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Package, Tag, PawPrint, FolderTree, Stethoscope, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';

type ProductLite = {
  id: string;
  name: string;
  name_ur: string | null;
  brand: string | null;
  image_url: string | null;
  price: number;
  discount_price: number | null;
  tags: string[] | null;
  animal_type: string[] | null;
  category_id: string | null;
};

type CategoryLite = { id: string; name: string; name_ur: string | null };

interface Props {
  placeholder?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
  className?: string;
}

const ANIMAL_KEYWORDS = ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Poultry', 'Horse', 'Dog', 'Cat'];

const SmartSearch = ({ placeholder, autoFocus, onNavigate, className = '' }: Props) => {
  const { t, isUrdu } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounce
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 180);
    return () => clearTimeout(id);
  }, [query]);

  // Load categories once
  useEffect(() => {
    supabase.from('categories').select('id, name, name_ur').limit(50).then(({ data }) => {
      setCategories(data || []);
    });
  }, []);

  // Fetch product matches
  useEffect(() => {
    if (!debounced) { setProducts([]); return; }
    let cancelled = false;
    setLoading(true);
    const q = debounced;
    const like = `%${q}%`;
    supabase
      .from('products')
      .select('id, name, name_ur, brand, image_url, price, discount_price, tags, animal_type, category_id')
      .or(`name.ilike.${like},name_ur.ilike.${like},brand.ilike.${like},description.ilike.${like}`)
      .limit(8)
      .then(({ data }) => {
        if (!cancelled) { setProducts(data || []); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [debounced]);

  // Category and animal suggestions from query
  const suggestions = useMemo(() => {
    if (!debounced) return { cats: [] as CategoryLite[], animals: [] as string[] };
    const q = debounced.toLowerCase();
    const cats = categories.filter(c => c.name.toLowerCase().includes(q) || (c.name_ur || '').includes(debounced)).slice(0, 4);
    const animals = ANIMAL_KEYWORDS.filter(a => a.toLowerCase().includes(q)).slice(0, 4);
    return { cats, animals };
  }, [debounced, categories]);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const goTo = (path: string) => {
    setOpen(false);
    setQuery('');
    onNavigate?.();
    navigate(path);
  };

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    goTo(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const showPanel = open && debounced.length > 0;
  const hasResults = products.length > 0 || suggestions.cats.length > 0 || suggestions.animals.length > 0;

  return (
    <div ref={wrapRef} className={`relative w-full ${className}`}>
      <form onSubmit={submitSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            autoFocus={autoFocus}
            placeholder={placeholder || (isUrdu ? 'دوا، بیماری، جانور یا برانڈ تلاش کریں...' : 'Search medicine, disease, animal or brand...')}
            className={`pl-10 pr-9 ${isUrdu ? 'font-urdu text-right' : ''}`}
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-popover border rounded-lg shadow-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
              <Loader2 size={14} className="animate-spin" /> {isUrdu ? 'تلاش جاری ہے...' : 'Searching...'}
            </div>
          )}

          {!loading && !hasResults && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              <Stethoscope size={22} className="mx-auto mb-2 opacity-40" />
              {isUrdu ? 'کوئی نتیجہ نہیں ملا' : 'No results found'}
            </div>
          )}

          {/* Product results */}
          {products.length > 0 && (
            <div className="py-1">
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {isUrdu ? 'مصنوعات' : 'Products'}
              </div>
              {products.map(p => {
                const price = p.discount_price ?? p.price;
                return (
                  <button key={p.id} onClick={() => goTo(`/product/${p.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left transition-colors">
                    <div className="w-10 h-10 rounded bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={16} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{isUrdu && p.name_ur ? p.name_ur : p.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.brand ? `${p.brand} · ` : ''}Rs. {price.toLocaleString()}
                        {p.animal_type && p.animal_type.length > 0 ? ` · ${p.animal_type.slice(0, 2).join(', ')}` : ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Category suggestions */}
          {suggestions.cats.length > 0 && (
            <div className="py-1 border-t">
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {isUrdu ? 'کیٹیگریز' : 'Categories'}
              </div>
              {suggestions.cats.map(c => (
                <button key={c.id} onClick={() => goTo(`/products?category=${c.id}`)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-left text-sm transition-colors">
                  <FolderTree size={14} className="text-primary" />
                  <span className="truncate">{isUrdu && c.name_ur ? c.name_ur : c.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Animal suggestions */}
          {suggestions.animals.length > 0 && (
            <div className="py-1 border-t">
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {isUrdu ? 'جانور' : 'Animal'}
              </div>
              {suggestions.animals.map(a => (
                <button key={a} onClick={() => goTo(`/products?animal=${a}`)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-left text-sm transition-colors">
                  <PawPrint size={14} className="text-primary" />
                  <span>{a}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search-all footer */}
          <button onClick={() => submitSearch()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-muted/40 hover:bg-muted text-xs font-semibold text-primary border-t transition-colors">
            <Search size={12} /> {isUrdu ? `"${query}" کے تمام نتائج دیکھیں` : `See all results for "${query}"`}
          </button>
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
