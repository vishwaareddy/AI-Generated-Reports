import {
  Upload, LayoutDashboard, Brain, FileText, MessageSquare, TrendingUp
} from 'lucide-react';

interface MobileNavProps {
  activeScreen: string;
  setActiveScreen: (s: string) => void;
  hasData: boolean;
}

const navItems = [
  { id: 'upload', icon: Upload, label: 'Upload', requiresData: false },
  { id: 'analysis', icon: Brain, label: 'Analyze', requiresData: false },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', requiresData: true },
  { id: 'reports', icon: FileText, label: 'Reports', requiresData: true },
  { id: 'forecasting', icon: TrendingUp, label: 'Forecast', requiresData: true },
  { id: 'chat', icon: MessageSquare, label: 'AI Chat', requiresData: true },
];

export default function MobileNav({ activeScreen, setActiveScreen, hasData }: MobileNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-slate-700/50">
      <div className="flex items-stretch">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          const isLocked = item.requiresData && !hasData;
          return (
            <button
              key={item.id}
              onClick={() => { if (!isLocked) setActiveScreen(item.id); }}
              disabled={isLocked}
              className={`relative flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${
                isActive ? 'text-indigo-400' : isLocked ? 'text-slate-700' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-indigo-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
