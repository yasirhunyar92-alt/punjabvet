import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';

const Cart = () => {
  const { t, isUrdu } = useLanguage();
  const { items, removeFromCart, updateQuantity, totalPrice, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fontClass = isUrdu ? 'font-urdu' : '';

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className={`text-lg text-muted-foreground mb-4 ${fontClass}`}>Please login to view your cart</p>
        <Link to="/auth"><Button className={fontClass}>{t('login')}</Button></Link>
      </div>
    );
  }

  if (loading) return <div className="container py-16 text-center text-muted-foreground">{t('loading')}</div>;

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className={`text-lg text-muted-foreground mb-4 ${fontClass}`}>{t('emptyCart')}</p>
        <Link to="/products"><Button className={fontClass}>{t('continueShopping')}</Button></Link>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className={`text-2xl font-bold text-foreground mb-4 ${fontClass}`}>{t('yourCart')}</h1>

      <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-3 mb-6 flex items-start gap-2.5">
        <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
        <p className={`text-xs text-foreground ${fontClass}`}>
          {isUrdu
            ? 'کیش آن ڈیلیوری دستیاب نہیں ہے۔ تمام آرڈرز کے لیے 100% پیشگی ادائیگی ضروری ہے۔'
            : 'Cash on Delivery is not available. All orders require 100% advance payment.'}
        </p>
      </div>


      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="bg-card border rounded-lg p-4 flex items-center gap-4">
            <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
              {item.product?.image_url ? (
                <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🐄</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-medium text-foreground truncate ${fontClass}`}>
                {isUrdu && item.product?.name_ur ? item.product.name_ur : item.product?.name}
              </h3>
              <p className="text-primary font-bold">{t('rs')} {item.product?.price?.toLocaleString()}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                <Minus size={14} />
              </Button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                <Plus size={14} />
              </Button>
            </div>

            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeFromCart(item.id)}>
              <Trash2 size={18} />
            </Button>
          </div>
        ))}
      </div>

      {/* Total & Checkout */}
      <div className="mt-8 bg-card border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <span className={`text-lg font-semibold ${fontClass}`}>{t('total')}</span>
          <span className="text-2xl font-bold text-primary">{t('rs')} {totalPrice.toLocaleString()}</span>
        </div>
        <Button className={`w-full ${fontClass}`} size="lg" onClick={() => navigate('/checkout')}>
          {t('checkout')}
        </Button>
      </div>
    </div>
  );
};

export default Cart;
