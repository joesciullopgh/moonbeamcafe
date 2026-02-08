-- ============================================================
-- Security Migration: Lockout, Password Expiry, Force Reset
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add security columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS force_password_reset boolean DEFAULT false;

UPDATE profiles SET password_changed_at = now() WHERE password_changed_at IS NULL;

-- 2. Add billing/payment columns (safe to re-run)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_address_line1 text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_address_line2 text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_state text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_zip text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;

-- 3. Check login lockout
CREATE OR REPLACE FUNCTION check_login_lockout(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_locked_until timestamptz;
  v_remaining integer;
BEGIN
  SELECT id, locked_until
  INTO v_id, v_locked_until
  FROM profiles WHERE email = p_email;

  IF NOT FOUND THEN
    RETURN json_build_object('locked', false);
  END IF;

  IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    v_remaining := CEIL(EXTRACT(EPOCH FROM (v_locked_until - now())) / 60);
    RETURN json_build_object('locked', true, 'remaining_minutes', v_remaining);
  END IF;

  IF v_locked_until IS NOT NULL AND v_locked_until <= now() THEN
    UPDATE profiles SET failed_login_attempts = 0, locked_until = NULL WHERE id = v_id;
  END IF;

  RETURN json_build_object('locked', false);
END;
$$;

-- 4. Record failed login
CREATE OR REPLACE FUNCTION record_failed_login(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_attempts integer;
  v_new_count integer;
  v_max_attempts integer := 5;
  v_lockout_minutes integer := 15;
BEGIN
  SELECT id, failed_login_attempts
  INTO v_id, v_attempts
  FROM profiles WHERE email = p_email;

  IF NOT FOUND THEN
    RETURN json_build_object('locked', false);
  END IF;

  v_new_count := v_attempts + 1;

  IF v_new_count >= v_max_attempts THEN
    UPDATE profiles
    SET failed_login_attempts = v_new_count,
        locked_until = now() + (v_lockout_minutes * interval '1 minute')
    WHERE id = v_id;
    RETURN json_build_object('locked', true, 'remaining_minutes', v_lockout_minutes);
  ELSE
    UPDATE profiles SET failed_login_attempts = v_new_count WHERE id = v_id;
    RETURN json_build_object('locked', false, 'attempts_remaining', v_max_attempts - v_new_count);
  END IF;
END;
$$;

-- 5. Reset login attempts on success
CREATE OR REPLACE FUNCTION reset_login_attempts(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET failed_login_attempts = 0, locked_until = NULL WHERE email = p_email;
END;
$$;

-- 6. Grant permissions to anon and authenticated
GRANT EXECUTE ON FUNCTION check_login_lockout(text) TO anon;
GRANT EXECUTE ON FUNCTION check_login_lockout(text) TO authenticated;
GRANT EXECUTE ON FUNCTION record_failed_login(text) TO anon;
GRANT EXECUTE ON FUNCTION record_failed_login(text) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_login_attempts(text) TO anon;
GRANT EXECUTE ON FUNCTION reset_login_attempts(text) TO authenticated;

-- 7. New user trigger with security fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, first_name, last_name,
    role, is_active, stars,
    failed_login_attempts, force_password_reset, password_changed_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    'customer', true, 0,
    0, false, now()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
