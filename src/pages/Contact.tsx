import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, MessageCircle, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const Contact = () => {
  const { t, isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';
  const [form, setForm] = useState({ name: '', phone: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = encodeURIComponent(`Name: ${form.name}\nPhone: ${form.phone}\nMessage: ${form.message}`);
    window.open(`https://wa.me/923065757283?text=${msg}`, '_blank');
    toast.success(isUrdu ? 'واٹس ایپ پر بھیجا جا رہا ہے' : 'Redirecting to WhatsApp...');
    setForm({ name: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <section className="hero-gradient py-10">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`text-2xl md:text-4xl font-extrabold text-primary-foreground ${f}`}>
            {t('contactUs')}
          </motion.h1>
          <p className={`text-primary-foreground/80 mt-2 text-sm ${f}`}>
            {isUrdu ? 'ہم سے رابطہ کریں — ہم آپ کی مدد کے لیے حاضر ہیں' : 'Get in touch — we\'re here to help you'}
          </p>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-6 border shadow-sm space-y-5">
              <h2 className={`text-lg font-bold text-foreground ${f}`}>
                {isUrdu ? 'رابطے کی تفصیلات' : 'Contact Details'}
              </h2>
              <a href="tel:+923065757283" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"><Phone size={18} className="text-primary" /></div>
                <div><p className="text-sm text-muted-foreground">{isUrdu ? 'فون' : 'Phone'}</p><p className="font-semibold">0306-5757283</p></div>
              </a>
              <a href="https://wa.me/923065757283" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"><MessageCircle size={18} className="text-primary" /></div>
                <div><p className="text-sm text-muted-foreground">WhatsApp</p><p className="font-semibold">+92 306 5757283</p></div>
              </a>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"><MapPin size={18} className="text-primary" /></div>
                <div><p className="text-sm text-muted-foreground">{isUrdu ? 'پتہ' : 'Address'}</p><p className={`font-semibold ${f}`}>{t('location')}</p></div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-card rounded-xl overflow-hidden border shadow-sm">
              <iframe
                src="https://www.google.com/maps?q=Islam+Nagar+Road,+Sillanwali,+Pakistan&output=embed"
                width="100%" height="280" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                title="Punjab Vet Location — Islam Nagar Road, Sillanwali"
              />
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <h2 className={`text-lg font-bold text-foreground mb-4 ${f}`}>
              {isUrdu ? 'ہمیں پیغام بھیجیں' : 'Send us a Message'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`text-sm font-medium text-foreground ${f}`}>{t('name')}</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={f} />
              </div>
              <div>
                <label className={`text-sm font-medium text-foreground ${f}`}>{t('phone')}</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div>
                <label className={`text-sm font-medium text-foreground ${f}`}>{isUrdu ? 'پیغام' : 'Message'}</label>
                <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={4} className={f} />
              </div>
              <Button type="submit" className={`w-full ${f}`}>
                <Send size={16} className="mr-2" />
                {isUrdu ? 'واٹس ایپ پر بھیجیں' : 'Send via WhatsApp'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
