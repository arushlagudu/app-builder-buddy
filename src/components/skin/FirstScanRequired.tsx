import { ScanFace, Crown, TrendingUp, Package, Bot, Clock, Zap, Shield, Target, BarChart3 } from 'lucide-react';

interface FeatureHighlight {
  icon: React.ReactNode;
  text: string;
}

interface FirstScanRequiredProps {
  onGoToScan: () => void;
  featureName: string;
  description: string;
  isPremiumFeature?: boolean;
  highlights?: FeatureHighlight[];
}

const defaultHighlights: Record<string, FeatureHighlight[]> = {
  'Progress Timeline': [
    { icon: <TrendingUp className="w-4 h-4" />, text: 'Visual before/after comparisons' },
    { icon: <BarChart3 className="w-4 h-4" />, text: 'AI-powered progress tracking' },
    { icon: <Target className="w-4 h-4" />, text: 'Goal-based milestone alerts' },
  ],
  'Product Scanner': [
    { icon: <Shield className="w-4 h-4" />, text: 'Instant ingredient conflict detection' },
    { icon: <Zap className="w-4 h-4" />, text: 'Real-time compatibility scoring' },
    { icon: <Target className="w-4 h-4" />, text: 'Personalized product recommendations' },
  ],
  'AI Skin Coach': [
    { icon: <Bot className="w-4 h-4" />, text: 'Neural-powered daily insights' },
    { icon: <Zap className="w-4 h-4" />, text: 'Adaptive real-time recommendations' },
    { icon: <Target className="w-4 h-4" />, text: 'Climate-aware routine optimization' },
  ],
  'Analysis History': [
    { icon: <Clock className="w-4 h-4" />, text: 'Unlimited scan archive access' },
    { icon: <BarChart3 className="w-4 h-4" />, text: 'Long-term trend visualization' },
    { icon: <Target className="w-4 h-4" />, text: 'Data-driven skin insights' },
  ],
};

const featureTaglines: Record<string, string> = {
  'Progress Timeline': 'Watch your skin transform with clinical-grade tracking',
  'Product Scanner': 'Never buy the wrong product again',
  'AI Skin Coach': 'Your personal dermatologist, powered by AI',
  'Analysis History': 'Your complete skin journey, always accessible',
};

export function FirstScanRequired({ onGoToScan, featureName, description, isPremiumFeature = false, highlights }: FirstScanRequiredProps) {
  const featureHighlights = highlights || defaultHighlights[featureName] || [];
  const tagline = featureTaglines[featureName] || '';

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
        isPremiumFeature ? 'bg-gradient-to-br from-secondary/30 to-primary/30 ring-2 ring-secondary/50' : 'bg-primary/20'
      }`}>
        {isPremiumFeature ? (
          <Crown className="w-10 h-10 text-secondary" />
        ) : (
          <ScanFace className="w-10 h-10 text-primary" />
        )}
      </div>
      
      <h2 className="text-xl font-bold text-center mb-1">
        {isPremiumFeature ? featureName : 'Complete Your First Scan'}
      </h2>

      {isPremiumFeature && tagline && (
        <p className="text-secondary font-medium text-center text-sm mb-4">
          {tagline}
        </p>
      )}
      
      <p className="text-muted-foreground text-center mb-6 max-w-sm text-sm">
        {isPremiumFeature ? (
          description
        ) : (
          <>To unlock <span className="text-foreground font-medium">{featureName}</span>, complete your first skin analysis.</>
        )}
      </p>

      {/* Feature Highlights for Premium */}
      {isPremiumFeature && featureHighlights.length > 0 && (
        <div className="w-full max-w-sm mb-6 space-y-2">
          {featureHighlights.map((highlight, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-muted"
            >
              <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
                {highlight.icon}
              </div>
              <span className="text-sm text-foreground">{highlight.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Premium Badge */}
      {isPremiumFeature && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30">
          <Crown className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium text-secondary">Premium Feature • $9.99/mo</span>
        </div>
      )}
      
      <button
        onClick={onGoToScan}
        className={`px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 btn-shine shadow-lg ${
          isPremiumFeature 
            ? 'bg-gradient-to-r from-secondary via-primary to-secondary bg-[length:200%_100%] text-primary-foreground hover:bg-right transition-all duration-500' 
            : 'bg-gradient-to-r from-primary to-secondary text-primary-foreground'
        }`}
      >
        {isPremiumFeature ? (
          <>
            <Zap className="w-5 h-5" />
            Unlock {featureName}
          </>
        ) : (
          <>
            <ScanFace className="w-5 h-5" />
            Start Your First Scan
          </>
        )}
      </button>
    </div>
  );
}
