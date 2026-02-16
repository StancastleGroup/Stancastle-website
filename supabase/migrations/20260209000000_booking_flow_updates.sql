-- Support guest checkout and signup profile fields.
-- Run in Supabase SQL Editor if not using migrations.

-- Profiles: add phone and company_website if missing (for signup flow)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT;

-- Appointments: allow guest bookings (user_id null) and ensure pending does not block slots
-- get-availability already filters by status IN ('paid','booked') so pending is ignored
ALTER TABLE appointments
ALTER COLUMN user_id DROP NOT NULL;

-- RPC for Edge Function only: check if an email is already registered (avoids exposing auth.users to client)
CREATE OR REPLACE FUNCTION public.email_registered(check_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = lower(trim(check_email)));
$$;
