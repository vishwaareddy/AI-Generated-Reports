export type UploadStatus = 'queued' | 'parsing' | 'analyzing' | 'ready' | 'error';

export type ColumnType = 'number' | 'date' | 'string' | 'boolean';

export interface ColumnSchema {
  name: string;
  type: ColumnType;
  nullCount: number;
  missingCount: number;
  missingPct: number;
  uniqueCount: number;
  sampleValues: unknown[];
  min?: number | string;
  max?: number | string;
  sum?: number;
  mean?: number;
}

export interface ParsedDataset {
  columns: string[];
  rows: Record<string, unknown>[];
  schema: ColumnSchema[];
  rowCount: number;
}

export interface KPI {
  label: string;
  value: string;
  rawValue: number;
  change?: string;
  trend?: 'up' | 'down' | 'flat';
  hint?: string;
}

export interface ChartSeriesPoint {
  label: string;
  value: number;
}

export interface MultiSeriesPoint {
  label: string;
  [key: string]: string | number;
}

export interface CategoricalBreakdown {
  column: string;
  data: ChartSeriesPoint[];
}

export interface TimeSeries {
  column: string;
  metric: string;
  data: MultiSeriesPoint[];
  series: string[];
}

export interface InsightItem {
  type: 'opportunity' | 'warning' | 'trend' | 'prediction' | 'info' | 'outlier' | 'positive';
  icon: string;
  text: string;
  priority: 'CRITICAL' | 'HIGH' | 'MED' | 'LOW' | 'INFO';
  column?: string;
}

export type Insight = InsightItem;

export interface ForecastResult {
  metric: string;
  history: { label: string; actual: number | null; forecast: number | null }[];
  rangeLow: number;
  rangeHigh: number;
  confidence: number;
  slope: number;
  intercept: number;
}

export interface NumericSummary {
  column: string;
  min: number;
  max: number;
  mean: number;
  sum: number;
  median: number;
  stdDev: number;
}

export interface DatasetAnalytics {
  kpis: KPI[];
  timeSeries: TimeSeries | null;
  breakdowns: CategoricalBreakdown[];
  insights: InsightItem[];
  forecast: ForecastResult | null;
  numericSummary: NumericSummary[];
  categoricalSummary: { column: string; distinct: number; top: string }[];
  preview: Record<string, unknown>[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  type: string;
  status: UploadStatus;
  progress: number;
  errorMessage?: string;
  dataset?: ParsedDataset;
  analytics?: DatasetAnalytics;
}

export const SUPPORTED_FOR_ANALYTICS = ['Excel', 'CSV', 'JSON'] as const;
