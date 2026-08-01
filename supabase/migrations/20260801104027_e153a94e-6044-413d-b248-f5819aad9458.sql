CREATE TABLE public.site_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  occasion TEXT,
  banner_text TEXT,
  banner_text_ur TEXT,
  tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  starts_at DATE,
  ends_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_themes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_themes TO authenticated;
GRANT ALL ON public.site_themes TO service_role;

ALTER TABLE public.site_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site themes"
  ON public.site_themes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage site themes"
  ON public.site_themes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_themes_updated_at
  BEFORE UPDATE ON public.site_themes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX site_themes_single_active ON public.site_themes (is_active) WHERE is_active;