import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import pptxgen from 'pptxgenjs';
import type { UploadedFile } from '../types';
import { formatNumber } from './analytics';

export const exportPdfReport = (file: UploadedFile, reportTitle: string) => {
  if (!file.analytics || !file.dataset) throw new Error('No analytics available for this file.');
  const a = file.analytics;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cover
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 120, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(reportTitle, 40, 60);
  doc.setFontSize(11);
  doc.setTextColor(165, 180, 252);
  doc.text(`Source: ${file.name} · ${file.dataset.rowCount} rows × ${file.dataset.columns.length} columns`, 40, 85);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated ${new Date().toLocaleString()}`, 40, 102);

  let y = 150;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text('Key Performance Indicators', 40, y);
  y += 20;

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value', 'Detail']],
    body: a.kpis.map((k) => [k.label, k.value, k.hint ?? '']),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 10 },
  });

  // @ts-expect-error – jspdf-autotable adds lastAutoTable
  y = (doc.lastAutoTable?.finalY ?? y) + 30;

  if (a.numericSummary.length > 0) {
    if (y > 700) { doc.addPage(); y = 60; }
    doc.setFontSize(14);
    doc.text('Numeric Summary', 40, y);
    y += 10;
    autoTable(doc, {
      startY: y + 5,
      head: [['Column', 'Sum', 'Mean', 'Min', 'Max']],
      body: a.numericSummary.map((s) => [
        s.column, formatNumber(s.sum), formatNumber(s.mean),
        formatNumber(s.min), formatNumber(s.max),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 10 },
    });
    // @ts-expect-error
    y = (doc.lastAutoTable?.finalY ?? y) + 30;
  }

  if (a.insights.length > 0) {
    if (y > 650) { doc.addPage(); y = 60; }
    doc.setFontSize(14);
    doc.text('AI Insights', 40, y);
    y += 20;
    doc.setFontSize(10);
    a.insights.forEach((ins) => {
      if (y > 780) { doc.addPage(); y = 60; }
      doc.setTextColor(99, 102, 241);
      doc.text(`[${ins.priority}]`, 40, y);
      doc.setTextColor(15, 23, 42);
      const lines = doc.splitTextToSize(ins.text, pageWidth - 130);
      doc.text(lines, 100, y);
      y += lines.length * 14 + 8;
    });
  }

  if (a.preview.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Data Preview (first 10 rows)', 40, 60);
    autoTable(doc, {
      startY: 80,
      head: [file.dataset.columns.slice(0, 8)],
      body: a.preview.map((row) => file.dataset!.columns.slice(0, 8).map((c) => String(row[c] ?? ''))),
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212] },
      styles: { fontSize: 8 },
    });
  }

  doc.save(`${reportTitle.replace(/\s+/g, '_')}_${file.name.replace(/\.[^.]+$/, '')}.pdf`);
};

export const exportPptDeck = async (file: UploadedFile, deckTitle: string) => {
  if (!file.analytics || !file.dataset) throw new Error('No analytics available for this file.');
  const a = file.analytics;
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = deckTitle;

  // Cover slide
  const cover = pptx.addSlide();
  cover.background = { color: '0F172A' };
  cover.addText(deckTitle, {
    x: 0.5, y: 1.5, w: 12, h: 1.2,
    fontSize: 44, color: 'FFFFFF', bold: true, fontFace: 'Arial',
  });
  cover.addText(`Source: ${file.name} · ${file.dataset.rowCount} rows × ${file.dataset.columns.length} columns`, {
    x: 0.5, y: 2.8, w: 12, h: 0.5,
    fontSize: 18, color: 'A5B4FC', fontFace: 'Arial',
  });
  cover.addText(`Generated ${new Date().toLocaleString()}`, {
    x: 0.5, y: 6.5, w: 12, h: 0.4,
    fontSize: 12, color: '94A3B8', fontFace: 'Arial',
  });

  // KPI slide
  const kpiSlide = pptx.addSlide();
  kpiSlide.background = { color: 'FFFFFF' };
  kpiSlide.addText('Key Performance Indicators', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, bold: true, color: '0F172A' });
  a.kpis.slice(0, 4).forEach((k, i) => {
    const x = 0.5 + (i % 2) * 6.5;
    const y = 1.2 + Math.floor(i / 2) * 2.8;
    kpiSlide.addShape('roundRect', {
      x, y, w: 6, h: 2.5,
      fill: { color: 'F1F5F9' },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.1,
    });
    kpiSlide.addText(k.label, { x: x + 0.3, y: y + 0.2, w: 5.5, h: 0.5, fontSize: 14, color: '64748B' });
    kpiSlide.addText(k.value, { x: x + 0.3, y: y + 0.7, w: 5.5, h: 1, fontSize: 36, bold: true, color: '6366F1' });
    if (k.hint) kpiSlide.addText(k.hint, { x: x + 0.3, y: y + 1.8, w: 5.5, h: 0.5, fontSize: 11, color: '94A3B8' });
  });

  // Trend slide
  if (a.timeSeries && a.timeSeries.data.length > 0) {
    const trendSlide = pptx.addSlide();
    trendSlide.background = { color: 'FFFFFF' };
    trendSlide.addText(`Trend: ${a.timeSeries.metric} over ${a.timeSeries.column}`, {
      x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: '0F172A',
    });
    trendSlide.addChart('line', a.timeSeries.series.map((s) => ({
      name: s,
      labels: a.timeSeries!.data.map((p) => String(p.label)),
      values: a.timeSeries!.data.map((p) => Number(p[s]) || 0),
    })), { x: 0.5, y: 1.2, w: 12, h: 5.5 });
  }

  // Breakdown slides
  a.breakdowns.slice(0, 2).forEach((b) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addText(`Breakdown: ${b.column}`, { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: '0F172A' });
    slide.addChart('bar', [{
      name: b.column,
      labels: b.data.map((p) => p.label),
      values: b.data.map((p) => p.value),
    }], { x: 0.5, y: 1.2, w: 12, h: 5.5 });
  });

  // Insights slide
  const insightsSlide = pptx.addSlide();
  insightsSlide.background = { color: 'FFFFFF' };
  insightsSlide.addText('AI Insights', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, bold: true, color: '0F172A' });
  a.insights.slice(0, 5).forEach((ins, i) => {
    insightsSlide.addText(`${ins.icon}  [${ins.priority}]  ${ins.text}`, {
      x: 0.5, y: 1.2 + i * 1, w: 12, h: 0.9,
      fontSize: 14, color: '1E293B', fontFace: 'Arial',
    });
  });

  await pptx.writeFile({ fileName: `${deckTitle.replace(/\s+/g, '_')}_${file.name.replace(/\.[^.]+$/, '')}.pptx` });
};
