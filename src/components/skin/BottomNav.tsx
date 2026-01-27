import { Scan, Clock, Settings, Package, TrendingUp, Sparkles, Camera, ListChecks, Flame } from 'lucide-react';

type Tab = 'scan' | 'history' | 'progress' | 'scanner' | 'coach' | 'routines' | 'streaks' | 'settings';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'scan' as Tab, icon: Scan, label: 'Scan' },
    { id: 'streaks' as Tab, icon: Flame, label: 'Streaks' },
    { id: 'routines' as Tab, icon: ListChecks, label: 'Routines' },
    { id: 'scanner' as Tab, icon: Package, label: 'Products' },
    { id: 'coach' as Tab, icon: Sparkles, label: 'Coach' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass-card mx-2 mb-3 rounded-2xl border-t-0">
        <div className="flex items-center justify-around py-2">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                activeTab === id
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${activeTab === id ? 'text-glow-cyan' : ''}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
