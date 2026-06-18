import { useLanguage } from '@/contexts/LanguageContext';
import SEOHead from '@/components/SEOHead';

const Shipping = () => {
  const { isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOHead title="Shipping Policy" description="Delivery times, charges, and coverage for Punjab Veterinary Medical Store orders across Pakistan." url="/shipping" />
      <section className="hero-gradient py-8">
        <div className="container text-center">
          <h1 className={`text-2xl md:text-3xl font-extrabold text-primary-foreground ${f}`}>
            {isUrdu ? 'شپنگ پالیسی' : 'Shipping Policy'}
          </h1>
        </div>
      </section>
      <div className="container py-8 max-w-3xl">
        <div className="bg-card rounded-xl p-6 md:p-8 border shadow-sm space-y-6">
          {isUrdu ? (
            <div className={`space-y-4 text-muted-foreground leading-relaxed ${f}`}>
              <h2 className="text-lg font-bold text-foreground">ڈیلیوری کا علاقہ</h2>
              <p>ہم پاکستان بھر میں ڈیلیوری فراہم کرتے ہیں۔ سلانوالی، سرگودھا اور قریبی علاقوں میں اسی دن ڈیلیوری دستیاب ہے۔</p>
              <h2 className="text-lg font-bold text-foreground">ڈیلیوری کا وقت</h2>
              <p>• مقامی (سلانوالی/سرگودھا): 1 سے 24 گھنٹے<br/>• پنجاب کے اندر: 2 سے 3 دن<br/>• دیگر صوبے: 3 سے 5 دن</p>
              <h2 className="text-lg font-bold text-foreground">ڈیلیوری چارجز</h2>
              <p>5,000 روپے سے زیادہ آرڈر پر مفت ڈیلیوری۔ چھوٹے آرڈرز پر 200 سے 400 روپے چارج لگ سکتے ہیں۔</p>
              <h2 className="text-lg font-bold text-foreground">ادائیگی</h2>
              <p>کیش آن ڈیلیوری، بینک ٹرانسفر اور WhatsApp آرڈر دستیاب ہیں۔</p>
              <h2 className="text-lg font-bold text-foreground">رابطہ</h2>
              <p>ڈیلیوری سے متعلق کسی بھی سوال کے لیے 0306-5757283 پر کال یا WhatsApp کریں۔</p>
            </div>
          ) : (
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <h2 className="text-lg font-bold text-foreground">Delivery Coverage</h2>
              <p>We deliver across Pakistan. Same-day delivery is available in Sillanwali, Sargodha, and nearby areas.</p>
              <h2 className="text-lg font-bold text-foreground">Delivery Times</h2>
              <p>• Local (Sillanwali / Sargodha): 1–24 hours<br/>• Within Punjab: 2–3 business days<br/>• Other provinces: 3–5 business days</p>
              <h2 className="text-lg font-bold text-foreground">Shipping Charges</h2>
              <p>Free delivery on orders above Rs. 5,000. Smaller orders may carry a Rs. 200–400 delivery fee based on location.</p>
              <h2 className="text-lg font-bold text-foreground">Payment Methods</h2>
              <p>Cash on Delivery (COD), bank transfer, and WhatsApp order confirmation are all supported.</p>
              <h2 className="text-lg font-bold text-foreground">Need Help?</h2>
              <p>For any delivery questions, call or WhatsApp us at 0306-5757283 or visit the store at Islam Nagar Road, Sillanwali.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shipping;
