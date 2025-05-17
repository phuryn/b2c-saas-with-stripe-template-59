
-- This migration enables Row Level Security (RLS) policies
-- These policies will be executed during migration

-- Enable RLS on these tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES
-- Policy: Administrators can view all users
CREATE POLICY "Administrators can view all users"
ON public.users
FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM public.users WHERE role = 'administrator'
));

-- Policy: Users can view own user record
CREATE POLICY "Users can view own user record"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Administrators can insert users
CREATE POLICY "Administrators can insert users"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT id FROM public.users WHERE role = 'administrator'
));

-- Policy: Administrators can update users
CREATE POLICY "Administrators can update users"
ON public.users
FOR UPDATE
USING (auth.uid() IN (
  SELECT id FROM public.users WHERE role = 'administrator'
));

-- Policy: Administrators can delete users
CREATE POLICY "Administrators can delete users"
ON public.users
FOR DELETE
USING (auth.uid() IN (
  SELECT id FROM public.users WHERE role = 'administrator'
));

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

-- Policy: Users can update own subscriber record
CREATE POLICY "Users can update own subscription"
ON public.subscribers
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Administrators can view all subscribers
CREATE POLICY "Administrators can view all subscriptions"
ON public.subscribers
FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM public.users WHERE role = 'administrator'
));

-- Policy: Administrators can update all subscribers
CREATE POLICY "Administrators can update all subscriptions"
ON public.subscribers
FOR UPDATE
USING (auth.uid() IN (
  SELECT id FROM public.users WHERE role = 'administrator'
));

-- Policy: Administrators can insert subscribers
CREATE POLICY "Administrators can insert subscriptions"
ON public.subscribers
FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT id FROM public.users WHERE role = 'administrator'
));

-- Policy: Users can create their own subscription
CREATE POLICY "Users can create their own subscription"
ON public.subscribers
FOR INSERT
WITH CHECK (auth.uid() = user_id);
