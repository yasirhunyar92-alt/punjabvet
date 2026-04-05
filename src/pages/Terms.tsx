import { useLanguage } from '@/contexts/LanguageContext';

const Terms = () => {
  const { isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';

  return (
    <div className="min-h-screen bg-muted/30">
      <section className="hero-gradient py-8">
        <div className="container text-center">
          <h1 className={`text-2xl md:text-3xl font-extrabold text-primary-foreground ${f}`}>
            {isUrdu ? 'شرائط و ضوابط' : 'Terms & Conditions'}
          </h1>
        </div>
      </section>
      <div className="container py-8 max-w-3xl">
        <div className="bg-card rounded-xl p-6 md:p-8 border shadow-sm space-y-6">
          {isUrdu ? (
            <div className={`space-y-4 text-muted-foreground leading-relaxed ${f}`}>
              <h2 className="text-lg font-bold text-foreground">عام شرائط</h2>
              <p>اس ویب سائٹ کا استعمال کرتے ہوئے آپ ان شرائط سے اتفاق کرتے ہیں۔ پنجاب ویٹرنری میڈیکل سٹور کسی بھی وقت ان شرائط میں تبدیلی کا حق رکھتا ہے۔</p>
              <h2 className="text-lg font-bold text-foreground">آرڈرز اور ادائیگی</h2>
              <p>تمام آرڈرز کی تصدیق فون یا واٹس ایپ کے ذریعے کی جاتی ہے۔ قیمتیں تبدیل ہو سکتی ہیں۔ ادائیگی ڈیلیوری کے وقت کی جاتی ہے (COD)۔</p>
              <h2 className="text-lg font-bold text-foreground">واپسی کی پالیسی</h2>
              <p>خراب یا غلط مصنوعات کی واپسی 24 گھنٹوں کے اندر قبول کی جاتی ہے۔ براہ کرم وصولی کے وقت مصنوعات چیک کریں۔</p>
              <h2 className="text-lg font-bold text-foreground">ذمہ داری کی حد</h2>
              <p>ہم ادویات کے استعمال سے ہونے والے نقصان کی ذمہ داری نہیں لیتے۔ ہمیشہ ماہر ڈاکٹر سے مشورہ کریں۔</p>
            </div>
          ) : (
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <h2 className="text-lg font-bold text-foreground">General Terms</h2>
              <p>By using this website, you agree to these terms and conditions. Punjab Veterinary Medical Store reserves the right to modify these terms at any time.</p>
              <h2 className="text-lg font-bold text-foreground">Orders & Payment</h2>
              <p>All orders are confirmed via phone or WhatsApp. Prices are subject to change. Payment is accepted at the time of delivery (Cash on Delivery — COD).</p>
              <h2 className="text-lg font-bold text-foreground">Return Policy</h2>
              <p>Returns for damaged or incorrect products are accepted within 24 hours of delivery. Please inspect products at the time of receipt.</p>
              <h2 className="text-lg font-bold text-foreground">Limitation of Liability</h2>
              <p>We are not responsible for any damages arising from the use of medicines without proper veterinary consultation. Always consult a qualified veterinarian.</p>
              <h2 className="text-lg font-bold text-foreground">Contact</h2>
              <p>For questions regarding these terms, contact us at 0306-5757283 or visit Islam Nagar Road, Sillanwali, Pakistan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Terms;
