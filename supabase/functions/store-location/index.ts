import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY = 'https://connector-gateway.lovable.dev/google_maps';
const PLACE_ID = 'ChIJb0P_pq_XIzkRjsliWrb5bTU'; // Punjab Veterinary Medical Store, Sillanwali

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

const headers = () => ({
  Authorization: `Bearer ${LOVABLE_API_KEY}`,
  'X-Connection-Api-Key': GOOGLE_MAPS_API_KEY ?? '',
  'Content-Type': 'application/json',
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
  });

// In-memory cache so repeat visits don't re-bill Google.
let cache: { at: number; data: unknown } | null = null;
const TTL = 1000 * 60 * 60 * 6;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return json({ error: 'Google Maps connection is not configured' }, 500);
    }
    if (cache && Date.now() - cache.at < TTL) return json(cache.data);

    const fieldMask = [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'googleMapsUri',
      'rating',
      'userRatingCount',
      'nationalPhoneNumber',
      'currentOpeningHours.openNow',
      'regularOpeningHours.weekdayDescriptions',
      'photos',
    ].join(',');

    const res = await fetch(`${GATEWAY}/places/v1/places/${PLACE_ID}`, {
      headers: { ...headers(), 'X-Goog-FieldMask': fieldMask },
    });

    if (!res.ok) {
      const details = await res.text();
      console.error(`Places details failed [${res.status}]: ${details}`);
      return json({ error: 'Could not load the store listing', status: res.status, details }, res.status);
    }

    const place = await res.json();

    let rawPhotos = place.photos ?? [];
    if (!rawPhotos.length) {
      // Some listings only expose photos through search — fall back to it.
      const sr = await fetch(`${GATEWAY}/places/v1/places:searchText`, {
        method: 'POST',
        headers: { ...headers(), 'X-Goog-FieldMask': 'places.id,places.photos' },
        body: JSON.stringify({ textQuery: 'Punjab Veterinary Medical Store Sillanwali' }),
      });
      if (sr.ok) {
        const sj = await sr.json();
        rawPhotos = (sj.places ?? []).find((p: { id: string }) => p.id === PLACE_ID)?.photos ?? [];
      } else {
        console.error(`Photo search fallback failed [${sr.status}]: ${(await sr.text()).slice(0, 200)}`);
      }
    }

    // Resolve up to 6 photo URLs (server-side; the browser gets plain image URLs).
    const photoRefs = rawPhotos.slice(0, 6);
    const photos: { url: string; attribution?: string }[] = [];
    for (const p of photoRefs) {
      try {
        const pr = await fetch(`${GATEWAY}/places/v1/${p.name}/media?maxWidthPx=1200&skipHttpRedirect=true`, {
          headers: headers(),
        });
        if (!pr.ok) {
          console.error(`Photo media failed [${pr.status}]: ${(await pr.text()).slice(0, 200)}`);
          continue;
        }
        const pj = await pr.json();
        if (pj.photoUri) {
          photos.push({ url: pj.photoUri, attribution: p.authorAttributions?.[0]?.displayName });
        }
      } catch (e) {
        console.error('photo error', e instanceof Error ? e.message : e);
      }
    }

    const data = {
      name: place.displayName?.text ?? 'Punjab Veterinary Medical Store',
      address: place.formattedAddress ?? null,
      location: place.location ?? null,
      mapsUri: place.googleMapsUri ?? null,
      rating: place.rating ?? null,
      reviews: place.userRatingCount ?? null,
      phone: place.nationalPhoneNumber ?? null,
      openNow: place.currentOpeningHours?.openNow ?? null,
      hours: place.regularOpeningHours?.weekdayDescriptions ?? [],
      photos,
    };

    cache = { at: Date.now(), data };
    return json(data);
  } catch (e) {
    console.error('store-location error', e);
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500);
  }
});
