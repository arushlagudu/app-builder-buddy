import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletionDate: string | null;
}

interface TodayStatus {
  morning: boolean;
  evening: boolean;
}

export function useStreaks() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StreakStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalCompletions: 0,
    lastCompletionDate: null,
  });
  const [todayStatus, setTodayStatus] = useState<TodayStatus>({
    morning: false,
    evening: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch streak stats
      const { data: statsData } = await supabase
        .from('user_streak_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsData) {
        setStats({
          currentStreak: statsData.current_streak,
          longestStreak: statsData.longest_streak,
          totalCompletions: statsData.total_completions,
          lastCompletionDate: statsData.last_completion_date,
        });
      }

      // Check today's completions
      const today = new Date().toISOString().split('T')[0];
      const { data: todayData } = await supabase
        .from('routine_streaks')
        .select('routine_type')
        .eq('user_id', user.id)
        .eq('completed_at', today);

      if (todayData) {
        setTodayStatus({
          morning: todayData.some(r => r.routine_type === 'morning'),
          evening: todayData.some(r => r.routine_type === 'evening'),
        });
      }
    } catch (error) {
      console.error('Failed to fetch streaks:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const markComplete = async (routineType: 'morning' | 'evening') => {
    if (!user) return false;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('routine_streaks')
        .insert({
          user_id: user.id,
          routine_type: routineType,
          completed_at: today,
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Already marked as complete!');
          return false;
        }
        throw error;
      }

      // Update local state
      setTodayStatus(prev => ({
        ...prev,
        [routineType]: true,
      }));

      // Refetch stats to get updated streak
      await fetchStats();

      const emoji = routineType === 'morning' ? '☀️' : '🌙';
      toast.success(`${emoji} ${routineType.charAt(0).toUpperCase() + routineType.slice(1)} routine complete!`);
      
      return true;
    } catch (error) {
      console.error('Failed to mark complete:', error);
      toast.error('Failed to save completion');
      return false;
    }
  };

  const getStreakBadge = () => {
    const streak = stats.currentStreak;
    if (streak >= 30) return { emoji: '🔥', label: 'On Fire!', color: 'text-orange-500' };
    if (streak >= 14) return { emoji: '⭐', label: 'Consistent', color: 'text-yellow-400' };
    if (streak >= 7) return { emoji: '💪', label: 'Building', color: 'text-primary' };
    if (streak >= 3) return { emoji: '🌱', label: 'Growing', color: 'text-green-400' };
    return { emoji: '✨', label: 'Starting', color: 'text-muted-foreground' };
  };

  return {
    stats,
    todayStatus,
    loading,
    markComplete,
    getStreakBadge,
    refetch: fetchStats,
  };
}
