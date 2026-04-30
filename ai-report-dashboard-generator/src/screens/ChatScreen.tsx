import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles, Send, ChevronRight,
  BarChart3, FileText, TrendingUp, Brain, Copy, Database
} from 'lucide-react';
import type { UploadedFile, ParsedDataset, DatasetAnalytics } from '../types';

interface ChatScreenProps {
  file: UploadedFile | null;
}

interface AnswerBlock {
  text: string;
  table?: { columns: string[]; rows: (string | number)[][] };
  bars?: { label: string; value: number }[];
}

interface Msg {
  role: 'ai' | 'user';
  text: string;
  time: string;
  table?: AnswerBlock['table'];
  bars?: AnswerBlock['bars'];
  suggestions?: string[];
}

const formatNumber = (n: number) => Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2);
const lower = (s: string) => s.toLowerCase();
const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function findColumn(question: string, ds: ParsedDataset): string | null {
  const q = lower(question);
  // Try longest column-name match first
  const sorted = [...ds.columns].sort((a, b) => b.length - a.length);
  for (const c of sorted) {
    if (q.includes(lower(c))) return c;
  }
  return null;
}

function answer(question: string, file: UploadedFile): AnswerBlock {
  const ds = file.dataset!;
  const a = file.analytics!;
  const q = lower(question.trim());

  if (!q) return { text: 'Ask me anything about your data.' };

  // Schema
  if (q.includes('column') && (q.includes('list') || q.includes('what') || q.includes('which') || q.includes('show'))) {
    return {
      text: `Your dataset has ${ds.columns.length} columns:`,
      table: {
        columns: ['Column', 'Type', 'Unique', 'Missing %'],
        rows: ds.schema.map((s) => [s.name, s.type, s.uniqueCount, (s.missingPct * 100).toFixed(1) + '%']),
      },
    };
  }

  // Row count
  if (q.includes('how many row') || q.includes('row count') || q.includes('records') || q === 'rows' || q.includes('how many record')) {
    return { text: `Your dataset has **${ds.rowCount.toLocaleString()}** rows across ${ds.columns.length} columns.` };
  }

  // KPIs
  if (q.includes('kpi') || q.includes('summarize') || q === 'summary' || q.includes('overview')) {
    return {
      text: `Here are the top KPIs derived from your dataset:`,
      table: {
        columns: ['KPI', 'Value', 'Hint'],
        rows: a.kpis.map((k) => [k.label, k.value, k.hint ?? '']),
      },
    };
  }

  // Insights
  if (q.includes('insight') || q.includes('finding') || q.includes('anomal')) {
    return {
      text: `I surfaced ${a.insights.length} insights:`,
      table: {
        columns: ['Priority', 'Type', 'Insight'],
        rows: a.insights.map((i) => [i.priority, i.type, i.text]),
      },
    };
  }

  // Forecast
  if (q.includes('forecast') || q.includes('predict') || q.includes('project')) {
    if (!a.forecast) return { text: `No forecast is available — your dataset doesn't have both a date and a numeric column.` };
    return {
      text: `Forecast for **${a.forecast.metric}**: projected range **${a.forecast.rangeLow.toFixed(2)} – ${a.forecast.rangeHigh.toFixed(2)}** with R² ${(a.forecast.confidence * 100).toFixed(1)}%.`,
      bars: a.forecast.history.slice(-12).map((h) => ({
        label: h.label,
        value: h.actual ?? h.forecast ?? 0,
      })),
    };
  }

  // Trend
  if (q.includes('trend') || q.includes('over time')) {
    if (!a.timeSeries) return { text: 'No time series detected (need a date column + numeric column).' };
    return {
      text: `Trend of **${a.timeSeries.metric}** over **${a.timeSeries.column}** (${a.timeSeries.data.length} periods):`,
      bars: a.timeSeries.data.map((d) => ({
        label: d.label,
        value: Number(d[a.timeSeries!.metric] ?? 0),
      })),
    };
  }

  // Top values in a column
  const col = findColumn(question, ds);
  if (col) {
    const sch = ds.schema.find((s) => s.name === col)!;

    if (q.includes('top') || q.includes('most common') || q.includes('breakdown') || q.includes('distribution')) {
      const breakdown = a.breakdowns.find((b) => b.column === col);
      const data = breakdown?.data ?? buildBreakdown(col, ds, a);
      return {
        text: `Top values in **${col}**:`,
        table: { columns: [col, 'Count'], rows: data.slice(0, 10).map((d) => [d.label, d.value]) },
        bars: data.slice(0, 10).map((d) => ({ label: d.label, value: d.value })),
      };
    }

    if (sch.type === 'number') {
      const summary = a.numericSummary.find((s) => s.column === col);
      if (summary) {
        if (q.includes('average') || q.includes('mean') || q.includes('avg')) {
          return { text: `Average of **${col}** is **${formatNumber(summary.mean)}** (across ${ds.rowCount.toLocaleString()} rows).` };
        }
        if (q.includes('total') || q.includes('sum')) {
          return { text: `Total of **${col}** is **${formatNumber(summary.sum)}**.` };
        }
        if (q.includes('min') || q.includes('lowest') || q.includes('smallest')) {
          return { text: `Minimum of **${col}** is **${formatNumber(summary.min)}**.` };
        }
        if (q.includes('max') || q.includes('highest') || q.includes('largest')) {
          return { text: `Maximum of **${col}** is **${formatNumber(summary.max)}**.` };
        }
        if (q.includes('median')) {
          return { text: `Median of **${col}** is **${formatNumber(summary.median)}**.` };
        }
        // Default numeric summary
        return {
          text: `Summary for **${col}**:`,
          table: {
            columns: ['Metric', 'Value'],
            rows: [
              ['Sum', formatNumber(summary.sum)],
              ['Mean', formatNumber(summary.mean)],
              ['Median', formatNumber(summary.median)],
              ['Min', formatNumber(summary.min)],
              ['Max', formatNumber(summary.max)],
              ['Std dev', formatNumber(summary.stdDev)],
            ],
          },
        };
      }
    }

    // Generic: describe column
    return {
      text: `**${col}** is a **${sch.type}** column with ${sch.uniqueCount.toLocaleString()} unique values${sch.missingCount > 0 ? ` and ${sch.missingCount} missing` : ''}.`,
      table: sch.sampleValues.length > 0 ? {
        columns: ['Sample value'],
        rows: sch.sampleValues.slice(0, 5).map((v) => [String(v)]),
      } : undefined,
    };
  }

  // Missing values
  if (q.includes('missing') || q.includes('null') || q.includes('empty')) {
    const withMissing = ds.schema.filter((s) => s.missingCount > 0);
    if (withMissing.length === 0) return { text: 'No missing values in any column. ' };
    return {
      text: `Columns with missing values:`,
      table: {
        columns: ['Column', 'Missing', 'Missing %'],
        rows: withMissing.map((s) => [s.name, s.missingCount, (s.missingPct * 100).toFixed(2) + '%']),
      },
    };
  }

  // Help / fallback
  return {
    text: `I can answer questions like:\n• "How many rows?"\n• "List the columns"\n• "Average of <column>"\n• "Top values in <column>"\n• "Show me the trend"\n• "Forecast"\n• "What insights did you find?"`,
  };
}

function buildBreakdown(col: string, ds: ParsedDataset, _a: DatasetAnalytics): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const row of ds.rows) {
    const v = row[col];
    if (v === null || v === undefined || v === '') continue;
    const k = String(v);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

export default function ChatScreen({ file }: ChatScreenProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reset messages whenever the file changes
  useEffect(() => {
    if (!file?.analytics) {
      setMessages([]);
      return;
    }
    const a = file.analytics;
    setMessages([
      {
        role: 'ai',
        time: nowTime(),
        text: `Hi! I've parsed **${file.name}** — ${file.dataset!.rowCount.toLocaleString()} rows across ${file.dataset!.columns.length} columns. Ask me anything about it.`,
        suggestions: [
          'List the columns',
          'How many rows?',
          ...(a.timeSeries ? [`Show the trend of ${a.timeSeries.metric}`] : []),
          ...(a.breakdowns[0] ? [`Top values in ${a.breakdowns[0].column}`] : []),
          ...(a.forecast ? ['Forecast'] : []),
        ],
      },
    ]);
  }, [file?.id, file?.name, file?.analytics, file?.dataset]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickPrompts = useMemo(() => {
    if (!file?.analytics) return [];
    const a = file.analytics;
    const list: { icon: typeof BarChart3; text: string }[] = [
      { icon: BarChart3, text: 'Summarize all KPIs' },
      { icon: Database, text: 'List the columns' },
    ];
    if (a.timeSeries) list.push({ icon: TrendingUp, text: 'Show the trend' });
    if (a.forecast) list.push({ icon: Brain, text: 'Forecast' });
    list.push({ icon: FileText, text: 'What insights did you find?' });
    return list;
  }, [file?.analytics]);

  if (!file || !file.analytics) return null;

  const handleSend = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setMessages((prev) => [...prev, { role: 'user', text: msg, time: nowTime() }]);
    setInput('');
    setIsTyping(true);
    // Tiny delay so the typing indicator is visible
    setTimeout(() => {
      const result = answer(msg, file);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: result.text,
          time: nowTime(),
          table: result.table,
          bars: result.bars,
        },
      ]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="px-6 py-3 border-b border-slate-700/30" style={{ background: 'rgba(99,102,241,0.05)' }}>
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-2 text-slate-400">
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span>Talking about:</span>
          </div>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            {file.name}
          </span>
          <span className="text-slate-500">{file.dataset!.rowCount.toLocaleString()} rows · {file.dataset!.columns.length} columns</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'ai' ? (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1 glow-purple">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-500 flex items-center justify-center flex-shrink-0 mt-1 text-sm font-bold text-white">
                Y
              </div>
            )}

            <div className={`max-w-2xl space-y-3 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-white rounded-tr-sm'
                    : 'bg-slate-800/80 text-slate-300 border border-slate-700/30 rounded-tl-sm'
                }`}
                style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}
              >
                {msg.text.split('\n').map((line, j) => (
                  <div key={j} className={line === '' ? 'mt-2' : ''}>
                    <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>') }} />
                  </div>
                ))}
              </div>

              {msg.table && (
                <div className="w-full bg-slate-800/60 border border-slate-700/30 rounded-xl p-3 overflow-x-auto">
                  <table className="text-xs min-w-full">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        {msg.table.columns.map((c) => (
                          <th key={c} className="text-left py-2 px-2 text-slate-400 font-semibold">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.table.rows.slice(0, 12).map((row, k) => (
                        <tr key={k} className="border-b border-slate-800/40">
                          {row.map((cell, c) => (
                            <td key={c} className="py-1.5 px-2 text-slate-300">{String(cell).slice(0, 80)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {msg.table.rows.length > 12 && (
                    <p className="text-xs text-slate-500 mt-2">+ {msg.table.rows.length - 12} more rows</p>
                  )}
                </div>
              )}

              {msg.bars && msg.bars.length > 0 && (
                <div className="w-full bg-slate-800/60 border border-slate-700/30 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    Visualization
                  </div>
                  <div className="h-24 flex items-end justify-around gap-1">
                    {msg.bars.map((b, j) => {
                      const max = Math.max(...msg.bars!.map((x) => x.value));
                      const h = max > 0 ? (b.value / max) * 100 : 0;
                      return (
                        <div key={j} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                          <div className="w-full rounded-t" style={{ height: `${Math.max(h, 4)}%`, background: 'linear-gradient(to top, #6366f1, #8b5cf6)', opacity: 0.6 + (j / msg.bars!.length) * 0.4 }} title={`${b.label}: ${formatNumber(b.value)}`}></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-slate-600 overflow-hidden">
                    {msg.bars.slice(0, 8).map((b, j) => <span key={j} className="truncate">{b.label}</span>)}
                  </div>
                </div>
              )}

              {msg.suggestions && msg.suggestions.length > 0 && msg.role === 'ai' && (
                <div className="flex flex-wrap gap-2">
                  {msg.suggestions.map((s, j) => (
                    <button key={j} onClick={() => handleSend(s)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all">
                      {s}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}

              {msg.role === 'ai' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">{msg.time}</span>
                  <button onClick={() => navigator.clipboard?.writeText(msg.text)} className="p-1 rounded hover:bg-slate-700/50 transition-all" title="Copy">
                    <Copy className="w-3 h-3 text-slate-600 hover:text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/30 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
                  ))}
                </div>
                <span className="text-xs text-slate-500 ml-2">Computing on your data…</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}></div>
      </div>

      <div className="px-6 py-3 border-t border-slate-700/20">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickPrompts.map((p, i) => {
            const Icon = p.icon;
            return (
              <button key={i} onClick={() => handleSend(p.text)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 bg-slate-800/60 border border-slate-700/30 hover:border-indigo-500/30 hover:text-indigo-300 transition-all whitespace-nowrap flex-shrink-0">
                <Icon className="w-3.5 h-3.5" />
                {p.text}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-6 pt-2">
        <div className="flex items-end gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 hover:border-indigo-500/30 transition-colors focus-within:border-indigo-500/40">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Ask anything about ${file.name}…`}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none resize-none min-h-[36px] max-h-[120px]"
            rows={1}
          />
          <button onClick={() => handleSend()} disabled={!input.trim()} aria-label="Send"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-slate-600 text-center mt-2">All Q&A computed locally on your dataset · No data leaves your browser</p>
      </div>
    </div>
  );
}
