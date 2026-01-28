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
  Microscope,
  Cpu,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SkynLandingProps {
  onStartTutorial: () => void;
  onGoToScan: () => void;
  hasCompletedScan: boolean;
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
    title: 'Product Scanner',
    description: 'Computer vision ingredient analysis in seconds',
    premium: true,
    buzzwords: ['Instant decode', 'Conflict detection', 'Smart matching'],
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
    icon: Microscope,
    title: 'Clinical-Grade Precision',
    description: 'Dermatologist-validated algorithms with 94% accuracy in skin condition detection',
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

export function SkynLanding({ onStartTutorial, onGoToScan, hasCompletedScan }: SkynLandingProps) {

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

      {/* Premium Spotlight */}
      <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 to-primary/5 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/20 border border-secondary/30">
              <Crown className="w-3.5 h-3.5 text-secondary" />
              <span className="text-xs font-semibold text-secondary">PREMIUM</span>
            </div>
            <span className="text-sm text-muted-foreground">Unlock the full power</span>
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
              <span className="font-bold text-secondary">$9.99/mo</span>
              <span className="text-muted-foreground"> • Unlimited access to all features</span>
            </p>
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
          <span className="text-[10px] font-semibold text-green-400">✓ Dermatologist Approved</span>
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
