import { useMemo, useState } from 'react';
import {
  Download, Sparkles, ChevronLeft, ChevronRight, AlertCircle, BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import type { UploadedFile, DatasetAnalytics } from '../types';
import { exportPptDeck } from '../lib/export';

interface PresentationsScreenProps {
  file: UploadedFile | null;
  files: UploadedFile[];
  setSelectedFileId: (id: string) => void;
}

type SlideType = 'title' | 'kpis' | 'trend' | 'breakdown' | 'insights' | 'forecast';

interface Slide {
  id: string;
  title: string;
  type: SlideType;
  bg: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#a855f7'];

const buildSlides = (file: UploadedFile, a: DatasetAnalytics): Slide[] => {
  const slides: Slide[] = [
    { id: 'title', title: file.name, type: 'title', bg: 'from-indigo-900 via-purple-900 to-slate-900' },
  ];
  if (a.kpis.length > 0) slides.push({ id: 'kpis', title: 'Key Performance Indicators', type: 'kpis', bg: 'from-slate-900 to-slate-800' });
  if (a.timeSeries) slides.push({ id: 'trend', title: `Trend: ${a.timeSeries.metric}`, type: 'trend', bg: 'from-indigo-950 to-slate-900' });
  a.breakdowns.forEach((b, i) => {
    slides.push({ id: `breakdown-${i}`, title: `Breakdown: ${b.column}`, type: 'breakdown', bg: 'from-slate-900 via-purple-950 to-slate-900' });
  });
  if (a.insights.length > 0) slides.push({ id: 'insights', title: 'AI Insights', type: 'insights', bg: 'from-cyan-950 to-slate-900' });
  if (a.forecast) slides.push({ id: 'forecast', title: `Forecast: ${a.forecast.metric}`, type: 'forecast', bg: 'from-slate-900 to-indigo-950' });
  return slides;
};

export default function PresentationsScreen({ file, files, setSelectedFileId }: PresentationsScreenProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const slides = useMemo(() => (file?.analytics ? buildSlides(file, file.analytics) : []), [file]);

  if (!file) return null;
  const a = file.analytics;
  if (!a) return null;

  const safeIdx = Math.min(activeSlide, slides.length - 1);
  const current = slides[safeIdx];

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportError(null);
      await exportPptDeck(file, file.name.replace(/\.[^.]+$/, '') + ' Deck');
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'PPTX export failed');
    } finally {
      setExporting(false);
    }
  };

  const breakdownIndex = current?.type === 'breakdown'
    ? Number(current.id.split('-')[1])
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="ai-badge">AI PRESENTATIONS</div>
            <div className="ai-badge" style={{ background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)', color: '#fbbf24' }}>
              {slides.length} SLIDES READY
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Presentation Builder</h2>
          <p className="text-slate-400 text-sm mt-1">
            Slides generated from <span className="text-indigo-400 font-semibold">{file.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Download className="w-4 h-4" /> {exporting ? 'Generating…' : 'Export .PPTX'}
          </button>
        </div>
      </div>

      {files.length > 1 && (
        <div className="glass-card p-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-semibold mr-2">Dataset:</span>
          {files.map((f) => (
            <button key={f.id} onClick={() => { setSelectedFileId(f.id); setActiveSlide(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                f.id === file.id ? 'bg-indigo-500/20 border-indigo-500/50 text-white' : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-indigo-500/40'
              }`}>
              {f.name}
            </button>
          ))}
        </div>
      )}

      {exportError && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          {exportError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Slides</h3>
          <div className="space-y-2">
            {slides.map((slide, i) => (
              <button key={slide.id} onClick={() => setActiveSlide(i)}
                className={`w-full text-left rounded-xl overflow-hidden border-2 transition-all ${
                  safeIdx === i ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-slate-700/50 hover:border-slate-600'
                }`}>
                <div className={`h-16 bg-gradient-to-br ${slide.bg} p-3 flex flex-col justify-between`}>
                  <div className="text-xs font-bold text-white/80 leading-tight line-clamp-1">{slide.title}</div>
                  <div className="text-xs text-white/40">{i + 1} / {slides.length}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className={`relative rounded-2xl overflow-hidden aspect-video bg-gradient-to-br ${current.bg} border border-slate-700/30`}
            style={{ minHeight: '320px' }}>
            <div className="absolute inset-0 grid-bg opacity-30"></div>
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">N</span>
                </div>
                <span className="text-xs text-white/50">NexusIQ</span>
              </div>
              <div className="flex gap-1">
                {slides.map((_, i) => (
                  <div key={i} className={`h-0.5 rounded-full transition-all ${i === safeIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/30'}`}></div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center h-full p-8">
              {current.type === 'title' && (
                <div className="text-center">
                  <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
                    GENERATED · {new Date().toLocaleDateString()}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3">{file.name.replace(/\.[^.]+$/, '')}</h2>
                  <p className="text-slate-400 text-sm">{file.dataset!.rowCount.toLocaleString()} rows · {file.dataset!.columns.length} columns</p>
                  <div className="mt-6 w-16 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto"></div>
                </div>
              )}

              {current.type === 'kpis' && (
                <div className="w-full">
                  <h2 className="text-xl font-bold text-white mb-6 text-center">{current.title}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {a.kpis.slice(0, 4).map((m, i) => (
                      <div key={i} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-2xl font-bold text-white mb-1 truncate" title={m.value}>{m.value}</div>
                        {m.change && <div className={`text-xs font-bold mb-1 ${m.trend === 'up' ? 'text-green-400' : m.trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>{m.change}</div>}
                        <div className="text-xs text-slate-400 truncate" title={m.label}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {current.type === 'trend' && a.timeSeries && (
                <div className="w-full">
                  <h2 className="text-xl font-bold text-white mb-3 text-center">{current.title}</h2>
                  <p className="text-slate-400 text-sm mb-4 text-center">{a.timeSeries.data.length} periods over {a.timeSeries.column}</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={a.timeSeries.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '11px' }} />
                        {a.timeSeries.series.map((s, i) => (
                          <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i]} strokeWidth={2} dot={false} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {current.type === 'breakdown' && a.breakdowns[breakdownIndex] && (
                <div className="w-full">
                  <h2 className="text-xl font-bold text-white mb-3 text-center">{current.title}</h2>
                  <div className="grid grid-cols-2 gap-4 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={a.breakdowns[breakdownIndex].data} cx="50%" cy="50%" innerRadius={30} outerRadius={70}
                          paddingAngle={3} dataKey="value" nameKey="label">
                          {a.breakdowns[breakdownIndex].data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 overflow-y-auto">
                      {a.breakdowns[breakdownIndex].data.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></div>
                          <span className="text-slate-400 flex-1 truncate">{p.label}</span>
                          <span className="text-white font-bold">{p.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {current.type === 'insights' && (
                <div className="w-full">
                  <h2 className="text-xl font-bold text-white mb-4 text-center">{current.title}</h2>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {a.insights.map((ins, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-base">{ins.icon}</span>
                        <div className="flex-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            ins.priority === 'CRITICAL' ? 'bg-red-500/30 text-red-300' :
                            ins.priority === 'HIGH' ? 'bg-orange-500/30 text-orange-300' :
                            ins.priority === 'MED' ? 'bg-yellow-500/30 text-yellow-300' :
                            'bg-blue-500/30 text-blue-300'
                          }`}>{ins.priority}</span>
                          <p className="text-xs text-slate-300 mt-1">{ins.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {current.type === 'forecast' && a.forecast && (
                <div className="w-full">
                  <h2 className="text-xl font-bold text-white mb-3 text-center">{current.title}</h2>
                  <p className="text-slate-400 text-xs text-center mb-3">
                    Range: {a.forecast.rangeLow.toFixed(2)} – {a.forecast.rangeHigh.toFixed(2)} · Confidence (R²): {(a.forecast.confidence * 100).toFixed(1)}%
                  </p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={a.forecast.history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '11px' }} />
                        <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2} dot={false} name="Actual" />
                        <Line type="monotone" dataKey="forecast" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Forecast" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute bottom-3 right-4 text-xs text-white/20 font-mono">
              NexusIQ · Generated
            </div>

            <button onClick={() => setActiveSlide(Math.max(0, safeIdx - 1))} aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center hover:bg-black/50 transition-all">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => setActiveSlide(Math.min(slides.length - 1, safeIdx + 1))} aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center hover:bg-black/50 transition-all">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Slide {safeIdx + 1} of {slides.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={handleExport} disabled={exporting}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-500/20 border border-indigo-500/30 disabled:opacity-50">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Download Deck
              </button>
            </div>
          </div>

          {/* Slide chart sample mockup with bar */}
          {current.type === 'breakdown' && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Bar view
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={a.breakdowns[breakdownIndex].data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" horizontal vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
