
-- 1. Coupons: restrict public read to signed-in users only (hides usage internals from anon)
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Authenticated users view active coupons"
  ON public.coupons FOR SELECT TO authenticated
  USING (active = true);
REVOKE SELECT ON public.coupons FROM anon;

-- 2. Product reviews: hide reviewer user_id column from anon (public)
REVOKE SELECT (user_id) ON public.product_reviews FROM anon;

-- 3. Storage: drop broad LIST/SELECT policy on product-images.
-- Bucket is public, so getPublicUrl / direct object GET still works without a policy.
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

-- 4. SECURITY DEFINER functions: revoke EXECUTE from anon/authenticated where not needed.
--    Trigger functions never need direct EXECUTE by API roles.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

--    has_role: used inside RLS policies; keep for authenticated, remove from anon/PUBLIC.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

--    update_order_contact: intentional RPC for signed-in customers; block anon.
REVOKE EXECUTE ON FUNCTION public.update_order_contact(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_order_contact(uuid, text, text, text) TO authenticated;
