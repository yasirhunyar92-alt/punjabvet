import { motion } from 'framer-motion';
import { Shield, Award, Users, Heart, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import heroBanner from '@/assets/hero-banner.jpg';

const About = () => {
  const { t, isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';

  const values = [
    { icon: <Shield size={28} />, title: isUrdu ? 'معیار کی ضمانت' : 'Quality Assurance', desc: isUrdu ? 'ہم صرف تصدیق شدہ اور معیاری ویٹرنری ادویات فراہم کرتے ہیں۔' : 'We provide only certified and quality-tested veterinary medicines.' },
    { icon: <Award size={28} />, title: isUrdu ? 'تجربہ' : 'Experience', desc: isUrdu ? 'سیلنوالی میں برسوں کا تجربہ اور کسانوں کا اعتماد۔' : 'Years of experience serving farmers and livestock owners in Sillanwali.' },
    { icon: <Users size={28} />, title: isUrdu ? 'کسٹمر سروس' : 'Customer Service', desc: isUrdu ? 'ہر گاہک کو ذاتی توجہ اور ماہرانہ مشورے فراہم کیے جاتے ہیں۔' : 'Personalized attention and expert advice for every customer.' },
    { icon: <Heart size={28} />, title: isUrdu ? 'جانوروں کی فلاح' : 'Animal Welfare', desc: isUrdu ? 'ہمارا مقصد جانوروں کی صحت اور بہبود کو یقینی بنانا ہے۔' : 'Our mission is to ensure the health and well-being of all animals.' },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <img src={heroBanner} alt={isUrdu ? 'پنجاب ویٹرنری میڈیکل سٹور' : 'Punjab Veterinary Medical Store'} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`text-2xl md:text-4xl font-extrabold text-primary-foreground ${f}`}>
            {t('aboutUs')}
          </motion.h1>
        </div>
      </section>

      <div className="container py-8 space-y-10">
        {/* Mission */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
          <h2 className={`text-xl font-bold text-foreground mb-4 ${f}`}>
            {isUrdu ? 'ہمارا مشن' : 'Our Mission'}
          </h2>
          <p className={`text-muted-foreground leading-relaxed mb-4 ${f}`}>
            {isUrdu
              ? 'پنجاب ویٹرنری میڈیکل سٹور سیلنوالی، پاکستان میں ایک معتبر ویٹرنری اسٹور ہے۔ ہم مقامی کسانوں اور مویشی پالنے والوں کو معیاری ادویات، ویکسینز اور سپلیمنٹس فراہم کرتے ہیں۔ ہمارا مقصد جانوروں کی بہترین صحت کو یقینی بنانا ہے۔'
              : 'Punjab Veterinary Medical Store is a trusted veterinary pharmacy located in Sillanwali, Pakistan. We serve local farmers and livestock owners with quality medicines, vaccines, and supplements. Our mission is to ensure the best possible health outcomes for animals in our community.'}
          </p>
          <p className={`text-muted-foreground leading-relaxed ${f}`}>
            {isUrdu
              ? 'سی ای او قیصر حسین کی قیادت میں، ہم نے ہزاروں کسانوں کا اعتماد حاصل کیا ہے۔ ہم اسلام نگر روڈ، سیلنوالی میں واقع ہیں اور واٹس ایپ کے ذریعے بھی آرڈر لیتے ہیں۔'
              : 'Under the leadership of CEO Qaiser Hussain, we have earned the trust of thousands of farmers across Punjab. Located on Islam Nagar Road, Sillanwali, we also accept orders via WhatsApp for your convenience.'}
          </p>
        </motion.section>

        {/* Values */}
        <section>
          <h2 className={`text-xl font-bold text-foreground mb-5 text-center ${f}`}>
            {isUrdu ? 'ہماری اقدار' : 'Our Values'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className="bg-card rounded-xl p-5 border text-center card-elevated">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent text-primary mb-3">{v.icon}</div>
                <h3 className={`font-bold text-foreground mb-2 ${f}`}>{v.title}</h3>
                <p className={`text-sm text-muted-foreground ${f}`}>{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact Info */}
        <section className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
          <h2 className={`text-lg font-bold text-foreground mb-3 ${f}`}>{t('contactUs')}</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Phone size={16} className="text-primary" /> 0306-5757283</span>
            <span className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> <span className={f}>{t('location')}</span></span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
