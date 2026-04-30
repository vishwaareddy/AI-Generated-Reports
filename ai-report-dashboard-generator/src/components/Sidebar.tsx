import {
  LayoutDashboard, Upload, Brain, FileText,
  Presentation, Settings, Bell, Zap, Users,
  Database, ChevronRight, Sparkles, MessageSquare, TrendingUp
} from 'lucide-react';

interface SidebarProps {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  hasData: boolean;
}

const navItems = [
  { id: 'upload', icon: Upload, label: 'Upload Data', requiresData: false },
  { id: 'analysis', icon: Brain, label: 'AI Analysis', requiresData: false },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', requiresData: true },
  { id: 'reports', icon: FileText, label: 'Reports', requiresData: true },
  { id: 'presentations', icon: Presentation, label: 'Presentations', requiresData: true },
  { id: 'insights', icon: Sparkles, label: 'AI Insights', requiresData: true },
  { id: 'forecasting', icon: TrendingUp, label: 'Forecasting', requiresData: true },
  { id: 'chat', icon: MessageSquare, label: 'AI Assistant', requiresData: true },
];

const bottomItems = [
  { id: 'team', icon: Users, label: 'Team' },
  { id: 'integrations', icon: Database, label: 'Integrations' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ activeScreen, setActiveScreen, hasData }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen glass border-r border-indigo-500/10 relative z-10">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-purple">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse-glow"></div>
          </div>
          <div>
            <div className="font-bold text-white text-lg leading-none">NexusIQ</div>
            <div className="text-xs text-indigo-400 font-medium">Enterprise AI</div>
          </div>
        </div>
      </div>

      {/* Workspace selector */}
      <div className="px-4 py-3 border-b border-slate-700/30">
        <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/30 transition-all group">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">A</div>
            <span className="text-sm text-slate-300 font-medium">Acme Corp</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 mb-3">Workspace</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          const isLocked = item.requiresData && !hasData;
          return (
            <button
              key={item.id}
              onClick={() => { if (!isLocked) setActiveScreen(item.id); }}
              disabled={isLocked}
              title={isLocked ? 'Upload data to unlock this section' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                isActive
                  ? 'nav-active text-white'
                  : isLocked
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : isLocked ? '' : 'group-hover:text-indigo-400'}`} style={{ width: '18px', height: '18px' }} />
              <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
              {isLocked && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-700/40 text-slate-500 border border-slate-700/50">LOCKED</span>
              )}
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Credits */}
      <div className="px-4 py-3 mx-3 mb-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">AI Credits</span>
          <span className="text-xs text-indigo-400 font-bold">8,420 / 10K</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: '84%' }}></div>
        </div>
        <div className="text-xs text-slate-500 mt-1.5">Resets Dec 31 · <span className="text-indigo-400 cursor-pointer hover:underline">Upgrade</span></div>
      </div>

      {/* Bottom Nav */}
      <div className="px-3 pb-4 space-y-1 border-t border-slate-700/30 pt-3">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 transition-all group"
            >
              <Icon className="group-hover:text-indigo-400 transition-colors" style={{ width: '18px', height: '18px' }} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User */}
      <div className="px-4 py-4 border-t border-slate-700/30 flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">S</div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">Sarah Chen</div>
          <div className="text-xs text-slate-500 truncate">Head of Analytics</div>
        </div>
        <Bell className="w-4 h-4 text-slate-500 hover:text-indigo-400 cursor-pointer transition-colors" />
      </div>
    </aside>
  );
}
