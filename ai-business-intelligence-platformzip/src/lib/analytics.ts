import type {
  CategoricalBreakdown, ChartSeriesPoint, DatasetAnalytics,
  ForecastResult, InsightItem, KPI, MultiSeriesPoint,
  ParsedDataset, TimeSeries
} from '../types';

const formatNumber = (n: number): string => {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toFixed(2);
};

const dateKey = (v: unknown, granularity: 'day' | 'month' | 'year'): string | null => {
  const d = v instanceof Date ? v : new Date(String(v));
  if (isNaN(d.getTime())) return null;
  if (granularity === 'year') return String(d.getFullYear());
  if (granularity === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return d.toISOString().slice(0, 10);
};

const pickGranularity = (dates: Date[]): 'day' | 'month' | 'year' => {
  if (dates.length < 2) return 'month';
  const span = (Math.max(...dates.map((d) => d.getTime())) - Math.min(...dates.map((d) => d.getTime()))) / 86400000;
  if (span > 730) return 'year';
  if (span > 60) return 'month';
  return 'day';
};

const buildTimeSeries = (dataset: ParsedDataset): TimeSeries | null => {
  const dateCol = dataset.schema.find((s) => s.type === 'date');
  if (!dateCol) return null;
  const numericCols = dataset.schema.filter((s) => s.type === 'number').slice(0, 3);
  if (numericCols.length === 0) return null;

  const dates = dataset.rows
    .map((r) => new Date(String(r[dateCol.name])))
    .filter((d) => !isNaN(d.getTime()));
  if (dates.length === 0) return null;

  const gran = pickGranularity(dates);
  const buckets = new Map<string, Record<string, number[]>>();

  dataset.rows.forEach((row) => {
    const key = dateKey(row[dateCol.name], gran);
    if (!key) return;
    if (!buckets.has(key)) buckets.set(key, {});
    const bucket = buckets.get(key)!;
    numericCols.forEach((nc) => {
      const v = Number(row[nc.name]);
      if (!isNaN(v)) {
        if (!bucket[nc.name]) bucket[nc.name] = [];
        bucket[nc.name].push(v);
      }
    });
  });

  const sortedKeys = Array.from(buckets.keys()).sort();
  const data: MultiSeriesPoint[] = sortedKeys.map((key) => {
    const bucket = buckets.get(key)!;
    const point: MultiSeriesPoint = { label: key };
    numericCols.forEach((nc) => {
      const arr = bucket[nc.name] ?? [];
      point[nc.name] = arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0);
    });
    return point;
  });

  return {
    column: dateCol.name,
    metric: numericCols[0].name,
    data,
    series: numericCols.map((c) => c.name),
  };
};

const buildBreakdowns = (dataset: ParsedDataset): CategoricalBreakdown[] => {
  const catCols = dataset.schema
    .filter((s) => s.type === 'string' && s.uniqueCount > 1 && s.uniqueCount <= 12)
    .slice(0, 3);
  const numericMetric = dataset.schema.find((s) => s.type === 'number');

  return catCols.map((cat) => {
    const counts = new Map<string, number>();
    dataset.rows.forEach((row) => {
      const key = String(row[cat.name] ?? 'Unknown').slice(0, 30);
      const inc = numericMetric ? Number(row[numericMetric.name]) || 0 : 1;
      counts.set(key, (counts.get(key) ?? 0) + inc);
    });
    const data: ChartSeriesPoint[] = Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    return { column: cat.name, data };
  });
};

const buildKpis = (dataset: ParsedDataset, ts: TimeSeries | null): KPI[] => {
  const kpis: KPI[] = [];
  kpis.push({
    label: 'Total Records',
    value: formatNumber(dataset.rowCount),
    rawValue: dataset.rowCount,
    hint: `${dataset.columns.length} columns detected`,
  });

  const numericCols = dataset.schema.filter((s) => s.type === 'number').slice(0, 3);
  numericCols.forEach((nc) => {
    if (nc.sum === undefined || nc.mean === undefined) return;
    let change: string | undefined;
    let trend: 'up' | 'down' | 'flat' | undefined;
    if (ts && ts.data.length >= 2 && ts.series.includes(nc.name)) {
      const last = Number(ts.data[ts.data.length - 1][nc.name]);
      const prev = Number(ts.data[ts.data.length - 2][nc.name]);
      if (prev !== 0 && !isNaN(last) && !isNaN(prev)) {
        const pct = ((last - prev) / Math.abs(prev)) * 100;
        change = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
        trend = pct > 0.1 ? 'up' : pct < -0.1 ? 'down' : 'flat';
      }
    }
    kpis.push({
      label: `Total ${nc.name}`,
      value: formatNumber(nc.sum),
      rawValue: nc.sum,
      change,
      trend,
      hint: `Avg ${formatNumber(nc.mean)} · Range ${formatNumber(Number(nc.min))}–${formatNumber(Number(nc.max))}`,
    });
  });

  const catCols = dataset.schema.filter((s) => s.type === 'string' && s.uniqueCount > 1);
  if (catCols.length > 0) {
    const c = catCols[0];
    kpis.push({
      label: `Distinct ${c.name}`,
      value: formatNumber(c.uniqueCount),
      rawValue: c.uniqueCount,
      hint: `${formatNumber(c.nullCount)} missing values`,
    });
  }

  return kpis.slice(0, 4);
};

const buildInsights = (dataset: ParsedDataset, ts: TimeSeries | null, breakdowns: CategoricalBreakdown[]): InsightItem[] => {
  const insights: InsightItem[] = [];

  if (ts && ts.data.length >= 3) {
    const series = ts.series[0];
    const values = ts.data.map((p) => Number(p[series])).filter((v) => !isNaN(v));
    if (values.length >= 3) {
      const first = values[0];
      const last = values[values.length - 1];
      if (first !== 0) {
        const pct = ((last - first) / Math.abs(first)) * 100;
        insights.push({
          type: pct >= 0 ? 'trend' : 'warning',
          icon: pct >= 0 ? '📈' : '📉',
          text: `${series} ${pct >= 0 ? 'grew' : 'declined'} ${Math.abs(pct).toFixed(1)}% across ${ts.data.length} ${ts.data.length === 1 ? 'period' : 'periods'} (${ts.data[0].label} → ${ts.data[ts.data.length - 1].label}).`,
          priority: Math.abs(pct) > 20 ? 'HIGH' : 'MED',
        });
      }
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
      const std = Math.sqrt(variance);
      const outliers = values.filter((v) => Math.abs(v - mean) > 2 * std);
      if (outliers.length > 0) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          text: `${outliers.length} outlier${outliers.length === 1 ? '' : 's'} detected in ${series} (>2σ from the mean of ${formatNumber(mean)}).`,
          priority: outliers.length > 2 ? 'CRITICAL' : 'HIGH',
        });
      }
    }
  }

  breakdowns.slice(0, 2).forEach((b) => {
    if (b.data.length === 0) return;
    const top = b.data[0];
    const total = b.data.reduce((a, p) => a + p.value, 0);
    if (total > 0) {
      const pct = (top.value / total) * 100;
      insights.push({
        type: 'opportunity',
        icon: '💡',
        text: `${top.label} dominates ${b.column} with ${pct.toFixed(1)}% of the total (${formatNumber(top.value)}).`,
        priority: pct > 50 ? 'HIGH' : 'MED',
      });
    }
  });

  const numericCols = dataset.schema.filter((s) => s.type === 'number');
  numericCols.slice(0, 1).forEach((nc) => {
    if (nc.nullCount > 0) {
      const pct = (nc.nullCount / dataset.rowCount) * 100;
      if (pct > 10) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          text: `${nc.name} has ${nc.nullCount} missing values (${pct.toFixed(1)}% of records) — consider data cleaning.`,
          priority: pct > 30 ? 'CRITICAL' : 'MED',
        });
      }
    }
  });

  if (insights.length === 0) {
    insights.push({
      type: 'info',
      icon: 'ℹ️',
      text: `Dataset loaded: ${dataset.rowCount} rows × ${dataset.columns.length} columns. Add a date column or numeric metrics to unlock trend insights.`,
      priority: 'INFO',
    });
  }

  return insights.slice(0, 6);
};

const linearRegressionForecast = (ts: TimeSeries): ForecastResult | null => {
  if (!ts || ts.data.length < 4) return null;
  const series = ts.series[0];
  const ys = ts.data.map((p) => Number(p[series])).filter((v) => !isNaN(v));
  if (ys.length < 4) return null;
  const xs = ys.map((_, i) => i);
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;

  const forecastPoints = 3;
  const meanY = sumY / n;
  const ssRes = ys.reduce((a, y, i) => a + (y - (slope * xs[i] + intercept)) ** 2, 0);
  const ssTot = ys.reduce((a, y) => a + (y - meanY) ** 2, 0) || 1;
  const r2 = Math.max(0, 1 - ssRes / ssTot);

  const history: { label: string; actual: number | null; forecast: number | null }[] =
    ts.data.map((p) => ({
      label: String(p.label),
      actual: Number(p[series]),
      forecast: null,
    }));

  for (let i = 0; i < forecastPoints; i++) {
    const x = n + i;
    history.push({
      label: `+${i + 1}`,
      actual: null,
      forecast: slope * x + intercept,
    });
  }
  // Connect actual to forecast at the boundary
  if (history[n - 1]) {
    history[n - 1].forecast = history[n - 1].actual;
  }

  const lastForecast = (slope * (n + forecastPoints - 1) + intercept);
  const margin = Math.abs(lastForecast) * (1 - r2) * 0.5;
  return {
    metric: series,
    history,
    rangeLow: lastForecast - margin,
    rangeHigh: lastForecast + margin,
    confidence: r2,
    slope,
    intercept,
  };
};

const median = (arr: number[]): number => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const stdDev = (arr: number[], mean: number): number => {
  if (arr.length === 0) return 0;
  const variance = arr.reduce((a, v) => a + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
};

export const analyzeDataset = (dataset: ParsedDataset): DatasetAnalytics => {
  const timeSeries = buildTimeSeries(dataset);
  const breakdowns = buildBreakdowns(dataset);
  const kpis = buildKpis(dataset, timeSeries);
  const insights = buildInsights(dataset, timeSeries, breakdowns);
  const forecast = timeSeries ? linearRegressionForecast(timeSeries) : null;

  const numericSummary = dataset.schema
    .filter((s) => s.type === 'number' && s.sum !== undefined && s.mean !== undefined)
    .map((s) => {
      const nums = dataset.rows
        .map((r) => Number(r[s.name]))
        .filter((n) => !isNaN(n));
      return {
        column: s.name,
        min: Number(s.min ?? 0),
        max: Number(s.max ?? 0),
        mean: s.mean!,
        sum: s.sum!,
        median: median(nums),
        stdDev: stdDev(nums, s.mean!),
      };
    });

  const categoricalSummary = dataset.schema
    .filter((s) => s.type === 'string')
    .slice(0, 5)
    .map((s) => ({
      column: s.name,
      distinct: s.uniqueCount,
      top: String(s.max ?? '—'),
    }));

  const preview = dataset.rows.slice(0, 10);

  return {
    kpis,
    timeSeries,
    breakdowns,
    insights,
    forecast,
    numericSummary,
    categoricalSummary,
    preview,
  };
};

export { formatNumber };
