import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export const useWishlist = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { t } = useLanguage();

  const { data: items = [] } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('wishlists').select('product_id').eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const ids = new Set(items.map((i: any) => i.product_id));

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('auth');
      if (ids.has(productId)) {
        await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
        return 'removed';
      } else {
        await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
        return 'added';
      }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['wishlist', user?.id] });
      toast.success(res === 'added' ? t('addedToWishlist') : t('removedFromWishlist'));
    },
    onError: (e: any) => {
      if (e?.message === 'auth') toast.error(t('login'));
      else toast.error(e?.message || 'Error');
    },
  });

  return { ids, toggle: (id: string) => toggle.mutate(id), isInWishlist: (id: string) => ids.has(id), user };
};
