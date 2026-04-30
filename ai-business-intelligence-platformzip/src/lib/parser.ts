import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ColumnSchema, ColumnType, ParsedDataset } from '../types';

const DATE_REGEX = /^\d{4}-\d{1,2}(-\d{1,2})?$|^\d{1,2}\/\d{1,2}\/\d{2,4}$/;

const detectType = (values: unknown[]): ColumnType => {
  const sample = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (sample.length === 0) return 'string';

  const numericRatio = sample.filter((v) => !isNaN(Number(v)) && typeof v !== 'boolean').length / sample.length;
  if (numericRatio > 0.85) return 'number';

  const dateRatio = sample.filter((v) => {
    if (v instanceof Date) return true;
    if (typeof v === 'string' && DATE_REGEX.test(v.trim())) return true;
    if (typeof v === 'string') {
      const d = new Date(v);
      return !isNaN(d.getTime()) && /\d{4}|\d{1,2}[\/\-]\d{1,2}/.test(v);
    }
    return false;
  }).length / sample.length;
  if (dateRatio > 0.7) return 'date';

  const boolRatio = sample.filter((v) => {
    const s = String(v).toLowerCase();
    return s === 'true' || s === 'false' || s === 'yes' || s === 'no' || s === '0' || s === '1';
  }).length / sample.length;
  if (boolRatio > 0.95 && new Set(sample.map((v) => String(v).toLowerCase())).size <= 2) return 'boolean';

  return 'string';
};

const buildSchema = (columns: string[], rows: Record<string, unknown>[]): ColumnSchema[] => {
  return columns.map((col) => {
    const values = rows.map((r) => r[col]);
    const type = detectType(values);
    const present = values.filter((v) => v !== null && v !== undefined && v !== '');
    const nullCount = rows.length - present.length;
    const uniqueCount = new Set(present.map((v) => String(v))).size;

    const missingPct = rows.length === 0 ? 0 : nullCount / rows.length;
    const sampleValues = Array.from(new Set(present.map((v) => v))).slice(0, 8);

    const schema: ColumnSchema = {
      name: col,
      type,
      nullCount,
      missingCount: nullCount,
      missingPct,
      uniqueCount,
      sampleValues,
    };

    if (type === 'number') {
      const nums = present.map((v) => Number(v)).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        schema.min = Math.min(...nums);
        schema.max = Math.max(...nums);
        schema.sum = nums.reduce((a, b) => a + b, 0);
        schema.mean = schema.sum / nums.length;
      }
    } else if (type === 'date') {
      const dates = present
        .map((v) => (v instanceof Date ? v : new Date(String(v))))
        .filter((d) => !isNaN(d.getTime()))
        .map((d) => d.getTime());
      if (dates.length > 0) {
        schema.min = new Date(Math.min(...dates)).toISOString().slice(0, 10);
        schema.max = new Date(Math.max(...dates)).toISOString().slice(0, 10);
      }
    } else {
      const sorted = Array.from(new Set(present.map((v) => String(v))));
      if (sorted.length > 0) {
        schema.min = sorted[0];
        schema.max = sorted[sorted.length - 1];
      }
    }

    return schema;
  });
};

const buildDataset = (rawRows: Record<string, unknown>[]): ParsedDataset => {
  if (rawRows.length === 0) {
    return { columns: [], rows: [], schema: [], rowCount: 0 };
  }
  const columns = Object.keys(rawRows[0]);
  const cleanedRows = rawRows.map((row) => {
    const out: Record<string, unknown> = {};
    columns.forEach((c) => {
      const v = row[c];
      if (typeof v === 'string') {
        const trimmed = v.trim();
        const num = Number(trimmed);
        if (trimmed !== '' && !isNaN(num) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
          out[c] = num;
        } else {
          out[c] = trimmed;
        }
      } else {
        out[c] = v;
      }
    });
    return out;
  });
  const schema = buildSchema(columns, cleanedRows);
  return { columns, rows: cleanedRows, schema, rowCount: cleanedRows.length };
};

const parseCsv = async (file: File): Promise<ParsedDataset> => {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error('CSV is empty or malformed.'));
          return;
        }
        resolve(buildDataset(results.data));
      },
      error: (err) => reject(err),
    });
  });
};

const parseExcel = async (file: File): Promise<ParsedDataset> => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) throw new Error('Workbook has no sheets.');
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[firstSheet], { defval: null });
  if (json.length === 0) throw new Error('First sheet is empty.');
  return buildDataset(json);
};

const parseJson = async (file: File): Promise<ParsedDataset> => {
  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('JSON file is not valid.');
  }
  let rows: Record<string, unknown>[];
  if (Array.isArray(data)) {
    rows = data.filter((r) => r && typeof r === 'object') as Record<string, unknown>[];
  } else if (data && typeof data === 'object') {
    const candidates = Object.values(data).find((v) => Array.isArray(v));
    if (Array.isArray(candidates)) {
      rows = candidates.filter((r) => r && typeof r === 'object') as Record<string, unknown>[];
    } else {
      rows = [data as Record<string, unknown>];
    }
  } else {
    throw new Error('JSON does not contain a tabular array of objects.');
  }
  if (rows.length === 0) throw new Error('JSON contains no records.');
  return buildDataset(rows);
};

export const detectFileType = (name: string): string => {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (['xlsx', 'xls'].includes(ext)) return 'Excel';
  if (ext === 'csv') return 'CSV';
  if (ext === 'pdf') return 'PDF';
  if (['docx', 'doc'].includes(ext)) return 'Word';
  if (['pptx', 'ppt'].includes(ext)) return 'PowerPoint';
  if (ext === 'sql') return 'SQL';
  if (ext === 'json') return 'JSON';
  return 'File';
};

export const parseFile = async (file: File): Promise<ParsedDataset> => {
  const type = detectFileType(file.name);
  switch (type) {
    case 'CSV': return parseCsv(file);
    case 'Excel': return parseExcel(file);
    case 'JSON': return parseJson(file);
    default:
      throw new Error(`We couldn't process this file. ${type} files aren't supported for analytics — please upload a CSV, Excel, or JSON dataset.`);
  }
};

export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};
