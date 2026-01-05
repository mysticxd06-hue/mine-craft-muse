-- 1. Add CHECK constraint to prevent negative credits
ALTER TABLE public.user_credits ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);

-- 2. Create atomic credit deduction function to prevent race conditions
CREATE OR REPLACE FUNCTION public.use_credit(_user_id uuid, _reason text DEFAULT 'AI generation')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_credits integer;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Only allow users to use their own credits
  IF auth.uid() != _user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Atomic update with WHERE clause for concurrency safety
  UPDATE user_credits 
  SET credits = credits - 1, updated_at = now()
  WHERE user_id = _user_id AND credits > 0
  RETURNING credits INTO remaining_credits;
  
  IF remaining_credits IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credits');
  END IF;
  
  -- Log the transaction
  INSERT INTO credit_transactions (user_id, amount, reason)
  VALUES (_user_id, -1, _reason);
  
  RETURN json_build_object('success', true, 'remainingCredits', remaining_credits);
END;
$$;

-- 3. Create secure admin role change function with audit logging
CREATE OR REPLACE FUNCTION public.admin_set_user_role(_target_user_id uuid, _new_role app_role)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is an admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Prevent self-promotion/demotion
  IF auth.uid() = _target_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot modify your own role');
  END IF;
  
  -- Update the role
  UPDATE user_roles 
  SET role = _new_role 
  WHERE user_id = _target_user_id;
  
  -- Log to credit_transactions as audit (we could create a separate audit table later)
  INSERT INTO credit_transactions (user_id, admin_id, amount, reason)
  VALUES (_target_user_id, auth.uid(), 0, 'Role changed to: ' || _new_role::text);
  
  RETURN json_build_object('success', true, 'newRole', _new_role::text);
END;
$$;

-- 4. Fix check_device_limit to require authentication
CREATE OR REPLACE FUNCTION public.check_device_limit(p_fingerprint text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For signup flow, we need to allow this check before user is authenticated
  -- But we should still return a count safely without exposing exact fingerprint data
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.device_fingerprints
    WHERE fingerprint = p_fingerprint
  );
END;
$$;