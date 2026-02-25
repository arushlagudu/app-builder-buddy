import { Flame, Sun, Moon, Trophy, Target, Check } from 'lucide-react';
import { useStreaks } from '@/hooks/useStreaks';
import { useAchievements } from '@/hooks/useAchievements';
import { useAuth } from '@/hooks/useAuth';

export function StreakTracker() {
  const { user } = useAuth();
  const { stats, todayStatus, loading, markComplete, getStreakBadge } = useStreaks();
  const { checkAndUnlock } = useAchievements();
  const badge = getStreakBadge();

  if (!user) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground">Sign in to track your streak</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const bothComplete = todayStatus.morning && todayStatus.evening;

  return (
    <div className="space-y-4">
      {/* Main Streak Card */}
      <div className="glass-card p-6 text-center relative overflow-hidden">
        {/* Animated background for active streaks */}
        {stats.currentStreak >= 3 && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 animate-pulse" />
        )}
        
        <div className="relative">
          {/* Streak Number */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <Flame className={`w-8 h-8 ${stats.currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'}`} />
            <span className="text-5xl font-bold text-foreground">{stats.currentStreak}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Day Streak</p>
          
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 ${badge.color}`}>
            <span className="text-lg">{badge.emoji}</span>
            <span className="text-sm font-medium">{badge.label}</span>
          </div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Today's Routine
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Morning Button */}
          <button
            onClick={async () => {
              if (!todayStatus.morning) {
                await markComplete('morning');
                checkAndUnlock(stats.currentStreak);
              }
            }}
            disabled={todayStatus.morning}
            className={`p-4 rounded-xl border-2 transition-all ${
              todayStatus.morning
                ? 'bg-primary/20 border-primary/50'
                : 'bg-muted/30 border-muted hover:border-primary/30 hover:bg-muted/50'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              {todayStatus.morning ? (
                <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
              ) : (
                <Sun className="w-10 h-10 text-yellow-400" />
              )}
              <span className="text-sm font-medium">Morning</span>
              <span className="text-xs text-muted-foreground">
                {todayStatus.morning ? 'Complete!' : 'Tap when done'}
              </span>
            </div>
          </button>

          {/* Evening Button */}
          <button
            onClick={async () => {
              if (!todayStatus.evening) {
                await markComplete('evening');
                checkAndUnlock(stats.currentStreak);
              }
            }}
            disabled={todayStatus.evening}
            className={`p-4 rounded-xl border-2 transition-all ${
              todayStatus.evening
                ? 'bg-secondary/20 border-secondary/50'
                : 'bg-muted/30 border-muted hover:border-secondary/30 hover:bg-muted/50'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              {todayStatus.evening ? (
                <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center">
                  <Check className="w-5 h-5 text-secondary" />
                </div>
              ) : (
                <Moon className="w-10 h-10 text-secondary" />
              )}
              <span className="text-sm font-medium">Evening</span>
              <span className="text-xs text-muted-foreground">
                {todayStatus.evening ? 'Complete!' : 'Tap when done'}
              </span>
            </div>
          </button>
        </div>

        {/* Completion message */}
        {bothComplete && (
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 text-center animate-fade-in">
            <p className="text-sm font-medium">🎉 Perfect day! See you tomorrow!</p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 text-center">
          <Trophy className="w-5 h-5 mx-auto mb-2 text-yellow-400" />
          <p className="text-2xl font-bold">{stats.longestStreak}</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Target className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{stats.totalCompletions}</p>
          <p className="text-xs text-muted-foreground">Total Check-ins</p>
        </div>
      </div>

      {/* Motivation Text */}
      <div className="glass-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          {stats.currentStreak === 0 && "Start your streak by completing today's routine!"}
          {stats.currentStreak >= 1 && stats.currentStreak < 7 && "You're building momentum—keep going!"}
          {stats.currentStreak >= 7 && stats.currentStreak < 14 && "One week strong! 💪 Your skin is thanking you."}
          {stats.currentStreak >= 14 && stats.currentStreak < 30 && "Two weeks of consistency! Real results take time."}
          {stats.currentStreak >= 30 && "30+ days! You've built a lasting habit. 🔥"}
        </p>
      </div>
    </div>
  );
}
