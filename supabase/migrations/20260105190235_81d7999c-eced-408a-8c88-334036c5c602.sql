-- Add banned status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN banned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ban_reason TEXT;

-- Create function for admins to ban/unban users
CREATE OR REPLACE FUNCTION public.admin_ban_user(_target_user_id uuid, _ban boolean, _reason text DEFAULT NULL)
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
  
  -- Prevent self-ban
  IF auth.uid() = _target_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot ban yourself');
  END IF;
  
  -- Update ban status
  UPDATE profiles 
  SET 
    is_banned = _ban,
    banned_at = CASE WHEN _ban THEN now() ELSE NULL END,
    ban_reason = CASE WHEN _ban THEN _reason ELSE NULL END,
    updated_at = now()
  WHERE id = _target_user_id;
  
  -- Log to credit_transactions as audit
  INSERT INTO credit_transactions (user_id, admin_id, amount, reason)
  VALUES (_target_user_id, auth.uid(), 0, CASE WHEN _ban THEN 'User banned: ' || COALESCE(_reason, 'No reason') ELSE 'User unbanned' END);
  
  RETURN json_build_object('success', true, 'banned', _ban);
END;
$$;

-- Create function for admins to set credits directly
CREATE OR REPLACE FUNCTION public.admin_set_credits(_target_user_id uuid, _credits integer, _reason text DEFAULT 'Admin adjustment')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_credits integer;
  credit_diff integer;
BEGIN
  -- Check if caller is an admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Get current credits
  SELECT credits INTO old_credits FROM user_credits WHERE user_id = _target_user_id;
  credit_diff := _credits - COALESCE(old_credits, 0);
  
  -- Update credits
  UPDATE user_credits 
  SET credits = _credits, updated_at = now()
  WHERE user_id = _target_user_id;
  
  -- Log the transaction
  INSERT INTO credit_transactions (user_id, admin_id, amount, reason)
  VALUES (_target_user_id, auth.uid(), credit_diff, _reason);
  
  RETURN json_build_object('success', true, 'newCredits', _credits, 'diff', credit_diff);
END;
$$;