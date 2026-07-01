/**
 * Export Engine — generates multi-format report exports.
 * PDF/CSV: run immediately (no extra load)
 * DOCX / PPTX / Excel: lazy-loaded on demand
 */

// ─── PDF via jsPDF (already installed) ──────────────────────────────────────
export async function exportPDF(reportData, elementId = 'er-report-root') {
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');

  const element = document.getElementById(elementId);
  if (!element) throw new Error('Report element not found for PDF export');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#060D17',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth  = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth   = pageWidth;
  const imgHeight  = (canvas.height * pageWidth) / canvas.width;

  let yOffset = 0;
  while (yOffset < imgHeight) {
    if (yOffset > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, -yOffset, imgWidth, imgHeight);
    yOffset += pageHeight;
  }

  const filename = `ER-Research-${Date.now()}.pdf`;
  pdf.save(filename);
  return filename;
}

// ─── CSV export ──────────────────────────────────────────────────────────────
export function exportCSV(reportData) {
  const stats = reportData?.research?.keyStats || [];
  const rows  = [['Metric', 'Value', 'Unit', 'Date', 'Trend']];
  stats.forEach(s => rows.push([s.label, s.value, s.unit || '', s.date || '', s.trend || '']));

  const indicators = reportData?.finance?.indicators || [];
  indicators.forEach(i => rows.push([i.name, i.value, '', '', i.signal || '']));

  const csv     = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href = url; a.download = `ER-Data-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── DOCX (lazy-loaded) ─────────────────────────────────────────────────────
export async function exportDOCX(reportData) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

  const reportText = reportData?.report || '';
  const lines      = reportText.split('\n');
  const children   = lines.map(line => {
    if (line.startsWith('# ')) return new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 });
    if (line.startsWith('## ')) return new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 });
    if (line.startsWith('### ')) return new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 });
    return new Paragraph({ children: [new TextRun(line.replace(/\*\*([^*]+)\*\*/g, '$1'))] });
  });

  const doc  = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `ER-Report-${Date.now()}.docx`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Excel (lazy-loaded via SheetJS) ─────────────────────────────────────────
export async function exportExcel(reportData) {
  const XLSX = await import('xlsx');
  const wb   = XLSX.utils.book_new();

  // Sheet 1: Key Stats
  const statsData = (reportData?.research?.keyStats || []).map(s =>
    ({ Metric: s.label, Value: s.value, Unit: s.unit || '', Date: s.date || '', Trend: s.trend || '' })
  );
  if (statsData.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statsData), 'Key Statistics');
  }

  // Sheet 2: Financial Indicators
  const indData = (reportData?.finance?.indicators || []).map(i =>
    ({ Indicator: i.name, Value: i.value, Signal: i.signal || '', Implication: i.implication || '' })
  );
  if (indData.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(indData), 'Indicators');
  }

  // Sheet 3: Sources
  const srcData = (reportData?.citation?.scoredSources || []).map(s =>
    ({ Domain: s.domain, Title: s.title, Date: s.date, Credibility: s.credibilityScore, Freshness: s.freshnessScore, Confidence: s.confidenceScore })
  );
  if (srcData.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(srcData), 'Sources');
  }

  XLSX.writeFile(wb, `ER-Data-${Date.now()}.xlsx`);
}

// ─── PPTX (lazy-loaded) ─────────────────────────────────────────────────────
export async function exportPPTX(reportData) {
  const pptxgenjs = await import('pptxgenjs');
  const PptxGenJs = pptxgenjs.default || pptxgenjs;
  const pptx = new PptxGenJs();

  const navy = '060D17';
  const gold  = 'F4A726';

  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
  pptx.layout = 'WIDE';

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: navy };
  titleSlide.addText('ECONOMICAL RESEARCH AI', {
    x: 0.5, y: 1.5, w: 12, h: 1, fontSize: 32, bold: true, color: gold, align: 'center', fontFace: 'Georgia',
  });
  titleSlide.addText(reportData?.query || 'Deep Research Report', {
    x: 0.5, y: 2.8, w: 12, h: 1, fontSize: 20, color: 'FFFFFF', align: 'center',
  });
  titleSlide.addText(`Generated ${new Date().toLocaleDateString()}`, {
    x: 0.5, y: 6.5, w: 12, h: 0.5, fontSize: 11, color: '999999', align: 'center',
  });

  // Key stats slide
  const statsSlide = pptx.addSlide();
  statsSlide.background = { color: navy };
  statsSlide.addText('KEY STATISTICS', { x: 0.5, y: 0.3, w: 12, h: 0.7, fontSize: 18, bold: true, color: gold });
  const stats = reportData?.research?.keyStats?.slice(0, 6) || [];
  stats.forEach((s, i) => {
    const x = 0.5 + (i % 3) * 4.3;
    const y = 1.2 + Math.floor(i / 3) * 2.5;
    statsSlide.addText(s.label, { x, y, w: 4, h: 0.5, fontSize: 11, color: '999999' });
    statsSlide.addText(s.value + (s.unit || ''), { x, y: y + 0.5, w: 4, h: 0.8, fontSize: 22, bold: true, color: 'FFFFFF' });
  });

  // Risk slide
  const riskSlide = pptx.addSlide();
  riskSlide.background = { color: navy };
  riskSlide.addText('FINANCIAL ASSESSMENT', { x: 0.5, y: 0.3, w: 12, h: 0.7, fontSize: 18, bold: true, color: gold });
  riskSlide.addText(`Risk Level: ${reportData?.finance?.riskLevel || 'MEDIUM'}`, {
    x: 0.5, y: 1.2, w: 12, h: 0.8, fontSize: 24, bold: true, color: 'FFFFFF',
  });
  riskSlide.addText(reportData?.finance?.shortTermOutlook?.slice(0, 300) || '', {
    x: 0.5, y: 2.2, w: 12, h: 2, fontSize: 13, color: 'DDDDDD',
  });

  pptx.writeFile({ fileName: `ER-Report-${Date.now()}.pptx` });
}
