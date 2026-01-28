import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Subscription {
  id: string;
  status: 'free' | 'premium' | 'cancelled';
  scans_used: number;
  scans_reset_at: string;
}

const TOTAL_TOKENS = 5000;
const SCAN_TOKEN_COST = 2500;
const RESET_INTERVAL_DAYS = 3;

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Check if we need to reset the token count (every 3 days)
        const resetDate = new Date(data.scans_reset_at);
        const now = new Date();
        const daysSinceReset = Math.floor((now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceReset >= RESET_INTERVAL_DAYS) {
          // Reset the token count
          const { data: updated } = await supabase
            .from('subscriptions')
            .update({ scans_used: 0, scans_reset_at: now.toISOString() })
            .eq('id', data.id)
            .select()
            .single();
          
          setSubscription(updated as Subscription);
        } else {
          setSubscription(data as Subscription);
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPremium = subscription?.status === 'premium';
  
  // Token-based system: scans_used now represents tokens used
  const tokensUsed = subscription?.scans_used || 0;
  const tokensRemaining = isPremium ? Infinity : Math.max(0, TOTAL_TOKENS - tokensUsed);
  const canScan = isPremium || tokensRemaining >= SCAN_TOKEN_COST;

  const useTokens = async (amount: number) => {
    if (!subscription || isPremium) return;
    
    try {
      const newTokensUsed = subscription.scans_used + amount;
      await supabase
        .from('subscriptions')
        .update({ scans_used: newTokensUsed })
        .eq('id', subscription.id);
      
      setSubscription(prev => prev ? { ...prev, scans_used: newTokensUsed } : null);
    } catch (error) {
      console.error('Failed to use tokens:', error);
    }
  };

  const incrementScanCount = async () => {
    // Scan costs 2500 tokens
    await useTokens(SCAN_TOKEN_COST);
  };

  const getDaysUntilReset = () => {
    if (!subscription) return RESET_INTERVAL_DAYS;
    const resetDate = new Date(subscription.scans_reset_at);
    const now = new Date();
    const daysSinceReset = Math.floor((now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, RESET_INTERVAL_DAYS - daysSinceReset);
  };

  return {
    subscription,
    loading,
    isPremium,
    tokensRemaining,
    tokensUsed,
    canScan,
    incrementScanCount,
    useTokens,
    getDaysUntilReset,
    refetch: fetchSubscription,
    TOTAL_TOKENS,
    SCAN_TOKEN_COST,
  };
}
