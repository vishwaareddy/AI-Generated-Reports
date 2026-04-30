import { useMemo, useState } from 'react';
import { Zap, Brain, Target, Download, AlertCircle, Calendar } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import type { UploadedFile, ForecastResult } from '../types';
import { exportPdfReport } from '../lib/export';

interface ForecastingScreenProps {
  file: UploadedFile | null;
  files: UploadedFile[];
  setSelectedFileId: (id: string) => void;
}

interface ScenarioPoint {
  label: string;
  actual: number | null;
  forecast: number | null;
  bear: number | null;
  bull: number | null;
}

function buildScenarioData(forecast: ForecastResult): ScenarioPoint[] {
  return forecast.history.map((h) => ({
    label: h.label,
    actual: h.actual,
    forecast: h.forecast,
    bear: h.forecast !== null ? h.forecast * 0.85 : null,
    bull: h.forecast !== null ? h.forecast * 1.15 : null,
  }));
}

export default function ForecastingScreen({ file, files, setSelectedFileId }: ForecastingScreenProps) {
  const [exportError, setExportError] = useState<string | null>(null);

  const a = file?.analytics;
  const forecast = a?.forecast;

  const scenarioData = useMemo(() => (forecast ? buildScenarioData(forecast) : []), [forecast]);

  const handleExport = () => {
    if (!file) return;
    try {
      setExportError(null);
      exportPdfReport(file, 'Forecast Report');
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  if (!file) return null;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="ai-badge">PREDICTIVE ANALYTICS</div>
            {forecast && (
              <div className="ai-badge" style={{ background: 'rgba(6,182,212,0.15)', borderColor: 'rgba(6,182,212,0.4)', color: '#67e8f9' }}>
                LINEAR REGRESSION · R² {(forecast.confidence * 100).toFixed(1)}%
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">Predictive Forecasting</h2>
          <p className="text-slate-400 text-sm mt-1">
            Forecast for <span className="text-indigo-400 font-semibold">{file.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Download className="w-4 h-4" />
            Export Report
          </button>
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

      {exportError && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          {exportError}
        </div>
      )}

      {!forecast ? (
        <div className="glass-card p-10 text-center">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No forecast available</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            We couldn't find a date column paired with a numeric column in <span className="text-indigo-400">{file.name}</span>.
            Add columns like <code className="text-slate-300">date</code> + <code className="text-slate-300">amount</code> to enable forecasting.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Bear Case', value: forecast.rangeLow.toFixed(2), pct: '−15%', color: '#f59e0b', icon: '🛡️' },
              { label: 'Base Case', value: ((forecast.rangeLow + forecast.rangeHigh) / 2).toFixed(2), pct: 'mid', color: '#6366f1', icon: '📊' },
              { label: 'Bull Case', value: forecast.rangeHigh.toFixed(2), pct: '+15%', color: '#10b981', icon: '🚀' },
            ].map((s, i) => (
              <div key={i} className={`glass-card p-5 transition-all ${i === 1 ? 'border-indigo-500/40' : ''}`}
                style={i === 1 ? { boxShadow: '0 0 30px rgba(99,102,241,0.15)' } : {}}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-sm font-bold text-white">{s.label}</span>
                  </div>
                  {i === 1 && <span className="text-xs font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">Most Likely</span>}
                </div>
                <div className="text-3xl font-bold text-white mb-1">{Number(s.value).toLocaleString()}</div>
                <div className="text-sm font-semibold mb-2" style={{ color: s.color }}>
                  {s.pct} of base
                </div>
                <div className="text-xs text-slate-500">{forecast.metric}</div>
              </div>
            ))}
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-white">Forecast: {forecast.metric}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Historical actuals + linear projection · {forecast.history.filter((h) => h.actual !== null).length} historic + {forecast.history.filter((h) => h.forecast !== null).length} forecast periods
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-indigo-400 inline-block rounded"></span>Actual</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t-2 border-dashed border-purple-400 inline-block"></span>Forecast</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-purple-400/20 inline-block"></span>±15% band</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={scenarioData}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="bull" name="Bull Case" stroke="transparent" fill="url(#bullGrad)" connectNulls={false} />
                <Area type="monotone" dataKey="bear" name="Bear Case" stroke="transparent" fill="url(#bullGrad)" connectNulls={false} />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#6366f1" strokeWidth={2.5} fill="url(#actGrad)" connectNulls={false} dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#a78bfa" strokeWidth={2} strokeDasharray="6 3" fill="transparent" connectNulls={false} dot={{ fill: '#a78bfa', r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                Model Coefficients
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Slope (per period)', value: forecast.slope.toFixed(4) },
                  { label: 'Intercept', value: forecast.intercept.toFixed(4) },
                  { label: 'R² (fit quality)', value: (forecast.confidence * 100).toFixed(2) + '%' },
                  { label: 'Forecast horizon', value: `${forecast.history.filter((h) => h.forecast !== null).length} periods` },
                  { label: 'Direction', value: forecast.slope > 0 ? 'Trending up' : forecast.slope < 0 ? 'Trending down' : 'Flat' },
                ].map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-xs text-slate-500">{d.label}</span>
                    <span className="text-xs font-semibold text-slate-300 font-mono">{d.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/30 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Predicted range</span>
                <span className="text-sm font-bold text-indigo-400">{forecast.rangeLow.toFixed(2)} – {forecast.rangeHigh.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  Method
                </h3>
                <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
                  <p>Ordinary least-squares linear regression fit on the aggregated time series, then projected forward by 25% of the historical period count.</p>
                  <p>Confidence is reported as the R² of the fit on historical data. Bear / bull bands are ±15% around the projected base.</p>
                  <p>Run client-side in your browser with no external API calls.</p>
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Caveats
                </h3>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5"></div>
                    <span>Linear models miss seasonality and non-linear trends.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5"></div>
                    <span>Confidence reflects fit, not predictive certainty.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5"></div>
                    <span>Use as a directional baseline, not a planning commitment.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
