import { Link } from 'react-router-dom';
import { Phone, MapPin, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t, isUrdu } = useLanguage();
  const fontClass = isUrdu ? 'font-urdu' : '';

  return (
    <footer className="bg-primary text-primary-foreground mt-12">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className={`text-lg font-bold mb-3 ${fontClass}`}>{t('aboutUs')}</h3>
            <p className={`text-sm opacity-90 leading-relaxed ${fontClass}`}>{t('aboutText')}</p>
            <p className={`text-sm mt-2 opacity-80 ${fontClass}`}>{t('ceo')}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={`text-lg font-bold mb-3 ${fontClass}`}>{t('quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className={`opacity-90 hover:opacity-100 ${fontClass}`}>{t('home')}</Link></li>
              <li><Link to="/products" className={`opacity-90 hover:opacity-100 ${fontClass}`}>{t('products')}</Link></li>
              <li><Link to="/cart" className={`opacity-90 hover:opacity-100 ${fontClass}`}>{t('cart')}</Link></li>
              <li><Link to="/profile" className={`opacity-90 hover:opacity-100 ${fontClass}`}>{t('profile')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className={`text-lg font-bold mb-3 ${fontClass}`}>{t('contactUs')}</h3>
            <div className="space-y-3 text-sm">
              <a href="tel:+923065757283" className="flex items-center gap-2 opacity-90 hover:opacity-100">
                <Phone size={16} /> +92 306 5757283
              </a>
              <a href="https://wa.me/923065757283" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-90 hover:opacity-100">
                <MessageCircle size={16} /> WhatsApp
              </a>
              <div className="flex items-center gap-2 opacity-90">
                <MapPin size={16} />
                <span className={fontClass}>{t('location')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-sm opacity-70">
          <p>© {new Date().getFullYear()} Punjab Veterinary Medical Store. {t('allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
