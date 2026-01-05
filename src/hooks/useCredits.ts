import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseCreditResult {
  success: boolean;
  error?: string;
  remainingCredits?: number;
}

export function useCredits() {
  // Use the atomic database function to prevent race conditions
  const useCredit = useCallback(async (userId: string, reason: string = 'AI generation'): Promise<UseCreditResult> => {
    const { data, error } = await supabase.rpc('use_credit', {
      _user_id: userId,
      _reason: reason,
    });

    if (error) {
      console.error('Credit deduction error:', error);
      return { success: false, error: error.message };
    }

    // The RPC returns a JSON object
    const result = data as { success: boolean; error?: string; remainingCredits?: number };
    return result;
  }, []);

  const addCredits = useCallback(async (
    userId: string, 
    amount: number, 
    adminId: string,
    reason: string = 'Admin credit grant'
  ) => {
    // Get current credits
    const { data: currentCredits } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    const newCredits = (currentCredits?.credits ?? 0) + amount;

    // Update credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ credits: newCredits })
      .eq('user_id', userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log the transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount,
      reason,
      admin_id: adminId,
    });

    return { success: true, newCredits };
  }, []);

  const getCredits = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    return data?.credits ?? 0;
  }, []);

  return { useCredit, addCredits, getCredits };
}
