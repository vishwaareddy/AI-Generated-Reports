# NexusIQ

A 100% client-side AI analytics platform built with React 19 + Vite 7 + TypeScript + Tailwind 4. Upload a CSV / Excel / JSON file in the browser and NexusIQ parses it, computes KPIs, charts, insights, and forecasts on the fly — no backend, no API keys, no data leaves the browser.

## Core principle

Nothing appears until real data is uploaded. Every dashboard, report, insight, forecast, and chat answer is derived from the user's actual file. PDF / Word / PowerPoint / SQL files are accepted but explicitly marked unsupported for analytics rather than faked.

## Architecture

- `src/App.tsx` — central state: `files[]`, `selectedFileId`, view routing. Resolves `selectedFile` and gates locked screens behind `readyFiles`.
- `src/types.ts` — single source of truth for `UploadedFile`, `ParsedDataset`, `ColumnSchema`, `DatasetAnalytics`, `KPI`, `InsightItem`, `ForecastResult`, `NumericSummary`.
- `src/lib/parser.ts` — CSV (PapaParse), Excel (SheetJS), JSON parsing → `ParsedDataset` with full per-column schema (type, nulls, missing %, sample values, min/max/sum/mean).
- `src/lib/analytics.ts` — derives KPIs, time series, categorical breakdowns, insights, numeric summary (incl. median + std dev), and a linear-regression forecast (with slope, intercept, R²).
- `src/lib/export.ts` — `exportPdfReport(file, title)` (jspdf + jspdf-autotable) and `exportPptDeck(file, title)` (pptxgenjs).
- `src/screens/*` — every screen reads from `file.dataset` + `file.analytics`. None contain hardcoded business numbers.

## Screens

- **UploadScreen** — drag/drop, parses synchronously in worker-friendly libs, shows status per file.
- **AnalysisScreen** — inspect the parsed dataset (columns, schema, preview rows).
- **DashboardScreen** — KPIs, time series, breakdowns from the active file.
- **ReportsScreen** — generates a markdown-style report with preview modal + PDF export.
- **PresentationsScreen** — real slide outlines + PPTX export via pptxgenjs.
- **InsightsScreen** — sorted list of `InsightItem`s with priority/type chips.
- **ForecastingScreen** — bear/base/bull bands, linear regression coefficients, R² confidence.
- **ChatScreen** — intent-based Q&A (row count, columns, KPIs, insights, forecast, trends, top values, numeric stats, missing values, per-column descriptions). All answers computed live from the uploaded dataset.

## Workflow

`Start application` → `npm run dev` (Vite on `0.0.0.0:5000`).

## Build

`npm run build` produces an inlined single-file `dist/index.html`.
