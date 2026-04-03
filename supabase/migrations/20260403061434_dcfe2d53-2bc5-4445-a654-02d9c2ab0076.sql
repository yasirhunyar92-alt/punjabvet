
-- Remove the overly broad user UPDATE policy
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

-- Create a restricted RPC that only allows updating contact fields on pending orders
CREATE OR REPLACE FUNCTION public.update_order_contact(
  _order_id uuid,
  _customer_name text,
  _phone text,
  _address text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE orders
  SET customer_name = _customer_name,
      phone = _phone,
      address = _address
  WHERE id = _order_id AND user_id = auth.uid()
    AND status = 'pending';
$$;

-- Grant execute only to authenticated users
REVOKE ALL ON FUNCTION public.update_order_contact(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order_contact(uuid, text, text, text) TO authenticated;
