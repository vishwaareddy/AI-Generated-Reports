import { useMemo } from 'react';
import {
  Sparkles, Target, Brain, ChevronRight, Zap, Database
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Area
} from 'recharts';
import type { UploadedFile, Insight } from '../types';

interface InsightsScreenProps {
  file: UploadedFile | null;
  files: UploadedFile[];
  setSelectedFileId: (id: string) => void;
}

const PRIORITY_RANK: Record<Insight['priority'], number> = { CRITICAL: 0, HIGH: 1, MED: 2, LOW: 3, INFO: 4 };

const TYPE_COLORS: Record<string, { dot: string; bg: string; text: string; chart: string }> = {
  warning: { dot: 'bg-red-500/15', bg: 'border-red-500/25', text: 'text-red-400', chart: '#f87171' },
  outlier: { dot: 'bg-orange-500/15', bg: 'border-orange-500/25', text: 'text-orange-400', chart: '#fb923c' },
  trend: { dot: 'bg-green-500/15', bg: 'border-green-500/25', text: 'text-green-400', chart: '#34d399' },
  positive: { dot: 'bg-indigo-500/15', bg: 'border-indigo-500/25', text: 'text-indigo-400', chart: '#818cf8' },
  info: { dot: 'bg-slate-700/40', bg: 'border-slate-700/40', text: 'text-slate-300', chart: '#94a3b8' },
};

export default function InsightsScreen({ file, files, setSelectedFileId }: InsightsScreenProps) {
  const a = file?.analytics;

  const sortedInsights = useMemo(() => {
    if (!a) return [];
    return [...a.insights].sort((x, y) => PRIORITY_RANK[x.priority] - PRIORITY_RANK[y.priority]);
  }, [a]);

  const counts = useMemo(() => {
    if (!a) return { critical: 0, high: 0, med: 0, low: 0 };
    return a.insights.reduce(
      (acc, i) => {
        if (i.priority === 'CRITICAL') acc.critical++;
        else if (i.priority === 'HIGH') acc.high++;
        else if (i.priority === 'MED') acc.med++;
        else acc.low++;
        return acc;
      },
      { critical: 0, high: 0, med: 0, low: 0 }
    );
  }, [a]);

  if (!file || !a) return null;

  const ds = file.dataset!;
  const tsSeries = a.timeSeries?.series[0];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="ai-badge">AI INSIGHTS ENGINE</div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-xs font-semibold text-purple-400">{a.insights.length} insights found</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">AI-Generated Insights</h2>
          <p className="text-slate-400 text-sm mt-1">
            Pattern recognition across <span className="text-indigo-400 font-semibold">{file.name}</span>
          </p>
        </div>
      </div>

      {files.length > 1 && (
        <div className="glass-card p-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-semibold mr-2">Dataset:</span>
          {files.map((f) => (
            <button key={f.id} onClick={() => setSelectedFileId(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                f.id === file.id ? 'bg-indigo-500/20 border-indigo-500/50 text-white' : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-indigo-500/40'
              }`}>
              {f.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Critical', value: counts.critical, icon: '🚨', color: 'text-red-400 border-red-500/20' },
          { label: 'High', value: counts.high, icon: '⚠️', color: 'text-orange-400 border-orange-500/20' },
          { label: 'Medium', value: counts.med, icon: '💡', color: 'text-yellow-400 border-yellow-500/20' },
          { label: 'Low / Info', value: counts.low, icon: '📌', color: 'text-blue-400 border-blue-500/20' },
        ].map((c, i) => (
          <div key={i} className={`glass-card p-4 ${c.color}`}>
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="text-2xl font-bold text-white">{c.value}</div>
            <div className={`text-xs font-semibold ${c.color}`}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {sortedInsights.length === 0 && (
            <div className="glass-card p-8 text-center text-slate-400 text-sm">
              No insights surfaced for this dataset yet.
            </div>
          )}
          {sortedInsights.map((insight, i) => {
            const c = TYPE_COLORS[insight.type] ?? TYPE_COLORS.info;
            return (
              <div key={i} className={`glass-card p-5 transition-all ${c.bg}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${c.dot}`}>
                    {insight.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            insight.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                            insight.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                            insight.priority === 'MED' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            #{i + 1} · {insight.priority}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800/60 ${c.text}`}>
                            {insight.type.toUpperCase()}
                          </span>
                          {insight.column && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Database className="w-3 h-3" /> {insight.column}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed">{insight.text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          {a.forecast ? (
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Forecast: {a.forecast.metric}
              </h3>
              <p className="text-xs text-slate-500 mb-4">Confidence (R²): {(a.forecast.confidence * 100).toFixed(1)}%</p>
              <ResponsiveContainer width="100%" height={150}>
                <ComposedChart data={a.forecast.history}>
                  <defs>
                    <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="actual" name="Actual" stroke="#6366f1" strokeWidth={2} fill="url(#fcGrad)" connectNulls={false} />
                  <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="mt-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="text-sm font-bold text-white">{a.forecast.rangeLow.toFixed(2)} – {a.forecast.rangeHigh.toFixed(2)}</div>
                <div className="text-xs text-slate-400">Projected range (next periods)</div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Forecast
              </h3>
              <p className="text-xs text-slate-500">No date + numeric column combination found in this dataset, so no forecast was generated.</p>
            </div>
          )}

          {tsSeries && a.timeSeries && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Trend at a glance
              </h3>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={a.timeSeries.data}>
                  <Line type="monotone" dataKey={tsSeries} stroke="#818cf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-500 mt-2">{tsSeries} over {a.timeSeries.column}</p>
            </div>
          )}

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              Column Health
            </h3>
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {ds.schema.map((s) => (
                <div key={s.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40">
                  <span className="text-xs flex-shrink-0">
                    {s.type === 'number' ? '🔢' : s.type === 'date' ? '📅' : s.type === 'boolean' ? '✅' : '🔤'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate" title={s.name}>{s.name}</div>
                    <div className="text-xs text-slate-500">
                      {s.type} · {s.uniqueCount} unique{s.missingCount > 0 ? ` · ${s.missingCount} missing` : ''}
                    </div>
                  </div>
                  <div className={`text-xs font-bold flex-shrink-0 ${
                    s.missingPct === 0 ? 'text-green-400'
                    : s.missingPct < 0.1 ? 'text-yellow-400'
                    : 'text-red-400'
                  }`}>
                    {((1 - s.missingPct) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Try in Chat
            </h3>
            <div className="space-y-2">
              {[
                'What columns are in this dataset?',
                'Show me the row count',
                a.timeSeries ? `Plot ${a.timeSeries.metric} over time` : null,
                a.breakdowns[0] ? `Top values in ${a.breakdowns[0].column}` : null,
              ].filter(Boolean).map((s, i) => (
                <div key={i} className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <span className="text-base">💬</span>
                  <span className="text-xs text-slate-400 flex-1">{s}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
