import { TrendingUp, TrendingDown, Minus, PartyPopper, Target, Lightbulb } from 'lucide-react';

interface ProgressFeedbackProps {
  currentScore: number;
  previousScore: number;
  currentProblems?: { title: string }[];
  previousProblems?: { title: string }[];
}

export function ProgressFeedback({ currentScore, previousScore, currentProblems, previousProblems }: ProgressFeedbackProps) {
  const scoreDelta = currentScore - previousScore;
  const isImproved = scoreDelta > 0;
  const isDeclined = scoreDelta < 0;
  const isMaintained = scoreDelta === 0;

  // Check for resolved problems
  const previousProblemTitles = new Set(previousProblems?.map(p => p.title) || []);
  const currentProblemTitles = new Set(currentProblems?.map(p => p.title) || []);
  const resolvedProblems = [...previousProblemTitles].filter(p => !currentProblemTitles.has(p));
  const newProblems = [...currentProblemTitles].filter(p => !previousProblemTitles.has(p));

  const getFeedbackMessage = () => {
    if (isImproved) {
      if (scoreDelta >= 2) {
        return {
          title: "🎉 Amazing Progress!",
          message: "Your skin has shown significant improvement! Your routine is clearly working. The AI recommends considering a lighter maintenance routine.",
          suggestion: "lighter",
          color: "text-green-400",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30"
        };
      }
      return {
        title: "✨ Great Job!",
        message: "Your skin is improving! Keep up the consistent routine. The AI is adapting recommendations based on your progress.",
        suggestion: "maintain",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30"
      };
    }
    
    if (isDeclined) {
      if (scoreDelta <= -2) {
        return {
          title: "🔍 Let's Adjust",
          message: "Your skin shows some changes. This could be seasonal, stress, or product-related. The AI recommends a more intensive care routine.",
          suggestion: "intense",
          color: "text-amber-400",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/30"
        };
      }
      return {
        title: "📊 Minor Fluctuation",
        message: "Small changes are normal! Stay consistent with your routine. The AI is monitoring patterns to optimize recommendations.",
        suggestion: "maintain",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30"
      };
    }
    
    return {
      title: "💪 Staying Strong!",
      message: "Your skin health is stable. Consistency is key! The AI continues to monitor for any changes.",
      suggestion: "maintain",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30"
    };
  };

  const feedback = getFeedbackMessage();

  return (
    <div className={`glass-card p-4 border-l-4 ${feedback.borderColor}`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${feedback.bgColor}`}>
          {isImproved ? (
            scoreDelta >= 2 ? <PartyPopper className={`w-6 h-6 ${feedback.color}`} /> : <TrendingUp className={`w-6 h-6 ${feedback.color}`} />
          ) : isDeclined ? (
            <TrendingDown className={`w-6 h-6 ${feedback.color}`} />
          ) : (
            <Target className={`w-6 h-6 ${feedback.color}`} />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className={`font-semibold ${feedback.color}`}>{feedback.title}</h4>
            <span className={`text-lg font-bold ${feedback.color}`}>
              {scoreDelta > 0 ? '+' : ''}{scoreDelta.toFixed(1)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{feedback.message}</p>
          
          {/* Resolved Problems */}
          {resolvedProblems.length > 0 && (
            <div className="mt-3 p-2 rounded-lg bg-green-500/10">
              <p className="text-xs font-medium text-green-400 mb-1">✅ Problems Resolved:</p>
              <div className="flex flex-wrap gap-1">
                {resolvedProblems.map((problem, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                    {problem}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* New Concerns */}
          {newProblems.length > 0 && (
            <div className="mt-2 p-2 rounded-lg bg-amber-500/10">
              <p className="text-xs font-medium text-amber-400 mb-1">⚠️ New Concerns:</p>
              <div className="flex flex-wrap gap-1">
                {newProblems.map((problem, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                    {problem}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestion */}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span>
              {feedback.suggestion === 'lighter' && "AI suggests transitioning to a simpler maintenance routine"}
              {feedback.suggestion === 'intense' && "AI recommends a more intensive treatment routine"}
              {feedback.suggestion === 'maintain' && "AI recommends continuing your current routine"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
