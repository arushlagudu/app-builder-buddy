import { Calendar, TrendingUp, Brain, Sparkles } from 'lucide-react';

interface MonthlyScanReminderProps {
  lastScanDate?: string;
  onScanClick?: () => void;
}

export function MonthlyScanReminder({ lastScanDate, onScanClick }: MonthlyScanReminderProps) {
  const daysSinceLastScan = lastScanDate 
    ? Math.floor((Date.now() - new Date(lastScanDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isOverdue = daysSinceLastScan !== null && daysSinceLastScan >= 30;
  const isDueSoon = daysSinceLastScan !== null && daysSinceLastScan >= 25 && daysSinceLastScan < 30;

  if (!isOverdue && !isDueSoon) return null;

  return (
    <div className={`glass-card p-4 border-l-4 ${isOverdue ? 'border-l-secondary' : 'border-l-primary'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isOverdue ? 'bg-secondary/20' : 'bg-primary/20'
        }`}>
          <Brain className={`w-5 h-5 ${isOverdue ? 'text-secondary' : 'text-primary'}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm flex items-center gap-2">
            {isOverdue ? '🔬 Monthly Scan Due' : '📅 Scan Reminder'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {isOverdue 
              ? `It's been ${daysSinceLastScan} days since your last scan. For optimal AI coaching and adaptive routines, we recommend monthly scans.`
              : `Your next monthly scan is due in ${30 - daysSinceLastScan!} days for continued progress tracking.`
            }
          </p>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span>Track improvement</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-secondary" />
              <span>Adaptive coaching</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 text-accent" />
              <span>Smart routines</span>
            </div>
          </div>

          {onScanClick && isOverdue && (
            <button
              onClick={onScanClick}
              className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Start Monthly Scan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
