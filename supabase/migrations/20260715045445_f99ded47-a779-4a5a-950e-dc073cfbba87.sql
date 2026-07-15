
-- 1. Orders: add payment fields
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_proof_path text;

-- 2. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- null = broadcast
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'system',
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_broadcast_idx ON public.notifications(created_at DESC) WHERE user_id IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own and broadcast notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  order_updates boolean NOT NULL DEFAULT true,
  promotions boolean NOT NULL DEFAULT true,
  new_products boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification prefs"
  ON public.notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Order status change -> notification
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.user_id,
      'Order status updated',
      'Your order #' || substring(NEW.id::text, 1, 8) || ' is now ' || NEW.status || '.',
      'order_status',
      '/profile'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_order_status ON public.orders;
CREATE TRIGGER trg_notify_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_status_change();

-- 5. New product / discount / restock -> broadcast notification
CREATE OR REPLACE FUNCTION public.notify_new_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (
    NULL,
    'New product available',
    NEW.name || ' just landed in our store.',
    'new_product',
    '/product/' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_product ON public.products;
CREATE TRIGGER trg_notify_new_product
  AFTER INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_product();

CREATE OR REPLACE FUNCTION public.notify_product_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Discount added or lowered
  IF NEW.discount_price IS NOT NULL
     AND (OLD.discount_price IS NULL OR NEW.discount_price < OLD.discount_price) THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NULL,
      'New discount: ' || NEW.name,
      'Now available at Rs. ' || NEW.discount_price::text,
      'discount',
      '/product/' || NEW.id::text
    );
  END IF;

  -- Back in stock (from 0 -> > 0, or in_stock flipped false -> true)
  IF (COALESCE(OLD.stock_quantity, 0) = 0 AND COALESCE(NEW.stock_quantity, 0) > 0)
     OR (OLD.in_stock IS DISTINCT FROM true AND NEW.in_stock IS TRUE) THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NULL,
      'Back in stock: ' || NEW.name,
      NEW.name || ' is available again.',
      'restock',
      '/product/' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_product_updates ON public.products;
CREATE TRIGGER trg_notify_product_updates
  AFTER UPDATE OF discount_price, stock_quantity, in_stock ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.notify_product_updates();

-- 6. Storage policies for payment-proofs bucket (bucket created via storage tool)
-- Path convention: {user_id}/{order_id}-{timestamp}.{ext}
DROP POLICY IF EXISTS "Users upload own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users read own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins read all payment proofs" ON storage.objects;

CREATE POLICY "Users upload own payment proofs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own payment proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins read all payment proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND public.has_role(auth.uid(), 'admin')
  );
