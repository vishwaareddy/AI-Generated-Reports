import { useState, useRef } from 'react';
import {
  Upload, FileText,
  CheckCircle, Loader2, Shield, CloudUpload,
  Globe, Link2, Sparkles, ArrowRight, X, AlertCircle
} from 'lucide-react';
import type { UploadedFile } from '../types';
import { SUPPORTED_FOR_ANALYTICS } from '../types';
import { detectFileType, formatSize, parseFile } from '../lib/parser';
import { analyzeDataset } from '../lib/analytics';

interface UploadScreenProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  updateFile: (id: string, patch: Partial<UploadedFile>) => void;
  removeFile: (id: string) => void;
  onAnalyze: () => void;
}

const fileTypes = [
  { icon: '📊', label: 'Excel', ext: '.xlsx', supported: true },
  { icon: '📋', label: 'CSV', ext: '.csv', supported: true },
  { icon: '{}', label: 'JSON', ext: '.json', supported: true },
  { icon: '📄', label: 'PDF', ext: '.pdf', supported: false },
  { icon: '📝', label: 'Word', ext: '.docx', supported: false },
  { icon: '📊', label: 'PowerPoint', ext: '.pptx', supported: false },
  { icon: '🗄️', label: 'SQL', ext: '.sql', supported: false },
];

const integrations = [
  { name: 'Salesforce', icon: '☁️' },
  { name: 'SAP', icon: '⚙️' },
  { name: 'QuickBooks', icon: '💚' },
  { name: 'Google Sheets', icon: '📗' },
  { name: 'HubSpot', icon: '🔶' },
  { name: 'Snowflake', icon: '❄️' },
];

const MAX_FILE_SIZE = 500 * 1024 * 1024;

export default function UploadScreen({ files, setFiles, updateFile, removeFile, onAnalyze }: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'connect' | 'url'>('upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (id: string, file: File) => {
    try {
      updateFile(id, { status: 'parsing', progress: 25 });
      const dataset = await parseFile(file);
      updateFile(id, { status: 'analyzing', progress: 70, dataset });
      // Run analytics in a microtask so UI can paint
      await new Promise((r) => setTimeout(r, 50));
      const analytics = analyzeDataset(dataset);
      updateFile(id, { status: 'ready', progress: 100, analytics });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error while parsing this file.';
      updateFile(id, { status: 'error', progress: 100, errorMessage: message });
    }
  };

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    if (list.length === 0) return;

    const tooBig = list.find((f) => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      setErrorMsg(`"${tooBig.name}" exceeds the 500MB limit.`);
      return;
    }
    setErrorMsg(null);

    const queued: { entry: UploadedFile; raw: File }[] = list.map((f) => ({
      raw: f,
      entry: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        size: formatSize(f.size),
        sizeBytes: f.size,
        type: detectFileType(f.name),
        status: 'queued',
        progress: 0,
      },
    }));

    setFiles((prev) => [...queued.map((q) => q.entry), ...prev]);
    queued.forEach((q) => { void processFile(q.entry.id, q.raw); });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const readyCount = files.filter((f) => f.status === 'ready').length;
  const inFlight = files.some((f) => f.status === 'parsing' || f.status === 'analyzing' || f.status === 'queued');
  const canAnalyze = readyCount > 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="ai-badge">STEP 1 OF 4</div>
          <div className="ai-badge" style={{ background: 'rgba(6,182,212,0.15)', borderColor: 'rgba(6,182,212,0.4)', color: '#67e8f9' }}>CLIENT-SIDE PARSING</div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Upload Your Business Data</h2>
        <p className="text-slate-400 text-base">
          Drop a CSV, Excel, or JSON dataset and NexusIQ will parse it in your browser and generate live KPIs, charts, insights, and forecasts.
        </p>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-800/60 rounded-xl w-fit border border-slate-700/50">
        {(['upload', 'connect', 'url'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab ? 'tab-active shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'upload' ? '📂 Upload File' : tab === 'connect' ? '🔌 Connect App' : '🔗 Paste URL'}
          </button>
        ))}
      </div>

      {activeTab === 'upload' && (
        <>
          <div
            className={`upload-zone rounded-2xl p-12 text-center cursor-pointer relative overflow-hidden transition-all ${isDragging ? 'drag-over' : ''}`}
            style={{ background: isDragging ? 'rgba(99,102,241,0.08)' : 'rgba(15,23,42,0.6)' }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="absolute h-px w-full opacity-20"
                  style={{
                    top: `${(i + 1) * 16}%`,
                    background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
                    animation: `shimmer ${2 + i * 0.3}s infinite`,
                    animationDelay: `${i * 0.4}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center animate-float">
                <CloudUpload className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Drop files here or click to browse</h3>
              <p className="text-slate-400 mb-2">Fully supported for analytics: <span className="text-indigo-300 font-semibold">CSV, Excel, JSON</span></p>
              <p className="text-xs text-slate-500 mb-6">PDF, Word, PowerPoint and SQL files can be uploaded but will not be parsed for analytics.</p>

              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {fileTypes.map((ft) => (
                  <div key={ft.label}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-transform hover:scale-105 ${
                      ft.supported
                        ? 'text-white border border-indigo-500/30'
                        : 'text-slate-500 border border-slate-700/40'
                    }`}
                    style={{ background: ft.supported ? 'rgba(99,102,241,0.15)' : 'rgba(30,41,59,0.5)' }}
                  >
                    <span>{ft.icon}</span>
                    <span>{ft.label}</span>
                    {!ft.supported && <span className="text-[9px] uppercase opacity-70">view only</span>}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 25px rgba(99,102,241,0.4)' }}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Choose Files
              </button>
              <p className="text-xs text-slate-600 mt-3">Max 500MB per file · Files never leave your browser</p>
              {errorMsg && <p className="text-xs text-red-400 mt-3" role="alert">{errorMsg}</p>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.json,.pdf,.doc,.docx,.ppt,.pptx,.sql"
              className="hidden"
              onChange={handleFileInputChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Uploaded Files
                <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full">
                  {files.length} {files.length === 1 ? 'file' : 'files'}
                </span>
                {inFlight && (
                  <span className="bg-amber-500/15 text-amber-400 text-xs px-2 py-0.5 rounded-full">parsing…</span>
                )}
                {readyCount > 0 && (
                  <span className="bg-green-500/15 text-green-400 text-xs px-2 py-0.5 rounded-full">{readyCount} ready</span>
                )}
              </h3>
              <button
                onClick={onAnalyze}
                disabled={!canAnalyze}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
              >
                <Sparkles className="w-4 h-4" />
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                No files yet. Drop files above or click "Choose Files" to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => {
                  const isUnsupported = !SUPPORTED_FOR_ANALYTICS.includes(file.type as never);
                  return (
                    <div key={file.id} className="flex items-start gap-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 hover:border-indigo-500/20 transition-all group">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                        file.type === 'Excel' ? 'bg-green-500/20' :
                        file.type === 'CSV' ? 'bg-blue-500/20' :
                        file.type === 'PDF' ? 'bg-red-500/20' :
                        file.type === 'Word' ? 'bg-sky-500/20' :
                        file.type === 'PowerPoint' ? 'bg-orange-500/20' :
                        file.type === 'SQL' ? 'bg-violet-500/20' :
                        file.type === 'JSON' ? 'bg-yellow-500/20' : 'bg-slate-500/20'
                      }`}>
                        {file.type === 'Excel' ? '📊' :
                          file.type === 'CSV' ? '📋' :
                          file.type === 'PDF' ? '📄' :
                          file.type === 'Word' ? '📝' :
                          file.type === 'PowerPoint' ? '📊' :
                          file.type === 'SQL' ? '🗄️' :
                          file.type === 'JSON' ? '{}' : '📁'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-white truncate">{file.name}</span>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            <span className="text-xs text-slate-500">{file.size}</span>
                            {file.status === 'ready' && <CheckCircle className="w-4 h-4 text-green-400" />}
                            {(file.status === 'parsing' || file.status === 'analyzing') && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                            {file.status === 'queued' && <div className="w-2 h-2 rounded-full bg-slate-500"></div>}
                            {file.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              aria-label={`Remove ${file.name}`}
                              className="opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X className="w-4 h-4 text-slate-600 hover:text-red-400 cursor-pointer" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="progress-bar flex-1">
                            <div className="progress-fill" style={{
                              width: `${file.progress}%`,
                              background: file.status === 'error' ? '#ef4444' : undefined,
                            }}></div>
                          </div>
                          <span className={`text-xs font-medium flex-shrink-0 ${
                            file.status === 'ready' ? 'text-green-400' :
                            file.status === 'error' ? 'text-red-400' :
                            file.status === 'parsing' || file.status === 'analyzing' ? 'text-indigo-400' :
                            'text-slate-500'
                          }`}>
                            {file.status === 'ready' && file.dataset
                              ? `Ready · ${file.dataset.rowCount.toLocaleString()} rows × ${file.dataset.columns.length} cols`
                              : file.status === 'parsing' ? 'Parsing file…'
                              : file.status === 'analyzing' ? 'Generating analytics…'
                              : file.status === 'error' ? 'Failed'
                              : 'Queued'}
                          </span>
                        </div>
                        {file.status === 'error' && file.errorMessage && (
                          <p className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                            {file.errorMessage}
                          </p>
                        )}
                        {file.status === 'ready' && isUnsupported && (
                          <p className="mt-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                            Stored for reference only — analytics aren't available for {file.type} files.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-slate-500 mt-4">
              Files are parsed entirely in your browser. Click <span className="text-indigo-400 font-semibold">Open Dashboard</span> once at least one dataset is ready.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: '🧮', title: 'Auto Schema Detection', desc: 'Numeric, date, categorical' },
              { icon: '📈', title: 'Live KPIs & Charts', desc: 'Generated from your rows' },
              { icon: '🔮', title: 'Linear Forecasts', desc: 'On any time-series column' },
              { icon: '🔐', title: 'Browser-Only', desc: 'Nothing is uploaded anywhere' },
            ].map((f, i) => (
              <div key={i} className="glass-card p-4 text-center">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-xs font-bold text-white mb-1">{f.title}</div>
                <div className="text-xs text-slate-500">{f.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'connect' && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-2">Connect Your Apps</h3>
          <p className="text-amber-400 text-sm mb-6 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 inline-block">
            Live integrations require a backend and aren't enabled in this build. For now, export your data and use the Upload tab.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 opacity-60">
            {integrations.map((int, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30 cursor-not-allowed">
                <span className="text-2xl">{int.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{int.name}</div>
                  <div className="text-xs text-slate-500">Backend required</div>
                </div>
                <Link2 className="w-4 h-4 text-slate-600 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'url' && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-2">Import from URL</h3>
          <p className="text-amber-400 text-sm mb-6 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 inline-block">
            URL fetching is blocked by browser CORS for arbitrary endpoints. Download the file and upload it instead.
          </p>
          <div className="flex gap-3 opacity-60">
            <div className="flex-1 flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
              <Globe className="w-4 h-4 text-slate-500" />
              <input
                type="url"
                disabled
                placeholder="https://docs.google.com/spreadsheets/..."
                className="bg-transparent text-sm text-white placeholder-slate-500 outline-none flex-1 cursor-not-allowed"
              />
            </div>
            <button disabled className="px-6 py-3 rounded-xl font-semibold text-white text-sm cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              Import
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        {['SOC 2 Type II', 'ISO 27001', 'GDPR Compliant', 'HIPAA Ready', 'Zero-Knowledge'].map((b) => (
          <div key={b} className="security-badge">
            <Shield style={{ width: '10px', height: '10px' }} />
            {b}
          </div>
        ))}
      </div>
    </div>
  );
}
