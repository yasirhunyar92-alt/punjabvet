import { useLanguage } from '@/contexts/LanguageContext';

const Privacy = () => {
  const { isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';

  return (
    <div className="min-h-screen bg-muted/30">
      <section className="hero-gradient py-8">
        <div className="container text-center">
          <h1 className={`text-2xl md:text-3xl font-extrabold text-primary-foreground ${f}`}>
            {isUrdu ? 'رازداری کی پالیسی' : 'Privacy Policy'}
          </h1>
        </div>
      </section>
      <div className="container py-8 max-w-3xl">
        <div className="bg-card rounded-xl p-6 md:p-8 border shadow-sm space-y-6">
          {isUrdu ? (
            <div className={`space-y-4 text-muted-foreground leading-relaxed ${f}`}>
              <h2 className="text-lg font-bold text-foreground">تعارف</h2>
              <p>پنجاب ویٹرنری میڈیکل سٹور آپ کی رازداری کا احترام کرتا ہے۔ یہ پالیسی بتاتی ہے کہ ہم آپ کی معلومات کیسے جمع، استعمال اور محفوظ کرتے ہیں۔</p>
              <h2 className="text-lg font-bold text-foreground">جمع کی جانے والی معلومات</h2>
              <p>ہم صرف وہ معلومات جمع کرتے ہیں جو آرڈر کی تکمیل کے لیے ضروری ہیں: نام، فون نمبر، ڈیلیوری ایڈریس۔</p>
              <h2 className="text-lg font-bold text-foreground">معلومات کا استعمال</h2>
              <p>آپ کی معلومات صرف آرڈر کی تکمیل، ڈیلیوری اور کسٹمر سروس کے لیے استعمال ہوتی ہیں۔ ہم آپ کی معلومات کسی تیسرے فریق کو نہیں بیچتے۔</p>
              <h2 className="text-lg font-bold text-foreground">ڈیٹا کی حفاظت</h2>
              <p>ہم آپ کے ڈیٹا کی حفاظت کے لیے مناسب حفاظتی اقدامات استعمال کرتے ہیں۔</p>
              <h2 className="text-lg font-bold text-foreground">رابطہ</h2>
              <p>کسی بھی سوال کے لیے 0306-5757283 پر رابطہ کریں۔</p>
            </div>
          ) : (
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <h2 className="text-lg font-bold text-foreground">Introduction</h2>
              <p>Punjab Veterinary Medical Store respects your privacy. This policy explains how we collect, use, and protect your personal information when you use our website and services.</p>
              <h2 className="text-lg font-bold text-foreground">Information We Collect</h2>
              <p>We collect only the information necessary to fulfill your orders: name, phone number, delivery address, and email address when you create an account.</p>
              <h2 className="text-lg font-bold text-foreground">How We Use Your Information</h2>
              <p>Your information is used solely for order fulfillment, delivery coordination, and customer service. We do not sell your personal data to third parties.</p>
              <h2 className="text-lg font-bold text-foreground">Data Security</h2>
              <p>We implement appropriate security measures to protect your data, including encrypted connections and secure storage.</p>
              <h2 className="text-lg font-bold text-foreground">Contact Us</h2>
              <p>For any privacy-related questions, contact us at 0306-5757283 or visit our store at Islam Nagar Road, Sillanwali, Pakistan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Privacy;
