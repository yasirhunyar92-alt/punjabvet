ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_alt text;

CREATE TABLE IF NOT EXISTS public.product_slug_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  old_slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_slug_history TO anon;
GRANT SELECT ON public.product_slug_history TO authenticated;
GRANT ALL ON public.product_slug_history TO service_role;
ALTER TABLE public.product_slug_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Slug history is publicly readable" ON public.product_slug_history;
CREATE POLICY "Slug history is publicly readable" ON public.product_slug_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage slug history" ON public.product_slug_history;
CREATE POLICY "Admins manage slug history" ON public.product_slug_history FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.slugify(value text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(both '-' from regexp_replace(regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'), '-+', '-', 'g'))
$$;

CREATE OR REPLACE FUNCTION public.products_seo_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base text;
  candidate text;
  n int := 1;
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    base := public.slugify(NEW.name);
  ELSE
    base := public.slugify(NEW.slug);
  END IF;
  IF base IS NULL OR base = '' THEN
    base := 'product';
  END IF;
  base := left(base, 80);
  candidate := base;
  WHILE EXISTS (
    SELECT 1 FROM public.products p WHERE p.slug = candidate AND p.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) OR EXISTS (
    SELECT 1 FROM public.product_slug_history h WHERE h.old_slug = candidate AND h.product_id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;
  NEW.slug := candidate;

  IF TG_OP = 'UPDATE' AND OLD.slug IS NOT NULL AND OLD.slug <> NEW.slug THEN
    INSERT INTO public.product_slug_history (product_id, old_slug)
    VALUES (NEW.id, OLD.slug)
    ON CONFLICT (old_slug) DO UPDATE SET product_id = EXCLUDED.product_id;
    DELETE FROM public.product_slug_history WHERE old_slug = NEW.slug;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_seo_slug_trigger ON public.products;
CREATE TRIGGER products_seo_slug_trigger
BEFORE INSERT OR UPDATE OF name, slug ON public.products
FOR EACH ROW EXECUTE FUNCTION public.products_seo_slug();

UPDATE public.products SET slug = slug WHERE slug IS NULL OR btrim(slug) = '';

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products (slug);