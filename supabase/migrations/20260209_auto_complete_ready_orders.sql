-- ============================================================
-- Auto-complete ready orders after 15 minutes
--
-- Previously this logic only ran client-side in the staff
-- dashboard, so orders would stay in "ready" forever if no
-- one had the page open. This adds:
--   1. An updated_at column + trigger for reliable timestamps
--   2. A callable function that any page can invoke via RPC
--      to batch-complete stale ready orders
-- ============================================================

-- 1. Add updated_at column so we can reliably track when the
--    status last changed, surviving page reloads and closed tabs.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Back-fill existing rows so they are not null
UPDATE orders SET updated_at = created_at WHERE updated_at IS NULL;

-- 2. Trigger to auto-set updated_at on every row update
CREATE OR REPLACE FUNCTION set_orders_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_orders_updated_at();

-- 3. Function that auto-completes orders sitting in "ready"
--    for longer than 15 minutes. Called via supabase.rpc()
--    from any page that loads orders.
CREATE OR REPLACE FUNCTION auto_complete_ready_orders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE orders
  SET status = 'completed'
  WHERE status = 'ready'
    AND updated_at < now() - interval '15 minutes';

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END; $$;

-- 4. Allow any authenticated user to call the cleanup function.
--    The function is SECURITY DEFINER so it can update orders
--    regardless of RLS policies.
GRANT EXECUTE ON FUNCTION auto_complete_ready_orders() TO authenticated;
