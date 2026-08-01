import { useSiteTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

const FestiveBanner = () => {
  const { theme } = useSiteTheme();
  const { language } = useLanguage();

  const text = language === 'ur' ? theme?.banner_text_ur || theme?.banner_text : theme?.banner_text;
  if (!theme || !text) return null;

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container flex items-center justify-center gap-2 py-2 text-center text-xs sm:text-sm font-medium">
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className={language === 'ur' ? 'font-urdu' : undefined}>{text}</span>
      </div>
    </div>
  );
};

export default FestiveBanner;
