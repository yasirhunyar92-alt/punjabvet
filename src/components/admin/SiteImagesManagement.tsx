import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ImageUpload from './ImageUpload';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const SLOTS: { key: string; label: string; description: string }[] = [
  { key: 'hero_banner', label: 'Hero / Order Now Banner', description: 'Top banner image behind "Order Now" on the homepage.' },
  { key: 'services_bg', label: 'Services Section Background', description: 'Background image behind the Our Services section.' },
  { key: 'categories_bg', label: 'Categories Section Background', description: 'Background image behind the Categories row.' },
];

const SiteImagesManagement = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['site-images'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_images').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const getUrl = (key: string) => data?.find(d => d.key === key)?.image_url || '';

  const save = async (key: string, url: string) => {
    const existing = data?.find(d => d.key === key);
    if (!url) {
      if (existing) {
        const { error } = await supabase.from('site_images').delete().eq('key', key);
        if (error) return toast.error(error.message);
        toast.success('Image removed — default will be shown');
      }
    } else if (existing) {
      const { error } = await supabase.from('site_images').update({ image_url: url }).eq('key', key);
      if (error) return toast.error(error.message);
      toast.success('Image updated');
    } else {
      const { error } = await supabase.from('site_images').insert({ key, image_url: url });
      if (error) return toast.error(error.message);
      toast.success('Image saved');
    }
    qc.invalidateQueries({ queryKey: ['site-images'] });
    qc.invalidateQueries({ queryKey: ['site-images-public'] });
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 lg:p-8 space-y-6">
      <p className="text-sm text-slate-500">Upload or paste image URLs for the background sections of your homepage. Leave a slot empty to use the default design image.</p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SLOTS.map(slot => (
          <div key={slot.key} className="border border-slate-200 rounded-2xl p-4 space-y-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{slot.label}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{slot.description}</p>
            </div>
            <ImageUpload value={getUrl(slot.key)} onChange={(url) => save(slot.key, url)} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SiteImagesManagement;
