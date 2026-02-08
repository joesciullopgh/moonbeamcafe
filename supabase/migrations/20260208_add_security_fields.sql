-- ============================================================
-- Security Migration: Lockout, Password Expiry, Force Reset
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add security columns to profiles table
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS force_password_reset boolean DEFAULT false;

-- Set password_changed_at for existing users (assume current passwords are fresh)
UPDATE profiles SET password_changed_at = now() WHERE password_changed_at IS NULL;


-- 2. Add billing/payment columns (if not already added from prior migration)
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_address_line1 text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_address_line2 text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_state text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_zip text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;

-- Add customer_name to orders (if not already added)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;


-- 3. RPC: Check login lockout status
-- Called BEFORE login attempt — returns {locked, remaining_minutes}
-- Uses SECURITY DEFINER so it works for unauthenticated users
-- ============================================================

CREATE OR REPLACE FUNCTION check_login_lockout(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_remaining_minutes integer;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE email = p_email;

  -- Don't reveal whether account exists
  IF NOT FOUND THEN
    RETURN json_build_object('locked', false);
  END IF;

  -- Check active lockout
  IF v_profile.locked_until IS NOT NULL AND v_profile.locked_until > now() THEN
    v_remaining_minutes := CEIL(EXTRACT(EPOCH FROM (v_profile.locked_until - now())) / 60);
    RETURN json_build_object('locked', true, 'remaining_minutes', v_remaining_minutes);
  END IF;

  -- Clear expired lockout
  IF v_profile.locked_until IS NOT NULL AND v_profile.locked_until <= now() THEN
    UPDATE profiles
    SET failed_login_attempts = 0, locked_until = NULL
    WHERE id = v_profile.id;
  END IF;

  RETURN json_build_object('locked', false);
END;
$$;


-- 4. RPC: Record a failed login attempt
-- Called AFTER a failed login — increments counter, triggers lockout at threshold
-- ============================================================

CREATE OR REPLACE FUNCTION record_failed_login(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_max_attempts constant integer := 5;
  v_lockout_minutes constant integer := 15;
  v_new_count integer;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE email = p_email;

  -- Don't reveal whether account exists
  IF NOT FOUND THEN
    RETURN json_build_object('locked', false);
  END IF;

  v_new_count := v_profile.failed_login_attempts + 1;

  IF v_new_count >= v_max_attempts THEN
    -- Lock the account
    UPDATE profiles
    SET failed_login_attempts = v_new_count,
        locked_until = now() + (v_lockout_minutes || ' minutes')::interval
    WHERE id = v_profile.id;

    RETURN json_build_object('locked', true, 'remaining_minutes', v_lockout_minutes);
  ELSE
    -- Increment counter
    UPDATE profiles
    SET failed_login_attempts = v_new_count
    WHERE id = v_profile.id;

    RETURN json_build_object(
      'locked', false,
      'attempts_remaining', v_max_attempts - v_new_count
    );
  END IF;
END;
$$;


-- 5. RPC: Reset login attempts on successful login
-- Called AFTER a successful login
-- ============================================================

CREATE OR REPLACE FUNCTION reset_login_attempts(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET failed_login_attempts = 0, locked_until = NULL
  WHERE email = p_email;
END;
$$;


-- 6. Grant execute permissions to anon and authenticated roles
-- (needed so unauthenticated login flow can call these RPCs)
-- ============================================================

GRANT EXECUTE ON FUNCTION check_login_lockout(text) TO anon;
GRANT EXECUTE ON FUNCTION check_login_lockout(text) TO authenticated;

GRANT EXECUTE ON FUNCTION record_failed_login(text) TO anon;
GRANT EXECUTE ON FUNCTION record_failed_login(text) TO authenticated;

GRANT EXECUTE ON FUNCTION reset_login_attempts(text) TO anon;
GRANT EXECUTE ON FUNCTION reset_login_attempts(text) TO authenticated;


-- 7. Update the handle_new_user trigger to initialize security fields
-- (if you have an existing trigger, update it; otherwise create one)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    stars,
    failed_login_attempts,
    force_password_reset,
    password_changed_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    'customer',
    true,
    0,
    0,
    false,
    now()
  );
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
-- (drop and recreate to ensure latest version)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 8. Enable realtime for orders (if not already enabled)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
