import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';

const FREE_DAILY_TOKENS = 2500;

export function useAICoachUsage() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [tokensUsed, setTokensUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTodayUsage();
    } else {
      setTokensUsed(0);
      setLoading(false);
    }
  }, [user]);

  const fetchTodayUsage = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('ai_coach_usage')
        .select('tokens_used')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch AI coach usage:', error);
        return;
      }

      setTokensUsed(data?.tokens_used || 0);
    } catch (error) {
      console.error('Error fetching AI coach usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTokens = async (tokens: number) => {
    if (!user || isPremium) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Try to upsert the usage record
      const { data: existing } = await supabase
        .from('ai_coach_usage')
        .select('id, tokens_used')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (existing) {
        // Update existing record
        await supabase
          .from('ai_coach_usage')
          .update({ tokens_used: existing.tokens_used + tokens })
          .eq('id', existing.id);

        setTokensUsed(existing.tokens_used + tokens);
      } else {
        // Insert new record
        await supabase
          .from('ai_coach_usage')
          .insert({
            user_id: user.id,
            usage_date: today,
            tokens_used: tokens,
          });

        setTokensUsed(tokens);
      }
    } catch (error) {
      console.error('Failed to update AI coach usage:', error);
    }
  };

  const tokensRemaining = isPremium ? Infinity : Math.max(0, FREE_DAILY_TOKENS - tokensUsed);
  const canAsk = isPremium || tokensRemaining > 0;

  // Estimate tokens for a message (rough approximation: ~4 chars per token)
  const estimateTokens = (message: string) => {
    const baseTokens = 200; // Base cost for any question
    const messageTokens = Math.ceil(message.length / 4);
    return baseTokens + messageTokens;
  };

  return {
    tokensUsed,
    tokensRemaining,
    canAsk,
    addTokens,
    estimateTokens,
    loading,
    dailyLimit: FREE_DAILY_TOKENS,
    isPremium,
    refetch: fetchTodayUsage,
  };
}
