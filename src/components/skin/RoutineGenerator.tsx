import { useState } from 'react';
import { Sparkles, Zap, Flame, Loader2, Sun, Moon, Calendar, ChevronDown, ChevronUp, Clock, Droplets, Info, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface RoutineStep {
  step: number;
  productType: string;
  productName: string;
  frequency: string;
  howToUse: string;
  reason: string;
  productLink?: string;
}

interface WeeklyTreatment {
  treatment: string;
  productName: string;
  frequency: string;
  howToUse: string;
  reason: string;
  productLink?: string;
}

interface GeneratedRoutine {
  routineTitle: string;
  routineSummary: string;
  morningRoutine: RoutineStep[];
  eveningRoutine: RoutineStep[];
  weeklyTreatments?: WeeklyTreatment[];
  tips?: string[];
}

interface RoutineGeneratorProps {
  skinType: string;
  concerns: string[];
  problems: Array<{ title: string; description: string }>;
  score: number;
  climate: string;
  pollution: string;
}

type Intensity = 'simple' | 'medium' | 'intense';

const intensityConfig = {
  simple: {
    label: 'Simple',
    description: '3-4 steps • Quick & easy',
    icon: Sparkles,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    activeColor: 'bg-emerald-500',
  },
  medium: {
    label: 'Medium',
    description: '5-6 steps • Balanced care',
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    activeColor: 'bg-primary',
  },
  intense: {
    label: 'Intense',
    description: '7-10 steps • Maximum results',
    icon: Flame,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    borderColor: 'border-secondary/30',
    activeColor: 'bg-secondary',
  },
};

export function RoutineGenerator({ skinType, concerns, problems, score, climate, pollution }: RoutineGeneratorProps) {
  const [selectedIntensity, setSelectedIntensity] = useState<Intensity | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<GeneratedRoutine | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (key: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleGenerateRoutine = async () => {
    if (!selectedIntensity) {
      toast.error('Please select an intensity level');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-routine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          intensity: selectedIntensity,
          skinType,
          concerns,
          problems,
          score,
          climate,
          pollution,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
          return;
        }
        throw new Error('Failed to generate routine');
      }

      const data = await response.json();
      setGeneratedRoutine(data);
      toast.success('Your personalized routine is ready!');
    } catch (error) {
      console.error('Error generating routine:', error);
      toast.error('Failed to generate routine. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderRoutineStep = (step: RoutineStep, prefix: string) => {
    const key = `${prefix}-${step.step}`;
    const isExpanded = expandedSteps.has(key);

    return (
      <div key={key} className="relative timeline-node">
        <button
          onClick={() => toggleStep(key)}
          className="w-full text-left"
        >
          <div className="ml-4 glass-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {step.productType}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                    {step.frequency}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{step.productName}</p>
                  {step.productLink && (
                    <a
                      href={step.productLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="Find where to buy"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </div>
            
            {isExpanded && (
              <div className="mt-3 space-y-3 animate-fade-in">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                  <Droplets className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-primary mb-1">How to Use</p>
                    <p className="text-xs text-muted-foreground">{step.howToUse}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-secondary/5">
                  <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-secondary mb-1">Why This Works</p>
                    <p className="text-xs text-muted-foreground">{step.reason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </button>
      </div>
    );
  };

  if (generatedRoutine) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="glass-card p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">{generatedRoutine.routineTitle}</h2>
          <p className="text-sm text-muted-foreground">{generatedRoutine.routineSummary}</p>
          <button
            onClick={() => {
              setGeneratedRoutine(null);
              setSelectedIntensity(null);
            }}
            className="mt-4 text-xs text-primary hover:underline"
          >
            ← Generate Different Routine
          </button>
        </div>

        {/* Morning Routine */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1 flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            Morning Routine
          </h3>
          <div className="relative pl-6 border-l-2 border-amber-500/30 space-y-3">
            {generatedRoutine.morningRoutine.map(step => renderRoutineStep(step, 'am'))}
          </div>
        </div>

        {/* Evening Routine */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1 flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            Evening Routine
          </h3>
          <div className="relative pl-6 border-l-2 border-indigo-400/30 space-y-3">
            {generatedRoutine.eveningRoutine.map(step => renderRoutineStep(step, 'pm'))}
          </div>
        </div>

        {/* Weekly Treatments */}
        {generatedRoutine.weeklyTreatments && generatedRoutine.weeklyTreatments.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-400" />
              Weekly Treatments
            </h3>
            <div className="space-y-3">
              {generatedRoutine.weeklyTreatments.map((treatment, index) => {
                const key = `weekly-${index}`;
                const isExpanded = expandedSteps.has(key);
                
                return (
                  <button
                    key={key}
                    onClick={() => toggleStep(key)}
                    className="w-full text-left glass-card p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-rose-400 uppercase tracking-wide">
                            {treatment.treatment}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400">
                            {treatment.frequency}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{treatment.productName}</p>
                          {treatment.productLink && (
                            <a
                              href={treatment.productLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-rose-400 hover:text-rose-300 transition-colors"
                              title="Find where to buy"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-3 space-y-3 animate-fade-in">
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/5">
                          <Clock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-rose-400 mb-1">How to Use</p>
                            <p className="text-xs text-muted-foreground">{treatment.howToUse}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-secondary/5">
                          <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-secondary mb-1">Why This Works</p>
                            <p className="text-xs text-muted-foreground">{treatment.reason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tips */}
        {generatedRoutine.tips && generatedRoutine.tips.length > 0 && (
          <div className="glass-card p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              💡 Pro Tips
            </h4>
            <ul className="space-y-2">
              {generatedRoutine.tips.map((tip, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Create Your Routine</h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred intensity level for a personalized skincare routine
        </p>
      </div>

      {/* Intensity Selection */}
      <div className="grid gap-3">
        {(Object.keys(intensityConfig) as Intensity[]).map((intensity) => {
          const config = intensityConfig[intensity];
          const Icon = config.icon;
          const isSelected = selectedIntensity === intensity;

          return (
            <button
              key={intensity}
              onClick={() => setSelectedIntensity(intensity)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? `${config.borderColor} ${config.bgColor}`
                  : 'border-muted/30 hover:border-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${isSelected ? config.color : 'text-foreground'}`}>
                    {config.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    isSelected
                      ? `${config.activeColor} border-transparent`
                      : 'border-muted-foreground/30'
                  }`}
                >
                  {isSelected && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateRoutine}
        disabled={!selectedIntensity || isGenerating}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Your Routine...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Make My Routine
          </>
        )}
      </button>
    </div>
  );
}
