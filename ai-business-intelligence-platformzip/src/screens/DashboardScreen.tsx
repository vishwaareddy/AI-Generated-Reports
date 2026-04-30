import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus,
  Filter, Download, RefreshCw, ChevronDown,
  Sparkles, BarChart3, ArrowUpRight, FileText, CheckCircle, Database, AlertCircle, Loader2
} from 'lucide-react';
import {
  ComposedChart, Area, BarChart, Bar, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import type { UploadedFile } from '../types';
import { exportPdfReport } from '../lib/export';

interface DashboardScreenProps {
  files: UploadedFile[];
  selectedFile: UploadedFile | null;
  setSelectedFileId: (id: string) => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#a855f7'];

const PIE_TOOLTIP = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { label: string } }[] }) => {
  if (active && payload && payload.length) {
    const p = payload[0];
    return (
      <div className="glass-card p-2 border border-indigo-500/20">
        <p className="text-xs font-bold text-white">{p.payload.label}</p>
        <p className="text-xs text-slate-300">{p.value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-indigo-500/20">
        <p className="text-xs font-bold text-white mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: {Number(p.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardScreen({ files, selectedFile, setSelectedFileId }: DashboardScreenProps) {
  const [exportError, setExportError] = useState<string | null>(null);

  if (!selectedFile) {
    return null;
  }

  const handleExport = () => {
    if (!selectedFile.analytics) return;
    try {
      setExportError(null);
      exportPdfReport(selectedFile, 'Executive Dashboard');
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const a = selectedFile.analytics;
  const ds = selectedFile.dataset;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="ai-badge">STEP 3 OF 4</div>
            <div className="ai-badge" style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)', color: '#34d399' }}>
              GENERATED FROM YOUR DATA
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Built in your browser
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Executive Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">
            Active dataset: <span className="text-indigo-400 font-semibold">{selectedFile.name}</span>
            {ds && <> · {ds.rowCount.toLocaleString()} rows · {ds.columns.length} columns</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button disabled className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs font-medium text-slate-500 opacity-60 cursor-not-allowed">
            <Filter className="w-3.5 h-3.5" />
            Filters
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            onClick={handleExport}
            disabled={!a}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs font-medium text-slate-400 hover:text-white hover:border-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {exportError && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          {exportError}
        </div>
      )}

      {/* Dataset Picker */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Uploaded Datasets
            <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full">
              {files.length} ready
            </span>
          </h3>
          <span className="text-xs text-slate-500">Click a file to make it the active dataset</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {files.map((f) => {
            const isActive = f.id === selectedFile.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFileId(f.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-indigo-500/40 hover:text-white'
                }`}
              >
                <span>{f.type === 'Excel' ? '📊' : f.type === 'CSV' ? '📋' : f.type === 'JSON' ? '{}' : '📁'}</span>
                <span className="truncate max-w-[180px]">{f.name}</span>
                <span className="text-[10px] text-slate-500 font-normal">{f.dataset?.rowCount.toLocaleString()} rows</span>
                {isActive && <CheckCircle className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {!a || !ds ? (
        <div className="glass-card p-10 text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Analytics for this file aren't ready yet.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {a.kpis.map((kpi, i) => {
              const c = COLORS[i % COLORS.length];
              const trendIcon = kpi.trend === 'up' ? <TrendingUp className="w-3 h-3" />
                : kpi.trend === 'down' ? <TrendingDown className="w-3 h-3" />
                : <Minus className="w-3 h-3" />;
              return (
                <div key={i} className="metric-card rounded-2xl p-5 relative overflow-hidden"
                  style={{ background: `${c}15`, border: `1px solid ${c}30` }}>
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6"
                    style={{ background: c }}></div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${c}30` }}>
                      <Database className="w-4 h-4" style={{ color: c }} />
                    </div>
                    {kpi.change && (
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                        kpi.trend === 'up' ? 'text-green-400 bg-green-400/10'
                        : kpi.trend === 'down' ? 'text-red-400 bg-red-400/10'
                        : 'text-slate-400 bg-slate-700/30'
                      }`}>
                        {trendIcon}
                        {kpi.change}
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1 truncate" title={kpi.value}>{kpi.value}</div>
                  <div className="text-xs font-semibold mb-1 truncate" style={{ color: c }} title={kpi.label}>{kpi.label}</div>
                  {kpi.hint && <div className="text-xs text-slate-500 line-clamp-2">{kpi.hint}</div>}
                </div>
              );
            })}
          </div>

          {/* Time series + first breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 glass-card p-5">
              {a.timeSeries ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">Trend over {a.timeSeries.column}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{a.timeSeries.data.length} periods · {a.timeSeries.series.length} {a.timeSeries.series.length === 1 ? 'metric' : 'metrics'}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      {a.timeSeries.series.map((s, i) => (
                        <span key={s} className="flex items-center gap-1">
                          <span className="w-3 h-0.5 inline-block rounded" style={{ background: COLORS[i] }}></span>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={a.timeSeries.data}>
                      <defs>
                        <linearGradient id="tsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey={a.timeSeries.series[0]} name={a.timeSeries.series[0]} stroke="#6366f1" strokeWidth={2} fill="url(#tsGrad)" />
                      {a.timeSeries.series.slice(1).map((s, i) => (
                        <Line key={s} type="monotone" dataKey={s} name={s} stroke={COLORS[i + 1]} strokeWidth={1.5} dot={false} />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white mb-1">No time series detected</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Add a date column and at least one numeric column to your dataset to see trends here.
                  </p>
                </div>
              )}
            </div>

            <div className="glass-card p-5">
              {a.breakdowns[0] ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">{a.breakdowns[0].column}</h3>
                      <p className="text-xs text-slate-500">Distribution</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={a.breakdowns[0].data}
                        cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3}
                        dataKey="value"
                        nameKey="label"
                      >
                        {a.breakdowns[0].data.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PIE_TOOLTIP />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                    {a.breakdowns[0].data.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }}></div>
                        <span className="text-xs text-slate-400 flex-1 truncate" title={r.label}>{r.label}</span>
                        <span className="text-xs font-bold text-white">{r.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-500">No categorical columns suitable for breakdown.</p>
                </div>
              )}
            </div>
          </div>

          {/* Second breakdown row */}
          {a.breakdowns.length > 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {a.breakdowns.slice(1, 3).map((b, idx) => (
                <div key={idx} className="glass-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">{b.column}</h3>
                      <p className="text-xs text-slate-500">Top {b.data.length}</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={b.data} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" horizontal vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" name={b.column} fill={COLORS[(idx + 2) % COLORS.length]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}

          {/* Insights */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">AI-Generated Insights</h3>
              <span className="ai-badge">{a.insights.length} found</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {a.insights.map((ins, i) => (
                <div key={i} className="insight-card p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">{ins.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ins.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                        ins.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                        ins.priority === 'MED' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>{ins.priority}</span>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1.5">{ins.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Preview Table */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Data Preview
                <span className="text-xs text-slate-500 font-normal">first 10 rows</span>
              </h3>
              <span className="text-xs text-slate-500">{ds.rowCount.toLocaleString()} total · {ds.columns.length} columns</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {ds.columns.slice(0, 8).map((c) => {
                      const sch = ds.schema.find((s) => s.name === c);
                      return (
                        <th key={c} className="text-left py-2 px-3 text-slate-400 font-semibold">
                          <div>{c}</div>
                          {sch && <div className="text-[10px] text-slate-600 font-normal mt-0.5">{sch.type}</div>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {a.preview.map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                      {ds.columns.slice(0, 8).map((c) => (
                        <td key={c} className="py-2 px-3 text-slate-300">
                          {row[c] === null || row[c] === undefined || row[c] === ''
                            ? <span className="text-slate-600 italic">—</span>
                            : String(row[c]).slice(0, 50)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {ds.columns.length > 8 && (
                <p className="text-xs text-slate-500 mt-2">+ {ds.columns.length - 8} more columns hidden</p>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <div>
              <h3 className="text-sm font-bold text-white">Want a deeper dive?</h3>
              <p className="text-xs text-slate-400 mt-0.5">Generate a full PDF report or PowerPoint deck from this dataset.</p>
            </div>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <ArrowUpRight className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
