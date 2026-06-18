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
import { Truck, Banknote, MessageCircle, Tag, X } from 'lucide-react';

const TCS_CHARGES = 250;

const Checkout = () => {
  const { t, isUrdu } = useLanguage();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fontClass = isUrdu ? 'font-urdu' : '';
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '' });
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ id: string; code: string; discount: number } | null>(null);
  const [applying, setApplying] = useState(false);
  const subtotal = totalPrice;
  const discount = coupon?.discount || 0;
  const grandTotal = Math.max(0, subtotal - discount) + TCS_CHARGES;

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setApplying(true);
    try {
      const { data, error } = await supabase.from('coupons').select('*').eq('code', code).eq('active', true).maybeSingle();
      if (error || !data) { toast.error(isUrdu ? 'غلط کوپن' : 'Invalid coupon'); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error(isUrdu ? 'کوپن ختم ہو چکا' : 'Coupon expired'); return; }
      if (data.max_uses && data.used_count >= data.max_uses) { toast.error(isUrdu ? 'کوپن استعمال ہو چکا' : 'Coupon limit reached'); return; }
      if (data.min_order_amount && subtotal < Number(data.min_order_amount)) {
        toast.error(`${isUrdu ? 'کم از کم آرڈر' : 'Min order'}: Rs. ${data.min_order_amount}`); return;
      }
      const d = data.discount_type === 'percent'
        ? Math.round(subtotal * Number(data.discount_value) / 100)
        : Number(data.discount_value);
      setCoupon({ id: data.id, code: data.code, discount: Math.min(d, subtotal) });
      toast.success(isUrdu ? 'کوپن لاگو ہو گیا' : 'Coupon applied');
    } finally { setApplying(false); }
  };

  const buildWhatsAppMessage = () => {
    const itemsList = items.map(item =>
      `• ${item.product?.name || 'Product'} × ${item.quantity} = Rs. ${((item.product?.price || 0) * item.quantity).toLocaleString()}`
    ).join('\n');

    return encodeURIComponent(
      `🛒 *New Order – Punjab Vet*\n\n` +
      `${itemsList}\n\n` +
      `Product Total: Rs. ${subtotal.toLocaleString()}\n` +
      (coupon ? `Coupon (${coupon.code}): -Rs. ${discount.toLocaleString()}\n` : '') +
      `TCS Delivery: Rs. ${TCS_CHARGES}\n` +
      `*Grand Total: Rs. ${grandTotal.toLocaleString()}*\n\n` +
      `👤 Name: ${form.name}\n` +
      `📞 Phone: ${form.phone}\n` +
      `🏙️ City: ${form.city}\n` +
      `📍 Address: ${form.address}\n\n` +
      `💵 Payment: Cash on Delivery`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) return;
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error(isUrdu ? 'تمام فیلڈز بھریں' : 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // Save order to database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          customer_name: form.name.trim(),
          phone: form.phone.trim(),
          address: `${form.address.trim()}, ${form.city.trim()}`,
          total_price: grandTotal,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name || 'Unknown',
        quantity: item.quantity,
        price_at_purchase: item.product?.price || 0,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      if (coupon) {
        // best-effort increment; ignore failure
        await supabase.rpc as any;
        await supabase.from('coupons').update({ used_count: (await supabase.from('coupons').select('used_count').eq('id', coupon.id).single()).data?.used_count + 1 || 1 }).eq('id', coupon.id);
      }

      await clearCart();
      toast.success(t('orderSuccess'));

      // Redirect to WhatsApp with order details
      const whatsappUrl = `https://wa.me/923065757283?text=${buildWhatsAppMessage()}`;
      window.open(whatsappUrl, '_blank');

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
        <div className="border-t mt-3 pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={`text-muted-foreground ${fontClass}`}>{isUrdu ? 'مصنوعات کی قیمت' : 'Product Total'}</span>
            <span>{t('rs')} {subtotal.toLocaleString()}</span>
          </div>
          {coupon && (
            <div className="flex justify-between text-primary">
              <span className="flex items-center gap-1"><Tag size={14} /> {coupon.code}</span>
              <span>− {t('rs')} {discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Truck size={14} /> {isUrdu ? 'TCS ڈیلیوری چارجز' : 'TCS Delivery Charges'}
            </span>
            <span>{t('rs')} {TCS_CHARGES.toLocaleString()}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-base">
            <span className={fontClass}>{isUrdu ? 'کل رقم' : 'Grand Total'}</span>
            <span className="text-primary">{t('rs')} {grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Coupon */}
      <div className="bg-card border rounded-lg p-4 mb-6">
        <Label className={`flex items-center gap-1 mb-2 ${fontClass}`}><Tag size={14} /> {isUrdu ? 'پروموشن کوڈ' : 'Promo Code'}</Label>
        {coupon ? (
          <div className="flex items-center justify-between bg-primary/10 rounded-md px-3 py-2">
            <span className="font-mono font-bold text-primary">{coupon.code}</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setCoupon(null); setCouponInput(''); }}>
              <X size={14} />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input value={couponInput} onChange={e => setCouponInput(e.target.value)} placeholder={isUrdu ? 'کوڈ درج کریں' : 'Enter code'} className="uppercase" />
            <Button type="button" variant="outline" onClick={applyCoupon} disabled={applying}>
              {applying ? '...' : (isUrdu ? 'لاگو کریں' : 'Apply')}
            </Button>
          </div>
        )}
      </div>

      {/* COD Info */}
      <div className="bg-accent/50 border border-primary/20 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Banknote size={24} className="text-primary flex-shrink-0 mt-0.5" />
        <div>
          <h4 className={`font-semibold text-foreground text-sm ${fontClass}`}>
            {isUrdu ? 'کیش آن ڈیلیوری (COD)' : 'Cash on Delivery (COD)'}
          </h4>
          <p className={`text-xs text-muted-foreground mt-0.5 ${fontClass}`}>
            {isUrdu ? 'آرڈر ملنے پر نقد ادائیگی کریں' : 'Pay cash when your order is delivered'}
          </p>
        </div>
      </div>

      {/* Customer Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className={fontClass}>{t('name')}</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={isUrdu ? 'font-urdu text-right' : ''} placeholder={isUrdu ? 'آپ کا پورا نام' : 'Your full name'} />
        </div>
        <div>
          <Label className={fontClass}>{t('phone')}</Label>
          <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" required placeholder="03XX-XXXXXXX" />
        </div>
        <div>
          <Label className={fontClass}>{isUrdu ? 'شہر' : 'City'}</Label>
          <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required className={isUrdu ? 'font-urdu text-right' : ''} placeholder={isUrdu ? 'شہر کا نام' : 'City name'} />
        </div>
        <div>
          <Label className={fontClass}>{t('address')}</Label>
          <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required className={isUrdu ? 'font-urdu text-right' : ''} placeholder={isUrdu ? 'مکمل پتہ' : 'Full delivery address'} />
        </div>

        <Button type="submit" className={`w-full ${fontClass}`} size="lg" disabled={loading}>
          <MessageCircle size={18} />
          {loading ? t('loading') : (isUrdu ? 'آرڈر دیں اور واٹس ایپ پر بھیجیں' : 'Place Order & Send via WhatsApp')}
        </Button>

        <p className={`text-[11px] text-center text-muted-foreground ${fontClass}`}>
          {isUrdu ? 'آرڈر دینے کے بعد آپ واٹس ایپ پر ری ڈائریکٹ ہوں گے' : 'You will be redirected to WhatsApp after placing order'}
        </p>
      </form>
    </div>
  );
};

export default Checkout;
