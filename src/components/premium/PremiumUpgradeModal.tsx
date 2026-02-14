import { useState } from 'react';
import { X, Check, Wand2, TrendingUp, Shield, Zap, Crown, Star, Camera, Bot, BarChart3, History } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { STRIPE_PRICES } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'scan_limit' | 'routine' | 'progress' | 'scanner' | 'coach' | 'analytics' | 'history' | 'first_results';
}

const triggerMessages: Record<string, { title: string; subtitle: string }> = {
  scan_limit: { title: "You've Used All Your Free Scans", subtitle: "Unlock unlimited scans and transform your skin forever" },
  routine: { title: "Unlock Your Custom Routine", subtitle: "Get step-by-step instructions crafted just for YOUR skin" },
  progress: { title: "Track Your Transformation", subtitle: "See your skin improve week by week with visual proof" },
  scanner: { title: "Unlock Full Scanner Access", subtitle: "Scan products for compatibility and scars for AI-powered treatment plans" },
  coach: { title: "Your Personal Skin Expert", subtitle: "Get daily tips adapted to your skin, weather, and lifestyle" },
  analytics: { title: "Understand Your Skin Trends", subtitle: "Data-driven insights that reveal what's really working" },
  history: { title: "Access Your Full History", subtitle: "Review all past analyses and track your complete journey" },
  first_results: { title: "Your Results Are Ready! 🎉", subtitle: "Unlock your full personalized routine and track your progress" },
};

const premiumFeatures = [
  { icon: Zap, title: "Unlimited Skin Scans", description: "Scan anytime, anywhere. No limits.", highlight: true },
  { icon: Wand2, title: "Personalized In-Depth Routine", description: "Custom AM/PM routines with intensity levels & step-by-step guidance" },
  { icon: Camera, title: "Progress Timeline", description: "Before/after comparisons that show real results" },
  { icon: Shield, title: "Product & Scar Scanner", description: "Scan products for compatibility + AI scar identification" },
  { icon: Bot, title: "AI Skin Coach", description: "Neural-powered insights that adapt in real-time to your skin" },
  { icon: BarChart3, title: "Trend Analytics", description: "Charts & insights showing your skin health over time" },
  { icon: History, title: "Full Analysis History", description: "Access all your past scans and track improvements" },
];

export function PremiumUpgradeModal({ isOpen, onClose, trigger = 'scan_limit' }: PremiumUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const message = triggerMessages[trigger] || triggerMessages.scan_limit;
  const plan = STRIPE_PRICES[selectedPlan];

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: plan.price_id },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-b from-background via-background to-primary/5 border border-primary/20 rounded-3xl shadow-[0_0_60px_rgba(0,245,255,0.15)]">
        <button onClick={onClose} className="absolute right-4 top-4 z-50 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Hero */}
        <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="relative mx-auto w-20 h-20 mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl rotate-45 animate-pulse" />
            <div className="absolute inset-1 bg-background rounded-xl rotate-45" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Crown className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h2 className="relative text-2xl font-bold bg-gradient-to-r from-primary via-white to-secondary bg-clip-text text-transparent mb-2">
            {message.title}
          </h2>
          <p className="relative text-muted-foreground text-sm">{message.subtitle}</p>
        </div>

        {/* Plan Toggle */}
        <div className="px-6 pb-4">
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center ${
                selectedPlan === 'monthly'
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 bg-muted/20 hover:border-border'
              }`}
            >
              <div className="text-sm font-medium text-muted-foreground">Monthly</div>
              <div className="text-2xl font-bold text-foreground mt-1">${STRIPE_PRICES.monthly.amount}</div>
              <div className="text-xs text-muted-foreground">/month</div>
            </button>
            <button
              onClick={() => setSelectedPlan('annual')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center relative ${
                selectedPlan === 'annual'
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 bg-muted/20 hover:border-border'
              }`}
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-primary text-[10px] font-bold text-background">
                {STRIPE_PRICES.annual.savings}
              </div>
              <div className="text-sm font-medium text-muted-foreground">Annual</div>
              <div className="text-2xl font-bold text-foreground mt-1">${STRIPE_PRICES.annual.monthly_equivalent}</div>
              <div className="text-xs text-muted-foreground">/month</div>
              <div className="text-[10px] text-primary mt-1">${STRIPE_PRICES.annual.amount}/year</div>
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 pb-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Everything You Get
          </h3>
          <div className="space-y-3">
            {premiumFeatures.map((feature, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                  feature.highlight ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  feature.highlight ? 'bg-primary text-background' : 'bg-muted'
                }`}>
                  <feature.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
                <Check className={`w-5 h-5 shrink-0 ${feature.highlight ? 'text-primary' : 'text-primary/60'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="sticky bottom-0 px-6 py-6 bg-gradient-to-t from-background via-background to-transparent">
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="relative w-full py-4 rounded-2xl font-bold text-lg overflow-hidden group disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-[gradient_3s_linear_infinite]" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative flex items-center justify-center gap-2 text-background">
              <Crown className="w-5 h-5" />
              {isLoading ? 'Opening Checkout...' : 'Start 7-Day Free Trial'}
            </span>
          </button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            No charge for 7 days • Cancel anytime • Instant access
          </p>
          <button onClick={onClose} className="w-full mt-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Continue with free plan (2 scans/month)
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
