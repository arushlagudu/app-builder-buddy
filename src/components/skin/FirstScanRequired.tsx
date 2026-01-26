import { ScanFace } from 'lucide-react';

interface FirstScanRequiredProps {
  onGoToScan: () => void;
  featureName: string;
  description: string;
}

export function FirstScanRequired({ onGoToScan, featureName, description }: FirstScanRequiredProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
        <ScanFace className="w-10 h-10 text-primary" />
      </div>
      
      <h2 className="text-xl font-semibold text-center mb-2">
        Complete Your First Scan
      </h2>
      
      <p className="text-muted-foreground text-center mb-2 max-w-sm">
        To unlock <span className="text-foreground font-medium">{featureName}</span>, you need to complete your first skin analysis.
      </p>
      
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        {description}
      </p>
      
      <button
        onClick={onGoToScan}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium flex items-center gap-2 btn-shine"
      >
        <ScanFace className="w-5 h-5" />
        Start Your First Scan
      </button>
    </div>
  );
}
