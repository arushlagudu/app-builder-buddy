import { ScanFace, Crown } from 'lucide-react';

interface FirstScanRequiredProps {
  onGoToScan: () => void;
  featureName: string;
  description: string;
  isPremiumFeature?: boolean;
}

export function FirstScanRequired({ onGoToScan, featureName, description, isPremiumFeature = false }: FirstScanRequiredProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
        isPremiumFeature ? 'bg-secondary/20' : 'bg-primary/20'
      }`}>
        {isPremiumFeature ? (
          <Crown className="w-10 h-10 text-secondary" />
        ) : (
          <ScanFace className="w-10 h-10 text-primary" />
        )}
      </div>
      
      <h2 className="text-xl font-semibold text-center mb-2">
        {isPremiumFeature ? 'Premium Feature' : 'Complete Your First Scan'}
      </h2>
      
      <p className="text-muted-foreground text-center mb-2 max-w-sm">
        {isPremiumFeature ? (
          <>Unlock <span className="text-secondary font-medium">{featureName}</span> with Premium to access this feature.</>
        ) : (
          <>To unlock <span className="text-foreground font-medium">{featureName}</span>, you need to complete your first skin analysis.</>
        )}
      </p>
      
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        {description}
      </p>
      
      <button
        onClick={onGoToScan}
        className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 btn-shine ${
          isPremiumFeature 
            ? 'bg-gradient-to-r from-secondary to-primary text-primary-foreground' 
            : 'bg-gradient-to-r from-primary to-secondary text-primary-foreground'
        }`}
      >
        {isPremiumFeature ? (
          <>
            <Crown className="w-5 h-5" />
            Upgrade to Premium
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
