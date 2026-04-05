import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const blogPosts = [
  {
    id: 1,
    title: 'Essential Vaccines for Livestock in Punjab',
    titleUr: 'پنجاب میں مویشیوں کے لیے ضروری ویکسینز',
    excerpt: 'Learn about the most important vaccines your cattle and goats need to stay healthy throughout the year.',
    excerptUr: 'جانیں کہ آپ کے مویشیوں اور بکریوں کو سال بھر صحت مند رہنے کے لیے کن ویکسینز کی ضرورت ہے۔',
    date: '2026-03-15',
    category: 'Vaccines',
  },
  {
    id: 2,
    title: 'Signs Your Animal Needs Immediate Veterinary Care',
    titleUr: 'نشانیاں کہ آپ کے جانور کو فوری طبی مدد چاہیے',
    excerpt: 'Recognize the warning signs that indicate your livestock needs urgent medical attention.',
    excerptUr: 'ان انتباہی علامات کو پہچانیں جو ظاہر کرتی ہیں کہ آپ کے مویشیوں کو فوری طبی توجہ کی ضرورت ہے۔',
    date: '2026-03-01',
    category: 'Health Tips',
  },
  {
    id: 3,
    title: 'Nutrition Guide: Best Supplements for Dairy Animals',
    titleUr: 'دودھ دینے والے جانوروں کے لیے بہترین سپلیمنٹس',
    excerpt: 'Improve milk production and animal health with the right nutritional supplements.',
    excerptUr: 'صحیح غذائی سپلیمنٹس سے دودھ کی پیداوار اور جانوروں کی صحت بہتر بنائیں۔',
    date: '2026-02-20',
    category: 'Supplements',
  },
];

const Blog = () => {
  const { isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';

  return (
    <div className="min-h-screen bg-muted/30">
      <section className="hero-gradient py-10">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`text-2xl md:text-4xl font-extrabold text-primary-foreground ${f}`}>
            {isUrdu ? 'ویٹرنری بلاگ' : 'Veterinary Blog'}
          </motion.h1>
          <p className={`text-primary-foreground/80 mt-2 text-sm ${f}`}>
            {isUrdu ? 'جانوروں کی صحت کے بارے میں مفید معلومات اور مشورے' : 'Helpful tips and advice on animal health and care'}
          </p>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post, i) => (
            <motion.article key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl border shadow-sm overflow-hidden card-elevated">
              <div className="h-2 hero-gradient" />
              <div className="p-5">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">{post.category}</span>
                <h2 className={`text-base font-bold text-foreground mt-1 mb-2 line-clamp-2 ${f}`}>
                  {isUrdu ? post.titleUr : post.title}
                </h2>
                <p className={`text-sm text-muted-foreground line-clamp-3 mb-3 ${f}`}>
                  {isUrdu ? post.excerptUr : post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                  <Button variant="ghost" size="sm" className="text-primary text-xs">
                    {isUrdu ? 'مزید پڑھیں' : 'Read More'} <ArrowRight size={12} />
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
