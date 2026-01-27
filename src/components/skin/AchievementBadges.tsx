import { Trophy, Lock, Sparkles } from 'lucide-react';
import { useAchievements, Achievement } from '@/hooks/useAchievements';
import { useStreaks } from '@/hooks/useStreaks';
import { Progress } from '@/components/ui/progress';
import { useEffect } from 'react';

function AchievementCard({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  return (
    <div
      className={`relative p-4 rounded-xl border-2 transition-all ${
        unlocked
          ? 'bg-gradient-to-br ' + achievement.color + '/20 border-primary/30'
          : 'bg-muted/20 border-muted/30 opacity-60'
      }`}
    >
      {/* Badge Icon */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
            unlocked
              ? 'bg-gradient-to-br ' + achievement.color + ' shadow-lg'
              : 'bg-muted/50'
          }`}
        >
          {unlocked ? achievement.emoji : <Lock className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
            {achievement.title}
          </h4>
          <p className="text-xs text-muted-foreground">{achievement.requiredStreak} day streak</p>
        </div>
      </div>
      
      {/* Description */}
      <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
      
      {/* Reward */}
      {unlocked && achievement.reward && (
        <div className="flex items-center gap-1.5 text-xs text-primary">
          <Sparkles className="w-3 h-3" />
          <span>{achievement.reward}</span>
        </div>
      )}
      
      {/* Unlocked Badge */}
      {unlocked && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}

export function AchievementBadges() {
  const { stats } = useStreaks();
  const {
    achievements,
    unlockedIds,
    loading,
    checkAndUnlock,
    getNextAchievement,
    getProgress,
  } = useAchievements();

  // Check for new achievements when streak changes
  useEffect(() => {
    if (stats.currentStreak > 0) {
      checkAndUnlock(stats.currentStreak);
    }
  }, [stats.currentStreak, checkAndUnlock]);

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const nextAchievement = getNextAchievement(stats.currentStreak);
  const progress = getProgress(stats.currentStreak);
  const unlockedCount = unlockedIds.length;

  return (
    <div className="space-y-4">
      {/* Progress to Next */}
      {nextAchievement && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{nextAchievement.emoji}</span>
              <div>
                <p className="text-sm font-medium">Next: {nextAchievement.title}</p>
                <p className="text-xs text-muted-foreground">
                  {nextAchievement.requiredStreak - stats.currentStreak} days to go
                </p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Stats */}
      <div className="glass-card p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="text-2xl font-bold">{unlockedCount}</span>
          <span className="text-muted-foreground">/ {achievements.length}</span>
        </div>
        <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
      </div>

      {/* All Achievements */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Streak Milestones
        </h3>
        
        <div className="grid gap-3">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              unlocked={unlockedIds.includes(achievement.id)}
            />
          ))}
        </div>
      </div>

      {/* Completion Message */}
      {unlockedCount === achievements.length && (
        <div className="glass-card p-4 text-center bg-gradient-to-r from-primary/20 to-secondary/20">
          <p className="text-lg font-semibold">👑 You've unlocked all achievements!</p>
          <p className="text-sm text-muted-foreground">You are a true skincare legend.</p>
        </div>
      )}
    </div>
  );
}
