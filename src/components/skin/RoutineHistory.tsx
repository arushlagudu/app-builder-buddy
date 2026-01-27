import { useState, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp, Sun, Moon, Sparkles, Zap, Flame, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface RoutineStep {
  step: number;
  productType: string;
  productName: string;
  frequency: string;
  howToUse: string;
  reason: string;
  productLink?: string;
}

interface SavedRoutine {
  id: string;
  routine_type: 'basic' | 'advanced';
  intensity: string | null;
  routine_title: string | null;
  routine_summary: string | null;
  morning_routine: RoutineStep[] | null;
  evening_routine: RoutineStep[] | null;
  weekly_treatments: any[] | null;
  tips: string[] | null;
  skin_type: string | null;
  score: number | null;
  created_at: string;
}

const intensityIcons = {
  simple: Sparkles,
  medium: Zap,
  intense: Flame,
};

const intensityColors = {
  simple: 'text-emerald-500',
  medium: 'text-primary',
  intense: 'text-secondary',
};

export function RoutineHistory() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<SavedRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchRoutines();
    }
  }, [user]);

  const fetchRoutines = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_routines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutines((data as unknown as SavedRoutine[]) || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      const { error } = await supabase
        .from('generated_routines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRoutines(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (routines.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Saved Routines</h3>
        <p className="text-sm text-muted-foreground">
          Generate a routine from your skin analysis to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold px-1">Your Routine History</h2>
      
      {routines.map((routine) => {
        const isExpanded = expandedRoutine === routine.id;
        const IntensityIcon = routine.intensity ? intensityIcons[routine.intensity as keyof typeof intensityIcons] : Sparkles;
        const intensityColor = routine.intensity ? intensityColors[routine.intensity as keyof typeof intensityColors] : 'text-primary';

        return (
          <div key={routine.id} className="glass-card overflow-hidden">
            <button
              onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}
              className="w-full p-4 flex items-start justify-between gap-3 text-left"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 ${intensityColor}`}>
                  <IntensityIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">
                    {routine.routine_title || `${routine.intensity?.charAt(0).toUpperCase()}${routine.intensity?.slice(1)} Routine`}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(routine.created_at), 'MMM d, yyyy')}
                    </span>
                    {routine.intensity && (
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-muted/50 capitalize ${intensityColor}`}>
                        {routine.intensity}
                      </span>
                    )}
                    {routine.score && (
                      <span className="text-xs text-muted-foreground">
                        Score: {routine.score}/10
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRoutine(routine.id);
                  }}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-4 animate-fade-in">
                {routine.routine_summary && (
                  <p className="text-sm text-muted-foreground italic">{routine.routine_summary}</p>
                )}

                {/* Morning Routine */}
                {routine.morning_routine && routine.morning_routine.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      Morning
                    </h4>
                    <div className="space-y-2">
                      {routine.morning_routine.map((step, idx) => {
                        const stepKey = `${routine.id}-am-${idx}`;
                        const isStepExpanded = expandedSteps.has(stepKey);
                        
                        return (
                          <button
                            key={stepKey}
                            onClick={() => toggleStep(stepKey)}
                            className="w-full text-left p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{step.productType}</span>
                                <span className="text-sm font-medium">{step.productName}</span>
                                {step.productLink && (
                                  <a
                                    href={step.productLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-primary hover:text-primary/80"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              {isStepExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </div>
                            {isStepExpanded && (
                              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                <p><Clock className="w-3 h-3 inline mr-1" />{step.frequency}</p>
                                <p>{step.howToUse}</p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Evening Routine */}
                {routine.evening_routine && routine.evening_routine.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-400" />
                      Evening
                    </h4>
                    <div className="space-y-2">
                      {routine.evening_routine.map((step, idx) => {
                        const stepKey = `${routine.id}-pm-${idx}`;
                        const isStepExpanded = expandedSteps.has(stepKey);
                        
                        return (
                          <button
                            key={stepKey}
                            onClick={() => toggleStep(stepKey)}
                            className="w-full text-left p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{step.productType}</span>
                                <span className="text-sm font-medium">{step.productName}</span>
                                {step.productLink && (
                                  <a
                                    href={step.productLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-primary hover:text-primary/80"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              {isStepExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </div>
                            {isStepExpanded && (
                              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                <p><Clock className="w-3 h-3 inline mr-1" />{step.frequency}</p>
                                <p>{step.howToUse}</p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {routine.tips && routine.tips.length > 0 && (
                  <div className="p-3 rounded-lg bg-primary/5">
                    <h4 className="text-xs font-medium text-primary mb-2">💡 Pro Tips</h4>
                    <ul className="space-y-1">
                      {routine.tips.map((tip, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
