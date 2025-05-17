
-- This migration is now obsolete and has been replaced by 20250517100000_update_rls_documentation.sql
-- Please refer to the newer migration for accurate RLS policy documentation.

-- DEPRECATED: Original content below for reference
-- Enable RLS on these tables
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
