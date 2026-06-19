import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

interface Props { productId: string }

const ProductReviews = ({ productId }: Props) => {
  const { user } = useAuth();
  const { t, isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_reviews')
        .select('id, rating, title, comment, created_at, user_id')
        .eq('product_id', productId)
        .eq('approved', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!comment.trim()) { toast.error('Please write a review'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('product_reviews').insert({
      product_id: productId, user_id: user.id, rating, title: title.trim() || null, comment: comment.trim(),
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t('reviewPending'));
    setTitle(''); setComment(''); setRating(5);
    qc.invalidateQueries({ queryKey: ['reviews', productId] });
  };

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className={`text-xl font-bold text-foreground mb-5 ${f}`}>{t('customerReviews')}</h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Reviews list */}
        <div className="space-y-4">
          {reviews && reviews.length > 0 ? reviews.map(r => (
            <div key={r.id} className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < r.rating ? 'fill-warning text-warning' : 'text-border'} />
                ))}
                <span className="text-xs text-muted-foreground ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.title && <p className="font-semibold text-sm text-foreground">{r.title}</p>}
              <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>
            </div>
          )) : (
            <p className={`text-sm text-muted-foreground ${f}`}>{t('noReviewsYet')}</p>
          )}
        </div>

        {/* Write review */}
        <div className="bg-card border rounded-lg p-5 h-fit">
          <h3 className={`font-semibold text-foreground mb-3 ${f}`}>{t('writeReview')}</h3>
          {!user ? (
            <p className={`text-sm text-muted-foreground ${f}`}>
              {t('loginToReview')} <Link to="/auth" className="text-primary underline">{t('login')}</Link>
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label className={`text-xs ${f}`}>{t('yourRating')}</Label>
                <div className="flex gap-1 mt-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}>
                      <Star size={22} className={n <= (hover || rating) ? 'fill-warning text-warning' : 'text-border'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className={`text-xs ${f}`}>{t('reviewTitle')}</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />
              </div>
              <div>
                <Label className={`text-xs ${f}`}>{t('reviewComment')}</Label>
                <Textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} required maxLength={1000} />
              </div>
              <Button type="submit" disabled={submitting} className={f}>{submitting ? t('loading') : t('submitReview')}</Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;
