import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, MessageCircle, Star, ChevronRight, Zap } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isUrdu } = useLanguage();
  const { addToCart } = useCart();
  const fontClass = isUrdu ? 'font-urdu' : '';
  const [selectedImage, setSelectedImage] = useState(0);

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

  const handleBuyNow = async () => {
    if (!product) return;
    await addToCart(product.id);
    navigate('/checkout');
  };

  if (isLoading) return (
    <div className="container py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-24 bg-muted rounded" />
        <div className="aspect-square max-w-md bg-muted rounded-lg" />
        <div className="h-6 w-3/4 bg-muted rounded" />
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
  const categoryName = product.categories ? (isUrdu && (product.categories as any).name_ur ? (product.categories as any).name_ur : (product.categories as any).name) : '';
  const whatsappMsg = encodeURIComponent(`Hello, I want to order "${product.name}" (Rs. ${product.discount_price || product.price}) from Punjab Veterinary Medical Store.`);
  const allImages = (product.images && product.images.length > 0) ? product.images : (product.image_url ? [product.image_url] : []);
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const usageText = isUrdu && product.usage_instructions_ur ? product.usage_instructions_ur : product.usage_instructions;

  return (
    <div className="container py-6">
      <SEOHead
        title={`${product.name} — Rs. ${product.discount_price || product.price}`}
        description={`Buy ${product.name} at Rs. ${product.discount_price || product.price} from Punjab Veterinary Medical Store Sillanwali. ${product.description || ''}`}
        keywords={`${product.name}, ${categoryName}, ${(product.tags || []).join(', ')}, veterinary medicine Sillanwali, Punjab Vet`}
        image={product.image_url || undefined}
        url={`/product/${product.id}`}
        type="product"
        jsonLd={{
          '@context': 'https://schema.org', '@type': 'Product', name: product.name,
          description: product.description || `${product.name} available at Punjab Veterinary Medical Store`,
          image: allImages, brand: { '@type': 'Brand', name: product.brand || 'Punjab Vet' },
          offers: { '@type': 'Offer', price: product.discount_price || product.price, priceCurrency: 'PKR',
            availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: { '@type': 'Organization', name: 'Punjab Veterinary Medical Store' } },
        }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 flex-wrap">
        <Link to="/" className="hover:text-primary">{t('breadcrumbHome')}</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-primary">{t('products')}</Link>
        {categoryName && <><ChevronRight size={12} /><span>{categoryName}</span></>}
        <ChevronRight size={12} />
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-3">
            {allImages.length > 0 ? (
              <img src={allImages[selectedImage] || allImages[0]} alt={`${product.name} — Punjab Vet Sillanwali`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🐄</div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img: string, i: number) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${i === selectedImage ? 'border-primary' : 'border-border'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.categories && (
            <Badge variant="secondary" className={`mb-2 ${fontClass}`}>{categoryName}</Badge>
          )}
          <h1 className={`text-2xl font-bold text-foreground mb-2 ${fontClass}`}>{displayName}</h1>

          {/* Rating */}
          {product.rating != null && product.rating > 0 && (
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className={i < Math.round(product.rating) ? 'fill-warning text-warning' : 'text-border'} />
              ))}
              <span className="text-sm text-muted-foreground ml-1">({product.rating_count || 0} {t('reviews')})</span>
            </div>
          )}

          {/* Price */}
          <div className="mb-4">
            {hasDiscount ? (
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-primary">{t('rs')} {product.discount_price.toLocaleString()}</p>
                <p className="text-lg text-muted-foreground line-through">Rs. {product.price.toLocaleString()}</p>
                <Badge className="bg-destructive hover:bg-destructive text-[11px]">-{Math.round(((product.price - product.discount_price) / product.price) * 100)}%</Badge>
              </div>
            ) : (
              <p className="text-3xl font-bold text-primary">{t('rs')} {product.price.toLocaleString()}</p>
            )}
          </div>

          <Badge variant={product.in_stock ? 'default' : 'destructive'} className={fontClass}>
            {product.in_stock ? t('inStock') : t('outOfStock')}
          </Badge>
          {product.stock_quantity > 0 && <span className="text-xs text-muted-foreground ml-2">{product.stock_quantity} available</span>}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {product.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Animal Types */}
          {product.animal_type && product.animal_type.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {product.animal_type.map((a: string) => (
                <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
              ))}
            </div>
          )}

          {/* Details */}
          <div className="mt-4 space-y-2 text-sm">
            {product.brand && <div className="flex justify-between border-b border-dashed border-border pb-1"><span className="text-muted-foreground">{t('brand')}</span><span className="font-medium">{product.brand}</span></div>}
            {product.volume_size && <div className="flex justify-between border-b border-dashed border-border pb-1"><span className="text-muted-foreground">{t('volumeSize')}</span><span className="font-medium">{product.volume_size}</span></div>}
            {product.sku && <div className="flex justify-between border-b border-dashed border-border pb-1"><span className="text-muted-foreground">{t('sku')}</span><span className="font-medium">{product.sku}</span></div>}
            {product.expiry_date && <div className="flex justify-between border-b border-dashed border-border pb-1"><span className="text-muted-foreground">{t('expiryDate')}</span><span className="font-medium">{product.expiry_date}</span></div>}
            {product.batch_number && <div className="flex justify-between border-b border-dashed border-border pb-1"><span className="text-muted-foreground">{t('batchNumber')}</span><span className="font-medium">{product.batch_number}</span></div>}
          </div>

          {/* Description - Benefits */}
          {displayDesc && (
            <div className="mt-6">
              <h3 className={`font-semibold text-foreground mb-2 ${fontClass}`}>{t('description')}</h3>
              <p className={`text-muted-foreground leading-relaxed ${fontClass}`}>{displayDesc}</p>
            </div>
          )}

          {/* Usage Instructions */}
          {usageText && (
            <div className="mt-4">
              <h3 className={`font-semibold text-foreground mb-2 ${fontClass}`}>{t('usageInstructions')}</h3>
              <p className={`text-muted-foreground leading-relaxed text-sm ${fontClass}`}>{usageText}</p>
            </div>
          )}

          {/* Action Buttons: Buy Now + Add to Cart */}
          <div className="flex flex-col gap-3 mt-8">
            <Button size="lg" onClick={handleBuyNow} disabled={!product.in_stock} className={`bg-accent-foreground hover:bg-accent-foreground/90 ${fontClass}`}>
              <Zap size={18} /> {t('buyNow')}
            </Button>
            <Button size="lg" variant="outline" onClick={() => addToCart(product.id)} disabled={!product.in_stock} className={fontClass}>
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
              <ProductCard key={p.id} id={p.id} name={p.name} nameUr={p.name_ur} price={p.price}
                discountPrice={p.discount_price} imageUrl={p.image_url} inStock={p.in_stock ?? true}
                tags={p.tags} rating={p.rating} ratingCount={p.rating_count} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
