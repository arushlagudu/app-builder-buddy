import { useState, useEffect } from 'react';
import { Bot, Sun, Cloud, Wind, Droplet, Check, RefreshCw, Bell, TrendingUp, TrendingDown, Brain, Crown, MessageCircle, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAICoachUsage } from '@/hooks/useAICoachUsage';
import { toast } from 'sonner';
import { MonthlyScanReminder } from './MonthlyScanReminder';

interface DailyTip {
  id: string;
  tip_type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface AISkinCoachProps {
  skinType?: string;
  concerns?: string[];
  climate?: string;
  score?: number | null;
  previousScore?: number | null;
  problems?: { title: string; description: string }[] | null;
  avoidIngredients?: { name: string; reason: string }[] | null;
  prescriptionIngredients?: { name: string; reason: string }[] | null;
  lastScanDate?: string;
  onUpgrade?: () => void;
}

export function AISkinCoach({ skinType, concerns, climate, score, previousScore, problems, avoidIngredients, prescriptionIngredients, lastScanDate, onUpgrade }: AISkinCoachProps) {
  const { user } = useAuth();
  const { questionsRemaining, canAsk, incrementUsage, dailyLimit, isPremium } = useAICoachUsage();
  const [tips, setTips] = useState<DailyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTips();
    }
  }, [user]);

  const fetchTips = async () => {
    if (!user) return;
    
    try {
      // Get today's tips
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('daily_tips')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTips(data || []);

      // Generate tips if none for today (auto-generate doesn't count towards limit)
      if (!data || data.length === 0) {
        await generateDailyTips(true);
      }
    } catch (error) {
      console.error('Failed to fetch tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDailyTips = async (isAutoGenerate = false) => {
    if (!user) return;

    // Check if user can ask (only for manual refresh)
    if (!isAutoGenerate && !canAsk) {
      toast.error('Daily limit reached', {
        description: 'Upgrade to Premium for unlimited AI coaching',
      });
      return;
    }
    
    setGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-tips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          userId: user.id,
          skinType: skinType || 'normal',
          concerns: concerns || [],
          climate: climate || 'temperate',
          score: score,
          problems: problems || [],
          avoidIngredients: avoidIngredients || [],
          prescriptionIngredients: prescriptionIngredients || [],
        }),
      });

      if (!response.ok) throw new Error('Failed to generate tips');

      const newTips = await response.json();

      // Save tips to database
      const { data, error } = await supabase
        .from('daily_tips')
        .insert(
          newTips.map((tip: { type: string; title: string; content: string }) => ({
            user_id: user.id,
            tip_type: tip.type,
            title: tip.title,
            content: tip.content,
          }))
        )
        .select();

      if (error) throw error;
      setTips(data || []);

      // Increment usage for manual refreshes only
      if (!isAutoGenerate) {
        await incrementUsage();
      }

      toast.success('Fresh tips generated!');
    } catch (error) {
      console.error('Failed to generate tips:', error);
      toast.error('Failed to generate tips');
    } finally {
      setGenerating(false);
    }
  };

  const markAsRead = async (tipId: string) => {
    try {
      await supabase
        .from('daily_tips')
        .update({ is_read: true })
        .eq('id', tipId);

      setTips(tips.map(t => t.id === tipId ? { ...t, is_read: true } : t));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getTipIcon = (type: string) => {
    switch (type) {
      case 'weather': return Sun;
      case 'routine': return Droplet;
      case 'product': return Star;
      default: return Bell;
    }
  };

  const getTipColor = (type: string) => {
    switch (type) {
      case 'weather': return 'text-yellow-400 bg-yellow-400/20';
      case 'routine': return 'text-primary bg-primary/20';
      case 'product': return 'text-secondary bg-secondary/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (!user) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground">Sign in to get personalized skin tips</p>
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

  // Calculate progress insight
  const getProgressInsight = () => {
    if (score === null || score === undefined || previousScore === null || previousScore === undefined) return null;
    const delta = score - previousScore;
    if (delta >= 2) {
      return { type: 'improved', message: 'Your skin is showing great improvement! Keep up the excellent work.', icon: TrendingUp, color: 'text-green-400 bg-green-400/20' };
    } else if (delta > 0) {
      return { type: 'slight-improvement', message: 'Your skin is on the right track. Stay consistent!', icon: TrendingUp, color: 'text-emerald-400 bg-emerald-400/20' };
    } else if (delta <= -2) {
      return { type: 'declined', message: 'Your skin needs extra attention. Follow the tips carefully.', icon: TrendingDown, color: 'text-amber-400 bg-amber-400/20' };
    } else if (delta < 0) {
      return { type: 'slight-decline', message: 'Minor fluctuation detected. Stay consistent with your routine.', icon: TrendingDown, color: 'text-yellow-400 bg-yellow-400/20' };
    }
    return { type: 'stable', message: 'Your skin health is stable. Keep maintaining your routine.', icon: Brain, color: 'text-primary bg-primary/20' };
  };

  const progressInsight = getProgressInsight();

  return (
    <div className="space-y-4">
      {/* Monthly Scan Reminder */}
      <MonthlyScanReminder lastScanDate={lastScanDate} />

      {/* Usage Banner for Free Users */}
      {!isPremium && (
        <div className="glass-card p-4 border border-secondary/30 bg-gradient-to-br from-secondary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {questionsRemaining > 0 ? (
                    <><span className="text-secondary">{questionsRemaining}</span> of {dailyLimit} free tips remaining today</>
                  ) : (
                    <span className="text-amber-400">Daily limit reached</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {questionsRemaining > 0 ? 'Resets at midnight' : 'Upgrade for unlimited access'}
                </p>
              </div>
            </div>
            <button
              onClick={onUpgrade}
              className="px-3 py-1.5 rounded-lg bg-secondary/20 text-secondary text-xs font-medium hover:bg-secondary/30 transition-colors flex items-center gap-1"
            >
              <Crown className="w-3 h-3" />
              Unlimited
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="font-medium">AI Skin Coach</h3>
            {isPremium && (
              <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-xs font-medium flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Premium
              </span>
            )}
          </div>
          <button
            onClick={() => generateDailyTips(false)}
            disabled={generating || (!isPremium && !canAsk)}
            className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canAsk && !isPremium ? 'Daily limit reached' : 'Generate new tips'}
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Personalized daily tips based on your skin profile
        </p>

        {/* Progress Insight */}
        {progressInsight && (
          <div className={`mt-3 p-3 rounded-xl flex items-center gap-3 ${progressInsight.color.split(' ')[1]}`}>
            <progressInsight.icon className={`w-5 h-5 ${progressInsight.color.split(' ')[0]}`} />
            <p className="text-xs font-medium">{progressInsight.message}</p>
          </div>
        )}
      </div>

      {/* Tips List */}
      {tips.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No tips yet</p>
          <button
            onClick={() => generateDailyTips(false)}
            disabled={generating || (!isPremium && !canAsk)}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            Generate Today's Tips
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tips.map((tip) => {
            const Icon = getTipIcon(tip.tip_type);
            const colorClass = getTipColor(tip.tip_type);

            return (
              <div
                key={tip.id}
                className={`glass-card p-4 transition-all ${tip.is_read ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{tip.title}</h4>
                      {!tip.is_read && (
                        <button
                          onClick={() => markAsRead(tip.id)}
                          className="p-1 rounded-lg hover:bg-muted"
                        >
                          <Check className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{tip.content}</p>
                    <p className="text-xs text-muted-foreground/50 mt-2 capitalize">
                      {tip.tip_type} tip
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Tips */}
      <div className="glass-card p-4">
        <h4 className="font-medium text-sm mb-3">Today's Conditions</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <Sun className="w-5 h-5 mx-auto text-yellow-400 mb-1" />
            <p className="text-xs text-muted-foreground">UV Index</p>
            <p className="text-sm font-medium">Moderate</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <Droplet className="w-5 h-5 mx-auto text-blue-400 mb-1" />
            <p className="text-xs text-muted-foreground">Humidity</p>
            <p className="text-sm font-medium">45%</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <Wind className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
            <p className="text-xs text-muted-foreground">Air Quality</p>
            <p className="text-sm font-medium">Good</p>
          </div>
        </div>
      </div>
    </div>
  );
}
