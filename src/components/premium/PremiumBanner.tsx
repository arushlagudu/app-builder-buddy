import { Crown, Zap, Camera, TrendingUp, Sparkles, Package, Clock, ListChecks } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface PremiumBannerProps {
  onUpgrade?: () => void;
}

export function PremiumBanner({ onUpgrade }: PremiumBannerProps) {
  const { isPremium, scansRemaining, getDaysUntilReset } = useSubscription();

  if (isPremium) return null;

  const features = [
    { icon: Camera, text: 'Unlimited scans' },
    { icon: TrendingUp, text: 'Progress tracking' },
    { icon: Sparkles, text: 'AI Skin Coach' },
    { icon: Package, text: 'Product Scanner' },
    { icon: Clock, text: 'Analysis History' },
    { icon: ListChecks, text: 'Personalized Routines' },
    { icon: TrendingUp, text: 'Trend Analytics' },
  ];

  return (
    <div className="glass-card p-4 border border-secondary/30 bg-gradient-to-br from-secondary/10 to-primary/5">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-5 h-5 text-secondary" />
        <span className="font-semibold text-secondary">Upgrade to Premium</span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {scansRemaining > 0 ? (
            <>
              <span className="text-foreground font-medium">{scansRemaining} free scan{scansRemaining !== 1 ? 's' : ''}</span> remaining this month
            </>
          ) : (
            <>No scans remaining. Resets in <span className="text-foreground font-medium">{getDaysUntilReset()} days</span></>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {features.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onUpgrade}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-secondary to-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 btn-shine pulse-glow"
      >
        <Zap className="w-4 h-4" />
        $9.99/month
      </button>
    </div>
  );
}
