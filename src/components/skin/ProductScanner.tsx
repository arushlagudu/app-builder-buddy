import { useState, useRef } from 'react';
import { Camera, Upload, X, Scan, AlertTriangle, Check, Loader2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ScanResult {
  productName: string;
  brand: string;
  compatibilityScore: number;
  conflicts: { ingredient: string; reason: string; severity: 'high' | 'medium' | 'low' }[];
  recommendations: string[];
  goodIngredients: string[];
}

interface ProductScannerProps {
  skinType?: string;
  concerns?: string[];
}

export function ProductScanner({ skinType, concerns }: ProductScannerProps) {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result as string;
      setImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const analyzeProduct = async () => {
    if (!image) return;

    setIsScanning(true);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          image,
          skinType: skinType || 'normal',
          concerns: concerns || [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze product');
      }

      const data = await response.json();
      setResult(data);

      // Save to history if logged in
      if (user) {
        await supabase.from('scanned_products').insert({
          user_id: user.id,
          product_name: data.productName,
          brand: data.brand,
          compatibility_score: data.compatibilityScore,
          conflicts: data.conflicts,
          recommendations: data.recommendations,
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to analyze product. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const clearScan = () => {
    setImage(null);
    setResult(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Product Scanner</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Scan a product's ingredient list to check compatibility with your skin
        </p>

        {!image ? (
          <div className="space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors"
            >
              <Camera className="w-10 h-10 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground">
                Tap to scan ingredient label
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <img src={image} alt="Product" className="w-full h-full object-cover" />
              
              {isScanning && (
                <div className="absolute inset-0 bg-obsidian/50 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                    <p className="text-sm text-primary">Analyzing ingredients...</p>
                  </div>
                </div>
              )}

              {!isScanning && !result && (
                <button
                  onClick={clearScan}
                  className="absolute top-2 right-2 p-2 rounded-full bg-muted/80"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {!result && !isScanning && (
              <button
                onClick={analyzeProduct}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium flex items-center justify-center gap-2 btn-shine"
              >
                <Scan className="w-5 h-5" />
                Analyze Ingredients
              </button>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageCapture}
          className="hidden"
        />
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Compatibility Score */}
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Compatibility Score</p>
            <p className={`text-5xl font-bold ${getScoreColor(result.compatibilityScore)}`}>
              {result.compatibilityScore}%
            </p>
            <p className="text-lg font-medium mt-2">{result.productName}</p>
            <p className="text-sm text-muted-foreground">{result.brand}</p>
          </div>

          {/* Conflicts */}
          {result.conflicts.length > 0 && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h4 className="font-medium text-sm">Potential Conflicts</h4>
              </div>
              <div className="space-y-2">
                {result.conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getSeverityColor(conflict.severity)}`}
                  >
                    <p className="font-medium text-sm">{conflict.ingredient}</p>
                    <p className="text-xs mt-1 opacity-80">{conflict.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Good Ingredients */}
          {result.goodIngredients.length > 0 && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-green-400" />
                <h4 className="font-medium text-sm">Good for Your Skin</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.goodIngredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="glass-card p-4">
              <h4 className="font-medium text-sm mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Scan Another */}
          <button
            onClick={clearScan}
            className="w-full py-3 rounded-xl bg-muted text-foreground font-medium"
          >
            Scan Another Product
          </button>
        </div>
      )}
    </div>
  );
}
