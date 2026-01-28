import { useState, useEffect } from 'react';
import { Calendar, ChevronRight, Sun, Moon, Leaf, Zap, Flame, Clock, ExternalLink, Trash2, Pencil, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
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
  custom_name: string | null;
}

const intensityIcons = {
  simple: Leaf,
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
  const [selectedRoutine, setSelectedRoutine] = useState<SavedRoutine | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
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

  const deleteRoutine = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('generated_routines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRoutines(prev => prev.filter(r => r.id !== id));
      if (selectedRoutine?.id === id) {
        setSelectedRoutine(null);
      }
      toast.success('Routine deleted');
    } catch (error) {
      console.error('Error deleting routine:', error);
      toast.error('Failed to delete routine');
    }
  };

  const startEditing = (routine: SavedRoutine, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(routine.id);
    setEditName(getRoutineName(routine, routines.indexOf(routine)));
  };

  const saveEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('generated_routines')
        .update({ custom_name: editName.trim() || null })
        .eq('id', id);

      if (error) throw error;
      
      setRoutines(prev => prev.map(r => 
        r.id === id ? { ...r, custom_name: editName.trim() || null } : r
      ));
      setEditingId(null);
      toast.success('Name updated');
    } catch (error) {
      console.error('Error updating routine name:', error);
      toast.error('Failed to update name');
    }
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditName('');
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

  const getRoutineName = (routine: SavedRoutine, index: number) => {
    if (routine.custom_name) return routine.custom_name;
    const routineNumber = routines.length - index;
    const date = format(new Date(routine.created_at), 'MMM d');
    return `Routine ${routineNumber} • ${date}`;
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

  // Full routine view
  if (selectedRoutine) {
    const IntensityIcon = (selectedRoutine.intensity && intensityIcons[selectedRoutine.intensity as keyof typeof intensityIcons]) || Leaf;
    const intensityColor = (selectedRoutine.intensity && intensityColors[selectedRoutine.intensity as keyof typeof intensityColors]) || 'text-primary';

    return (
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <button
          onClick={() => setSelectedRoutine(null)}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          ← Back to Routines
        </button>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center ${intensityColor}`}>
              <IntensityIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">
                {getRoutineName(selectedRoutine, routines.findIndex(r => r.id === selectedRoutine.id))}
              </h2>
              <p className="text-xs text-muted-foreground">
                {format(new Date(selectedRoutine.created_at), 'MMMM d, yyyy')}
                {selectedRoutine.intensity && (
                  <span className={`ml-2 capitalize ${intensityColor}`}>• {selectedRoutine.intensity}</span>
                )}
              </p>
            </div>
          </div>
          {selectedRoutine.routine_summary && (
            <p className="text-sm text-muted-foreground italic">{selectedRoutine.routine_summary}</p>
          )}
        </div>

        {/* Morning Routine */}
        {selectedRoutine.morning_routine && selectedRoutine.morning_routine.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              Morning Routine
            </h3>
            <div className="space-y-2">
              {selectedRoutine.morning_routine.map((step, idx) => {
                const stepKey = `${selectedRoutine.id}-am-${idx}`;
                const isExpanded = expandedSteps.has(stepKey);
                
                return (
                  <button
                    key={stepKey}
                    onClick={() => toggleStep(stepKey)}
                    className="w-full text-left p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-xs text-muted-foreground">{step.productType}</span>
                        <div className="flex items-center gap-2">
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
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                        {step.frequency}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 space-y-2 animate-fade-in">
                        <div className="p-2 rounded-lg bg-primary/5">
                          <p className="text-xs font-medium text-primary mb-1">How to Use</p>
                          <p className="text-xs text-muted-foreground">{step.howToUse}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-secondary/5">
                          <p className="text-xs font-medium text-secondary mb-1">Why This Works</p>
                          <p className="text-xs text-muted-foreground">{step.reason}</p>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Evening Routine */}
        {selectedRoutine.evening_routine && selectedRoutine.evening_routine.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              Evening Routine
            </h3>
            <div className="space-y-2">
              {selectedRoutine.evening_routine.map((step, idx) => {
                const stepKey = `${selectedRoutine.id}-pm-${idx}`;
                const isExpanded = expandedSteps.has(stepKey);
                
                return (
                  <button
                    key={stepKey}
                    onClick={() => toggleStep(stepKey)}
                    className="w-full text-left p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-xs text-muted-foreground">{step.productType}</span>
                        <div className="flex items-center gap-2">
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
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                        {step.frequency}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 space-y-2 animate-fade-in">
                        <div className="p-2 rounded-lg bg-primary/5">
                          <p className="text-xs font-medium text-primary mb-1">How to Use</p>
                          <p className="text-xs text-muted-foreground">{step.howToUse}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-secondary/5">
                          <p className="text-xs font-medium text-secondary mb-1">Why This Works</p>
                          <p className="text-xs text-muted-foreground">{step.reason}</p>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly Treatments */}
        {selectedRoutine.weekly_treatments && selectedRoutine.weekly_treatments.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-400" />
              Weekly Treatments
            </h3>
            <div className="space-y-2">
              {selectedRoutine.weekly_treatments.map((treatment, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-rose-400 font-medium">{treatment.treatment}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400">
                      {treatment.frequency}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{treatment.productName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{treatment.howToUse}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {selectedRoutine.tips && selectedRoutine.tips.length > 0 && (
          <div className="glass-card p-4">
            <h4 className="text-sm font-medium mb-3">💡 Pro Tips</h4>
            <ul className="space-y-2">
              {selectedRoutine.tips.map((tip, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
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

  // Routine list view
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold px-1">Your Routines</h2>
      
      {routines.map((routine, index) => {
        const IntensityIcon = (routine.intensity && intensityIcons[routine.intensity as keyof typeof intensityIcons]) || Leaf;
        const intensityColor = (routine.intensity && intensityColors[routine.intensity as keyof typeof intensityColors]) || 'text-primary';
        const isEditing = editingId === routine.id;

        return (
          <button
            key={routine.id}
            onClick={() => !isEditing && setSelectedRoutine(routine)}
            className="w-full glass-card p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
          >
            <div className={`w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 ${intensityColor}`}>
              <IntensityIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-muted/50 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => saveEdit(routine.id, e)}
                    className="p-1 rounded-lg bg-primary/20 text-primary hover:bg-primary/30"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1 rounded-lg bg-muted hover:bg-muted/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-medium text-sm truncate">
                    {getRoutineName(routine, index)}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(routine.created_at), 'MMM d, yyyy • h:mm a')}
                    </span>
                    {routine.intensity && (
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-muted/50 capitalize ${intensityColor}`}>
                        {routine.intensity}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
            {!isEditing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => startEditing(routine, e)}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  title="Rename"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => deleteRoutine(routine.id, e)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
