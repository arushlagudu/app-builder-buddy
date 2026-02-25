import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, ChevronRight, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScoreGauge } from './ScoreGauge';
import { toast } from 'sonner';

interface AnalysisRecord {
  id: string;
  created_at: string;
  score: number;
  skin_type: string;
  problems: { title: string; description: string }[] | null;
}

interface HistoryViewProps {
  onSelectAnalysis?: (id: string) => void;
}

export function HistoryView({ onSelectAnalysis }: HistoryViewProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('id, created_at, score, skin_type, problems')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast the data to match our interface
      setHistory((data || []).map(d => ({
        ...d,
        score: Number(d.score),
        problems: d.problems as { title: string; description: string }[] | null
      })));
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('analysis_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setHistory(history.filter(h => h.id !== id));
      toast.success('Analysis deleted');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete analysis');
    }
  };

  if (!user) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground">Sign in to view your analysis history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground">No analysis history yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Complete your first skin analysis to start tracking
        </p>
      </div>
    );
  }

  // Calculate improvement trend
  const scores = history.map(h => h.score).reverse();
  const trend = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : 0;

  return (
    <div className="space-y-4">
      {/* Trend Summary */}
      {scores.length >= 2 && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className={`w-5 h-5 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <div>
              <p className="text-sm font-medium">
                {trend >= 0 ? 'Skin improving!' : 'Needs attention'}
              </p>
              <p className="text-xs text-muted-foreground">
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)} points since first analysis
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="space-y-3">
        {history.map((record) => (
          <div
            key={record.id}
            className="glass-card p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={() => onSelectAnalysis?.(record.id)}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex-shrink-0">
                <ScoreGauge score={record.score} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm capitalize">{record.skin_type} Skin</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(record.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {record.problems && record.problems.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {record.problems.map(p => p.title).join(', ')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnalysis(record.id);
                  }}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
