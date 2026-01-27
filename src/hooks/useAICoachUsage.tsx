import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';

const FREE_DAILY_LIMIT = 5;

export function useAICoachUsage() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTodayUsage();
    } else {
      setQuestionsUsed(0);
      setLoading(false);
    }
  }, [user]);

  const fetchTodayUsage = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('ai_coach_usage')
        .select('questions_used')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch AI coach usage:', error);
        return;
      }

      setQuestionsUsed(data?.questions_used || 0);
    } catch (error) {
      console.error('Error fetching AI coach usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async () => {
    if (!user || isPremium) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Try to upsert the usage record
      const { data: existing } = await supabase
        .from('ai_coach_usage')
        .select('id, questions_used')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (existing) {
        // Update existing record
        await supabase
          .from('ai_coach_usage')
          .update({ questions_used: existing.questions_used + 1 })
          .eq('id', existing.id);

        setQuestionsUsed(existing.questions_used + 1);
      } else {
        // Insert new record
        await supabase
          .from('ai_coach_usage')
          .insert({
            user_id: user.id,
            usage_date: today,
            questions_used: 1,
          });

        setQuestionsUsed(1);
      }
    } catch (error) {
      console.error('Failed to increment AI coach usage:', error);
    }
  };

  const questionsRemaining = isPremium ? Infinity : Math.max(0, FREE_DAILY_LIMIT - questionsUsed);
  const canAsk = isPremium || questionsRemaining > 0;

  return {
    questionsUsed,
    questionsRemaining,
    canAsk,
    incrementUsage,
    loading,
    dailyLimit: FREE_DAILY_LIMIT,
    isPremium,
    refetch: fetchTodayUsage,
  };
}
