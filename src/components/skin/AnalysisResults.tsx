import { useState, useMemo } from 'react';
import { Droplet, AlertTriangle, Zap, X, Check, ChevronDown, ChevronUp, Download, ExternalLink, Sparkles, Crown, Lock, Info, DollarSign, TrendingDown, Leaf } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import { RoutineGenerator } from './RoutineGenerator';
import { IngredientGlossary } from './IngredientGlossary';
import { DupeFinder } from './DupeFinder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Problem {
  title: string;
  description: string;
  icon: 'hydration' | 'inflammation' | 'barrier';
}

interface Ingredient {
  name: string;
  reason: string;
}

interface RoutineStep {
  time: 'AM' | 'PM' | 'BOTH';
  step: number;
  product: string;
  productLink?: string;
  reason: string;
  price?: number;
}

interface AnalysisData {
  score: number;
  problems: Problem[];
  deepAnalysis: string;
  avoidIngredients: Ingredient[];
  prescriptionIngredients: Ingredient[];
  naturalRemedies?: Ingredient[];
  routine: RoutineStep[];
}

interface AnalysisResultsProps {
  data: AnalysisData;
  skinType?: string;
  concerns?: string[];
  climate?: string;
  pollution?: string;
  onDownloadReport: () => void;
  isPremium?: boolean;
  onUpgradeClick?: () => void;
}

const iconMap: Record<string, typeof Droplet> = {
  hydration: Droplet,
  inflammation: AlertTriangle,
  barrier: Zap,
};

const getIcon = (iconKey: string) => {
  return iconMap[iconKey] || Zap;
};

export function AnalysisResults({ data, skinType, concerns, climate, pollution, onDownloadReport, isPremium = false, onUpgradeClick }: AnalysisResultsProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showRoutineGenerator, setShowRoutineGenerator] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<{
    name: string;
    reason: string;
    type: 'avoid' | 'prescription';
  } | null>(null);
  const [dupeProduct, setDupeProduct] = useState<string | null>(null);


  const amRoutine = data.routine.filter(s => s.time === 'AM' || s.time === 'BOTH');
  const pmRoutine = data.routine.filter(s => s.time === 'PM' || s.time === 'BOTH');

  // Calculate totals
  const amTotal = useMemo(() => amRoutine.reduce((sum, step) => sum + (step.price || 0), 0), [amRoutine]);
  const pmTotal = useMemo(() => pmRoutine.reduce((sum, step) => sum + (step.price || 0), 0), [pmRoutine]);
  const grandTotal = useMemo(() => {
    const allProducts = new Set([...amRoutine.map(s => s.product), ...pmRoutine.map(s => s.product)]);
    let total = 0;
    allProducts.forEach(product => {
      const step = data.routine.find(s => s.product === product);
      total += step?.price || 0;
    });
    return total;
  }, [data.routine, amRoutine, pmRoutine]);

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Score Section */}
      <div className="glass-card p-6 text-center">
        <h2 className="text-lg font-semibold mb-4">Skin Health Analysis</h2>
        <ScoreGauge score={data.score} />
      </div>

      {/* Core Problems */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Core Problems Identified</h3>
        <div className="grid gap-3">
          {data.problems.map((problem, index) => {
            const Icon = getIcon(problem.icon);
            return (
              <div key={index} className="glass-card p-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{problem.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{problem.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep Analysis Toggle */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
        >
          <span className="font-medium">Deep Analysis (Why?)</span>
          {showAnalysis ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {showAnalysis && (
          <div className="px-4 pb-4 animate-fade-in">
            <p className="text-sm text-muted-foreground leading-relaxed">{data.deepAnalysis}</p>
          </div>
        )}
      </div>

      {/* Ingredient Tabs: Avoid / Prescription / Natural Remedies */}
      <div className="glass-card p-4">
        <Tabs defaultValue="avoid" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="avoid" className="text-xs gap-1 data-[state=active]:text-destructive">
              <X className="w-3 h-3" />
              Avoid
            </TabsTrigger>
            <TabsTrigger value="prescription" className="text-xs gap-1 data-[state=active]:text-primary">
              <Check className="w-3 h-3" />
              Prescription
            </TabsTrigger>
            <TabsTrigger value="natural" className="text-xs gap-1 data-[state=active]:text-green-500">
              <Leaf className="w-3 h-3" />
              Natural
            </TabsTrigger>
          </TabsList>

          {/* Avoid Tab */}
          <TabsContent value="avoid" className="mt-0">
            <p className="text-[10px] text-muted-foreground/60 mb-2 italic">Tap to learn why</p>
            <ul className="space-y-2">
              {data.avoidIngredients.slice(0, 6).map((ingredient, index) => (
                <li key={index}>
                  <button
                    onClick={() => setSelectedIngredient({ ...ingredient, type: 'avoid' })}
                    className="text-xs text-muted-foreground flex items-center gap-2 w-full text-left hover:text-destructive transition-colors group"
                  >
                    <X className="w-3 h-3 text-destructive shrink-0" />
                    <span className="flex-1">{ingredient.name}</span>
                    <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          </TabsContent>

          {/* Prescription Tab */}
          <TabsContent value="prescription" className="mt-0">
            <p className="text-[10px] text-muted-foreground/60 mb-2 italic">Tap to learn why</p>
            <ul className="space-y-2">
              {data.prescriptionIngredients.slice(0, 6).map((ingredient, index) => (
                <li key={index}>
                  <button
                    onClick={() => setSelectedIngredient({ ...ingredient, type: 'prescription' })}
                    className="text-xs text-muted-foreground flex items-center gap-2 w-full text-left hover:text-primary transition-colors group"
                  >
                    <Check className="w-3 h-3 text-primary shrink-0" />
                    <span className="flex-1">{ingredient.name}</span>
                    <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </button>
                </li>
              ))}
            </ul>
          </TabsContent>

          {/* Natural Remedies Tab */}
          <TabsContent value="natural" className="mt-0">
            <p className="text-[10px] text-muted-foreground/60 mb-2 italic">Tap to learn more</p>
            <ul className="space-y-2">
              {(data.naturalRemedies || []).slice(0, 6).map((remedy, index) => (
                <li key={index}>
                  <button
                    onClick={() => setSelectedIngredient({ ...remedy, type: 'prescription' })}
                    className="text-xs text-muted-foreground flex items-center gap-2 w-full text-left hover:text-green-500 transition-colors group"
                  >
                    <Leaf className="w-3 h-3 text-green-500 shrink-0" />
                    <span className="flex-1">{remedy.name}</span>
                    <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-green-500" />
                  </button>
                </li>
              ))}
              {(!data.naturalRemedies || data.naturalRemedies.length === 0) && (
                <li className="text-xs text-muted-foreground italic">
                  Natural remedies will appear after your next scan.
                </li>
              )}
            </ul>
          </TabsContent>
        </Tabs>
      </div>

      {/* Ingredient Glossary */}
      <IngredientGlossary
        ingredient={selectedIngredient}
        open={!!selectedIngredient}
        onClose={() => setSelectedIngredient(null)}
      />

      {/* Routine Section - Premium Only */}
      {isPremium ? (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Personalized Routine</h3>
          <p className="text-xs text-center text-muted-foreground mb-4 italic">
            💡 Tap on each step to see why this product is recommended
          </p>
          
          <div className="space-y-6">
            {/* AM Routine */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                  ☀️ Morning Routine
                </h4>
                {amTotal > 0 && (
                  <span className="text-xs text-primary flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
                    <DollarSign className="w-3 h-3" />
                    ~${amTotal}
                  </span>
                )}
              </div>
              <div className="relative pl-6 border-l-2 border-primary/30 space-y-4">
                {amRoutine.map((step, index) => (
                  <div key={index} className="relative timeline-node">
                    <button
                      onClick={() => setExpandedStep(expandedStep === step.step ? null : step.step)}
                      className="w-full text-left"
                    >
                      <div className="ml-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium flex-1">{step.product}</span>
                          <div className="flex items-center gap-2">
                            {step.price && step.price >= 25 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDupeProduct(step.product);
                                }}
                                className="p-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                title="Find cheaper alternatives"
                              >
                                <TrendingDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {step.price && (
                              <span className="text-xs text-muted-foreground">${step.price}</span>
                            )}
                            {step.productLink && (
                              <a
                                href={step.productLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-primary hover:text-primary/80"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        {expandedStep === step.step && (
                          <p className="text-xs text-muted-foreground mt-2 animate-fade-in bg-muted/30 p-2 rounded-lg">
                            {step.reason}
                          </p>
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* PM Routine */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-secondary flex items-center gap-2">
                  🌙 Evening Routine
                </h4>
                {pmTotal > 0 && (
                  <span className="text-xs text-secondary flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-lg">
                    <DollarSign className="w-3 h-3" />
                    ~${pmTotal}
                  </span>
                )}
              </div>
              <div className="relative pl-6 border-l-2 border-secondary/30 space-y-4">
                {pmRoutine.map((step, index) => (
                  <div key={index} className="relative timeline-node">
                    <button
                      onClick={() => setExpandedStep(expandedStep === step.step + 100 ? null : step.step + 100)}
                      className="w-full text-left"
                    >
                      <div className="ml-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium flex-1">{step.product}</span>
                          <div className="flex items-center gap-2">
                            {step.price && step.price >= 25 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDupeProduct(step.product);
                                }}
                                className="p-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                title="Find cheaper alternatives"
                              >
                                <TrendingDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {step.price && (
                              <span className="text-xs text-muted-foreground">${step.price}</span>
                            )}
                            {step.productLink && (
                              <a
                                href={step.productLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-secondary hover:text-secondary/80"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        {expandedStep === step.step + 100 && (
                          <p className="text-xs text-muted-foreground mt-2 animate-fade-in bg-muted/30 p-2 rounded-lg">
                            {step.reason}
                          </p>
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Cost */}
            {grandTotal > 0 && (
              <div className="glass-card p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Estimated Total Routine Cost</span>
                  <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-primary" />
                    ~${grandTotal}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Some products may be used in both routines</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Premium Upsell for Routine */
        <div className="glass-card p-6 text-center border-secondary/30">
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3">
            <Crown className="w-6 h-6 text-secondary" />
          </div>
          <h3 className="font-semibold mb-2">Personalized Routine</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Unlock your custom AM/PM skincare routine with product recommendations, pricing, and step-by-step guidance.
          </p>
          <button
            onClick={onUpgradeClick}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-secondary to-primary text-primary-foreground font-medium text-sm btn-shine flex items-center gap-2 mx-auto"
          >
            <Crown className="w-4 h-4" />
            Upgrade to Premium
            <Lock className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Make Routine Section - Premium Only */}
      {isPremium && (
        <div className="space-y-4">
          {!showRoutineGenerator ? (
            <button
              onClick={() => setShowRoutineGenerator(true)}
              className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-opacity relative overflow-hidden bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm sm:text-base">Generate In-Depth Personalized Routine</span>
            </button>
          ) : (
            <RoutineGenerator
              skinType={skinType || 'combination'}
              concerns={concerns || []}
              problems={data.problems}
              score={data.score}
              climate={climate || 'temperate'}
              pollution={pollution || 'moderate'}
            />
          )}
        </div>
      )}

      {/* Download Report Button */}
      <button
        onClick={onDownloadReport}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-foreground font-medium flex items-center justify-center gap-2 btn-shine hover:from-primary/30 hover:to-secondary/30 transition-all"
      >
        <Download className="w-5 h-5" />
        Download Clinical Report
      </button>

      {/* Dupe Finder Modal */}
      <DupeFinder
        productName={dupeProduct || ''}
        skinType={skinType}
        concerns={concerns}
        isOpen={!!dupeProduct}
        onClose={() => setDupeProduct(null)}
      />
    </div>
  );
}
