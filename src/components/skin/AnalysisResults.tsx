import { useState } from 'react';
import { Droplet, AlertTriangle, Zap, X, Check, ChevronDown, ChevronUp, Download, Gem, Lock, Info, Leaf, ShieldCheck } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import { RoutineGenerator } from './RoutineGenerator';
import { IngredientGlossary } from './IngredientGlossary';
import { ShareScoreCard } from './ShareScoreCard';
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

interface AnalysisData {
  score: number;
  problems: Problem[];
  deepAnalysis: string;
  avoidIngredients: Ingredient[];
  prescriptionIngredients: Ingredient[];
  naturalRemedies?: Ingredient[];
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
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<{
    name: string;
    reason: string;
    type: 'avoid' | 'prescription';
  } | null>(null);

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Score Section */}
      <div className="glass-card p-6 text-center">
        <h2 className="text-lg font-semibold mb-4">Skin Health Analysis</h2>
        <ScoreGauge score={data.score} />
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
          <span className="text-[11px] font-semibold text-green-400">Dermatologist Certified</span>
        </div>
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
        <RoutineGenerator
          skinType={skinType || 'combination'}
          concerns={concerns || []}
          problems={data.problems}
          score={data.score}
          climate={climate || 'temperate'}
          pollution={pollution || 'moderate'}
        />
      ) : (
        /* Premium Upsell for Routine */
        <div className="glass-card p-6 text-center border-secondary/30">
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3">
            <Gem className="w-6 h-6 text-secondary" />
          </div>
          <h3 className="font-semibold mb-2">Personalized In-Depth Routine</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Unlock your custom AM/PM skincare routine with product recommendations, pricing, and step-by-step guidance.
          </p>
          <button
            onClick={onUpgradeClick}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-secondary to-primary text-primary-foreground font-medium text-sm btn-shine flex items-center gap-2 mx-auto"
          >
            <Gem className="w-4 h-4" />
            Upgrade to Premium
            <Lock className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Share Score Card */}
      <ShareScoreCard score={data.score} skinType={skinType} concerns={concerns} />

      {/* Download Report Button */}
      <button
        onClick={onDownloadReport}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-foreground font-medium flex items-center justify-center gap-2 btn-shine hover:from-primary/30 hover:to-secondary/30 transition-all"
      >
        <Download className="w-5 h-5" />
        Download Clinical Report
      </button>
    </div>
  );
}
