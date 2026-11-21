'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MoistureTestRecord, YunOraniTestRecord, DryingNoteSession } from './types';
import { MoistureCalculator, YunOraniCalculator } from './calculations';
import { Formatting, ParseUtils } from './formatting';
import { geistFontBase64 } from './fontBase64';

/**
 * Creates a jsPDF document preconfigured with the Turkish-supported Geist UTF-8 font
 */
function createGeistDoc(orientation: 'portrait' | 'landscape' = 'portrait'): jsPDF {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  if (geistFontBase64) {
    doc.addFileToVFS('Geist.ttf', geistFontBase64);
    doc.addFont('Geist.ttf', 'Geist', 'normal');
    doc.addFont('Geist.ttf', 'Geist', 'bold');
    doc.setFont('Geist', 'normal');
  }

  return doc;
}

/**
 * Directly downloads the PDF file to the user's device (Phone Downloads / PC Downloads)
 */
export function downloadPdfFile(doc: jsPDF, filename: string): void {
  try {
    doc.save(filename);
  } catch (err) {
    // Fallback using Blob & Anchor click for maximum mobile browser compatibility
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }
}

/**
 * Opens mobile native share sheet (WhatsApp, Mail, AirDrop, etc.)
 * Sets clean email subject title and falls back to download if share is unsupported or fails
 */
export async function sharePdfFile(
  doc: jsPDF,
  filename: string,
  title: string = 'Kondisyon Test Raporu'
): Promise<void> {
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });

  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: title,
      });
      return;
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return; // User intentionally cancelled share dialog
      }
      console.warn('Share error, falling back to direct download:', e);
    }
  }

  downloadPdfFile(doc, filename);
}

export const PdfGenerator = {
  /**
   * Helper to build Kondisyon Test Report Document
   */
  buildMoistureDoc(record: MoistureTestRecord): { doc: jsPDF; filename: string } {
    const doc = createGeistDoc('portrait');

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

    // Header styling - High contrast dark blue banner
    doc.setFillColor(30, 58, 138); // Blue 900
    doc.rect(0, 0, 210, 26, 'F');

    // Title on left
    doc.setTextColor(255, 255, 255);
    doc.setFont('Geist', 'bold');
    doc.setFontSize(14);
    doc.text('YÜN KONDİSYON TEST RAPORU', 14, 12);

    // Subtitle on left
    doc.setFont('Geist', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.text('Tekstil Laboratuvar Nem ve Ticari Kondisyon Analiz Raporu', 14, 19);

    // Date on right (using right alignment to prevent ANY text collision)
    doc.setFont('Geist', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Tarih: ${Formatting.formatDateTime(record.createdAtEpochMs)}`, 196, 15, { align: 'right' });

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
      rows.push(['Invoice Weight as per Test (Ticari Ağırlık)', `${Formatting.formatKg(metrics.commercialTotalKg)} kg${commPctStr}`]);
    }

    rows.push(['Kondisyon KG (Çeki Listesi)', record.conditionKg ? `${Formatting.formatKg(record.conditionKg)} kg` : '—']);

    if (metrics?.gainKg !== null && metrics?.gainKg !== undefined && metrics?.gainPercentOfIncoming !== null) {
      rows.push(['Gain (Kazanım / Fark)', `${Formatting.formatSignedKg(metrics.gainKg)} kg  |  ${Formatting.pct(metrics.gainPercentOfIncoming)}`]);
    }

    rows.push(['Kondisyon Oranı % (Çeki Listesi)', record.conditionPercent ? Formatting.pct(record.conditionPercent) : '—']);

    autoTable(doc, {
      startY: 34,
      head: [['Parametre', 'Değer']],
      body: rows,
      theme: 'grid',
      styles: {
        font: 'Geist',
        fontStyle: 'normal',
        fontSize: 9.5,
        cellPadding: 3.5,
        textColor: [15, 23, 42],
      },
      headStyles: {
        font: 'Geist',
        fontStyle: 'bold',
        fillColor: [30, 58, 138],
        textColor: 255,
        fontSize: 10,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 92 },
        1: { cellWidth: 92 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // Footnotes / Formulas with proper UTF-8 Geist font
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont('Geist', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Formül Açıklamaları:', 14, finalY);

    doc.setFont('Geist', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('• Moisture Content: (Numune (Nemli) - Numune (Kuru)) / Numune (Nemli) × 100', 14, finalY + 4.5);
    doc.text('• Regain: (Numune (Nemli) - Numune (Kuru)) / Numune (Kuru) × 100', 14, finalY + 9);
    doc.text('• Total Dry Weight: Net KG × (Numune (Kuru) / Numune (Nemli))', 14, finalY + 13.5);
    doc.text('• Invoice Weight: Total Dry Weight × (1 + Standart Nem / 100)', 14, finalY + 18);
    doc.text('• Gain: Invoice Weight - Net KG', 14, finalY + 22.5);
    doc.text('• Kondisyon Oranı (Çeki): ((Kondisyon KG - Net KG) / Net KG) × 100', 14, finalY + 27);

    const cleanLot = (record.lotNo || 'Test').replace(/[\/\\:*?"<>|]/g, ' ').trim();
    const cleanDate = Formatting.formatDateTime(record.createdAtEpochMs).replace(/:/g, '.');
    const filename = `Kondisyon ${cleanLot} ${cleanDate}.pdf`;
    return { doc, filename };
  },

  async downloadMoistureReport(record: MoistureTestRecord): Promise<void> {
    const { doc, filename } = this.buildMoistureDoc(record);
    downloadPdfFile(doc, filename);
  },

  async shareMoistureReport(record: MoistureTestRecord): Promise<void> {
    const { doc, filename } = this.buildMoistureDoc(record);
    await sharePdfFile(doc, filename, 'Kondisyon Test Raporu');
  },

  // Backward compatibility alias
  async generateMoistureReport(record: MoistureTestRecord): Promise<void> {
    return this.downloadMoistureReport(record);
  },

  /**
   * Helper to build Yün Oranı Report Document
   */
  buildYunOraniDoc(tests: YunOraniTestRecord[]): { doc: jsPDF; filename: string } {
    const doc = createGeistDoc('portrait');

    // Header banner
    doc.setFillColor(15, 118, 110); // Teal 700
    doc.rect(0, 0, 210, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Geist', 'bold');
    doc.setFontSize(14);
    doc.text('YÜN ORANI TEST RAPORU', 14, 12);

    doc.setFont('Geist', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(204, 251, 241); // Teal 100
    doc.text('Kostik ve Yıkama Karışım Analizleri Raporu', 14, 19);

    doc.setFont('Geist', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 196, 15, { align: 'right' });

    let currentY = 32;
    const pageHeight = 297;
    const margin = 14;

    tests.forEach((t, idx) => {
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

      // Check page break
      if (currentY + 45 > pageHeight - 15) {
        doc.addPage();
        currentY = 20;
      }

      // Test Card Block
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY, 182, 40, 2, 2, 'F');

      // Card Header
      doc.setFont('Geist', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. Lot / Hammadde: ${t.hammaddeLot || '—'}`, margin + 4, currentY + 7);

      doc.setFont('Geist', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Tarih: ${Formatting.formatDateTime(t.createdAtEpochMs)}`, margin + 178, currentY + 7, { align: 'right' });

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

      doc.setFont('Geist', 'bold');
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
    if (currentY + 15 < pageHeight) {
      doc.setFont('Geist', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Hesap formülü: Diğer oranı (%) = Numune 1 son tartım / Numune 2 son tartım × 100; Yün oranı (%) = 100 − Diğer', margin, currentY + 6);
    }

    const dateStr = new Date().toLocaleDateString('tr-TR');
    const filename = `Yün Oranı Raporu ${tests.length} Test ${dateStr}.pdf`;
    return { doc, filename };
  },

  async downloadYunOraniReport(tests: YunOraniTestRecord[]): Promise<void> {
    if (tests.length === 0) return;
    const { doc, filename } = this.buildYunOraniDoc(tests);
    downloadPdfFile(doc, filename);
  },

  async shareYunOraniReport(tests: YunOraniTestRecord[]): Promise<void> {
    if (tests.length === 0) return;
    const { doc, filename } = this.buildYunOraniDoc(tests);
    await sharePdfFile(doc, filename, 'Yün Oranı Test Raporu');
  },

  // Backward compatibility alias
  async generateYunOraniReport(tests: YunOraniTestRecord[]): Promise<void> {
    return this.downloadYunOraniReport(tests);
  },

  /**
   * Helper to build Drying Session Report Document
   */
  buildDryingSessionDoc(session: DryingNoteSession): { doc: jsPDF; filename: string } {
    const doc = createGeistDoc('portrait');

    // Header banner
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, 210, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Geist', 'bold');
    doc.setFontSize(14);
    doc.text('KURUTMA NOTLARI RAPORU', 14, 12);

    doc.setFont('Geist', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(224, 231, 255); // Indigo 100
    doc.text('Fırın Tartım Takip ve Dara Analizi', 14, 19);

    doc.setFont('Geist', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Tarih: ${Formatting.formatDateTime(session.archivedAtEpochMs)}`, 196, 15, { align: 'right' });

    // Metadata
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('Geist', 'bold');
    doc.text(`Hammadde (Lot No): ${session.hammaddeLot || '—'}`, 14, 34);
    doc.text(`TARE (Dara): ${session.tare ? `${session.tare} g` : '—'}`, 120, 34);

    const sortedRows = [...session.measurements].sort((a, b) => a.sequence - b.sequence);
    const tableBody = sortedRows.map(r => [
      `${r.sequence}. Ölçüm`,
      r.time,
      r.value,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Sıra', 'Saat', 'Ölçüm Değeri']],
      body: tableBody,
      theme: 'striped',
      styles: {
        font: 'Geist',
        fontSize: 9.5,
      },
      headStyles: {
        font: 'Geist',
        fontStyle: 'bold',
        fillColor: [79, 70, 229],
        textColor: 255,
      },
    });

    const cleanLot = (session.hammaddeLot || 'Lot').replace(/[\/\\:*?"<>|]/g, ' ').trim();
    const cleanDate = Formatting.formatDateTime(session.archivedAtEpochMs).replace(/:/g, '.');
    const filename = `Kurutma Notları ${cleanLot} ${cleanDate}.pdf`;
    return { doc, filename };
  },

  async downloadDryingSessionReport(session: DryingNoteSession): Promise<void> {
    const { doc, filename } = this.buildDryingSessionDoc(session);
    downloadPdfFile(doc, filename);
  },

  async shareDryingSessionReport(session: DryingNoteSession): Promise<void> {
    const { doc, filename } = this.buildDryingSessionDoc(session);
    await sharePdfFile(doc, filename, 'Kurutma Notları Raporu');
  },

  // Backward compatibility alias
  async generateDryingSessionReport(session: DryingNoteSession): Promise<void> {
    return this.downloadDryingSessionReport(session);
  },
};
