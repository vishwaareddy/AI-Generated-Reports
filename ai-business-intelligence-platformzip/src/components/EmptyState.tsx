import { Inbox, Upload } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
  icon?: 'inbox' | 'upload';
}

export default function EmptyState({ title, message, ctaLabel, onCta, icon = 'inbox' }: EmptyStateProps) {
  const Icon = icon === 'upload' ? Upload : Inbox;
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-600/10 border border-indigo-500/20 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-indigo-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
      <p className="text-slate-400 max-w-md mb-6">{message}</p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
