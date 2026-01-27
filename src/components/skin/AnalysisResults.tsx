import { useState } from 'react';
import { Droplet, AlertTriangle, Zap, X, Check, ChevronDown, ChevronUp, Download, ExternalLink, Sparkles } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import { RoutineGenerator } from './RoutineGenerator';

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
}

interface AnalysisData {
  score: number;
  problems: Problem[];
  deepAnalysis: string;
  avoidIngredients: Ingredient[];
  prescriptionIngredients: Ingredient[];
  routine: RoutineStep[];
}

interface AnalysisResultsProps {
  data: AnalysisData;
  skinType?: string;
  concerns?: string[];
  climate?: string;
  pollution?: string;
  onDownloadReport: () => void;
}

const iconMap: Record<string, typeof Droplet> = {
  hydration: Droplet,
  inflammation: AlertTriangle,
  barrier: Zap,
};

const getIcon = (iconKey: string) => {
  return iconMap[iconKey] || Zap;
};

export function AnalysisResults({ data, skinType, concerns, climate, pollution, onDownloadReport }: AnalysisResultsProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showRoutineGenerator, setShowRoutineGenerator] = useState(false);

  const amRoutine = data.routine.filter(s => s.time === 'AM' || s.time === 'BOTH');
  const pmRoutine = data.routine.filter(s => s.time === 'PM' || s.time === 'BOTH');

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

      {/* Chemical Comparison */}
      <div className="grid grid-cols-2 gap-3">
        {/* Avoid List */}
        <div className="glass-card p-4 border-destructive/30">
          <h4 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
            <X className="w-4 h-4" />
            Avoid
          </h4>
          <ul className="space-y-2">
            {data.avoidIngredients.slice(0, 5).map((ingredient, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                <X className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                <span>{ingredient.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prescription List */}
        <div className="glass-card p-4 border-primary/30">
          <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Prescription
          </h4>
          <ul className="space-y-2">
            {data.prescriptionIngredients.slice(0, 5).map((ingredient, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                <span>{ingredient.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Routine Section */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Personalized Routine</h3>
        <p className="text-xs text-center text-muted-foreground mb-4 italic">
          💡 Tap on each step to see why this product is recommended
        </p>
        
        <div className="space-y-6">
          {/* AM Routine */}
          <div className="glass-card p-4">
            <h4 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
              ☀️ Morning Routine
            </h4>
            <div className="relative pl-6 border-l-2 border-primary/30 space-y-4">
              {amRoutine.map((step, index) => (
                <div key={index} className="relative timeline-node">
                  <button
                    onClick={() => setExpandedStep(expandedStep === step.step ? null : step.step)}
                    className="w-full text-left"
                  >
                    <div className="ml-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{step.product}</span>
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
            <h4 className="text-sm font-semibold text-secondary mb-4 flex items-center gap-2">
              🌙 Evening Routine
            </h4>
            <div className="relative pl-6 border-l-2 border-secondary/30 space-y-4">
              {pmRoutine.map((step, index) => (
                <div key={index} className="relative timeline-node">
                  <button
                    onClick={() => setExpandedStep(expandedStep === step.step + 100 ? null : step.step + 100)}
                    className="w-full text-left"
                  >
                    <div className="ml-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{step.product}</span>
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
        </div>
      </div>

      {/* Make Routine Section */}
      <div className="space-y-4">
        {!showRoutineGenerator ? (
          <button
            onClick={() => setShowRoutineGenerator(true)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-5 h-5" />
            Customized Personalized Routine with Instructions
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
