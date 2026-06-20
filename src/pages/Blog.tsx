import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, ArrowLeft, Clock, User, Tag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SEOHead from '@/components/SEOHead';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  titleUr: string;
  excerpt: string;
  excerptUr: string;
  content: string;
  contentUr: string;
  date: string;
  category: string;
  categoryUr: string;
  readTime: string;
  author: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    slug: 'essential-vaccines-livestock-punjab',
    title: 'Essential Vaccines for Livestock in Punjab',
    titleUr: 'پنجاب میں مویشیوں کے لیے ضروری ویکسینز',
    excerpt: 'Learn about the most important vaccines your cattle and goats need to stay healthy throughout the year.',
    excerptUr: 'جانیں کہ آپ کے مویشیوں اور بکریوں کو سال بھر صحت مند رہنے کے لیے کن ویکسینز کی ضرورت ہے۔',
    content: `Vaccinating your livestock is one of the most cost-effective ways to prevent disease and ensure healthy animals. Here are the key vaccines every farmer in Punjab should know about:

**1. Foot and Mouth Disease (FMD) Vaccine**
FMD is one of the most common and devastating diseases affecting cattle, buffalo, goats, and sheep in Pakistan. Vaccination should be done twice a year — before summer and before winter.

**2. Hemorrhagic Septicemia (HS) Vaccine**
Also known as "Gal Ghotu" locally, this disease is particularly deadly during the monsoon season. Vaccinate your animals at least 2-3 weeks before the rainy season begins.

**3. Black Quarter (BQ) Vaccine**
Known as "Kala Zehr" in Punjab, this bacterial disease affects young cattle aged 6 months to 2 years. Annual vaccination is recommended before the monsoon.

**4. Enterotoxemia Vaccine**
Common in goats and sheep, this disease can cause sudden death. Vaccinate twice a year, especially before seasonal changes.

**5. PPR Vaccine (Peste des Petits Ruminants)**
Essential for goats and sheep. A single dose provides immunity for up to 3 years.

**Tips for Effective Vaccination:**
- Always store vaccines at proper temperature (2-8°C)
- Use sterile needles for each animal
- Keep vaccination records
- Consult your veterinarian for a customized vaccination schedule

Visit Punjab Veterinary Medical Store in Sillanwali for all your vaccination needs. Call 0306-5757283 for expert advice.`,
    contentUr: `اپنے مویشیوں کو ویکسین لگوانا بیماری کی روک تھام اور صحت مند جانوروں کو یقینی بنانے کا سب سے مؤثر طریقہ ہے۔ پنجاب کے ہر کسان کو ان اہم ویکسینز کے بارے میں معلوم ہونا چاہیے:

**1. منہ کھر کی بیماری (FMD) ویکسین**
FMD پاکستان میں گائے، بھینس، بکریوں اور بھیڑوں کو متاثر کرنے والی سب سے عام بیماری ہے۔ سال میں دو بار ویکسینیشن ضروری ہے۔

**2. گل گھوٹو (HS) ویکسین**
یہ بیماری خاص طور پر مانسون کے موسم میں مہلک ہوتی ہے۔ بارش کے موسم سے 2-3 ہفتے پہلے ویکسین لگوائیں۔

**3. کالا زہر (BQ) ویکسین**
یہ بیکٹیریل بیماری 6 ماہ سے 2 سال کے نوجوان مویشیوں کو متاثر کرتی ہے۔ مانسون سے پہلے سالانہ ویکسینیشن ضروری ہے۔

**4. انٹروٹوکسیمیا ویکسین**
بکریوں اور بھیڑوں میں عام، یہ بیماری اچانک موت کا سبب بن سکتی ہے۔ سال میں دو بار ویکسین لگوائیں۔

**5. PPR ویکسین**
بکریوں اور بھیڑوں کے لیے ضروری۔ ایک خوراک 3 سال تک قوت مدافعت فراہم کرتی ہے۔

پنجاب ویٹرنری میڈیکل سٹور، سیلنوالی سے رابطہ کریں: 0306-5757283`,
    date: '2026-03-15',
    category: 'Vaccines',
    categoryUr: 'ویکسینز',
    readTime: '5 min',
    author: 'Punjab Vet Team',
  },
  {
    id: 2,
    slug: 'signs-animal-needs-veterinary-care',
    title: 'Signs Your Animal Needs Immediate Veterinary Care',
    titleUr: 'نشانیاں کہ آپ کے جانور کو فوری طبی مدد چاہیے',
    excerpt: 'Recognize the warning signs that indicate your livestock needs urgent medical attention.',
    excerptUr: 'ان انتباہی علامات کو پہچانیں جو ظاہر کرتی ہیں کہ آپ کے مویشیوں کو فوری طبی توجہ کی ضرورت ہے۔',
    content: `As a livestock owner, recognizing early signs of illness can save your animal's life and prevent disease spread. Here are critical warning signs:

**Emergency Signs (Act Immediately):**
- Sudden collapse or inability to stand
- Severe bloating of the abdomen
- Heavy bleeding from any part of the body
- Difficulty breathing or rapid panting
- Convulsions or seizures

**Urgent Signs (See a Vet Within Hours):**
- Refusal to eat for more than 24 hours
- High fever (above 104°F / 40°C)
- Severe diarrhea, especially with blood
- Swollen joints or sudden lameness
- Excessive drooling or nasal discharge

**Warning Signs (Monitor Closely):**
- Reduced milk production
- Dull coat or hair loss
- Weight loss despite normal feeding
- Separation from the herd
- Changes in behavior or temperament

**What to Do:**
1. Isolate the sick animal from the herd
2. Record symptoms and their onset time
3. Check temperature if possible
4. Call your veterinarian immediately
5. Keep the animal hydrated

For emergency veterinary advice, contact Punjab Veterinary Medical Store at 0306-5757283. We're available on WhatsApp for quick consultations.`,
    contentUr: `مویشی پالنے والے کے لیے بیماری کی ابتدائی علامات کو پہچاننا جانور کی جان بچا سکتا ہے۔ یہ اہم انتباہی علامات ہیں:

**ایمرجنسی علامات (فوری اقدام کریں):**
- اچانک گرنا یا کھڑے نہ ہو سکنا
- پیٹ کا شدید پھولنا
- جسم کے کسی حصے سے شدید خون بہنا
- سانس لینے میں دشواری
- دورے پڑنا

**فوری علامات (چند گھنٹوں میں ڈاکٹر کو دکھائیں):**
- 24 گھنٹے سے زیادہ کھانا نہ کھانا
- تیز بخار (104°F سے زیادہ)
- شدید دست، خاص طور پر خون کے ساتھ
- جوڑوں کی سوجن
- ناک سے زیادہ بہاؤ

**انتباہی علامات (احتیاط سے نگرانی کریں):**
- دودھ کی پیداوار میں کمی
- بالوں کا گرنا
- وزن میں کمی
- ریوڑ سے الگ ہونا

فوری مشورے کے لیے پنجاب ویٹرنری سے رابطہ کریں: 0306-5757283`,
    date: '2026-03-01',
    category: 'Health Tips',
    categoryUr: 'صحت کے مشورے',
    readTime: '4 min',
    author: 'Punjab Vet Team',
  },
  {
    id: 3,
    slug: 'nutrition-guide-supplements-dairy-animals',
    title: 'Nutrition Guide: Best Supplements for Dairy Animals',
    titleUr: 'دودھ دینے والے جانوروں کے لیے بہترین سپلیمنٹس',
    excerpt: 'Improve milk production and animal health with the right nutritional supplements.',
    excerptUr: 'صحیح غذائی سپلیمنٹس سے دودھ کی پیداوار اور جانوروں کی صحت بہتر بنائیں۔',
    content: `Proper nutrition is the foundation of healthy, productive dairy animals. Here's your complete guide to supplements:

**Essential Minerals:**
- **Calcium & Phosphorus**: Critical for milk production and bone health. Deficiency causes milk fever.
- **Salt (NaCl)**: Provide salt licks or add to feed. Essential for metabolism.
- **Zinc & Copper**: Support immune function and hoof health.

**Vitamins:**
- **Vitamin A**: Important for reproduction and immune health.
- **Vitamin D**: Helps calcium absorption. Important for housed animals.
- **Vitamin E & Selenium**: Prevents white muscle disease in calves.

**Protein Supplements:**
- Soybean meal, cotton seed cake, and canola meal boost milk protein content.
- Feed 16-18% crude protein for lactating cows.

**Energy Boosters:**
- Molasses mixed with feed increases energy intake.
- Bypass fat supplements for high-producing cows.

**Feeding Tips:**
1. Provide clean, fresh water at all times
2. Offer quality green fodder — Berseem, Lucerne, or Maize
3. Feed concentrates according to milk yield
4. Avoid sudden feed changes
5. Ensure proper mineral supplementation year-round

Visit Punjab Veterinary Medical Store for premium animal supplements. Call 0306-5757283 for recommendations tailored to your herd.`,
    contentUr: `مناسب غذائیت صحت مند اور پیداواری دودھ دینے والے جانوروں کی بنیاد ہے۔ سپلیمنٹس کی مکمل رہنمائی:

**ضروری معدنیات:**
- **کیلشیم اور فاسفورس**: دودھ کی پیداوار اور ہڈیوں کی صحت کے لیے ضروری۔
- **نمک**: میٹابولزم کے لیے ضروری۔ نمک کی اینٹیں فراہم کریں۔
- **زنک اور تانبا**: قوت مدافعت اور کھروں کی صحت۔

**وٹامنز:**
- **وٹامن اے**: افزائش نسل اور قوت مدافعت کے لیے اہم۔
- **وٹامن ڈی**: کیلشیم جذب کرنے میں مدد کرتا ہے۔
- **وٹامن ای اور سیلینیم**: بچھڑوں میں سفید پٹھوں کی بیماری سے بچاتا ہے۔

**خوراک کے مشورے:**
1. ہمیشہ صاف تازہ پانی فراہم کریں
2. معیاری سبز چارہ دیں — برسیم، لوسرن
3. دودھ کی پیداوار کے مطابق وانڈا دیں
4. خوراک میں اچانک تبدیلی سے بچیں

پنجاب ویٹرنری سے رابطہ کریں: 0306-5757283`,
    date: '2026-02-20',
    category: 'Supplements',
    categoryUr: 'سپلیمنٹس',
    readTime: '6 min',
    author: 'Punjab Vet Team',
  },
  {
    id: 4,
    slug: 'deworming-schedule-livestock-pakistan',
    title: 'Complete Deworming Schedule for Livestock in Pakistan',
    titleUr: 'پاکستان میں مویشیوں کی مکمل ڈی ورمنگ شیڈول',
    excerpt: 'A practical guide to deworming your cattle, buffalo, goats, and sheep for maximum health and productivity.',
    excerptUr: 'اپنے مویشیوں کی صحت اور پیداواری صلاحیت بڑھانے کے لیے ڈی ورمنگ کی عملی رہنمائی۔',
    content: `Internal parasites (worms) are one of the biggest hidden threats to livestock health and productivity in Pakistan. A proper deworming schedule is essential.

**Why Deworming Matters:**
- Worms reduce feed efficiency by 10-20%
- Cause weight loss and poor body condition
- Reduce milk production significantly
- Can cause death in severe infestations, especially in young animals

**Recommended Schedule:**
- **Cattle & Buffalo**: Deworm every 3-4 months (4 times/year)
- **Goats & Sheep**: Deworm every 2-3 months (more susceptible)
- **Calves & Kids**: First deworming at 3-4 weeks of age, then monthly until 6 months

**Best Practices:**
1. Rotate between different dewormer classes to prevent resistance
2. Dose according to body weight — never underdose
3. Deworm all animals in the herd at the same time
4. Deworm before monsoon and after monsoon
5. Keep newly dewormed animals off pasture for 24-48 hours

Available at Punjab Veterinary Medical Store, Sillanwali. Call 0306-5757283.`,
    contentUr: `اندرونی طفیلی کیڑے پاکستان میں مویشیوں کی صحت کے لیے سب سے بڑا خفیہ خطرہ ہیں۔ مناسب ڈی ورمنگ شیڈول ضروری ہے۔

**ڈی ورمنگ کیوں اہم ہے:**
- کیڑے خوراک کی کارکردگی 10-20% کم کرتے ہیں
- وزن میں کمی اور جسمانی حالت خراب ہوتی ہے
- دودھ کی پیداوار میں نمایاں کمی

**تجویز کردہ شیڈول:**
- **گائے اور بھینس**: ہر 3-4 ماہ بعد
- **بکریاں اور بھیڑیں**: ہر 2-3 ماہ بعد
- **بچھڑے**: 3-4 ہفتے کی عمر میں پہلی بار، پھر 6 ماہ تک ماہانہ

پنجاب ویٹرنری میڈیکل سٹور، سیلنوالی سے رابطہ کریں: 0306-5757283`,
    date: '2026-02-05',
    category: 'Health Tips',
    categoryUr: 'صحت کے مشورے',
    readTime: '5 min',
    author: 'Punjab Vet Team',
  },
];

const Blog = () => {
  const { isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';
  const navigate = useNavigate();
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const { data: dbPosts = [] } = useQuery({
    queryKey: ['blog_posts_public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, title_ur, excerpt, excerpt_ur, content, content_ur, category, published_at, cover_image')
        .eq('published', true)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((p): BlogPost => ({
        id: 1000 + Math.abs(p.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0)),
        slug: p.slug,
        title: p.title,
        titleUr: p.title_ur || p.title,
        excerpt: p.excerpt || '',
        excerptUr: p.excerpt_ur || p.excerpt || '',
        content: p.content,
        contentUr: p.content_ur || p.content,
        date: (p.published_at || new Date().toISOString()).split('T')[0],
        category: p.category || 'General',
        categoryUr: p.category || 'عام',
        readTime: `${Math.max(2, Math.round((p.content || '').split(/\s+/).length / 200))} min`,
        author: 'Punjab Vet Team',
      }));
    },
  });

  const allPosts = [...dbPosts, ...blogPosts];

  useEffect(() => {
    if (routeSlug) {
      const found = allPosts.find(p => p.slug === routeSlug);
      if (found) setSelectedPost(found);
    } else {
      setSelectedPost(null);
    }
  }, [routeSlug, allPosts.length]);

  const openPost = (p: BlogPost) => {
    setSelectedPost(p);
    navigate(`/blog/${p.slug}`);
  };

  const closePost = () => {
    setSelectedPost(null);
    navigate('/blog');
  };

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-muted/30">
        <SEOHead
          title={isUrdu ? selectedPost.titleUr : selectedPost.title}
          description={isUrdu ? selectedPost.excerptUr : selectedPost.excerpt}
          keywords={`${selectedPost.category}, veterinary, Punjab Vet, Sillanwali, livestock, ${isUrdu ? 'ویٹرنری' : ''}`}
          url={`/blog/${selectedPost.slug}`}
          type="article"
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: selectedPost.title,
            description: selectedPost.excerpt,
            author: { '@type': 'Organization', name: 'Punjab Veterinary Medical Store' },
            datePublished: selectedPost.date,
            publisher: { '@type': 'Organization', name: 'Punjab Veterinary Medical Store' },
          }}
        />
        <div className="container py-6 max-w-3xl">
          <button onClick={closePost} className={`inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 text-sm ${f}`}>
            <ArrowLeft size={16} /> {isUrdu ? 'واپس بلاگ' : 'Back to Blog'}
          </button>

          <article className="bg-card rounded-xl p-6 md:p-8 border shadow-sm">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><Tag size={12} className="text-primary" /> {isUrdu ? selectedPost.categoryUr : selectedPost.category}</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {selectedPost.date}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {selectedPost.readTime}</span>
            </div>

            <h1 className={`text-xl md:text-2xl font-extrabold text-foreground mb-4 ${f}`}>
              {isUrdu ? selectedPost.titleUr : selectedPost.title}
            </h1>

            <div className="flex items-center gap-2 mb-6 pb-4 border-b">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={14} className="text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{selectedPost.author}</span>
            </div>

            <div className={`prose prose-sm max-w-none text-muted-foreground leading-relaxed ${f}`}>
              {(isUrdu ? selectedPost.contentUr : selectedPost.content).split('\n\n').map((paragraph, i) => (
                <p key={i} className="mb-4" dangerouslySetInnerHTML={{
                  __html: paragraph
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                    .replace(/\n- /g, '<br/>• ')
                    .replace(/\n(\d)\./g, '<br/>$1.')
                }} />
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
              <p className={`font-bold text-foreground mb-1 ${f}`}>
                {isUrdu ? 'مزید مشورے کے لیے رابطہ کریں' : 'Need Expert Advice?'}
              </p>
              <p className={`text-sm text-muted-foreground mb-3 ${f}`}>
                {isUrdu ? 'پنجاب ویٹرنری میڈیکل سٹور، سیلنوالی' : 'Punjab Veterinary Medical Store, Sillanwali'}
              </p>
              <a href="https://wa.me/923065757283" target="_blank" rel="noopener noreferrer">
                <Button className="whatsapp-green border-0 font-bold">
                  WhatsApp: 0306-5757283
                </Button>
              </a>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOHead
        title={isUrdu ? 'ویٹرنری بلاگ' : 'Veterinary Blog — Animal Health Tips'}
        description="Expert veterinary tips on livestock vaccines, animal nutrition, deworming schedules & health care. Trusted advice from Punjab Vet Sillanwali."
        keywords="veterinary blog, livestock tips, animal health Pakistan, cattle vaccines, goat care, Punjab Vet blog"
        url="/blog"
      />

      <section className="hero-gradient py-10">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`text-2xl md:text-4xl font-extrabold text-primary-foreground ${f}`}>
            {isUrdu ? 'ویٹرنری بلاگ' : 'Veterinary Blog'}
          </motion.h1>
          <p className={`text-primary-foreground/80 mt-2 text-sm md:text-base ${f}`}>
            {isUrdu ? 'جانوروں کی صحت کے بارے میں ماہرانہ مشورے اور رہنمائی' : 'Expert tips and guidance on animal health and livestock care'}
          </p>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid gap-5 md:grid-cols-2">
          {allPosts.map((post, i) => (
            <motion.article key={`${post.slug}-${i}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border shadow-sm overflow-hidden card-elevated cursor-pointer" onClick={() => openPost(post)}>
              <div className="h-2 hero-gradient" />
              <div className="p-5">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                  <span className="uppercase font-bold text-primary tracking-wider">{isUrdu ? post.categoryUr : post.category}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {post.readTime}</span>
                </div>
                <h2 className={`text-base font-bold text-foreground mb-2 line-clamp-2 ${f}`}>
                  {isUrdu ? post.titleUr : post.title}
                </h2>
                <p className={`text-sm text-muted-foreground line-clamp-3 mb-3 ${f}`}>
                  {isUrdu ? post.excerptUr : post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                  <Button variant="ghost" size="sm" className={`text-primary text-xs ${f}`}>
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
