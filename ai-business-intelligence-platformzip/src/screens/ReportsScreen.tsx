import { useMemo, useState } from 'react';
import {
  Download, Sparkles, Eye, Clock, FileText,
  CheckCircle, ChevronRight, Brain, AlertCircle, X
} from 'lucide-react';
import type { UploadedFile } from '../types';
import { exportPdfReport } from '../lib/export';

interface ReportsScreenProps {
  file: UploadedFile | null;
  files: UploadedFile[];
  setSelectedFileId: (id: string) => void;
}

interface GeneratedReport {
  id: string;
  title: string;
  type: string;
  icon: string;
  description: string;
  highlights: string[];
  tags: string[];
}

const buildReports = (file: UploadedFile): GeneratedReport[] => {
  const a = file.analytics!;
  const ds = file.dataset!;
  const numericCols = ds.schema.filter((s) => s.type === 'number').map((s) => s.name);
  const catCols = ds.schema.filter((s) => s.type === 'string').map((s) => s.name);
  const dateCols = ds.schema.filter((s) => s.type === 'date').map((s) => s.name);

  const reports: GeneratedReport[] = [];

  reports.push({
    id: 'exec',
    title: 'Executive Summary',
    type: 'Overview Report',
    icon: '📊',
    description: `Top-level KPIs, schema breakdown, and key insights from ${ds.rowCount.toLocaleString()} records across ${ds.columns.length} columns.`,
    highlights: a.kpis.slice(0, 3).map((k) => `${k.label}: ${k.value}`),
    tags: ['KPIs', 'Schema', 'Insights'],
  });

  if (numericCols.length > 0) {
    reports.push({
      id: 'numeric',
      title: 'Numeric Columns Deep Dive',
      type: 'Statistical Report',
      icon: '📈',
      description: `Sum, mean, min, max, and outlier analysis for ${numericCols.length} numeric column${numericCols.length === 1 ? '' : 's'}: ${numericCols.slice(0, 4).join(', ')}${numericCols.length > 4 ? '…' : ''}.`,
      highlights: a.numericSummary.slice(0, 3).map((s) => `${s.column}: total ${s.sum.toLocaleString()}, avg ${s.mean.toFixed(2)}`),
      tags: numericCols.slice(0, 3),
    });
  }

  if (dateCols.length > 0 && a.timeSeries) {
    reports.push({
      id: 'trend',
      title: 'Trend Analysis',
      type: 'Time-Series Report',
      icon: '⏰',
      description: `Aggregated trends of ${a.timeSeries.series.join(', ')} over ${a.timeSeries.column} (${a.timeSeries.data.length} periods).`,
      highlights: a.insights.filter((i) => i.type === 'trend' || i.type === 'warning').slice(0, 3).map((i) => i.text),
      tags: ['Trends', a.timeSeries.column],
    });
  }

  if (catCols.length > 0 && a.breakdowns.length > 0) {
    reports.push({
      id: 'segments',
      title: 'Categorical Breakdown',
      type: 'Segmentation Report',
      icon: '🗂️',
      description: `Distribution analysis across ${a.breakdowns.length} categorical column${a.breakdowns.length === 1 ? '' : 's'}: ${a.breakdowns.map((b) => b.column).join(', ')}.`,
      highlights: a.breakdowns.slice(0, 3).map((b) => `${b.column}: top is "${b.data[0]?.label}" (${b.data[0]?.value.toLocaleString()})`),
      tags: a.breakdowns.map((b) => b.column).slice(0, 3),
    });
  }

  if (a.forecast) {
    reports.push({
      id: 'forecast',
      title: 'Forecast Report',
      type: 'Predictive Report',
      icon: '🔮',
      description: `Linear-regression projection of ${a.forecast.metric}. Model fit (R²): ${(a.forecast.confidence * 100).toFixed(1)}%.`,
      highlights: [
        `Forecast range: ${a.forecast.rangeLow.toFixed(2)} – ${a.forecast.rangeHigh.toFixed(2)}`,
        `Confidence: ${(a.forecast.confidence * 100).toFixed(1)}%`,
      ],
      tags: ['Forecast', a.forecast.metric],
    });
  }

  return reports;
};

export default function ReportsScreen({ file, files, setSelectedFileId }: ReportsScreenProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const reports = useMemo(() => (file?.analytics && file?.dataset ? buildReports(file) : []), [file]);

  const handleDownload = (title: string) => {
    if (!file) return;
    try {
      setExportError(null);
      exportPdfReport(file, title);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  if (!file) return null;

  const previewReport = reports.find((r) => r.id === previewId);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="ai-badge">STEP 4 OF 4</div>
            <div className="ai-badge" style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)', color: '#34d399' }}>
              {reports.length} REPORTS READY
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">AI-Generated Reports</h2>
          <p className="text-slate-400 text-sm mt-1">
            Generated from <span className="text-indigo-400 font-semibold">{file.name}</span>
          </p>
        </div>
        <button
          onClick={() => handleDownload('Executive Summary')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
        >
          <Download className="w-4 h-4" />
          Export Executive PDF
        </button>
      </div>

      {/* Dataset switcher */}
      {files.length > 1 && (
        <div className="glass-card p-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-semibold mr-2">Dataset:</span>
          {files.map((f) => (
            <button key={f.id} onClick={() => setSelectedFileId(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                f.id === file.id
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-indigo-500/40'
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="glass-card p-5 hover:border-indigo-500/30 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/30 flex items-center justify-center text-2xl flex-shrink-0">
                  {report.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{report.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{report.type}</span>
                        <span className="text-slate-700">·</span>
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span className="text-xs text-slate-500">just generated</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">{report.description}</p>

                  {report.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {report.highlights.map((h, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-lg bg-slate-800/60 text-slate-400 border border-slate-700/30 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          {h}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {report.tags.map((t) => (
                      <span key={t} className="ai-badge">{t}</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => setPreviewId(report.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button onClick={() => handleDownload(report.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/60 border border-slate-700/30 hover:border-indigo-500/30 transition-all">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Dataset Snapshot
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Rows</span><span className="text-white font-semibold">{file.dataset!.rowCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Columns</span><span className="text-white font-semibold">{file.dataset!.columns.length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Numeric columns</span><span className="text-white font-semibold">{file.dataset!.schema.filter((s) => s.type === 'number').length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Date columns</span><span className="text-white font-semibold">{file.dataset!.schema.filter((s) => s.type === 'date').length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Categorical columns</span><span className="text-white font-semibold">{file.dataset!.schema.filter((s) => s.type === 'string').length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Insights surfaced</span><span className="text-white font-semibold">{file.analytics!.insights.length}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Top Insights
            </h3>
            <div className="space-y-3">
              {file.analytics!.insights.slice(0, 4).map((ins, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-start gap-2">
                    <span className="text-base">{ins.icon}</span>
                    <p className="text-xs text-slate-400 leading-relaxed flex-1">{ins.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewId(null)}>
          <div className="glass-card max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/30 flex items-center justify-center text-xl">
                  {previewReport.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{previewReport.title}</h3>
                  <p className="text-xs text-slate-500">{previewReport.type} · {file.name}</p>
                </div>
              </div>
              <button onClick={() => setPreviewId(null)} aria-label="Close preview"
                className="w-8 h-8 rounded-lg hover:bg-slate-700/50 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-300">
              <p>{previewReport.description}</p>
              <h4 className="text-white font-semibold mt-4">Highlights</h4>
              <ul className="space-y-2">
                {previewReport.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-400">
                    <ChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
              <h4 className="text-white font-semibold mt-4">KPIs in this dataset</h4>
              <div className="grid grid-cols-2 gap-3">
                {file.analytics!.kpis.map((k, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                    <div className="text-xs text-slate-500">{k.label}</div>
                    <div className="text-lg font-bold text-white">{k.value}</div>
                  </div>
                ))}
              </div>
              <h4 className="text-white font-semibold mt-4">Sample rows</h4>
              <div className="overflow-x-auto">
                <table className="text-xs min-w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      {file.dataset!.columns.slice(0, 6).map((c) => (
                        <th key={c} className="text-left py-2 px-3 text-slate-400 font-semibold">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {file.analytics!.preview.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/40">
                        {file.dataset!.columns.slice(0, 6).map((c) => (
                          <td key={c} className="py-2 px-3 text-slate-300">{String(row[c] ?? '—').slice(0, 40)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700/50 flex justify-end gap-2">
              <button onClick={() => setPreviewId(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/60 border border-slate-700/50">
                Close
              </button>
              <button onClick={() => { handleDownload(previewReport.title); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {!file.dataset && (
        <div className="glass-card p-8 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Upload data to generate reports.</p>
        </div>
      )}
    </div>
  );
}
