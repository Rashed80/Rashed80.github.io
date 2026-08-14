import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Client, Payment, Physiotherapist, ReportingPeriod } from '../types';
import { FITBACK_LOGO_DATA_URI } from '../assets/logoData';
import {
  evaluateClientCommission,
  getCommissionMonthMetadata,
  getCurrentRealtimeMonthKey,
  ClientCommissionQualification,
} from './commissionRules';

// Professional Subtle Color Palette (RGB tuples for jsPDF)
const PALETTE = {
  // Brand & Core
  brandTeal: [15, 118, 110],       // #0F766E - Refined Deep Teal
  brandTealDark: [17, 94, 89],     // #115E59
  brandTealLight: [240, 253, 250], // #F0FDFA - Very soft teal tint
  brandTealBorder: [204, 251, 241],// #CCFBF1
  
  // Accents
  accentRose: [225, 29, 72],       // #E11D48 - Subtle Rose
  accentRoseLight: [255, 241, 242],// #FFF1F2
  accentAmber: [180, 83, 9],       // #B45309 - Warm Amber for partials
  accentAmberLight: [254, 243, 199],// #FEF3C7
  accentGreen: [22, 101, 52],      // #166534 - Forest Green for cleared
  accentGreenLight: [236, 253, 245],// #ECFDF5
  
  // Neutrals
  slate900: [15, 23, 42],          // #0F172A - Main Text
  slate800: [30, 41, 59],          // #1E293B - Headings
  slate600: [71, 85, 105],         // #475569 - Secondary Text
  slate400: [148, 163, 184],       // #94A3B8 - Muted Text / Labels
  slate200: [226, 232, 240],       // #E2E8F0 - Subtle Dividers & Borders
  slate100: [241, 245, 249],       // #F1F5F9 - Table Alternate Rows
  slate50: [248, 250, 252],        // #F8FAFC - Card Backgrounds
  white: [255, 255, 255],
};

// Helper to format BDT Currency cleanly
const formatBDT = (amount: number): string => {
  return `BDT ${Math.round(amount).toLocaleString('en-US')}`;
};

// Helper to format clean readable dates (e.g. "04 Aug 2026")
const formatPrettyDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2].padStart(2, '0');
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// Helper to format timestamp
const getFormattedTimestamp = (): string => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return now.toLocaleDateString('en-GB', options);
};

/**
 * Standard Executive Header with Fitback Reset branding
 * Supports full top banner on Page 1 and compact running banner on Page 2+
 */
const drawDocumentHeader = (
  doc: jsPDF,
  pageWidth: number,
  margin: number,
  reportTitle: string,
  docSubTitle: string,
  metaLine1: string,
  metaLine2: string,
  metaLine3: string,
  pageNumber = 1
) => {
  if (pageNumber === 1) {
    // Header Background: Clean white with subtle bottom border
    doc.setFillColor(PALETTE.white[0], PALETTE.white[1], PALETTE.white[2]);
    doc.rect(0, 0, pageWidth, 32, 'F');

    // Subtle Two-Tone Accent Line at Header Bottom (Teal & Rose)
    doc.setFillColor(PALETTE.brandTeal[0], PALETTE.brandTeal[1], PALETTE.brandTeal[2]);
    doc.rect(0, 31, pageWidth * 0.7, 1.2, 'F');
    doc.setFillColor(PALETTE.accentRose[0], PALETTE.accentRose[1], PALETTE.accentRose[2]);
    doc.rect(pageWidth * 0.7, 31, pageWidth * 0.3, 1.2, 'F');

    // Brand Logo on Left
    try {
      doc.addImage(FITBACK_LOGO_DATA_URI, 'PNG', margin, 4.5, 36, 16.5);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(PALETTE.brandTeal[0], PALETTE.brandTeal[1], PALETTE.brandTeal[2]);
      doc.text('FITBACK RESET', margin, 13);
    }

    // Clinic Sub-Brand text under logo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text('Specialized Physiotherapy & Rehabilitation Center', margin, 23.5);
    doc.text('Uttara / Dhanmondi Clinic • Dhaka, Bangladesh', margin, 27);

    // Right-aligned Document Classification & Metadata
    const rightX = pageWidth - margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]);
    doc.text(reportTitle.toUpperCase(), rightX, 9.5, { align: 'right' });

    // Subtitle badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(PALETTE.accentRose[0], PALETTE.accentRose[1], PALETTE.accentRose[2]);
    doc.text(docSubTitle, rightX, 14.5, { align: 'right' });

    // Metadata lines in soft slate
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(metaLine1, rightX, 19.5, { align: 'right' });
    doc.text(metaLine2, rightX, 23.5, { align: 'right' });
    doc.text(metaLine3, rightX, 27.5, { align: 'right' });
  } else {
    // Compact Running Header for Page 2+
    doc.setFillColor(PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]);
    doc.rect(0, 0, pageWidth, 13, 'F');
    doc.setFillColor(PALETTE.brandTeal[0], PALETTE.brandTeal[1], PALETTE.brandTeal[2]);
    doc.rect(0, 12.4, pageWidth, 0.6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]);
    doc.text(`FITBACK RESET  •  ${reportTitle.toUpperCase()}`, margin, 8.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`${docSubTitle}  |  ${metaLine1}`, pageWidth - margin, 8.5, { align: 'right' });
  }
};

/**
 * Standard Running Footer with Page Numbers and Security Badge
 */
const drawDocumentFooter = (
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  documentType: string
) => {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(PALETTE.slate200[0], PALETTE.slate200[1], PALETTE.slate200[2]);
    doc.setLineWidth(0.25);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(PALETTE.slate400[0], PALETTE.slate400[1], PALETTE.slate400[2]);
    doc.text(
      `Fitback Reset Practice Management  •  ${documentType}  •  Confidential Financial Record`,
      margin,
      pageHeight - 6
    );
    doc.text(
      `Generated: ${getFormattedTimestamp()}   |   Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: 'right' }
    );
  }
};

export class PdfReportGenerator {
  /**
   * Generates an elegant, user-friendly A4 Client Payment Statement PDF with subtle colors
   */
  static generateClientStatementPDF(
    client: Client,
    payments: Payment[],
    physio?: Physiotherapist,
    period?: ReportingPeriod
  ): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    // Header Banner
    drawDocumentHeader(
      doc,
      pageWidth,
      margin,
      'CLIENT PAYMENT STATEMENT',
      `STATEMENT #${client.id}`,
      `Issue Date: ${formatPrettyDate(new Date().toISOString().split('T')[0])}`,
      `Billing Account: ${client.phone || 'Standard'}`,
      `Period: ${period?.name || 'All Treatment Cycles'}`
    );

    let currentY = 37;

    // 1. Client & Treatment Info Section (Two subtle cards side-by-side)
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const dueAmount = Math.max(0, client.finalAmount - totalPaid);
    const isFullyPaid = dueAmount === 0;

    const infoCardWidth = (pageWidth - margin * 2 - 4) / 2;
    const infoCardHeight = 31;

    // Left Card: Client Information
    doc.setFillColor(PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]);
    doc.setDrawColor(PALETTE.slate200[0], PALETTE.slate200[1], PALETTE.slate200[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, infoCardWidth, infoCardHeight, 2, 2, 'FD');

    // Left Card Header Line
    doc.setFillColor(PALETTE.brandTeal[0], PALETTE.brandTeal[1], PALETTE.brandTeal[2]);
    doc.rect(margin, currentY, infoCardWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]);
    doc.text('CLIENT PROFILE', margin + 4, currentY + 6);

    doc.setFontSize(9);
    doc.setTextColor(PALETTE.slate900[0], PALETTE.slate900[1], PALETTE.slate900[2]);
    doc.text(client.name, margin + 4, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Client ID:`, margin + 4, currentY + 17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.slate800[0], PALETTE.slate800[1], PALETTE.slate800[2]);
    doc.text(client.id, margin + 20, currentY + 17);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Contact:`, margin + 4, currentY + 22);
    doc.setTextColor(PALETTE.slate800[0], PALETTE.slate800[1], PALETTE.slate800[2]);
    doc.text(client.phone || 'N/A', margin + 20, currentY + 22);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Enrolled Date:`, margin + 4, currentY + 27);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.brandTeal[0], PALETTE.brandTeal[1], PALETTE.brandTeal[2]);
    doc.text(formatPrettyDate(client.enrollmentDate), margin + 24, currentY + 27);

    // Right Card: Treatment Package & Assigned Staff
    const rightCardX = margin + infoCardWidth + 4;
    doc.setFillColor(PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]);
    doc.setDrawColor(PALETTE.slate200[0], PALETTE.slate200[1], PALETTE.slate200[2]);
    doc.roundedRect(rightCardX, currentY, infoCardWidth, infoCardHeight, 2, 2, 'FD');

    // Right Card Header Line
    doc.setFillColor(PALETTE.brandTeal[0], PALETTE.brandTeal[1], PALETTE.brandTeal[2]);
    doc.rect(rightCardX, currentY, infoCardWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]);
    doc.text('THERAPY PACKAGE DETAILS', rightCardX + 4, currentY + 6);

    doc.setFontSize(9);
    doc.setTextColor(PALETTE.slate900[0], PALETTE.slate900[1], PALETTE.slate900[2]);
    doc.text(client.packageName, rightCardX + 4, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Assigned Physio:`, rightCardX + 4, currentY + 17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.slate800[0], PALETTE.slate800[1], PALETTE.slate800[2]);
    doc.text(physio?.name || 'Unassigned', rightCardX + 28, currentY + 17);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`List Price:`, rightCardX + 4, currentY + 22);
    doc.setTextColor(PALETTE.slate800[0], PALETTE.slate800[1], PALETTE.slate800[2]);
    doc.text(formatBDT(client.packagePrice), rightCardX + 28, currentY + 22);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Agreed Fee:`, rightCardX + 4, currentY + 27);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.brandTeal[0], PALETTE.brandTeal[1], PALETTE.brandTeal[2]);
    doc.text(formatBDT(client.finalAmount), rightCardX + 28, currentY + 27);

    currentY += 35;

    // 2. Financial Summary Cards (3 Columns with subtle tinted backgrounds)
    const kpiWidth = (pageWidth - margin * 2 - 6) / 3;
    const kpiHeight = 18;

    // KPI 1: Agreed Package
    doc.setFillColor(PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]);
    doc.setDrawColor(PALETTE.slate200[0], PALETTE.slate200[1], PALETTE.slate200[2]);
    doc.roundedRect(margin, currentY, kpiWidth, kpiHeight, 1.8, 1.8, 'FD');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text('AGREED PACKAGE VALUE', margin + 3.5, currentY + 5);
    doc.setFontSize(10.5);
    doc.setTextColor(PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]);
    doc.text(formatBDT(client.finalAmount), margin + 3.5, currentY + 13.5);

    // KPI 2: Total Paid
    const kpi2X = margin + kpiWidth + 3;
    doc.setFillColor(PALETTE.accentGreenLight[0], PALETTE.accentGreenLight[1], PALETTE.accentGreenLight[2]);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(kpi2X, currentY, kpiWidth, kpiHeight, 1.8, 1.8, 'FD');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.accentGreen[0], PALETTE.accentGreen[1], PALETTE.accentGreen[2]);
    doc.text('TOTAL AMOUNT PAID', kpi2X + 3.5, currentY + 5);
    doc.setFontSize(10.5);
    doc.text(formatBDT(totalPaid), kpi2X + 3.5, currentY + 13.5);

    // KPI 3: Due Balance
    const kpi3X = kpi2X + kpiWidth + 3;
    if (isFullyPaid) {
      doc.setFillColor(PALETTE.accentGreenLight[0], PALETTE.accentGreenLight[1], PALETTE.accentGreenLight[2]);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(kpi3X, currentY, kpiWidth, kpiHeight, 1.8, 1.8, 'FD');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PALETTE.accentGreen[0], PALETTE.accentGreen[1], PALETTE.accentGreen[2]);
      doc.text('OUTSTANDING DUE', kpi3X + 3.5, currentY + 5);
      doc.setFontSize(10);
      doc.text('BDT 0 (CLEARED / 100%)', kpi3X + 3.5, currentY + 13.5);
    } else {
      doc.setFillColor(PALETTE.accentAmberLight[0], PALETTE.accentAmberLight[1], PALETTE.accentAmberLight[2]);
      doc.setDrawColor(253, 230, 138);
      doc.roundedRect(kpi3X, currentY, kpiWidth, kpiHeight, 1.8, 1.8, 'FD');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PALETTE.accentAmber[0], PALETTE.accentAmber[1], PALETTE.accentAmber[2]);
      doc.text('OUTSTANDING BALANCE', kpi3X + 3.5, currentY + 5);
      doc.setFontSize(10.5);
      doc.text(formatBDT(dueAmount), kpi3X + 3.5, currentY + 13.5);
    }

    currentY += 23;

    // 3. Payment Transactions History Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(PALETTE.slate800[0], PALETTE.slate800[1], PALETTE.slate800[2]);
    doc.text('PAYMENT TRANSACTIONS REGISTER', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text('Itemized receipts and installment history credited toward this treatment plan', margin, currentY + 4);

    currentY += 6.5;

    const tableBody = payments.map((p, index) => [
      (payments.length - index).toString(),
      formatPrettyDate(p.paymentDate || p.createdAt.split('T')[0]),
      p.id,
      p.paymentMethod.toUpperCase(),
      p.reference || 'REF-STD',
      formatBDT(p.amount),
      p.notes || 'Treatment installment',
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 25 },
      head: [['#', 'Payment Date', 'Receipt ID', 'Method', 'Reference #', 'Amount Paid', 'Notes / Description']],
      body:
        tableBody.length > 0
          ? tableBody
          : [['-', 'No payment recorded', '-', '-', '-', 'BDT 0', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]],
        textColor: [255, 255, 255],
        fontSize: 7.2,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: [PALETTE.slate900[0], PALETTE.slate900[1], PALETTE.slate900[2]],
        valign: 'middle',
      },
      alternateRowStyles: {
        fillColor: [PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 26, halign: 'center' },
        2: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 24, halign: 'center' },
        4: { cellWidth: 26 },
        5: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [PALETTE.accentGreen[0], PALETTE.accentGreen[1], PALETTE.accentGreen[2]] },
        6: { cellWidth: 'auto' },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;

    // Signatures
    if (finalY < pageHeight - 35) {
      doc.setDrawColor(PALETTE.slate200[0], PALETTE.slate200[1], PALETTE.slate200[2]);
      doc.line(margin, finalY + 14, margin + 55, finalY + 14);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
      doc.text('Authorized Clinic Signatory', margin, finalY + 18);

      doc.line(pageWidth - margin - 55, finalY + 14, pageWidth - margin, finalY + 14);
      doc.text('Client Signature / Acknowledgement', pageWidth - margin - 55, finalY + 18);
    }

    drawDocumentFooter(doc, pageWidth, pageHeight, margin, 'Client Statement');
    return doc;
  }

  /**
   * Generates a high-precision, executive-ready A4 PDF Report for an INDIVIDUAL Physiotherapist.
   * Adheres to the 15th of the month Commission Payment Rule with subtle, user-friendly colors.
   */
  static generateIndividualPhysioReportPDF(
    physio: Physiotherapist,
    clients: Client[],
    payments: Payment[],
    _settlements?: any[],
    period?: ReportingPeriod
  ): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    // Determine Commission Month Metadata dynamically
    const selectedMonthKey = period?.id && period.id.includes('-') ? period.id : getCurrentRealtimeMonthKey();
    const meta = getCommissionMonthMetadata(selectedMonthKey);

    // Filter assigned clients & payments for this physiotherapist
    const physioClients = clients.filter((c) => c.physiotherapistId === physio.id && !c.archived);
    const physioPayments = payments.filter((p) => p.physiotherapistId === physio.id);

    // Evaluate each client against the 15th Payout Commission Rule
    const allEvaluated = physioClients.map((c) =>
      evaluateClientCommission(c, physioPayments, [physio], selectedMonthKey)
    );

    const qualifyingClients = allEvaluated.filter((e) => e.qualifiesForSelectedMonth);
    const pendingClients = allEvaluated.filter((e) => e.qualificationStatus === 'PENDING_PAYMENT');

    const totalQualifyingPackageValue = qualifyingClients.reduce(
      (sum, e) => sum + e.client.finalAmount,
      0
    );
    const totalEarnedCommission = qualifyingClients.reduce(
      (sum, e) => sum + e.commissionAmount,
      0
    );
    const pendingDueBalance = pendingClients.reduce(
      (sum, e) => sum + e.dueAmount,
      0
    );

    // Header Banner
    drawDocumentHeader(
      doc,
      pageWidth,
      margin,
      'STAFF COMMISSION STATEMENT',
      `PAYOUT CYCLE: ${meta.commissionMonthName.toUpperCase()}`,
      `Commission Payout Date: ${meta.payoutDateFormatted}`,
      `Qualifying Cycle: Full Paid in ${meta.qualifyingMonthName}`,
      `Staff ID: ${physio.id} • Agreed Rate: ${physio.commissionRate}%`
    );

    let currentY = 36;

    // 1. Staff Profile & Payout Status Bar (Subtle Soft Tinted Card)
    doc.setFillColor(PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]);
    doc.setDrawColor(PALETTE.slate200[0], PALETTE.slate200[1], PALETTE.slate200[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'FD');

    // Left Column: Staff Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(PALETTE.slate900[0], PALETTE.slate900[1], PALETTE.slate900[2]);
    doc.text(physio.name, margin + 4, currentY + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`${physio.title}   •   Phone: ${physio.phone || 'N/A'}`, margin + 4, currentY + 11.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]);
    doc.text(`Commission Model: ${physio.commissionRate}% on 100% Cleared Package Fees`, margin + 4, currentY + 17.5);

    // Right Column: Summary Badges
    const boxRightX = pageWidth - margin - 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Qualifying Clients: ${qualifyingClients.length} cases`, boxRightX, currentY + 6.5, { align: 'right' });
    doc.text(`Qualifying Volume: ${formatBDT(totalQualifyingPackageValue)}`, boxRightX, currentY + 11.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]);
    doc.text(`Payable on ${meta.payoutDateFormatted}: ${formatBDT(totalEarnedCommission)}`, boxRightX, currentY + 17.5, { align: 'right' });

    currentY += 28;

    // 2. Executive 4-Card KPI Grid (Subtle, Clean)
    const cardGap = 3;
    const cardWidth = (pageWidth - margin * 2 - cardGap * 3) / 4;
    const cardHeight = 18;

    // Card 1: Net Commission Payout (Soft Teal Tint)
    doc.setFillColor(PALETTE.brandTealLight[0], PALETTE.brandTealLight[1], PALETTE.brandTealLight[2]);
    doc.setDrawColor(PALETTE.brandTealBorder[0], PALETTE.brandTealBorder[1], PALETTE.brandTealBorder[2]);
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.8, 1.8, 'FD');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]);
    doc.text('NET COMMISSION PAYOUT', margin + 3, currentY + 4.5);
    doc.setFontSize(10);
    doc.text(formatBDT(totalEarnedCommission), margin + 3, currentY + 11.5);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Payable on ${meta.payoutDateFormatted}`, margin + 3, currentY + 15.5);

    // Card 2: Qualifying Volume (Soft Green Tint)
    const card2X = margin + cardWidth + cardGap;
    doc.setFillColor(PALETTE.accentGreenLight[0], PALETTE.accentGreenLight[1], PALETTE.accentGreenLight[2]);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 1.8, 1.8, 'FD');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.accentGreen[0], PALETTE.accentGreen[1], PALETTE.accentGreen[2]);
    doc.text('QUALIFYING REVENUE', card2X + 3, currentY + 4.5);
    doc.setFontSize(10);
    doc.text(formatBDT(totalQualifyingPackageValue), card2X + 3, currentY + 11.5);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`${qualifyingClients.length} cleared client packages`, card2X + 3, currentY + 15.5);

    // Card 3: Pending Balance (Soft Amber Tint)
    const card3X = card2X + cardWidth + cardGap;
    doc.setFillColor(PALETTE.accentAmberLight[0], PALETTE.accentAmberLight[1], PALETTE.accentAmberLight[2]);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 1.8, 1.8, 'FD');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.accentAmber[0], PALETTE.accentAmber[1], PALETTE.accentAmber[2]);
    doc.text('PARTIAL / UNCLEARED DUES', card3X + 3, currentY + 4.5);
    doc.setFontSize(10);
    doc.text(formatBDT(pendingDueBalance), card3X + 3, currentY + 11.5);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`${pendingClients.length} ongoing cases`, card3X + 3, currentY + 15.5);

    // Card 4: Payout Schedule (Subtle Neutral Card)
    const card4X = card3X + cardWidth + cardGap;
    doc.setFillColor(PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]);
    doc.setDrawColor(PALETTE.slate200[0], PALETTE.slate200[1], PALETTE.slate200[2]);
    doc.roundedRect(card4X, currentY, cardWidth, cardHeight, 1.8, 1.8, 'FD');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text('SETTLEMENT CYCLE', card4X + 3, currentY + 4.5);
    doc.setFontSize(8.5);
    doc.setTextColor(PALETTE.slate900[0], PALETTE.slate900[1], PALETTE.slate900[2]);
    doc.text(meta.commissionMonthName, card4X + 3, currentY + 11);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.accentRose[0], PALETTE.accentRose[1], PALETTE.accentRose[2]);
    doc.text(`On ${meta.payoutDateFormatted}`, card4X + 3, currentY + 15.5);

    currentY += 23;

    // 3. Section 1: Qualifying Clients Table (100% Cleared)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(PALETTE.slate800[0], PALETTE.slate800[1], PALETTE.slate800[2]);
    doc.text(`1. QUALIFYING CLIENTS — FULL PAYMENT COMPLETED IN ${meta.qualifyingMonthName.toUpperCase()}`, margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Cases completed 100% of payment during ${meta.qualifyingRangeLabel} and qualify for the ${meta.payoutDateFormatted} payout.`, margin, currentY + 3.5);

    currentY += 5.5;

    const qualRows = qualifyingClients.map((item, idx) => {
      return [
        (idx + 1).toString(),
        item.client.name,
        formatPrettyDate(item.client.enrollmentDate),
        item.client.packageName,
        formatBDT(item.client.finalAmount),
        formatPrettyDate(item.fullPaymentDate) || 'Completed',
        `${physio.commissionRate}%`,
        formatBDT(item.commissionAmount),
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 35 },
      head: [
        [
          '#',
          'Client Name',
          'Enrolled Date',
          'Therapy Package',
          'Package Fee',
          'Full Paid Date',
          'Rate',
          'Commission Earned',
        ],
      ],
      body:
        qualRows.length > 0
          ? qualRows
          : [['-', `No client completed 100% full payment during ${meta.qualifyingMonthName}`, '-', '-', '-', '-', '-', 'BDT 0']],
      theme: 'grid',
      headStyles: {
        fillColor: [PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [PALETTE.slate900[0], PALETTE.slate900[1], PALETTE.slate900[2]],
        valign: 'middle',
      },
      alternateRowStyles: {
        fillColor: [PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]],
      },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 32 },
        4: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 22, halign: 'center' },
        6: { cellWidth: 12, halign: 'center' },
        7: { cellWidth: 25, halign: 'right', fontStyle: 'bold', textColor: [PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]] },
      },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 7;

    // 4. Section 2: Partial Payment / Ongoing Clients (With Enrollment Dates)
    if (pendingClients.length > 0) {
      if (finalY > pageHeight - 55) {
        doc.addPage();
        finalY = 16;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(PALETTE.slate800[0], PALETTE.slate800[1], PALETTE.slate800[2]);
      doc.text('2. PARTIAL PAYMENT CLIENTS — AWAITING FULL CLEARANCE', margin, finalY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
      doc.text('Ongoing installment plans. Commission will qualify on the 15th of the month following 100% full clearance.', margin, finalY + 3.5);

      finalY += 5.5;

      const pendingRows = pendingClients.map((pItem, idx) => {
        return [
          (idx + 1).toString(),
          pItem.client.name,
          formatPrettyDate(pItem.client.enrollmentDate),
          pItem.client.packageName,
          formatBDT(pItem.client.finalAmount),
          formatBDT(pItem.totalPaid),
          formatBDT(pItem.dueAmount),
          'Awaiting Clearance',
        ];
      });

      autoTable(doc, {
        startY: finalY,
        margin: { left: margin, right: margin, bottom: 35 },
        head: [
          [
            '#',
            'Client Name',
            'Enrolled Date',
            'Therapy Package',
            'Total Fee',
            'Paid So Far',
            'Due Balance',
            'Commission Status',
          ],
        ],
        body: pendingRows,
        theme: 'grid',
        headStyles: {
          fillColor: [PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
        },
        bodyStyles: {
          fontSize: 6.8,
          textColor: [PALETTE.slate900[0], PALETTE.slate900[1], PALETTE.slate900[2]],
          valign: 'middle',
        },
        alternateRowStyles: {
          fillColor: [PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]],
        },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          1: { cellWidth: 42, fontStyle: 'bold' },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 32 },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [PALETTE.accentGreen[0], PALETTE.accentGreen[1], PALETTE.accentGreen[2]] },
          6: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [PALETTE.accentAmber[0], PALETTE.accentAmber[1], PALETTE.accentAmber[2]] },
          7: { cellWidth: 22, halign: 'center', fontStyle: 'italic' },
        },
      });

      finalY = (doc as any).lastAutoTable.finalY + 7;
    }

    // Check if enough space for the Grand Settlement Voucher
    if (finalY > pageHeight - 45) {
      doc.addPage();
      finalY = 16;
    }

    // 5. Grand Settlement Voucher Box (Subtle, Clean Bordered Box with Teal Accent)
    doc.setFillColor(PALETTE.brandTealLight[0], PALETTE.brandTealLight[1], PALETTE.brandTealLight[2]);
    doc.setDrawColor(PALETTE.brandTealBorder[0], PALETTE.brandTealBorder[1], PALETTE.brandTealBorder[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, finalY, pageWidth - margin * 2, 26, 2, 2, 'FD');

    // Subtle Accent Stripe
    doc.setFillColor(PALETTE.brandTeal[0], PALETTE.brandTeal[1], PALETTE.brandTeal[2]);
    doc.rect(margin, finalY, 1.8, 26, 'F');

    // Voucher Content
    doc.setTextColor(PALETTE.slate900[0], PALETTE.slate900[1], PALETTE.slate900[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`OFFICIAL SETTLEMENT VOUCHER — ${meta.commissionMonthName.toUpperCase()}`, margin + 6, finalY + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Beneficiary: ${physio.name} (${physio.title})   •   Rate: ${physio.commissionRate}%`, margin + 6, finalY + 12);
    doc.text(`Settlement Cycle: Payable on ${meta.payoutDateFormatted} via Clinic Direct Transfer`, margin + 6, finalY + 17);
    doc.text(`Basis: ${qualifyingClients.length} client cases fully cleared in ${meta.qualifyingMonthName} (${formatBDT(totalQualifyingPackageValue)})`, margin + 6, finalY + 22);

    // Big Total Commission Right-Aligned
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]);
    doc.text('TOTAL COMMISSION PAYABLE', pageWidth - margin - 5, finalY + 6.5, { align: 'right' });

    doc.setFontSize(13);
    doc.text(formatBDT(totalEarnedCommission), pageWidth - margin - 5, finalY + 15, { align: 'right' });

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Disbursement Date: ${meta.payoutDateFormatted}`, pageWidth - margin - 5, finalY + 21, { align: 'right' });

    finalY += 33;

    // Dual Signature Lines
    if (finalY < pageHeight - 20) {
      doc.setDrawColor(PALETTE.slate200[0], PALETTE.slate200[1], PALETTE.slate200[2]);
      doc.line(margin, finalY + 8, margin + 55, finalY + 8);
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
      doc.text('Clinic Director / Accounts Authorized', margin, finalY + 12);

      doc.line(pageWidth - margin - 55, finalY + 8, pageWidth - margin, finalY + 8);
      doc.text(`Physiotherapist Signature (${physio.name})`, pageWidth - margin - 55, finalY + 12);
    }

    drawDocumentFooter(doc, pageWidth, pageHeight, margin, `Staff Commission Statement - ${physio.name}`);
    return doc;
  }

  /**
   * Generates a Master Physiotherapist Performance & Practice Commission A4 Summary PDF.
   * Compiles all staff members, their qualifying package volumes, and practice-wide totals with subtle colors.
   */
  static generateStaffPerformancePDF(
    physiotherapists: Physiotherapist[],
    clients: Client[],
    payments: Payment[],
    _settlements?: any[],
    period?: ReportingPeriod
  ): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    const selectedMonthKey = period?.id && period.id.includes('-') ? period.id : getCurrentRealtimeMonthKey();
    const meta = getCommissionMonthMetadata(selectedMonthKey);

    // Filter active clients
    const activeClients = clients.filter((c) => !c.archived);

    // Header Banner
    drawDocumentHeader(
      doc,
      pageWidth,
      margin,
      'PRACTICE COMMISSION MASTER REPORT',
      `PERIOD: ${meta.commissionMonthName.toUpperCase()}`,
      `Commission Payout Date: ${meta.payoutDateFormatted}`,
      `Qualifying Full-Payment Cycle: ${meta.qualifyingRangeLabel}`,
      `Active Physiotherapists: ${physiotherapists.length}`
    );

    let currentY = 36;

    let totalPracticeCommission = 0;
    let totalPracticeQualifyingPackages = 0;
    let totalQualifyingClientCount = 0;

    // Evaluate practice staff rows
    const staffSummaryRows = physiotherapists.map((physio) => {
      const physioClients = activeClients.filter((c) => c.physiotherapistId === physio.id);
      const physioPayments = payments.filter((p) => p.physiotherapistId === physio.id);

      const allEvaluated = physioClients.map((c) =>
        evaluateClientCommission(c, physioPayments, [physio], selectedMonthKey)
      );

      const qualifying = allEvaluated.filter((e) => e.qualifiesForSelectedMonth);
      const qualifyingPackageVal = qualifying.reduce((sum, e) => sum + e.client.finalAmount, 0);
      const earnedCommission = qualifying.reduce((sum, e) => sum + e.commissionAmount, 0);

      totalPracticeQualifyingPackages += qualifyingPackageVal;
      totalPracticeCommission += earnedCommission;
      totalQualifyingClientCount += qualifying.length;

      return [
        physio.name,
        physio.title,
        `${physio.commissionRate}%`,
        qualifying.length.toString(),
        formatBDT(qualifyingPackageVal),
        meta.payoutDateFormatted,
        formatBDT(earnedCommission),
      ];
    });

    // 1. Executive Practice KPI Grid (Subtle, Clean)
    const cardGap = 3;
    const cardWidth = (pageWidth - margin * 2 - cardGap * 3) / 4;
    const cardHeight = 18;

    // Card 1: Total Practice Commission (Soft Teal)
    doc.setFillColor(PALETTE.brandTealLight[0], PALETTE.brandTealLight[1], PALETTE.brandTealLight[2]);
    doc.setDrawColor(PALETTE.brandTealBorder[0], PALETTE.brandTealBorder[1], PALETTE.brandTealBorder[2]);
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.8, 1.8, 'FD');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]);
    doc.text('TOTAL PRACTICE COMMISSION', margin + 3, currentY + 4.5);
    doc.setFontSize(10);
    doc.text(formatBDT(totalPracticeCommission), margin + 3, currentY + 11.5);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Due ${meta.payoutDateFormatted}`, margin + 3, currentY + 15.5);

    // Card 2: Qualifying Volume (Soft Green)
    const card2X = margin + cardWidth + cardGap;
    doc.setFillColor(PALETTE.accentGreenLight[0], PALETTE.accentGreenLight[1], PALETTE.accentGreenLight[2]);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 1.8, 1.8, 'FD');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.accentGreen[0], PALETTE.accentGreen[1], PALETTE.accentGreen[2]);
    doc.text('QUALIFYING PACKAGES', card2X + 3, currentY + 4.5);
    doc.setFontSize(10);
    doc.text(formatBDT(totalPracticeQualifyingPackages), card2X + 3, currentY + 11.5);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`${totalQualifyingClientCount} qualifying cases`, card2X + 3, currentY + 15.5);

    // Card 3: Staff Count (Soft Neutral)
    const card3X = card2X + cardWidth + cardGap;
    doc.setFillColor(PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]);
    doc.setDrawColor(PALETTE.slate200[0], PALETTE.slate200[1], PALETTE.slate200[2]);
    doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 1.8, 1.8, 'FD');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text('ACTIVE STAFF MEMBERS', card3X + 3, currentY + 4.5);
    doc.setFontSize(10);
    doc.setTextColor(PALETTE.slate900[0], PALETTE.slate900[1], PALETTE.slate900[2]);
    doc.text(`${physiotherapists.length} Specialists`, card3X + 3, currentY + 11.5);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`All rates verified`, card3X + 3, currentY + 15.5);

    // Card 4: Schedule
    const card4X = card3X + cardWidth + cardGap;
    doc.setFillColor(PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]);
    doc.setDrawColor(PALETTE.slate200[0], PALETTE.slate200[1], PALETTE.slate200[2]);
    doc.roundedRect(card4X, currentY, cardWidth, cardHeight, 1.8, 1.8, 'FD');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text('PAYOUT DATE', card4X + 3, currentY + 4.5);
    doc.setFontSize(8.5);
    doc.setTextColor(PALETTE.accentRose[0], PALETTE.accentRose[1], PALETTE.accentRose[2]);
    doc.text(meta.payoutDateFormatted, card4X + 3, currentY + 11);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`For ${meta.qualifyingMonthName} cases`, card4X + 3, currentY + 15.5);

    currentY += 23;

    // 2. Staff Summary Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(PALETTE.slate800[0], PALETTE.slate800[1], PALETTE.slate800[2]);
    doc.text('1. STAFF PERFORMANCE & COMMISSION SUMMARY', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Consolidated breakdown of commission allocations for ${meta.commissionMonthName} (paid on ${meta.payoutDateFormatted})`, margin, currentY + 3.5);

    currentY += 5.5;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 35 },
      head: [
        [
          'Physiotherapist',
          'Title / Specialization',
          'Comm Rate',
          'Qualifying Cases',
          'Qualifying Volume',
          'Payout Date',
          'Total Earned Commission',
        ],
      ],
      body: staffSummaryRows,
      theme: 'grid',
      headStyles: {
        fillColor: [PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [PALETTE.slate900[0], PALETTE.slate900[1], PALETTE.slate900[2]],
        valign: 'middle',
      },
      alternateRowStyles: {
        fillColor: [PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]],
      },
      columnStyles: {
        0: { cellWidth: 36, fontStyle: 'bold' },
        1: { cellWidth: 34 },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 26, halign: 'right' },
        5: { cellWidth: 24, halign: 'center' },
        6: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]] },
      },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 7;

    // 3. Compile all clients for itemized practice register
    const allPracticeEvaluated: ClientCommissionQualification[] = [];
    activeClients.forEach((client) => {
      const clientPayments = payments.filter((p) => p.clientId === client.id);
      const evalResult = evaluateClientCommission(client, clientPayments, physiotherapists, selectedMonthKey);
      allPracticeEvaluated.push(evalResult);
    });

    const practiceQualifyingClients = allPracticeEvaluated.filter((e) => e.qualifiesForSelectedMonth);
    const practicePendingClients = allPracticeEvaluated.filter((e) => e.qualificationStatus === 'PENDING_PAYMENT');

    // Section 2: Practice Qualifying Clients (Fully Paid)
    if (practiceQualifyingClients.length > 0) {
      if (finalY > pageHeight - 55) {
        doc.addPage();
        finalY = 16;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(PALETTE.slate800[0], PALETTE.slate800[1], PALETTE.slate800[2]);
      doc.text(`2. PRACTICE QUALIFYING CLIENTS REGISTER (${meta.qualifyingMonthName.toUpperCase()})`, margin, finalY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
      doc.text(`Full payment completed in ${meta.qualifyingMonthName}. Qualifying for commission disbursement on ${meta.payoutDateFormatted}.`, margin, finalY + 3.5);

      finalY += 5.5;

      const qualRows = practiceQualifyingClients.map((qItem, idx) => {
        const physio = physiotherapists.find((p) => p.id === qItem.client.physiotherapistId);

        return [
          (idx + 1).toString(),
          qItem.client.name,
          formatPrettyDate(qItem.client.enrollmentDate),
          qItem.client.packageName,
          physio?.name || 'Unassigned',
          formatBDT(qItem.client.finalAmount),
          formatPrettyDate(qItem.fullPaymentDate) || 'Completed',
          `${physio?.commissionRate || 0}%`,
          formatBDT(qItem.commissionAmount),
        ];
      });

      autoTable(doc, {
        startY: finalY,
        margin: { left: margin, right: margin, bottom: 35 },
        head: [
          [
            '#',
            'Client Name',
            'Enrolled Date',
            'Therapy Package',
            'Assigned Physio',
            'Total Fee',
            'Full Paid Date',
            'Rate',
            'Commission',
          ],
        ],
        body: qualRows,
        theme: 'grid',
        headStyles: {
          fillColor: [PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
        },
        bodyStyles: {
          fontSize: 6.8,
          textColor: [PALETTE.slate900[0], PALETTE.slate900[1], PALETTE.slate900[2]],
          valign: 'middle',
        },
        alternateRowStyles: {
          fillColor: [PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]],
        },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          1: { cellWidth: 38, fontStyle: 'bold' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 28 },
          4: { cellWidth: 26 },
          5: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
          6: { cellWidth: 20, halign: 'center' },
          7: { cellWidth: 12, halign: 'center' },
          8: { cellWidth: 21, halign: 'right', fontStyle: 'bold', textColor: [PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]] },
        },
      });

      finalY = (doc as any).lastAutoTable.finalY + 7;
    }

    // Section 3: Partial Payment Practice Register
    if (practicePendingClients.length > 0) {
      if (finalY > pageHeight - 55) {
        doc.addPage();
        finalY = 16;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(PALETTE.slate800[0], PALETTE.slate800[1], PALETTE.slate800[2]);
      doc.text('3. PRACTICE PARTIAL PAYMENT REGISTER (IN PROGRESS)', margin, finalY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
      doc.text('Ongoing treatment packages awaiting remaining dues. Commission will be credited upon full clearance.', margin, finalY + 3.5);

      finalY += 5.5;

      const pendingRows = practicePendingClients.map((pItem, idx) => {
        const physio = physiotherapists.find((p) => p.id === pItem.client.physiotherapistId);

        return [
          (idx + 1).toString(),
          pItem.client.name,
          formatPrettyDate(pItem.client.enrollmentDate),
          pItem.client.packageName,
          physio?.name || 'Unassigned',
          formatBDT(pItem.client.finalAmount),
          formatBDT(pItem.totalPaid),
          formatBDT(pItem.dueAmount),
          'Partial / In Progress',
        ];
      });

      autoTable(doc, {
        startY: finalY,
        margin: { left: margin, right: margin, bottom: 35 },
        head: [
          [
            '#',
            'Client Name',
            'Enrolled Date',
            'Therapy Package',
            'Assigned Physio',
            'Total Fee',
            'Paid (Partial)',
            'Due Balance',
            'Status',
          ],
        ],
        body: pendingRows,
        theme: 'grid',
        headStyles: {
          fillColor: [PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
        },
        bodyStyles: {
          fontSize: 6.8,
          textColor: [PALETTE.slate900[0], PALETTE.slate900[1], PALETTE.slate900[2]],
          valign: 'middle',
        },
        alternateRowStyles: {
          fillColor: [PALETTE.slate50[0], PALETTE.slate50[1], PALETTE.slate50[2]],
        },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          1: { cellWidth: 38, fontStyle: 'bold' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 28 },
          4: { cellWidth: 26 },
          5: { cellWidth: 20, halign: 'right' },
          6: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [PALETTE.accentGreen[0], PALETTE.accentGreen[1], PALETTE.accentGreen[2]] },
          7: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [PALETTE.accentAmber[0], PALETTE.accentAmber[1], PALETTE.accentAmber[2]] },
          8: { cellWidth: 17, halign: 'center', fontStyle: 'italic' },
        },
      });

      finalY = (doc as any).lastAutoTable.finalY + 7;
    }

    // Grand Summary Box (Subtle, Clean Bordered Box with Teal Accent)
    if (finalY > pageHeight - 45) {
      doc.addPage();
      finalY = 16;
    }

    doc.setFillColor(PALETTE.brandTealLight[0], PALETTE.brandTealLight[1], PALETTE.brandTealLight[2]);
    doc.setDrawColor(PALETTE.brandTealBorder[0], PALETTE.brandTealBorder[1], PALETTE.brandTealBorder[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, finalY, pageWidth - margin * 2, 25, 2, 2, 'FD');

    // Subtle Accent Stripe
    doc.setFillColor(PALETTE.brandTeal[0], PALETTE.brandTeal[1], PALETTE.brandTeal[2]);
    doc.rect(margin, finalY, 1.8, 25, 'F');

    doc.setTextColor(PALETTE.slate900[0], PALETTE.slate900[1], PALETTE.slate900[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`PRACTICE MASTER COMMISSION TOTALS — ${meta.commissionMonthName.toUpperCase()}`, margin + 6, finalY + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Commission Payout Date: ${meta.payoutDateFormatted} (Rule: Clients 100% full-paid in ${meta.qualifyingMonthName})`, margin + 6, finalY + 12);
    doc.text(`Total Qualifying Package Volume: ${formatBDT(totalPracticeQualifyingPackages)} across ${totalQualifyingClientCount} client cases`, margin + 6, finalY + 17.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(PALETTE.brandTealDark[0], PALETTE.brandTealDark[1], PALETTE.brandTealDark[2]);
    doc.text('TOTAL PRACTICE COMMISSION PAYABLE', pageWidth - margin - 5, finalY + 6.5, { align: 'right' });
    doc.setFontSize(13);
    doc.text(formatBDT(totalPracticeCommission), pageWidth - margin - 5, finalY + 15, { align: 'right' });
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PALETTE.slate600[0], PALETTE.slate600[1], PALETTE.slate600[2]);
    doc.text(`Authorised for ${meta.payoutDateFormatted}`, pageWidth - margin - 5, finalY + 21, { align: 'right' });

    drawDocumentFooter(doc, pageWidth, pageHeight, margin, 'Practice Commission Master Report');
    return doc;
  }
}
