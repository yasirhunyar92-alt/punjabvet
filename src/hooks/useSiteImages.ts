import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSiteImages = () => {
  const { data } = useQuery({
    queryKey: ['site-images-public'],
    queryFn: async () => {
      const { data } = await supabase.from('site_images').select('key,image_url');
      return data || [];
    },
    staleTime: 60_000,
  });

  const get = (key: string, fallback: string) => data?.find(d => d.key === key)?.image_url || fallback;
  return { get };
};
