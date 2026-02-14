import { useState } from 'react';
import { X, Loader2, DollarSign, Check, Search, ExternalLink, TrendingDown } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Alternative {
  name: string;
  brand: string;
  price: number;
  savings: string;
  matchScore: number;
  keyIngredients: string[];
  whyItsGood: string;
}

interface DupeResult {
  originalProduct: {
    name: string;
    estimatedPrice: number;
    keyIngredients: string[];
  };
  alternatives: Alternative[];
}

interface DupeFinderProps {
  productName: string;
  skinType?: string;
  concerns?: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function DupeFinder({ productName, skinType, concerns, isOpen, onClose }: DupeFinderProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DupeResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const findAlternatives = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/find-alternatives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          productName,
          skinType,
          concerns,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
          return;
        }
        if (response.status === 402) {
          toast.error('AI credits exhausted.');
          return;
        }
        throw new Error('Failed to find alternatives');
      }

      const data = await response.json();
      setResult(data);
      setHasSearched(true);
    } catch (error) {
      console.error('Error finding alternatives:', error);
      toast.error('Failed to find alternatives. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    if (!hasSearched && !loading) {
      findAlternatives();
    }
  };

  // Trigger search when modal opens
  if (isOpen && !hasSearched && !loading && !result) {
    handleOpen();
  }

  const getMatchColor = (score: number) => {
    if (score >= 85) return 'text-green-400 bg-green-400/20';
    if (score >= 70) return 'text-yellow-400 bg-yellow-400/20';
    return 'text-orange-400 bg-orange-400/20';
  };

  const getSearchLink = (product: string) => {
    return `https://www.google.com/search?q=buy+${encodeURIComponent(product)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto p-0 bg-gradient-to-b from-background to-primary/5 border border-primary/20 rounded-3xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-primary/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Cheaper Alternatives</h2>
              <p className="text-sm text-muted-foreground">Budget-friendly dupes for your routine</p>
            </div>
          </div>

          {/* Original Product */}
          <div className="glass-card p-4 mb-6 border-muted">
            <p className="text-xs text-muted-foreground mb-1">Finding alternatives for:</p>
            <p className="font-medium text-sm">{productName}</p>
            {result?.originalProduct && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  ~${result.originalProduct.estimatedPrice}
                </span>
                {result.originalProduct.keyIngredients.slice(0, 3).map((ing, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {ing}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Finding the best dupes...</p>
            </div>
          )}

          {/* Results */}
          {result && result.alternatives && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found <span className="text-foreground font-medium">{result.alternatives.length}</span> affordable alternatives
              </p>

              {result.alternatives.map((alt, index) => (
                <div
                  key={index}
                  className="glass-card p-4 border-green-500/20 bg-gradient-to-r from-green-500/5 to-transparent animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{alt.name}</p>
                      <p className="text-xs text-muted-foreground">{alt.brand}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMatchColor(alt.matchScore)}`}>
                        {alt.matchScore}% match
                      </span>
                      <a
                        href={getSearchLink(alt.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg font-bold text-green-400 flex items-center">
                      <DollarSign className="w-4 h-4" />
                      {alt.price}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                      {alt.savings}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">{alt.whyItsGood}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {alt.keyIngredients.map((ing, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] flex items-center gap-1"
                      >
                        <Check className="w-2.5 h-2.5 text-green-400" />
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-[10px] text-center text-muted-foreground mt-4 px-4">
                💡 Prices are estimates. Always check ingredient lists to ensure compatibility with your skin.
              </p>
            </div>
          )}

          {/* Error/Empty State */}
          {!loading && hasSearched && !result?.alternatives?.length && (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No alternatives found. Try a different product.</p>
              <button
                onClick={findAlternatives}
                className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
