import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, Target, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface AnalysisRecord {
  id: string;
  created_at: string;
  score: number;
  problems: { title: string }[] | null;
}

export function TrendAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const { data: records, error } = await supabase
        .from('analysis_history')
        .select('id, created_at, score, problems')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setData((records || []).map(r => ({
        ...r,
        score: Number(r.score),
        problems: r.problems as { title: string }[] | null
      })));
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground">Sign in to view your analytics</p>
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

  if (data.length < 2) {
    return (
      <div className="glass-card p-8 text-center">
        <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground font-medium">Not Enough Data Yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Complete at least 2 analyses to see trends
        </p>
      </div>
    );
  }

  // Calculate stats
  const scores = data.map(d => d.score);
  const latestScore = scores[scores.length - 1];
  const firstScore = scores[0];
  const improvement = latestScore - firstScore;
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);

  // Problem frequency
  const problemCounts: Record<string, number> = {};
  data.forEach(d => {
    d.problems?.forEach(p => {
      problemCounts[p.title] = (problemCounts[p.title] || 0) + 1;
    });
  });
  const topProblems = Object.entries(problemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // Chart data
  const chartData = data.map(d => ({
    date: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: d.score,
  }));

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            {improvement >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs text-muted-foreground">Total Progress</span>
          </div>
          <p className={`text-2xl font-bold ${improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            points since start
          </p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Best Score</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {highestScore.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            highest achieved
          </p>
        </div>
      </div>

      {/* Score Chart */}
      <div className="glass-card p-4">
        <h3 className="font-medium text-sm mb-4">Skin Score Over Time</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(215, 20%, 65%)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 10, fill: 'hsl(215, 20%, 65%)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsla(220, 18%, 12%, 0.9)',
                  border: '1px solid hsla(220, 15%, 30%, 0.3)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(187, 100%, 50%)"
                strokeWidth={2}
                fill="url(#scoreGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="glass-card p-4">
        <h3 className="font-medium text-sm mb-4">Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold">{data.length}</p>
            <p className="text-xs text-muted-foreground">Analyses</p>
          </div>
          <div>
            <p className="text-xl font-bold">{averageScore.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </div>
          <div>
            <p className="text-xl font-bold">{latestScore.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Current</p>
          </div>
        </div>
      </div>

      {/* Top Problems */}
      {topProblems.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-medium text-sm mb-4">Recurring Concerns</h3>
          <div className="space-y-2">
            {topProblems.map(([problem, count], index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{problem}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">
                  {count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
