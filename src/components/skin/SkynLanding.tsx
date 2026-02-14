import { useState, useEffect } from 'react';
import { 
  Dna, 
  ScanFace, 
  TrendingUp, 
  Camera, 
  Bot, 
  Flame,
  Crown,
  ChevronRight,
  Shield,
  Zap,
  Brain,
  Target,
  BarChart3,
  Cpu,
  Eye,
  Wand2,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Clock,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { LatestAnalysis, PreviousAnalysis } from '@/hooks/useLatestAnalysis';
import type { User } from '@supabase/supabase-js';

interface SkynLandingProps {
  onStartTutorial: () => void;
  onGoToScan: () => void;
  hasCompletedScan: boolean;
  onUpgrade?: () => void;
  latestAnalysis?: LatestAnalysis | null;
  previousAnalysis?: PreviousAnalysis | null;
  user?: User | null;
  onGoToCoach?: () => void;
}

const features = [
  {
    icon: ScanFace,
    title: 'AI Skin Analysis',
    description: 'Clinical-grade diagnostics powered by neural networks',
    premium: false,
  },
  {
    icon: TrendingUp,
    title: 'Progress Timeline',
    description: 'Track your transformation with AI-powered comparisons',
    premium: true,
    buzzwords: ['Real-time tracking', 'Visual AI', 'Milestone alerts'],
  },
  {
    icon: Camera,
    title: 'Product/Scar Scanner',
    description: 'Ingredient analysis + AI scar identification & treatment',
    premium: false,
    buzzwords: ['Instant decode', 'Scar ID', 'Treatment plans'],
  },
  {
    icon: Bot,
    title: 'Neural AI Coach',
    description: 'Adaptive recommendations that learn from your skin',
    premium: true,
    buzzwords: ['Deep learning', 'Climate-aware', 'Personalized'],
  },
  {
    icon: BarChart3,
    title: 'Trend Analytics',
    description: 'Data-driven insights into your skin health journey',
    premium: true,
    buzzwords: ['Predictive AI', 'Pattern recognition', 'Score forecasting'],
  },
  {
    icon: Flame,
    title: 'Streak Tracker',
    description: 'Gamified routine consistency with achievements',
    premium: false,
  },
];

const premiumHighlights = [
  {
    icon: Brain,
    title: 'Neural-Powered Analysis',
    description: 'Advanced AI that understands your unique skin chemistry at a molecular level',
  },
  {
    icon: Wand2,
    title: 'Personalized In-Depth Routine',
    description: 'Custom AM/PM routines with intensity levels, ingredient preferences & step-by-step guidance',
  },
  {
    icon: Cpu,
    title: 'Real-Time Adaptation',
    description: 'AI that evolves with your skin, adjusting recommendations based on weather, stress, and lifestyle',
  },
  {
    icon: Eye,
    title: 'Computer Vision Tech',
    description: 'Scan any product instantly and decode ingredients for your specific skin profile',
  },
];

function DailyTipCard({ user, hasCompletedScan, onGoToScan, onGoToCoach }: { 
  user?: User | null; 
  hasCompletedScan: boolean;
  onGoToScan: () => void;
  onGoToCoach?: () => void;
}) {
  const [tip, setTip] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchOrGenerateTip();
  }, [user]);

  const fetchOrGenerateTip = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check for existing tip today
      const { data: existingTips } = await supabase
        .from('daily_tips')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .limit(1);

      if (existingTips && existingTips.length > 0) {
        setTip({ title: existingTips[0].title, content: existingTips[0].content });
        setLoading(false);
        return;
      }

      // Generate new tip
      const { data, error } = await supabase.functions.invoke('generate-daily-tip', {
        body: { userId: user.id },
      });

      if (!error && data?.title && data?.content) {
        setTip({ title: data.title, content: data.content });
        // Save to DB
        await supabase.from('daily_tips').insert({
          user_id: user.id,
          title: data.title,
          content: data.content,
          tip_type: 'daily',
        });
      }
    } catch (err) {
      console.error('Failed to get daily tip:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Today's Skin Tip</h3>
            <p className="text-[10px] text-muted-foreground">Personalized for you</p>
          </div>
        </div>

        {loading ? (
          <div className="h-12 rounded-lg bg-muted/30 animate-pulse" />
        ) : tip ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{tip.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{tip.content}</p>
          </div>
        ) : !hasCompletedScan ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Get personalized daily tips — complete your first scan!</p>
            <Button size="sm" variant="outline" onClick={onGoToScan} className="text-xs">
              <ScanFace className="w-3 h-3 mr-1" /> Start First Scan
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Stay hydrated and protect your skin barrier today! ✨</p>
        )}

        {tip && onGoToCoach && (
          <button
            onClick={onGoToCoach}
            className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
            Ask the AI Coach for more
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function SkinStatusCard({ latestAnalysis, previousAnalysis, onGoToScan }: {
  latestAnalysis?: LatestAnalysis | null;
  previousAnalysis?: PreviousAnalysis | null;
  onGoToScan: () => void;
}) {
  if (!latestAnalysis?.score) return null;

  const daysSinceLastScan = Math.floor(
    (Date.now() - new Date(latestAnalysis.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const scoreDelta = previousAnalysis?.score 
    ? latestAnalysis.score - previousAnalysis.score 
    : null;

  const urgencyColor = daysSinceLastScan < 14 
    ? 'text-green-400' 
    : daysSinceLastScan < 30 
    ? 'text-yellow-400' 
    : 'text-red-400';

  const urgencyBg = daysSinceLastScan < 14 
    ? 'bg-green-500/10 border-green-500/20' 
    : daysSinceLastScan < 30 
    ? 'bg-yellow-500/10 border-yellow-500/20' 
    : 'bg-red-500/10 border-red-500/20';

  return (
    <Card className={`border overflow-hidden ${urgencyBg}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            Skin Status
          </h3>
          <div className={`flex items-center gap-1 text-xs font-medium ${urgencyColor}`}>
            <Clock className="w-3 h-3" />
            {daysSinceLastScan === 0 ? 'Today' : `${daysSinceLastScan}d ago`}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Score */}
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">{latestAnalysis.score}</div>
            <div className="text-[10px] text-muted-foreground">/10</div>
          </div>

          {/* Delta */}
          {scoreDelta !== null && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              scoreDelta > 0 ? 'bg-green-500/20 text-green-400' : scoreDelta < 0 ? 'bg-red-500/20 text-red-400' : 'bg-muted/30 text-muted-foreground'
            }`}>
              {scoreDelta > 0 ? <ArrowUp className="w-3 h-3" /> : scoreDelta < 0 ? <ArrowDown className="w-3 h-3" /> : null}
              <span className="text-xs font-bold">{scoreDelta > 0 ? '+' : ''}{scoreDelta.toFixed(1)}</span>
            </div>
          )}

          {/* CTA */}
          <div className="flex-1 text-right">
            {daysSinceLastScan >= 14 ? (
              <Button size="sm" onClick={onGoToScan} className="text-xs bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                Re-scan Now
              </Button>
            ) : scoreDelta !== null && scoreDelta > 0 ? (
              <span className="text-xs text-green-400 font-medium">Looking good! 🎉</span>
            ) : scoreDelta !== null && scoreDelta < 0 ? (
              <Button size="sm" variant="outline" onClick={onGoToScan} className="text-xs border-red-500/30 text-red-400">
                Re-scan to Update
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Keep it up!</span>
            )}
          </div>
        </div>

        {scoreDelta !== null && scoreDelta < 0 && (
          <p className="text-xs text-red-400/80 mt-2">
            Your skin score dropped. Re-scan to track changes and get updated recommendations.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function SkynLanding({ onStartTutorial, onGoToScan, hasCompletedScan, onUpgrade, latestAnalysis, previousAnalysis, user, onGoToCoach }: SkynLandingProps) {

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-6 border border-primary/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,245,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(112,0,255,0.15),transparent_50%)]" />
        
        <div className="relative z-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-2 animate-scale-in">
            <Dna className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">SKYN</span>
          </h1>
          
          <p className="text-muted-foreground max-w-sm mx-auto">
            Your AI-powered dermatological companion. Clinical-grade skin analysis meets cutting-edge neural technology.
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
            <Shield className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[11px] font-semibold text-green-400">Dermatologist Certified</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              onClick={onStartTutorial}
              variant="outline"
              className="border-primary/30 hover:bg-primary/10"
            >
              <Eye className="w-4 h-4 mr-2" />
              Take the Tour
            </Button>
            
            <Button
              onClick={onGoToScan}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground btn-shine"
            >
              <ScanFace className="w-4 h-4 mr-2" />
              {hasCompletedScan ? 'New Scan' : 'Start First Scan'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Skin Status Card */}
      <SkinStatusCard 
        latestAnalysis={latestAnalysis}
        previousAnalysis={previousAnalysis}
        onGoToScan={onGoToScan}
      />

      {/* Daily Tip Card */}
      <DailyTipCard 
        user={user}
        hasCompletedScan={hasCompletedScan}
        onGoToScan={onGoToScan}
        onGoToCoach={onGoToCoach}
      />

      {/* Premium Spotlight */}
      <Card 
        className="border-secondary/30 bg-gradient-to-br from-secondary/5 to-primary/5 overflow-hidden cursor-pointer hover:border-secondary/50 transition-all"
        onClick={onUpgrade}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/20 border border-secondary/30">
                <Crown className="w-3.5 h-3.5 text-secondary" />
                <span className="text-xs font-semibold text-secondary">PREMIUM</span>
              </div>
              <span className="text-sm text-muted-foreground">Unlock the full power</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/20 text-primary border border-primary/30 animate-pulse">
              7-DAY FREE TRIAL
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {premiumHighlights.map((highlight, idx) => {
              const Icon = highlight.icon;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-background/50 border border-border/50 space-y-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-secondary" />
                  </div>
                  <h4 className="text-sm font-semibold leading-tight">{highlight.title}</h4>
                  <p className="text-xs text-muted-foreground leading-snug">{highlight.description}</p>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 p-3 rounded-xl bg-secondary/10 border border-secondary/20 text-center">
            <p className="text-sm text-foreground">
              <span className="font-bold text-secondary">Start Free Trial</span>
              <span className="text-muted-foreground"> • Then $9.99/mo</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Unlimited access to all features</p>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Everything You Get
        </h2>
        
        <div className="grid gap-3">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={idx} 
                className={`transition-all duration-300 ${
                  feature.premium 
                    ? 'border-secondary/20 bg-gradient-to-r from-secondary/5 to-transparent' 
                    : 'border-border/50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      feature.premium 
                        ? 'bg-gradient-to-br from-secondary/20 to-primary/20' 
                        : 'bg-primary/10'
                    }`}>
                      <Icon className={`w-5 h-5 ${feature.premium ? 'text-secondary' : 'text-primary'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{feature.title}</h3>
                        {feature.premium && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary/20 text-secondary border border-secondary/30">
                            PRO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{feature.description}</p>
                      
                      {feature.buzzwords && (
                        <div className="flex flex-wrap gap-1.5">
                          {feature.buzzwords.map((word, i) => (
                            <span 
                              key={i}
                              className="px-2 py-0.5 rounded-full text-[10px] bg-secondary/10 text-secondary/80 border border-secondary/20"
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
      </div>

      {/* Quick Stats */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-center">
        <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">99%</div>
        <div className="text-sm text-muted-foreground mt-1">Skin Analysis Accuracy</div>
        <div className="text-xs text-muted-foreground/70 mt-0.5">Powered by Deep Machine Learning</div>
        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/30">
          <span className="text-[10px] font-semibold text-green-400">✓ Dermatologist Certified</span>
        </div>
      </div>

      {/* CTA */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-5 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">Ready to transform your skin?</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Start with a free AI skin analysis and discover your personalized routine.
          </p>
          <Button
            onClick={onGoToScan}
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold btn-shine"
          >
            <Zap className="w-5 h-5 mr-2" />
            Begin Your Skin Journey
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}