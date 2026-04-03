import { Link } from 'react-router-dom';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  id: string;
  name: string;
  nameUr?: string | null;
  price: number;
  imageUrl?: string | null;
  inStock?: boolean;
  featured?: boolean;
}

const ProductCard = ({ id, name, nameUr, price, imageUrl, inStock = true, featured }: ProductCardProps) => {
  const { t, isUrdu } = useLanguage();
  const { addToCart } = useCart();
  const fontClass = isUrdu ? 'font-urdu' : '';
  const displayName = isUrdu && nameUr ? nameUr : name;

  const whatsappMsg = encodeURIComponent(`Hello, I want to order "${name}" from Punjab Veterinary Medical Store.`);

  return (
    <div className="bg-card rounded-lg border card-elevated overflow-hidden flex flex-col">
      <Link to={`/product/${id}`} className="block">
        <div className="aspect-square bg-muted relative overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">
              🐄
            </div>
          )}
          {featured && (
            <Badge className="absolute top-2 left-2 text-[10px]">{t('featured')}</Badge>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
              <span className={`text-primary-foreground font-semibold ${fontClass}`}>{t('outOfStock')}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <Link to={`/product/${id}`}>
          <h3 className={`text-sm font-medium text-foreground line-clamp-2 mb-1 ${fontClass}`}>
            {displayName}
          </h3>
        </Link>
        <p className="text-primary font-bold text-lg mt-auto">
          {t('rs')} {price.toLocaleString()}
        </p>

        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            className={`flex-1 text-xs ${fontClass}`}
            onClick={() => addToCart(id)}
            disabled={!inStock}
          >
            <ShoppingCart size={14} />
            {t('addToCart')}
          </Button>
          <a href={`https://wa.me/923065757283?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="whatsapp-green border-0 px-2">
              <MessageCircle size={14} />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
