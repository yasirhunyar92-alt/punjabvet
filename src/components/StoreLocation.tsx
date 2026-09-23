import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, Navigation, Clock, MapPin } from 'lucide-react';

type StoreInfo = {
  name: string;
  address: string | null;
  location: { latitude: number; longitude: number } | null;
  mapsUri: string | null;
  rating: number | null;
  reviews: number | null;
  openNow: boolean | null;
  hours: string[];
  photos: { url: string; attribution?: string }[];
};

const MAP_EMBED =
  'https://www.google.com/maps?q=Punjab+Veterinary+Medical+Store,+Railway+Road,+Model+Town,+Sillanwali,+Pakistan&output=embed';
const DIRECTIONS =
  'https://www.google.com/maps/dir/?api=1&destination=Punjab+Veterinary+Medical+Store+Sillanwali&destination_place_id=ChIJb0P_pq_XIzkRjsliWrb5bTU';

const StoreLocation = () => {
  const { isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';

  const { data } = useQuery<StoreInfo>({
    queryKey: ['store-location'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('store-location');
      if (error) throw error;
      return data as StoreInfo;
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-lg font-bold text-foreground ${f}`}>
          {isUrdu ? 'ہمارا سٹور — لائیو لوکیشن' : 'Our Store — Live Location'}
        </h2>
        <a
          href={DIRECTIONS}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 ${f}`}
        >
          <Navigation size={16} />
          {isUrdu ? 'راستہ دیکھیں' : 'Get Directions'}
        </a>
      </div>

      <div className="bg-card rounded-xl overflow-hidden border shadow-sm">
        <iframe
          src={MAP_EMBED}
          width="100%"
          height="320"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Punjab Veterinary Medical Store — Sillanwali, Punjab, Pakistan"
        />
        <div className="p-4 space-y-2 text-sm">
          <p className="flex items-start gap-2 text-foreground">
            <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
            <span className={f}>{data?.address ?? (isUrdu ? 'ریلوے روڈ، ماڈل ٹاؤن، سیلنوالی' : 'Railway Road, Model Town, Sillanwali, Pakistan')}</span>
          </p>
          {data?.rating != null && (
            <p className="flex items-center gap-2 text-foreground">
              <Star size={16} className="text-primary fill-primary" />
              <span className="font-semibold">{data.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({data.reviews} {isUrdu ? 'گوگل ریویو' : 'Google reviews'})
              </span>
            </p>
          )}
          {data?.openNow != null && (
            <p className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <span className={`font-semibold ${data.openNow ? 'text-primary' : 'text-destructive'} ${f}`}>
                {data.openNow ? (isUrdu ? 'ابھی کھلا ہے' : 'Open now') : (isUrdu ? 'ابھی بند ہے' : 'Closed now')}
              </span>
            </p>
          )}
          {!!data?.hours?.length && (
            <ul className="text-muted-foreground text-xs space-y-0.5 pt-1">
              {data.hours.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {!!data?.photos?.length && (
        <div>
          <h3 className={`text-base font-bold text-foreground mb-2 ${f}`}>
            {isUrdu ? 'سٹور کی تصاویر' : 'Photos of Our Store'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.photos.map((p, i) => (
              <figure key={i} className="overflow-hidden rounded-xl border bg-card">
                <img
                  src={p.url}
                  alt={`Punjab Veterinary Medical Store, Sillanwali — store photo ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-40 object-cover"
                />
                {p.attribution && (
                  <figcaption className="px-2 py-1 text-[10px] text-muted-foreground truncate">
                    {isUrdu ? 'تصویر: ' : 'Photo: '}
                    {p.attribution}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {isUrdu ? 'تصاویر گوگل بزنس پروفائل سے' : 'Photos from our Google Business Profile'}
          </p>
        </div>
      )}
    </section>
  );
};

export default StoreLocation;
