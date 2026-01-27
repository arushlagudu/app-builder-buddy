import { Scan, Package, Bot, ListChecks, Flame, TrendingUp, Dna } from 'lucide-react';

type Tab = 'scan' | 'history' | 'progress' | 'scanner' | 'skyn' | 'coach' | 'routines' | 'streaks' | 'settings';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'scan' as Tab, icon: Scan, label: 'Scan' },
    { id: 'routines' as Tab, icon: ListChecks, label: 'Routines' },
    { id: 'scanner' as Tab, icon: Package, label: 'Product Scanner' },
    { id: 'skyn' as Tab, icon: Dna, label: 'SKYN' },
    { id: 'coach' as Tab, icon: Bot, label: 'AI Coach' },
    { id: 'progress' as Tab, icon: TrendingUp, label: 'Progress Analytics' },
  ];

  // Split tabs into left, center (SKYN), and right groups
  const leftTabs = tabs.slice(0, 3);
  const centerTab = tabs[3]; // SKYN
  const rightTabs = tabs.slice(4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass-card mx-2 mb-3 rounded-2xl border-t-0">
        <div className="flex items-center py-2">
          {/* Left tabs */}
          <div className="flex items-center justify-around flex-1">
            {leftTabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-300 ${
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

          {/* Center SKYN tab */}
          <button
            onClick={() => onTabChange(centerTab.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-300 ${
              activeTab === centerTab.id
                ? 'text-secondary bg-secondary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <centerTab.icon className={`w-5 h-5 ${activeTab === centerTab.id ? 'text-glow-purple' : ''}`} />
            <span className={`text-[10px] font-medium ${activeTab === centerTab.id ? 'text-secondary' : ''}`}>
              {centerTab.label}
            </span>
          </button>

          {/* Right tabs */}
          <div className="flex items-center justify-around flex-1">
            {rightTabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-300 ${
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
      </div>
    </nav>
  );
}
