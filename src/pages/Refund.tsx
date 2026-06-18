import { useLanguage } from '@/contexts/LanguageContext';
import SEOHead from '@/components/SEOHead';

const Refund = () => {
  const { isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOHead title="Refund Policy" description="Return and refund process for veterinary medicines, vaccines, and supplies from Punjab Veterinary Medical Store." url="/refund" />
      <section className="hero-gradient py-8">
        <div className="container text-center">
          <h1 className={`text-2xl md:text-3xl font-extrabold text-primary-foreground ${f}`}>
            {isUrdu ? 'ریفنڈ پالیسی' : 'Refund Policy'}
          </h1>
        </div>
      </section>
      <div className="container py-8 max-w-3xl">
        <div className="bg-card rounded-xl p-6 md:p-8 border shadow-sm space-y-6">
          {isUrdu ? (
            <div className={`space-y-4 text-muted-foreground leading-relaxed ${f}`}>
              <h2 className="text-lg font-bold text-foreground">واپسی کی شرائط</h2>
              <p>ڈیلیوری کے 48 گھنٹوں کے اندر صرف غیر استعمال شدہ، سیل بند پروڈکٹس واپس کیے جا سکتے ہیں۔</p>
              <h2 className="text-lg font-bold text-foreground">ناقابل واپسی اشیاء</h2>
              <p>• ویکسین اور کولڈ چین والی دوائیں<br/>• کھولی ہوئی یا استعمال شدہ مصنوعات<br/>• ایکسپائر شدہ یا قریب الاختتام دوائیں</p>
              <h2 className="text-lg font-bold text-foreground">ریفنڈ کا طریقہ</h2>
              <p>منظوری کے بعد، رقم 5 سے 7 دنوں میں بینک ٹرانسفر یا EasyPaisa/JazzCash کے ذریعے واپس کی جائے گی۔</p>
              <h2 className="text-lg font-bold text-foreground">خراب یا غلط آرڈر</h2>
              <p>اگر پروڈکٹ خراب ہے یا غلط بھیجا گیا ہے، تو 24 گھنٹے کے اندر تصاویر کے ساتھ WhatsApp پر اطلاع دیں — ہم مفت تبدیل کریں گے۔</p>
              <h2 className="text-lg font-bold text-foreground">رابطہ</h2>
              <p>ریفنڈ کی درخواست کے لیے 0306-5757283 پر WhatsApp کریں۔</p>
            </div>
          ) : (
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <h2 className="text-lg font-bold text-foreground">Return Window</h2>
              <p>Returns are accepted within 48 hours of delivery for unused, sealed products only. Items must be in original packaging with batch and expiry visible.</p>
              <h2 className="text-lg font-bold text-foreground">Non-Returnable Items</h2>
              <p>• Vaccines and cold-chain medicines (safety reasons)<br/>• Opened or partially used products<br/>• Expired or short-dated stock<br/>• Special-order or custom items</p>
              <h2 className="text-lg font-bold text-foreground">Refund Process</h2>
              <p>Once your return is received and approved, the refund will be issued within 5–7 business days via bank transfer, EasyPaisa, or JazzCash.</p>
              <h2 className="text-lg font-bold text-foreground">Damaged or Wrong Items</h2>
              <p>If you receive a damaged or incorrect product, send us photos on WhatsApp within 24 hours of delivery — we will arrange a free replacement at no cost to you.</p>
              <h2 className="text-lg font-bold text-foreground">Contact</h2>
              <p>To request a refund or replacement, WhatsApp 0306-5757283 with your order number and photos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Refund;
