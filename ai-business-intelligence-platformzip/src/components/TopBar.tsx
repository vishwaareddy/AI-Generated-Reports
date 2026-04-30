import {
  Search, Bell, Zap, ChevronDown, Mic, Command, Plus
} from 'lucide-react';

interface TopBarProps {
  activeScreen: string;
  setActiveScreen: (s: string) => void;
}

const screenTitles: Record<string, { title: string; sub: string }> = {
  upload: { title: 'Upload Data', sub: 'Import any file format for AI analysis' },
  analysis: { title: 'AI Analysis Engine', sub: 'Real-time data processing & intelligence extraction' },
  dashboard: { title: 'Executive Dashboard', sub: 'Q4 2024 · Acme Corporation · Auto-refreshed 2m ago' },
  reports: { title: 'Reports & Documents', sub: 'AI-generated executive reports ready to share' },
  presentations: { title: 'Presentation Builder', sub: 'One-click slide deck generation' },
  insights: { title: 'AI Insights', sub: 'Smart recommendations & pattern detection' },
  forecasting: { title: 'Predictive Forecasting', sub: 'ML-powered trend predictions & scenario modeling' },
  chat: { title: 'AI Data Assistant', sub: 'Ask questions about your data in plain English' },
};

export default function TopBar({ activeScreen, setActiveScreen }: TopBarProps) {
  const info = screenTitles[activeScreen] || screenTitles.dashboard;

  return (
    <header className="h-16 glass border-b border-slate-700/50 flex items-center px-6 gap-4 sticky top-0 z-20">
      {/* Mobile Logo */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-sm">NexusIQ</span>
      </div>

      {/* Title */}
      <div className="hidden lg:block flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-white">{info.title}</h1>
          <div className="ai-badge">AI-POWERED</div>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{info.sub}</p>
      </div>

      <div className="flex-1 lg:flex-none"></div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 w-64 hover:border-indigo-500/40 transition-colors group cursor-pointer">
        <Search className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
        <span className="text-sm text-slate-500 flex-1">Search or ask AI...</span>
        <div className="flex items-center gap-1">
          <Command className="w-3 h-3 text-slate-600" />
          <span className="text-xs text-slate-600">K</span>
        </div>
      </div>

      {/* Voice */}
      <button className="hidden md:flex w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/50 items-center justify-center hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all group">
        <Mic className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
      </button>

      {/* New Report */}
      <button
        onClick={() => setActiveScreen('upload')}
        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
      >
        <Plus className="w-4 h-4" />
        New Analysis
      </button>

      {/* Notifications */}
      <button className="relative w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:border-indigo-500/40 transition-all">
        <Bell className="w-4 h-4 text-slate-400" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
      </button>

      {/* Avatar */}
      <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">S</div>
        <ChevronDown className="w-3 h-3 text-slate-500 hidden lg:block" />
      </button>
    </header>
  );
}
