import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  requiredStreak: number;
  reward?: string;
  color: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: '7 days of consistent skincare',
    emoji: '🌟',
    requiredStreak: 7,
    reward: 'Unlocked: Weekly Skin Tips',
    color: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'streak_14',
    title: 'Fortnight Fighter',
    description: '14 days of dedication',
    emoji: '💪',
    requiredStreak: 14,
    reward: 'Unlocked: Advanced Routines',
    color: 'from-blue-400 to-cyan-500',
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: '30 days of skincare excellence',
    emoji: '🔥',
    requiredStreak: 30,
    reward: 'Unlocked: Exclusive Badge',
    color: 'from-orange-400 to-red-500',
  },
  {
    id: 'streak_60',
    title: 'Skin Sensei',
    description: '60 days of unwavering commitment',
    emoji: '🧘',
    requiredStreak: 60,
    reward: 'Unlocked: Premium Tips Access',
    color: 'from-purple-400 to-pink-500',
  },
  {
    id: 'streak_90',
    title: 'Legendary Glow',
    description: '90 days - You are a skincare legend',
    emoji: '👑',
    requiredStreak: 90,
    reward: 'Unlocked: Legend Status',
    color: 'from-primary to-secondary',
  },
];

export function useAchievements() {
  const { user } = useAuth();
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      if (data) {
        setUnlockedIds(data.map((a) => a.achievement_id));
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const checkAndUnlock = async (currentStreak: number) => {
    if (!user) return;

    for (const achievement of ACHIEVEMENTS) {
      if (currentStreak >= achievement.requiredStreak && !unlockedIds.includes(achievement.id)) {
        try {
          const { error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
            });

          if (error) {
            if (error.code === '23505') continue; // Already exists
            throw error;
          }

          setUnlockedIds((prev) => [...prev, achievement.id]);
          setNewlyUnlocked(achievement);
          
          toast.success(`🎉 Achievement Unlocked: ${achievement.title}!`, {
            description: achievement.reward,
            duration: 5000,
          });
        } catch (error) {
          console.error('Failed to unlock achievement:', error);
        }
      }
    }
  };

  const dismissNewlyUnlocked = () => setNewlyUnlocked(null);

  const getUnlockedAchievements = () => 
    ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id));

  const getLockedAchievements = () => 
    ACHIEVEMENTS.filter((a) => !unlockedIds.includes(a.id));

  const getNextAchievement = (currentStreak: number) => 
    ACHIEVEMENTS.find((a) => a.requiredStreak > currentStreak);

  const getProgress = (currentStreak: number) => {
    const next = getNextAchievement(currentStreak);
    if (!next) return 100;
    
    const prev = ACHIEVEMENTS
      .filter((a) => a.requiredStreak < next.requiredStreak)
      .pop();
    
    const start = prev?.requiredStreak || 0;
    const end = next.requiredStreak;
    
    return Math.min(100, ((currentStreak - start) / (end - start)) * 100);
  };

  return {
    achievements: ACHIEVEMENTS,
    unlockedIds,
    loading,
    newlyUnlocked,
    dismissNewlyUnlocked,
    checkAndUnlock,
    getUnlockedAchievements,
    getLockedAchievements,
    getNextAchievement,
    getProgress,
    refetch: fetchAchievements,
  };
}
