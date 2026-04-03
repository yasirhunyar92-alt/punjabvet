import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, MessageCircle, ArrowLeft } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Badge } from '@/components/ui/badge';

const ProductDetail = () => {
  const { id } = useParams();
  const { t, isUrdu } = useLanguage();
  const { addToCart } = useCart();
  const fontClass = isUrdu ? 'font-urdu' : '';

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, categories(name, name_ur)').eq('id', id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('category_id', product!.category_id!).neq('id', id!).limit(4);
      return data || [];
    },
    enabled: !!product?.category_id,
  });

  if (isLoading) return (
    <div className="container py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-24 bg-muted rounded" />
        <div className="aspect-square max-w-md bg-muted rounded-lg" />
        <div className="h-6 w-3/4 bg-muted rounded" />
        <div className="h-8 w-1/4 bg-muted rounded" />
      </div>
    </div>
  );

  if (!product) return (
    <div className="container py-16 text-center text-muted-foreground">
      <p className="text-4xl mb-4">😔</p>
      <p>Product not found</p>
      <Link to="/products"><Button variant="outline" className="mt-4">{t('continueShopping')}</Button></Link>
    </div>
  );

  const displayName = isUrdu && product.name_ur ? product.name_ur : product.name;
  const displayDesc = isUrdu && product.description_ur ? product.description_ur : product.description;
  const whatsappMsg = encodeURIComponent(`Hello, I want to order "${product.name}" (Rs. ${product.price}) from Punjab Veterinary Medical Store.`);

  return (
    <div className="container py-6">
      <Link to="/products" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 text-sm">
        <ArrowLeft size={16} /> {t('products')}
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🐄</div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.categories && (
            <Badge variant="secondary" className={`mb-2 ${fontClass}`}>
              {isUrdu && (product.categories as any).name_ur ? (product.categories as any).name_ur : (product.categories as any).name}
            </Badge>
          )}
          <h1 className={`text-2xl font-bold text-foreground mb-2 ${fontClass}`}>{displayName}</h1>
          <p className="text-3xl font-bold text-primary mb-4">{t('rs')} {product.price.toLocaleString()}</p>
          
          <Badge variant={product.in_stock ? 'default' : 'destructive'} className={fontClass}>
            {product.in_stock ? t('inStock') : t('outOfStock')}
          </Badge>

          {displayDesc && (
            <div className="mt-6">
              <h3 className={`font-semibold text-foreground mb-2 ${fontClass}`}>{t('description')}</h3>
              <p className={`text-muted-foreground leading-relaxed ${fontClass}`}>{displayDesc}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-8">
            <Button size="lg" onClick={() => addToCart(product.id)} disabled={!product.in_stock} className={fontClass}>
              <ShoppingCart size={18} /> {t('addToCart')}
            </Button>
            <a href={`https://wa.me/923065757283?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className={`w-full whatsapp-green border-0 ${fontClass}`}>
                <MessageCircle size={18} /> {t('orderViaWhatsApp')}
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className={`text-xl font-bold text-foreground mb-5 ${fontClass}`}>{t('relatedProducts')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} id={p.id} name={p.name} nameUr={p.name_ur} price={p.price} imageUrl={p.image_url} inStock={p.in_stock ?? true} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
