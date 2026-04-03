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
    <div className="bg-card rounded-lg border overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <Link to={`/product/${id}`} className="block">
        <div className="aspect-square bg-muted relative overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl bg-gradient-to-br from-muted to-accent/30">
              🐄
            </div>
          )}
          {featured && (
            <Badge className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0 h-4 bg-destructive hover:bg-destructive">
              {t('featured')}
            </Badge>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center backdrop-blur-[1px]">
              <span className={`text-primary-foreground font-bold text-xs bg-destructive px-2 py-0.5 rounded ${fontClass}`}>{t('outOfStock')}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-2.5 flex flex-col flex-1">
        <Link to={`/product/${id}`}>
          <h3 className={`text-xs font-medium text-foreground line-clamp-2 mb-1 leading-snug hover:text-primary transition-colors ${fontClass}`}>
            {displayName}
          </h3>
        </Link>
        
        <div className="mt-auto">
          <p className="text-primary font-extrabold text-base">
            <span className="text-[10px] font-normal text-muted-foreground">{t('rs')} </span>
            {price.toLocaleString()}
          </p>
        </div>

        <div className="flex gap-1.5 mt-2">
          <Button
            size="sm"
            className={`flex-1 text-[10px] h-7 font-semibold ${fontClass}`}
            onClick={() => addToCart(id)}
            disabled={!inStock}
          >
            <ShoppingCart size={12} />
            {t('addToCart')}
          </Button>
          <a href={`https://wa.me/923065757283?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="whatsapp-green border-0 px-2 h-7">
              <MessageCircle size={12} />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
