import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportReportOptions {
  title: string;
  subtitle?: string;
  restaurantName?: string;
  dateRange?: string;
  headers: string[];
  rows: (string | number)[][];
  summaryMetrics?: { label: string; value: string | number }[];
  filename?: string;
}

export interface ReceiptExportData {
  receiptNumber: string;
  orderNumber?: string;
  tableNumber?: string | number;
  customerName?: string;
  cashierName?: string;
  waiterName?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  date: string;
  paymentMethod: string;
  currency?: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  amountReceived?: number;
  changeAmount?: number;
  footerMessage?: string;
}

// ─── 1. PDF EXPORT GENERATOR (jsPDF + autoTable) ───
export const exportToPdf = (options: ExportReportOptions) => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Primary Brand Colors
    const navyColor = [11, 22, 48]; // #0B1630
    const orangeColor = [249, 115, 22]; // #F97316
    const grayColor = [100, 116, 139]; // #64748B
    const bgLight = [248, 250, 252]; // #F8FAFC

    // Header Bar
    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(0, 0, pageWidth, 24, 'F');

    // Brand Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('DHADHAN HUB', 14, 12);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.text('Smart Restaurant. Simple Success.', 14, 18);

    // Restaurant Name & Export Timestamp
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(options.restaurantName || 'DHADHAN HQ', pageWidth - 14, 12, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Exported: ${new Date().toLocaleString()}`, pageWidth - 14, 18, { align: 'right' });

    // Document Title & Subtitle
    let startY = 32;
    doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title.toUpperCase(), 14, startY);

    if (options.subtitle || options.dateRange) {
      startY += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      const subText = [options.subtitle, options.dateRange ? `Range: ${options.dateRange}` : '']
        .filter(Boolean)
        .join(' | ');
      doc.text(subText, 14, startY);
    }

    // Summary Metrics Cards (if provided)
    if (options.summaryMetrics && options.summaryMetrics.length > 0) {
      startY += 8;
      const cardWidth = Math.min(60, (pageWidth - 28) / options.summaryMetrics.length - 4);
      options.summaryMetrics.forEach((metric, i) => {
        const x = 14 + i * (cardWidth + 4);
        doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
        doc.roundedRect(x, startY, cardWidth, 14, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, startY, cardWidth, 14, 2, 2, 'S');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(metric.label.toUpperCase(), x + 4, startY + 5);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
        doc.text(String(metric.value), x + 4, startY + 11);
      });
      startY += 18;
    } else {
      startY += 8;
    }

    // Table Generation via autoTable
    autoTable(doc, {
      startY: startY,
      head: [options.headers],
      body: options.rows.map((row) => row.map(String)),
      theme: 'grid',
      headStyles: {
        fillColor: [11, 22, 48],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14, bottom: 16 },
      didDrawPage: (data) => {
        // Footer Page Numbering
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        const pageStr = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`;
        doc.text(pageStr, pageWidth - 14, pageHeight - 8, { align: 'right' });
        doc.text('Dhadhan Hub Multi-Tenant Platform — Confidentially Generated', 14, pageHeight - 8);
      },
    });

    const defaultFilename = `${options.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(options.filename || defaultFilename);
  } catch (error) {
    console.error('[exportToPdf] Error generating PDF:', error);
    throw new Error('Failed to generate valid PDF document.');
  }
};

// ─── 2. EXCEL (.xlsx) EXPORT GENERATOR (SheetJS / XLSX) ───
export const exportToExcel = (options: ExportReportOptions) => {
  try {
    const wb = XLSX.utils.book_new();

    // Prepare Worksheet Data
    const sheetData: any[][] = [];

    // Title & Subtitle Headers
    sheetData.push(['DHADHAN HUB — ' + options.title.toUpperCase()]);
    if (options.restaurantName) {
      sheetData.push(['Restaurant Workspace: ' + options.restaurantName]);
    }
    if (options.dateRange) {
      sheetData.push(['Date Range: ' + options.dateRange]);
    }
    sheetData.push(['Exported Date: ' + new Date().toLocaleString()]);
    sheetData.push([]); // Blank separator

    // Summary Metrics Section (if present)
    if (options.summaryMetrics && options.summaryMetrics.length > 0) {
      sheetData.push(['SUMMARY METRICS']);
      options.summaryMetrics.forEach((m) => {
        sheetData.push([m.label, m.value]);
      });
      sheetData.push([]); // Blank separator
    }

    // Main Table Headers & Rows
    sheetData.push(options.headers);
    options.rows.forEach((row) => sheetData.push(row));

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Auto-calculate Column Widths
    const maxCols = Math.max(...sheetData.map((r) => r.length));
    const colWidths = [];
    for (let c = 0; c < maxCols; c++) {
      let maxLen = 10;
      sheetData.forEach((row) => {
        if (row[c] !== undefined && row[c] !== null) {
          const valStr = String(row[c]);
          if (valStr.length > maxLen) maxLen = valStr.length;
        }
      });
      colWidths.push({ wch: Math.min(maxLen + 4, 50) });
    }
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, options.title.slice(0, 31) || 'Report');

    const defaultFilename = `${options.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, options.filename || defaultFilename);
  } catch (error) {
    console.error('[exportToExcel] Error generating Excel workbook:', error);
    throw new Error('Failed to generate Excel (.xlsx) file.');
  }
};

// ─── 3. CSV EXPORT GENERATOR (UTF-8 BOM + RFC 4180 Escaping) ───
export const exportToCsv = (options: ExportReportOptions) => {
  try {
    const escapeCsvField = (field: string | number | boolean | null | undefined): string => {
      if (field === null || field === undefined) return '""';
      const str = String(field);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const csvLines: string[] = [];

    // Header Row
    csvLines.push(options.headers.map(escapeCsvField).join(','));

    // Data Rows
    options.rows.forEach((row) => {
      csvLines.push(row.map(escapeCsvField).join(','));
    });

    // UTF-8 BOM Prefix (\uFEFF) ensures Excel opens special characters cleanly
    const csvContent = '\uFEFF' + csvLines.join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    const defaultFilename = `${options.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    element.download = options.filename || defaultFilename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[exportToCsv] Error generating CSV file:', error);
    throw new Error('Failed to generate CSV file.');
  }
};

// ─── 4. RECEIPT PDF EXPORT GENERATOR ───
export const exportReceiptPdf = (receipt: ReceiptExportData) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200], // 80mm thermal receipt format
    });

    const pageWidth = 80;

    // Header Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(11, 22, 48);
    doc.text(receipt.restaurantName || 'DHADHAN HUB', pageWidth / 2, 10, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    if (receipt.restaurantAddress) {
      doc.text(receipt.restaurantAddress, pageWidth / 2, 14, { align: 'center' });
    }
    if (receipt.restaurantPhone) {
      doc.text(`Tel: ${receipt.restaurantPhone}`, pageWidth / 2, 18, { align: 'center' });
    }

    // Divider Line
    let y = receipt.restaurantAddress || receipt.restaurantPhone ? 22 : 16;
    doc.setDrawColor(226, 232, 240);
    doc.line(6, y, pageWidth - 6, y);
    y += 5;

    // Receipt Meta Details
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 22, 48);
    doc.text(`RECEIPT: #${receipt.receiptNumber}`, 6, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    if (receipt.orderNumber) {
      doc.text(`Order #: ${receipt.orderNumber}`, 6, y);
      y += 4;
    }
    if (receipt.tableNumber) {
      doc.text(`Table: Table ${receipt.tableNumber}`, 6, y);
      y += 4;
    }
    doc.text(`Date: ${receipt.date}`, 6, y);
    y += 4;
    doc.text(`Payment: ${receipt.paymentMethod}`, 6, y);
    y += 4;
    if (receipt.cashierName) {
      doc.text(`Cashier: ${receipt.cashierName}`, 6, y);
      y += 4;
    }
    if (receipt.waiterName) {
      doc.text(`Waiter: ${receipt.waiterName}`, 6, y);
      y += 4;
    }

    doc.line(6, y, pageWidth - 6, y);
    y += 4;

    // Items Table
    const curr = receipt.currency || 'ETB';
    autoTable(doc, {
      startY: y,
      head: [['QTY', 'ITEM', 'TOTAL']],
      body: receipt.items.map((i) => [
        `${i.quantity}x`,
        i.name,
        `${curr} ${i.totalPrice.toFixed(2)}`,
      ]),
      theme: 'plain',
      styles: {
        fontSize: 7.5,
        cellPadding: 1,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fontStyle: 'bold',
        textColor: [11, 22, 48],
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 42 },
        2: { cellWidth: 20, halign: 'right' },
      },
      margin: { left: 6, right: 6 },
    });

    y = (doc as any).lastAutoTable.finalY + 4;
    doc.line(6, y, pageWidth - 6, y);
    y += 5;

    // Financial Totals
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 6, y);
    doc.text(`${curr} ${receipt.subtotal.toFixed(2)}`, pageWidth - 6, y, { align: 'right' });
    y += 4;

    if (receipt.discountAmount && receipt.discountAmount > 0) {
      doc.text('Discount:', 6, y);
      doc.text(`-${curr} ${receipt.discountAmount.toFixed(2)}`, pageWidth - 6, y, { align: 'right' });
      y += 4;
    }

    doc.text('Tax:', 6, y);
    doc.text(`${curr} ${receipt.taxAmount.toFixed(2)}`, pageWidth - 6, y, { align: 'right' });
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(249, 115, 22);
    doc.text('TOTAL PAID:', 6, y);
    doc.text(`${curr} ${receipt.totalAmount.toFixed(2)}`, pageWidth - 6, y, { align: 'right' });
    y += 6;

    // Footer Message
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(receipt.footerMessage || 'Thank you for dining with us!', pageWidth / 2, y, { align: 'center' });

    const filename = `Receipt_${receipt.receiptNumber}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('[exportReceiptPdf] Error generating receipt PDF:', error);
    throw new Error('Failed to generate receipt PDF.');
  }
};
