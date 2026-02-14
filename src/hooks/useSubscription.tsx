import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Subscription {
  id: string;
  status: string;
  scans_used: number;
  scans_reset_at: string;
}

const FREE_SCAN_LIMIT = 2;
const RESET_INTERVAL_DAYS = 30;

export function useSubscription() {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
      // Also check Stripe subscription status
      checkStripeSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  // Check Stripe on page load and after checkout redirect
  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      // Delay to allow Stripe to process
      setTimeout(() => {
        checkStripeSubscription();
      }, 2000);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  const checkStripeSubscription = async () => {
    if (!session?.access_token) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('Failed to check Stripe subscription:', error);
        return;
      }

      if (data?.subscribed) {
        // Stripe says premium — refetch local subscription to get updated status
        await fetchSubscription();
      }
    } catch (err) {
      console.error('Stripe check error:', err);
    }
  };

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
        const resetDate = new Date(data.scans_reset_at);
        const now = new Date();
        const daysSinceReset = Math.floor((now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceReset >= RESET_INTERVAL_DAYS) {
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

  const isPremium = subscription?.status === 'premium' || subscription?.status === 'trialing';
  const scansRemaining = isPremium ? Infinity : Math.max(0, FREE_SCAN_LIMIT - (subscription?.scans_used || 0));
  const canScan = isPremium || scansRemaining > 0;

  const incrementScanCount = async () => {
    if (!subscription || isPremium) return;
    
    try {
      await supabase
        .from('subscriptions')
        .update({ scans_used: subscription.scans_used + 1 })
        .eq('id', subscription.id);
      
      setSubscription(prev => prev ? { ...prev, scans_used: prev.scans_used + 1 } : null);
    } catch (error) {
      console.error('Failed to increment scan count:', error);
    }
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
    scansRemaining,
    canScan,
    incrementScanCount,
    getDaysUntilReset,
    refetch: fetchSubscription,
    checkStripeSubscription,
  };
}
