-- Enable Row Level Security on tables
-- Run this in your Supabase SQL Editor

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on temp_registrations table
ALTER TABLE public.temp_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies to allow backend service account full access
-- (Backend uses the postgres role which bypasses RLS by default)

-- Policy for users table: Allow service role full access
CREATE POLICY "Service role has full access to users"
ON public.users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for temp_registrations table: Allow service role full access
CREATE POLICY "Service role has full access to temp_registrations"
ON public.temp_registrations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Note: Since your Spring Boot backend connects as the postgres user,
-- it will bypass RLS automatically. These policies are for additional
-- authenticated users if you add them later.

-- If you want to allow public access (not recommended), use:
-- CREATE POLICY "Allow all operations" ON public.users FOR ALL USING (true) WITH CHECK (true);
