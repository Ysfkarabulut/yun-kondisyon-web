'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MoistureTestRecord, YunOraniTestRecord, DryingNoteSession } from './types';
import { MoistureCalculator, YunOraniCalculator } from './calculations';
import { Formatting, ParseUtils } from './formatting';

// Helper to share or download PDF on mobile and desktop
export async function shareOrDownloadPdf(doc: jsPDF, filename: string): Promise<void> {
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });

  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
      });
      return;
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.warn('Share failed, falling back to download:', e);
      } else {
        return; // User cancelled share
      }
    }
  }

  // Fallback download
  doc.save(filename);
}

export const PdfGenerator = {
  /**
   * Kondisyon Test Raporu PDF
   */
  async generateMoistureReport(record: MoistureTestRecord): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const metrics = MoistureCalculator.calculateAll({
      lotNo: record.lotNo,
      incomingTotalKg: record.incomingTotalKg,
      grossKg: record.grossKg,
      wetGrams: record.wetGrams,
      dryGrams: record.dryGrams,
      standardMoisturePercent: record.standardMoisturePercent,
      conditionKg: record.conditionKg,
      conditionPercent: record.conditionPercent,
    });

    // Header styling
    doc.setFillColor(30, 58, 138); // Blue 900
    doc.rect(0, 0, 210, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('YÜN KONDİSYON TEST RAPORU', 14, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tarih: ${Formatting.formatDateTime(record.createdAtEpochMs)}`, 140, 15);

    // Build Table Rows
    const rows: [string, string][] = [
      ['Hammadde (Lot No)', record.lotNo || '—'],
      ['Net KG (Nemli)', record.incomingTotalKg ? `${Formatting.formatKg(record.incomingTotalKg)} kg` : '—'],
      ['Brüt KG (Nemli)', record.grossKg ? `${Formatting.formatKg(record.grossKg)} kg` : '—'],
      ['Numune (Nemli)', `${Formatting.formatGrams(record.wetGrams)} g`],
      ['Numune (Kuru)', `${Formatting.formatGrams(record.dryGrams)} g`],
      ['Moisture Content (Nem Oranı)', Formatting.pct(record.moistureContentPercent)],
      ['Regain (Kuru Bazlı Nem)', Formatting.pct(record.regainPercent)],
    ];

    if (metrics?.estimatedDryTotalKg) {
      rows.push(['Total Dry Weight (Toplam Kuru Ağırlık)', `${Formatting.formatKg(metrics.estimatedDryTotalKg)} kg`]);
    }

    rows.push(['Standart Nem (Ticari)', record.standardMoisturePercent ? Formatting.pct(record.standardMoisturePercent) : '—']);

    if (metrics?.standardRegainKg && metrics.standardRegainPercentOfIncoming) {
      const stdLabel = record.standardMoisturePercent
        ? `Regain at ${Formatting.pct(record.standardMoisturePercent)}`
        : 'Regain at Standart Nem';
      rows.push([stdLabel, `${Formatting.formatKg(metrics.standardRegainKg)} kg  |  ${Formatting.pct(metrics.standardRegainPercentOfIncoming)}`]);
    }

    if (metrics?.commercialTotalKg) {
      const commPctStr = metrics.commercialPercentOfIncoming ? `  |  ${Formatting.pct(metrics.commercialPercentOfIncoming)}` : '';
      rows.push(['Invoice Weight As Per Test', `${Formatting.formatKg(metrics.commercialTotalKg)} kg${commPctStr}`]);
    }

    rows.push(['Kondisyon KG (Çeki Listesi)', record.conditionKg ? `${Formatting.formatKg(record.conditionKg)} kg` : '—']);

    if (metrics?.gainKg !== null && metrics?.gainKg !== undefined && metrics?.gainPercentOfIncoming !== null) {
      rows.push(['Gain (Fark)', `${Formatting.formatSignedKg(metrics.gainKg)} kg  |  ${Formatting.pct(metrics.gainPercentOfIncoming)}`]);
    }

    rows.push(['Kondisyon Oranı (Çeki Listesi)', record.conditionPercent ? Formatting.pct(record.conditionPercent) : '—']);

    autoTable(doc, {
      startY: 32,
      head: [['Parametre', 'Değer']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      styles: {
        fontSize: 9.5,
        cellPadding: 3.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 90 },
        1: { cellWidth: 95 },
      },
    });

    // Footnotes / Formulas
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Formül Açıklamaları:', 14, finalY);
    doc.text('• Moisture Content: (Numune (Nemli) - Numune (Kuru)) / Numune (Nemli) * 100', 14, finalY + 4.5);
    doc.text('• Regain: (Numune (Nemli) - Numune (Kuru)) / Numune (Kuru) * 100', 14, finalY + 9);
    doc.text('• Total Dry Weight: Net KG * (Numune (Kuru) / Numune (Nemli))', 14, finalY + 13.5);
    doc.text('• Invoice Weight: Total Dry Weight * (1 + Standart Nem / 100)', 14, finalY + 18);
    doc.text('• Gain: Invoice Weight - Net KG', 14, finalY + 22.5);

    const filename = `Kondisyon_${record.lotNo || 'Test'}_${Formatting.formatDateTime(record.createdAtEpochMs).replace(/[: ]/g, '_')}.pdf`;
    await shareOrDownloadPdf(doc, filename);
  },

  /**
   * Yün Oranı Çoklu veya Tekli Test Raporu (Tek sayfada alt alta kompakt ve çizgili)
   */
  async generateYunOraniReport(tests: YunOraniTestRecord[]): Promise<void> {
    if (tests.length === 0) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Header
    doc.setFillColor(15, 118, 110); // Teal 700
    doc.rect(0, 0, 210, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('YÜN ORANI TEST RAPORU', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 160, 14);

    let currentY = 28;
    const pageHeight = 297;
    const margin = 14;

    tests.forEach((t, idx) => {
      // Find final dry measurements
      const m1Final = t.sample1Measurements.length > 0
        ? [...t.sample1Measurements].sort((a, b) => b.sequence - a.sequence)[0]
        : null;
      const m2Final = t.sample2Measurements.length > 0
        ? [...t.sample2Measurements].sort((a, b) => b.sequence - a.sequence)[0]
        : null;

      const s1Val = m1Final ? ParseUtils.parseDouble(m1Final.value) : null;
      const s2Val = m2Final ? ParseUtils.parseDouble(m2Final.value) : null;

      const ratio = s1Val !== null && s2Val !== null
        ? YunOraniCalculator.calculate(s1Val, s2Val)
        : null;

      // Check if we need a new page
      if (currentY + 45 > pageHeight - 15) {
        doc.addPage();
        currentY = 20;
      }

      // Test Card Block
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY, 182, 40, 2, 2, 'F');

      // Card Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. Lot / Hammadde: ${t.hammaddeLot || '—'}`, margin + 4, currentY + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Tarih: ${Formatting.formatDateTime(t.createdAtEpochMs)}`, margin + 110, currentY + 7);

      // Measurements info
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      const s1GramsStr = Formatting.formatGrams(t.sample1StartGrams);
      const s1FinalStr = s1Val !== null ? `${Formatting.formatGrams(s1Val)} g` : '—';
      doc.text(`Numune 1 (Kostik / Diğer): Başlangıç: ${s1GramsStr} g  |  Son Tartım: ${s1FinalStr}`, margin + 4, currentY + 15);

      const s2GramsStr = Formatting.formatGrams(t.sample2StartGrams);
      const s2FinalStr = s2Val !== null ? `${Formatting.formatGrams(s2Val)} g` : '—';
      doc.text(`Numune 2 (Toplam): Başlangıç: ${s2GramsStr} g  |  Son Tartım: ${s2FinalStr}`, margin + 4, currentY + 22);

      // Result highlight
      doc.setFillColor(240, 253, 250);
      doc.rect(margin + 4, currentY + 26, 174, 9, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      if (ratio) {
        doc.setTextColor(13, 148, 136); // Teal 600
        doc.text(`SONUÇ:  Diğer: ${Formatting.pct(ratio.otherPercent)}    |    Yün: ${Formatting.pct(ratio.woolPercent)}`, margin + 8, currentY + 32);
      } else {
        doc.setTextColor(225, 29, 72);
        doc.text('SONUÇ: Tamamlanmadı (Numune son tartımları eksik)', margin + 8, currentY + 32);
      }

      currentY += 46;

      // Divider line if not last
      if (idx < tests.length - 1) {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(margin, currentY - 2, 210 - margin, currentY - 2);
      }
    });

    // Footnote
    if (currentY + 20 < pageHeight) {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Hesap formülü: Diğer oranı (%) = Numune 1 son tartım / Numune 2 son tartım × 100; Yün oranı (%) = 100 − Diğer', margin, currentY + 6);
    }

    const filename = `Yun_Orani_Raporu_${tests.length}_test_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.pdf`;
    await shareOrDownloadPdf(doc, filename);
  },

  /**
   * Kurutma Notları Seansı PDF Raporu
   */
  async generateDryingSessionReport(session: DryingNoteSession): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Header
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, 210, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('KURUTMA NOTLARI RAPORU', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tarih: ${Formatting.formatDateTime(session.archivedAtEpochMs)}`, 140, 14);

    // Metadata
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Hammadde (Lot No): ${session.hammaddeLot || '—'}`, 14, 32);
    doc.text(`TARE (Dara): ${session.tare ? `${session.tare} g` : '—'}`, 120, 32);

    const sortedRows = [...session.measurements].sort((a, b) => a.sequence - b.sequence);
    const tableBody = sortedRows.map(r => [
      `${r.sequence}. Ölçüm`,
      r.time,
      r.value,
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['Sıra', 'Saat', 'Ölçüm Değeri']],
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
      },
      styles: {
        fontSize: 9.5,
      },
    });

    const filename = `Kurutma_Notlari_${session.hammaddeLot || 'Lot'}.pdf`;
    await shareOrDownloadPdf(doc, filename);
  },
};
