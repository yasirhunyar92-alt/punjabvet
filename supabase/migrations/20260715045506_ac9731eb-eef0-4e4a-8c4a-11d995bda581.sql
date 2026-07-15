
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_product() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_product_updates() FROM PUBLIC, anon, authenticated;
