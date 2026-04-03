import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Checkout = () => {
  const { t, isUrdu } = useLanguage();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fontClass = isUrdu ? 'font-urdu' : '';
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) return;
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          customer_name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          total_price: totalPrice,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name || 'Unknown',
        quantity: item.quantity,
        price_at_purchase: item.product?.price || 0,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      await clearCart();
      toast.success(t('orderSuccess'));
      navigate('/profile');
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="container py-6 max-w-lg">
      <h1 className={`text-2xl font-bold text-foreground mb-6 ${fontClass}`}>{t('checkoutTitle')}</h1>

      {/* Order Summary */}
      <div className="bg-card border rounded-lg p-4 mb-6">
        <h3 className={`font-semibold mb-3 ${fontClass}`}>{t('yourCart')} ({items.length})</h3>
        {items.map(item => (
          <div key={item.id} className="flex justify-between text-sm py-1">
            <span className={`text-muted-foreground ${fontClass}`}>{item.product?.name} × {item.quantity}</span>
            <span className="font-medium">{t('rs')} {((item.product?.price || 0) * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t mt-3 pt-3 flex justify-between font-bold">
          <span className={fontClass}>{t('total')}</span>
          <span className="text-primary">{t('rs')} {totalPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className={fontClass}>{t('name')}</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={isUrdu ? 'font-urdu text-right' : ''} />
        </div>
        <div>
          <Label className={fontClass}>{t('phone')}</Label>
          <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" required />
        </div>
        <div>
          <Label className={fontClass}>{t('address')}</Label>
          <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required className={isUrdu ? 'font-urdu text-right' : ''} />
        </div>
        <Button type="submit" className={`w-full ${fontClass}`} size="lg" disabled={loading}>
          {loading ? t('loading') : t('placeOrder')}
        </Button>
      </form>
    </div>
  );
};

export default Checkout;
