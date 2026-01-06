-- Add permissive policies requiring authentication for all tables
-- This ensures only authenticated users can access data

-- profiles table
CREATE POLICY "Require authentication for profiles"
ON public.profiles
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- user_roles table
CREATE POLICY "Require authentication for user_roles"
ON public.user_roles
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- user_credits table
CREATE POLICY "Require authentication for user_credits"
ON public.user_credits
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- device_fingerprints table
CREATE POLICY "Require authentication for device_fingerprints"
ON public.device_fingerprints
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- credit_transactions table
CREATE POLICY "Require authentication for credit_transactions"
ON public.credit_transactions
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);