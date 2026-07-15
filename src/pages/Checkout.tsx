import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Truck, Tag, X, Copy, Upload, Check, AlertCircle, Landmark, Smartphone } from 'lucide-react';
import { z } from 'zod';

const TCS_CHARGES = 250;

const PAYMENT_METHODS = [
  {
    id: 'jazzcash',
    label: 'JazzCash',
    labelUr: 'جاز کیش',
    icon: Smartphone,
    fields: [
      { label: 'Account Title', value: 'Qaisar HUSSAIN' },
      { label: 'Mobile Number', value: '03065757283' },
    ],
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer (UBL)',
    labelUr: 'بینک ٹرانسفر (UBL)',
    icon: Landmark,
    fields: [
      { label: 'Bank Name', value: 'UBL (United Bank Limited)' },
      { label: 'Account Title', value: 'Punjab Veterinary Medical Store' },
      { label: 'Account Number', value: '1300351503696' },
    ],
  },
] as const;

const formSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(100),
  paymentMethod: z.enum(['jazzcash', 'bank_transfer']),
  paymentReference: z.string().trim().min(4).max(64),
});

const Checkout = () => {
  const { t, isUrdu } = useLanguage();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fontClass = isUrdu ? 'font-urdu' : '';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '' });
  const [paymentMethod, setPaymentMethod] = useState<'jazzcash' | 'bank_transfer' | ''>('');
  const [paymentReference, setPaymentReference] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ id: string; code: string; discount: number } | null>(null);
  const [applying, setApplying] = useState(false);

  const subtotal = totalPrice;
  const discount = coupon?.discount || 0;
  const grandTotal = Math.max(0, subtotal - discount) + TCS_CHARGES;

  const copyToClipboard = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG or WEBP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setProofFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) return;

    const parsed = formSchema.safeParse({
      ...form,
      paymentMethod,
      paymentReference,
    });
    if (!parsed.success) {
      toast.error(isUrdu ? 'براہ کرم تمام فیلڈز درست طریقے سے بھریں' : 'Please fill all fields correctly');
      return;
    }
    if (!proofFile) {
      toast.error(isUrdu ? 'ادائیگی کا اسکرین شاٹ اپلوڈ کریں' : 'Please upload your payment screenshot');
      return;
    }

    setLoading(true);
    try {
      // 1. Create order (pending verification)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          customer_name: parsed.data.name,
          phone: parsed.data.phone,
          address: `${parsed.data.address}, ${parsed.data.city}`,
          total_price: grandTotal,
          status: 'pending_verification',
          payment_method: parsed.data.paymentMethod,
          payment_reference: parsed.data.paymentReference,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      // 2. Upload payment proof to private bucket
      const ext = proofFile.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${order.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(path, proofFile, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      // 3. Save proof path on order
      await supabase.from('orders').update({ payment_proof_path: path }).eq('id', order.id);

      // 4. Order items
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
        const { data: cur } = await supabase.from('coupons').select('used_count').eq('id', coupon.id).single();
        await supabase.from('coupons').update({ used_count: (cur?.used_count || 0) + 1 }).eq('id', coupon.id);
      }

      await clearCart();
      toast.success(isUrdu
        ? 'آپ کی ادائیگی زیر تصدیق ہے۔ تصدیق کے بعد آرڈر بھیج دیا جائے گا۔'
        : 'Thank you! Your payment is under verification.');
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

  const selected = PAYMENT_METHODS.find(m => m.id === paymentMethod);

  return (
    <div className="container py-6 max-w-2xl">
      <h1 className={`text-2xl font-bold text-foreground mb-3 ${fontClass}`}>{t('checkoutTitle')}</h1>

      {/* Advance payment notice */}
      <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-3 mb-6 flex items-start gap-2.5">
        <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
        <p className={`text-xs text-foreground ${fontClass}`}>
          {isUrdu
            ? 'کیش آن ڈیلیوری دستیاب نہیں ہے۔ تمام آرڈرز کے لیے 100% پیشگی ادائیگی ضروری ہے۔'
            : 'Cash on Delivery is not available. All orders require 100% advance payment.'}
        </p>
      </div>

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
              <Truck size={14} /> {isUrdu ? 'TCS ڈیلیوری چارجز' : 'TCS Delivery'}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment method */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className={`font-semibold mb-3 ${fontClass}`}>
            {isUrdu ? 'ادائیگی کا طریقہ منتخب کریں' : 'Choose Payment Method'} *
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PAYMENT_METHODS.map(m => {
              const Icon = m.icon;
              const active = paymentMethod === m.id;
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                    active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${fontClass}`}>{isUrdu ? m.labelUr : m.label}</p>
                    <p className="text-[10px] text-muted-foreground">Advance payment</p>
                  </div>
                  {active && <Check size={16} className="ml-auto text-primary" />}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="mt-4 rounded-lg bg-muted/40 border p-4 space-y-2">
              <p className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider ${fontClass}`}>
                {isUrdu ? 'اس اکاؤنٹ پر ادائیگی کریں' : 'Send payment to this account'}
              </p>
              {selected.fields.map(f => (
                <div key={f.label} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
                    <p className="text-sm font-mono font-semibold text-foreground truncate">{f.value}</p>
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => copyToClipboard(f.value, f.label)}>
                    <Copy size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment proof + reference */}
        {paymentMethod && (
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <div>
              <Label className={fontClass}>
                {isUrdu ? 'ٹرانزیکشن آئی ڈی / ریفرنس نمبر' : 'Transaction ID / Reference Number'} *
              </Label>
              <Input
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder="e.g. TXN123456789"
                maxLength={64}
                required
              />
            </div>
            <div>
              <Label className={fontClass}>
                {isUrdu ? 'ادائیگی کا اسکرین شاٹ' : 'Payment Screenshot'} *
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full mt-1 flex items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-all ${
                  proofFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                }`}
              >
                {proofFile ? (
                  <>
                    <Check className="text-primary" size={20} />
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{proofFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(proofFile.size / 1024).toFixed(0)} KB — tap to change</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="text-muted-foreground" size={20} />
                    <div className="text-left">
                      <p className={`text-sm font-semibold text-foreground ${fontClass}`}>
                        {isUrdu ? 'اسکرین شاٹ اپلوڈ کریں' : 'Upload screenshot'}
                      </p>
                      <p className="text-xs text-muted-foreground">JPG, PNG or WEBP · max 5 MB</p>
                    </div>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Customer info */}
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <h3 className={`font-semibold ${fontClass}`}>{isUrdu ? 'ڈیلیوری کی معلومات' : 'Delivery Information'}</h3>
          <div>
            <Label className={fontClass}>{t('name')} *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={isUrdu ? 'font-urdu text-right' : ''} placeholder={isUrdu ? 'آپ کا پورا نام' : 'Your full name'} />
          </div>
          <div>
            <Label className={fontClass}>{t('phone')} *</Label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" required placeholder="03XX-XXXXXXX" />
          </div>
          <div>
            <Label className={fontClass}>{isUrdu ? 'شہر' : 'City'} *</Label>
            <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required className={isUrdu ? 'font-urdu text-right' : ''} placeholder={isUrdu ? 'شہر کا نام' : 'City name'} />
          </div>
          <div>
            <Label className={fontClass}>{t('address')} *</Label>
            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required className={isUrdu ? 'font-urdu text-right' : ''} placeholder={isUrdu ? 'مکمل پتہ' : 'Full delivery address'} />
          </div>
        </div>

        <Button
          type="submit"
          className={`w-full ${fontClass}`}
          size="lg"
          disabled={loading || !paymentMethod || !paymentReference || !proofFile}
        >
          {loading ? t('loading') : (isUrdu ? 'آرڈر جمع کروائیں' : `Place Order · Rs. ${grandTotal.toLocaleString()}`)}
        </Button>

        <p className={`text-[11px] text-center text-muted-foreground ${fontClass}`}>
          {isUrdu
            ? 'آرڈر جمع کروانے کے بعد آپ کی ادائیگی زیر تصدیق ہوگی۔ تصدیق کے بعد آرڈر پروسیس اور شپ کر دیا جائے گا۔'
            : 'Once submitted, your payment will be under verification. After verification, your order will be processed and shipped.'}
        </p>
      </form>
    </div>
  );
};

export default Checkout;
