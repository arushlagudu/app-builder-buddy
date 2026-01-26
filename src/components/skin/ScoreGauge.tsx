import { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
}

export function ScoreGauge({ score, maxScore = 10 }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / maxScore) * circumference;
  const dashOffset = circumference - progress;

  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(score * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const getScoreColor = () => {
    if (animatedScore >= 8) return 'text-primary';
    if (animatedScore >= 5) return 'text-yellow-400';
    return 'text-destructive';
  };

  const getGradientId = () => {
    if (animatedScore >= 8) return 'gradient-good';
    if (animatedScore >= 5) return 'gradient-medium';
    return 'gradient-bad';
  };

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="gradient-good" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(187, 100%, 50%)" />
            <stop offset="100%" stopColor="hsl(270, 100%, 50%)" />
          </linearGradient>
          <linearGradient id="gradient-medium" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(45, 100%, 50%)" />
            <stop offset="100%" stopColor="hsl(187, 100%, 50%)" />
          </linearGradient>
          <linearGradient id="gradient-bad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(0, 84%, 60%)" />
            <stop offset="100%" stopColor="hsl(45, 100%, 50%)" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="hsl(220, 15%, 18%)"
          strokeWidth="8"
        />
        
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={`url(#${getGradientId()})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-300"
          style={{
            filter: 'drop-shadow(0 0 10px hsla(187, 100%, 50%, 0.5))',
          }}
        />
      </svg>
      
      {/* Score display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold font-mono ${getScoreColor()} text-glow-cyan`}>
          {animatedScore.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Health Score</span>
      </div>
    </div>
  );
}
