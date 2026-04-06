
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS volume_size text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS brand text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sku text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS expiry_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS batch_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS usage_instructions text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS usage_instructions_ur text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS animal_type text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_animal_type ON public.products USING GIN(animal_type);
