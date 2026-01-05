import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useCredits() {
  const useCredit = useCallback(async (userId: string, reason: string = 'AI generation') => {
    // First get current credits
    const { data: currentCredits } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (!currentCredits || currentCredits.credits <= 0) {
      return { success: false, error: 'Insufficient credits' };
    }

    // Deduct 1 credit
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ credits: currentCredits.credits - 1 })
      .eq('user_id', userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log the transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: -1,
      reason,
    });

    return { success: true, remainingCredits: currentCredits.credits - 1 };
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
