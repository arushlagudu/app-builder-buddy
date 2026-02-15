import { useState, useRef } from 'react';
import { Camera, X, Scan, Loader2, Info, RefreshCw, AlertCircle, Crosshair, Leaf, ShoppingBag, Clock, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

interface ScarResult {
  scarName: string;
  scarType: string;
  severity: number;
  possibleCauses: string[];
  naturalRemedies: { name: string; howToUse: string; effectiveness: string }[];
  productRecommendations: { name: string; reason: string; keyIngredient: string }[];
  removalTimeline: string;
  preventionTips: string[];
  detailedAnalysis: string;
}

export function ScarScanner() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScarResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['causes', 'natural', 'products']));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analyzeScar = async () => {
    if (!image || !user) return;

    // Check free user limit
    if (!isPremium) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('scar_scans_used')
        .eq('user_id', user.id)
        .single();

      if (sub && (sub as any).scar_scans_used >= 1) {
        toast.error('Free users get 1 scar scan. Upgrade to Premium for unlimited scans.');
        return;
      }
    }

    setIsScanning(true);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-scar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ image }),
      });

      if (!response.ok) throw new Error('Failed to analyze');

      const data = await response.json();
      setResult(data);

      // Save to DB
      await supabase.from('scar_scans').insert({
        user_id: user.id,
        scar_type: data.scarType,
        scar_name: data.scarName,
        severity: String(data.severity),
        possible_causes: data.possibleCauses,
        natural_remedies: data.naturalRemedies,
        product_recommendations: data.productRecommendations,
        removal_timeline: data.removalTimeline,
        prevention_tips: data.preventionTips,
        detailed_analysis: data.detailedAnalysis,
      });

      // Increment scar scan count for free users
      if (!isPremium) {
        const { data: currentSub } = await supabase
          .from('subscriptions')
          .select('scar_scans_used')
          .eq('user_id', user.id)
          .single();
        
        if (currentSub) {
          await supabase
            .from('subscriptions')
            .update({ scar_scans_used: ((currentSub as any).scar_scans_used || 0) + 1 } as any)
            .eq('user_id', user.id);
        }
      }

      toast.success('Scar analysis complete!');
    } catch (error) {
      console.error('Scar scan error:', error);
      toast.error('Failed to analyze. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const clearScan = () => {
    setImage(null);
    setResult(null);
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'text-green-400';
    if (severity <= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEffectivenessColor = (eff: string) => {
    if (eff === 'high') return 'bg-green-500/20 text-green-400';
    if (eff === 'medium') return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-blue-500/20 text-blue-400';
  };

  return (
    <div className="space-y-4">
      {/* Free user scan limit banner */}
      {!isPremium && (
        <div className="glass-card p-3 border border-secondary/30 bg-gradient-to-r from-secondary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-foreground">
                {(() => {
                  // We don't have scar_scans_used here directly, so show generic message
                  return '1 free scar scan included';
                })()}
              </span>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-secondary/20 text-secondary font-medium">
              Upgrade for unlimited
            </span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="glass-card p-3 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">How to scan scars/marks:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Take a close-up, well-lit photo of the scar or mark</li>
              <li>Keep the camera steady and focused on the area</li>
              <li>Include only the affected area, not your whole face</li>
              <li>Works for scars, acne marks, cuts, blemishes, or any skin concern</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Crosshair className="w-5 h-5 text-secondary" />
          <h3 className="font-medium">Scar Scanner</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Zoom in on any scar, mark, or skin concern for AI-powered identification and treatment plan
        </p>

        {!image ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-3 hover:border-secondary/50 transition-colors"
          >
            <Camera className="w-10 h-10 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">Tap to scan scar or mark</span>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <img src={image} alt="Scar" className="w-full h-full object-cover" />
              {isScanning && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-secondary animate-spin mx-auto mb-2" />
                    <p className="text-sm text-secondary">Analyzing scar...</p>
                  </div>
                </div>
              )}
              {!isScanning && !result && (
                <button onClick={clearScan} className="absolute top-2 right-2 p-2 rounded-full bg-muted/80">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {!result && !isScanning && (
              <button
                onClick={analyzeScar}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-secondary to-primary text-primary-foreground font-medium flex items-center justify-center gap-2 btn-shine"
              >
                <Scan className="w-5 h-5" />
                Analyze Scar
              </button>
            )}
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageCapture} className="hidden" />
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Identification */}
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Identified As</p>
            <p className="text-2xl font-bold">{result.scarName}</p>
            <p className="text-sm text-muted-foreground mt-1">{result.scarType}</p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Severity</p>
                <p className={`text-3xl font-bold ${getSeverityColor(result.severity)}`}>{result.severity}/10</p>
              </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">{result.detailedAnalysis}</p>
          </div>

          {/* Possible Causes */}
          <div className="glass-card overflow-hidden">
            <button onClick={() => toggleSection('causes')} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <h4 className="font-medium text-sm">Possible Causes</h4>
              </div>
              {expandedSections.has('causes') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.has('causes') && (
              <div className="px-4 pb-4 space-y-2">
                {result.possibleCauses.map((cause, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    <span>{cause}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Natural Remedies */}
          <div className="glass-card overflow-hidden">
            <button onClick={() => toggleSection('natural')} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-green-400" />
                <h4 className="font-medium text-sm">Natural Remedies</h4>
              </div>
              {expandedSections.has('natural') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.has('natural') && (
              <div className="px-4 pb-4 space-y-3">
                {result.naturalRemedies.map((remedy, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{remedy.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${getEffectivenessColor(remedy.effectiveness)}`}>
                        {remedy.effectiveness}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{remedy.howToUse}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Recommendations */}
          <div className="glass-card overflow-hidden">
            <button onClick={() => toggleSection('products')} className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <h4 className="font-medium text-sm">Product Recommendations</h4>
              </div>
              {expandedSections.has('products') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.has('products') && (
              <div className="px-4 pb-4 space-y-3">
                {result.productRecommendations.map((product, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/30">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{product.reason}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary mt-2 inline-block">
                      {product.keyIngredient}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <h4 className="font-medium text-sm">Expected Timeline</h4>
            </div>
            <p className="text-sm text-muted-foreground">{result.removalTimeline}</p>
          </div>

          {/* Prevention */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-green-400" />
              <h4 className="font-medium text-sm">Prevention Tips</h4>
            </div>
            <ul className="space-y-2">
              {result.preventionTips.map((tip, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <button onClick={clearScan} className="w-full py-3 rounded-xl bg-muted text-foreground font-medium">
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
}
