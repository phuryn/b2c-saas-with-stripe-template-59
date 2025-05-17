
-- This migration updates the documentation of existing RLS policies
-- by dropping old ones and recreating them to match the actual database state

-- Drop all existing policies to recreate them with correct names and conditions
-- USERS TABLE
DROP POLICY IF EXISTS "Users can view own user record" ON public.users;

-- PROFILES TABLE
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Administrators can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Administrators can update profiles" ON public.profiles;

-- SUBSCRIBERS TABLE
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscribers;

-- Enable RLS on these tables (in case it's not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES
-- Policy: Users can view own user record
CREATE POLICY "Users can view own user record"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- PROFILES TABLE POLICIES
-- Policy: Users can view own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Policy: Users can insert own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Administrators can view all profiles
CREATE POLICY "Administrators can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM public.users WHERE role = 'administrator'
));

-- Policy: Administrators can update all profiles
CREATE POLICY "Administrators can update profiles"
ON public.profiles
FOR UPDATE
USING (auth.uid() IN (
  SELECT id FROM public.users WHERE role = 'administrator'
));

-- SUBSCRIBERS TABLE POLICIES
-- Policy: Users can view own subscriber record
CREATE POLICY "Users can view own subscription"
ON public.subscribers
FOR SELECT
USING (auth.uid() = user_id);

-- Add comments to document the current state of each table
COMMENT ON TABLE public.users IS 'Stores user information with role assignments';
COMMENT ON TABLE public.profiles IS 'Stores user profile information that can be edited';
COMMENT ON TABLE public.subscribers IS 'Stores user subscription data. All modifications should be done through edge functions using service role keys.';
