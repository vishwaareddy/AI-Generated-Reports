import { useState, useMemo } from 'react';
import {
  Brain, CheckCircle, Loader2, Sparkles, TrendingUp,
  ChevronRight, Zap, ArrowRight, Target, AlertCircle
} from 'lucide-react';
import type { UploadedFile } from '../types';

interface AnalysisScreenProps {
  files: UploadedFile[];
  onComplete: (selectedFileId?: string) => void;
}

export default function AnalysisScreen({ files, onComplete }: AnalysisScreenProps) {
  const [chatInput, setChatInput] = useState('');

  const totalSizeLabel = useMemo(() => {
    const totalBytes = files.reduce((a, f) => a + f.sizeBytes, 0);
    if (totalBytes === 0) return '0 B';
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    if (totalBytes < 1024 * 1024 * 1024) return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }, [files]);

  const fileCount = files.length;
  const readyFiles = files.filter((f) => f.status === 'ready');
  const errorFiles = files.filter((f) => f.status === 'error');
  const inFlight = files.filter((f) => f.status === 'parsing' || f.status === 'analyzing' || f.status === 'queued');

  const completed = fileCount > 0 && inFlight.length === 0;
  const progress = fileCount === 0
    ? 0
    : Math.round(files.reduce((a, f) => a + f.progress, 0) / fileCount);

  const totalRows = readyFiles.reduce((a, f) => a + (f.dataset?.rowCount ?? 0), 0);
  const totalCols = readyFiles.reduce((a, f) => a + (f.dataset?.columns.length ?? 0), 0);
  const totalKpis = readyFiles.reduce((a, f) => a + (f.analytics?.kpis.length ?? 0), 0);
  const totalInsights = readyFiles.reduce((a, f) => a + (f.analytics?.insights.length ?? 0), 0);

  // Pull up to 6 KPIs from the first ready file for the preview
  const kpiPreview = readyFiles[0]?.analytics?.kpis ?? [];
  const insightPreview = readyFiles.flatMap((f) => f.analytics?.insights ?? []).slice(0, 4);

  // Build pipeline steps that mirror real progress
  const steps = useMemo(() => {
    const summary = files.length === 0
      ? '0 files'
      : `${readyFiles.length}/${fileCount} datasets · ${totalSizeLabel}`;
    const rowsLabel = totalRows > 0 ? `${totalRows.toLocaleString()} rows ingested` : 'awaiting data';
    const schemaLabel = totalCols > 0 ? `${totalCols} columns mapped` : 'awaiting data';
    const kpiLabel = totalKpis > 0 ? `${totalKpis} KPIs derived` : 'awaiting data';
    const insightLabel = totalInsights > 0 ? `${totalInsights} insights surfaced` : 'awaiting data';

    type StepStatus = 'queued' | 'processing' | 'done' | 'error';
    const list: { id: number; label: string; detail: string; status: StepStatus }[] = [
      { id: 1, label: 'File ingestion', detail: summary, status: completed ? 'done' : (fileCount > 0 ? 'processing' : 'queued') },
      { id: 2, label: 'Format detection & parsing', detail: rowsLabel, status: readyFiles.length > 0 ? 'done' : (inFlight.length > 0 ? 'processing' : 'queued') },
      { id: 3, label: 'Schema inference', detail: schemaLabel, status: readyFiles.length > 0 ? 'done' : 'queued' },
      { id: 4, label: 'KPI extraction', detail: kpiLabel, status: totalKpis > 0 ? 'done' : 'queued' },
      { id: 5, label: 'Trend & outlier analysis', detail: insightLabel, status: totalInsights > 0 ? 'done' : 'queued' },
      { id: 6, label: 'Forecast modeling', detail: readyFiles.some((f) => f.analytics?.forecast) ? 'Linear regression fit on time series' : 'No time series found', status: completed ? 'done' : 'queued' },
      { id: 7, label: 'Visualization rendering', detail: readyFiles.length > 0 ? 'Charts ready' : 'awaiting data', status: completed ? 'done' : 'queued' },
      { id: 8, label: 'Dashboard assembly', detail: completed ? 'Ready to view' : 'Pending…', status: completed ? 'done' : 'queued' },
    ];
    if (errorFiles.length > 0) {
      list.push({ id: 9, label: 'Errors', detail: `${errorFiles.length} file(s) couldn't be processed`, status: 'error' });
    }
    return list;
  }, [files.length, readyFiles.length, totalSizeLabel, totalRows, totalCols, totalKpis, totalInsights, completed, inFlight.length, fileCount, errorFiles.length]);

  const firstReadyFileId = readyFiles[0]?.id;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="animate-fade-in-up flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="ai-badge">STEP 2 OF 4</div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
              <div className={`w-2 h-2 rounded-full ${completed ? 'bg-green-400' : 'bg-green-400 animate-pulse'}`}></div>
              <span className="text-xs font-semibold text-green-400">{completed ? 'ANALYSIS COMPLETE' : fileCount === 0 ? 'WAITING FOR DATA' : 'AI ENGINE ACTIVE'}</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">
            {completed ? 'Intelligence Ready' : fileCount === 0 ? 'No data yet' : 'Generating Intelligence...'}
          </h2>
          <p className="text-slate-400">
            {fileCount === 0
              ? 'Head back to Upload to add a dataset.'
              : completed
                ? `Analyzed ${readyFiles.length} of ${fileCount} ${fileCount === 1 ? 'file' : 'files'}. Open your dashboard to explore.`
                : 'Parsing your data and deriving KPIs, charts, insights, and forecasts in your browser.'}
          </p>
        </div>
        <button
          onClick={() => onComplete(firstReadyFileId)}
          disabled={readyFiles.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
        >
          {completed ? 'View Dashboard' : 'Open Dashboard'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Brain className={`w-5 h-5 text-indigo-400 ${completed ? '' : 'animate-pulse'}`} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Analysis Pipeline</div>
                  <div className="text-xs text-slate-500">{fileCount} {fileCount === 1 ? 'file' : 'files'} · in-browser parser + analytics</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold gradient-text">{progress}%</div>
                <div className="text-xs text-slate-500">Complete</div>
              </div>
            </div>
            <div className="h-3 rounded-full bg-slate-800/80 overflow-hidden mb-2 border border-slate-700/30">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)',
                  boxShadow: '0 0 15px rgba(99,102,241,0.5)'
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{completed ? 'Done' : inFlight.length > 0 ? `${inFlight.length} file(s) still processing…` : 'Ready'}</span>
              <span>{totalSizeLabel} processed</span>
            </div>
          </div>

          {fileCount > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Files in this analysis
              </h3>
              <div className="flex flex-wrap gap-2">
                {files.map((f) => (
                  <span key={f.id} className={`text-xs px-3 py-1.5 rounded-lg border ${
                    f.status === 'ready' ? 'bg-green-500/10 text-green-300 border-green-500/30'
                      : f.status === 'error' ? 'bg-red-500/10 text-red-300 border-red-500/30'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700/30'
                  }`}>
                    {f.name} <span className="opacity-60">· {f.size}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              Processing Pipeline
            </h3>
            <div className="space-y-2">
              {steps.map((step) => (
                <div key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    step.status === 'processing' ? 'bg-indigo-500/10 border border-indigo-500/20' :
                    step.status === 'done' ? 'bg-slate-800/30' :
                    step.status === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                    'opacity-40'
                  }`}>
                  <div className="flex-shrink-0">
                    {step.status === 'done' && <CheckCircle className="w-4 h-4 text-green-400" />}
                    {step.status === 'processing' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                    {step.status === 'queued' && <div className="w-4 h-4 rounded-full border-2 border-slate-600"></div>}
                    {step.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${
                      step.status === 'done' ? 'text-slate-300'
                      : step.status === 'processing' ? 'text-white'
                      : step.status === 'error' ? 'text-red-300'
                      : 'text-slate-500'
                    }`}>{step.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{step.detail}</div>
                  </div>
                  {step.status === 'processing' && (
                    <div className="flex gap-1 flex-shrink-0">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-1 h-4 rounded-full bg-indigo-400 animate-wave"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {kpiPreview.length > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  KPIs from {readyFiles[0]?.name}
                </h3>
                <span className="ai-badge">LIVE</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {kpiPreview.map((kpi, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                    <div className="text-xs text-slate-500 mb-1">{kpi.label}</div>
                    <div className="text-lg font-bold text-white">{kpi.value}</div>
                    {kpi.change && (
                      <div className={`text-xs font-semibold flex items-center gap-1 mt-0.5 ${
                        kpi.trend === 'up' ? 'text-green-400' : kpi.trend === 'down' ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        <TrendingUp className="w-3 h-3" />
                        {kpi.change} period over period
                      </div>
                    )}
                    {kpi.hint && <div className="text-[10px] text-slate-500 mt-1">{kpi.hint}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5 h-fit">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"></div>
              </div>
              <div>
                <div className="text-sm font-bold text-white">Nexus AI</div>
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                  {completed ? 'Ready' : 'Working on your data'}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="text-xs p-3 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/30 max-w-xs">
                  {fileCount === 0
                    ? 'Upload a dataset and I\'ll start surfacing insights right away.'
                    : `I\'m parsing ${fileCount} ${fileCount === 1 ? 'file' : 'files'} (${totalSizeLabel}) directly in your browser.`}
                </div>
              </div>
              {completed && readyFiles.length > 0 && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="text-xs p-3 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/30 max-w-xs">
                    Done. {totalRows.toLocaleString()} rows across {totalCols} columns parsed. Open the Dashboard to dive in.
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your data..."
                className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
              />
              <button className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center hover:bg-indigo-400 transition-colors">
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              AI Discoveries
            </h3>
            {insightPreview.length === 0 ? (
              <p className="text-xs text-slate-500">Insights will appear here once at least one dataset is parsed.</p>
            ) : (
              <div className="space-y-2.5">
                {insightPreview.map((ins, i) => (
                  <div key={i} className="insight-card p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-base flex-shrink-0">{ins.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            ins.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                            ins.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                            ins.priority === 'MED' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>{ins.priority}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{ins.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
