'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CLPCouple, CLPProgram } from '@/types';
import {
  calculateDemographics,
  computeAgeString,
  computeYearsMarried,
  getCoupleAgeBracketKey,
  REPORT_AGE_BRACKETS,
} from './reportHelpers';
import {
  generateAgeBarChartImage,
  generateAgePieChartImage,
  generateTuyPlottedMapImage,
} from './reportVisualGenerators';

export interface GeneratePdfOptions {
  currentClp: CLPProgram;
  couples: CLPCouple[];
  filteredCouples: CLPCouple[];
  filterAgeBracket: string;
  filterBarangay: string;
  filterStatus: string;
  onToast?: (message: string) => void;
}

export async function generateComprehensivePdfReport({
  currentClp,
  couples,
  filteredCouples,
  filterAgeBracket,
  filterBarangay,
  filterStatus,
  onToast,
}: GeneratePdfOptions): Promise<void> {
  if (!couples.length || !currentClp) {
    if (onToast) onToast('No invitee data available to generate report.');
    return;
  }

  try {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const genDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const genTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const demographics = calculateDemographics(couples);

    // =========================================================================
    // PAGE 1: EXECUTIVE COVER & VISUAL ANALYTICS (GRAPHS & PIE CHART)
    // =========================================================================

    // Top Header Brand Banner
    doc.setFillColor(36, 60, 129); // #243c81 Navy
    doc.rect(0, 0, pageWidth, 24, 'F');

    // Accent Gold Bar
    doc.setFillColor(217, 119, 6); // #d97706 Gold
    doc.rect(0, 24, pageWidth, 2.5, 'F');

    // Title
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('COUPLES FOR CHRIST • MUNICIPALITY OF TUY, BATANGAS', 14, 11);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 231, 255);
    doc.text(
      `CHRISTIAN LIFE PROGRAM: ${currentClp.name.toUpperCase()} • COMPREHENSIVE INVITEE & DEMOGRAPHIC REPORT`,
      14,
      18
    );

    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Generated: ${genDate} at ${genTime}`, pageWidth - 14, 18, {
      align: 'right',
    });

    // Program Meta & Filter Banner
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Venue: ${currentClp.venue || 'Tuy, Batangas'}`, 14, 32);

    const activeBracketLabel =
      filterAgeBracket === 'ALL'
        ? 'All Age Groups'
        : REPORT_AGE_BRACKETS.find((b) => b.key === filterAgeBracket)?.label || filterAgeBracket;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Filters: [Age Group: ${activeBracketLabel}] • [Barangay: ${filterBarangay}] • [Status: ${filterStatus}] | Scope: ${filteredCouples.length} of ${couples.length} Couples (${filteredCouples.length * 2} Individuals)`,
      14,
      37
    );

    // Render Graphs & Pie Chart via HTML5 Canvas
    const barChartImg = generateAgeBarChartImage(demographics);
    const pieChartImg = generateAgePieChartImage(demographics);

    // Section 1 Heading
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(36, 60, 129);
    doc.text('1. Visual Demographic Analytics (Age Distribution & Cohort Composition)', 14, 44);

    // Embed Bar Chart (Left) and Pie Chart (Right)
    const chartY = 48;
    const chartWidth = 132;
    const chartHeight = 64;

    if (barChartImg) {
      doc.addImage(barChartImg, 'PNG', 14, chartY, chartWidth, chartHeight);
    }
    if (pieChartImg) {
      doc.addImage(pieChartImg, 'PNG', 151, chartY, chartWidth, chartHeight);
    }

    // Section 2: Demographic Breakdown Table (Summary Table)
    const tableStartY = chartY + chartHeight + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(36, 60, 129);
    doc.text('2. Invitee Age Group Demographic Breakdown Table', 14, tableStartY);

    const ageSummaryRows = REPORT_AGE_BRACKETS.map((b) => {
      const stats = demographics.bracketCounts[b.key] || {
        husbands: 0,
        wives: 0,
        total: 0,
        percentage: 0,
      };
      return [
        `${b.label} (${b.sublabel})`,
        b.range,
        stats.husbands,
        stats.wives,
        stats.total,
        `${stats.percentage}%`,
      ];
    });

    ageSummaryRows.push([
      'Total Cohort',
      'Husbands + Wives',
      demographics.totalCouples,
      demographics.totalCouples,
      demographics.totalIndividuals,
      '100%',
    ]);

    autoTable(doc, {
      startY: tableStartY + 3,
      head: [
        [
          'Age Bracket',
          'Age Range',
          'Husbands Count',
          'Wives Count',
          'Total Individuals',
          '% of Total',
        ],
      ],
      body: ageSummaryRows,
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [15, 23, 42],
      },
      headStyles: {
        fillColor: [36, 60, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 45 },
        2: { halign: 'center', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 35 },
        4: { halign: 'center', cellWidth: 35, fontStyle: 'bold' },
        5: { halign: 'center', cellWidth: 30 },
      },
      margin: { left: 14, right: 14 },
    });

    // Top Barangays mini-table next to it or right below
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalYAge = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : 170;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(36, 60, 129);
    doc.text('3. Geographic Distribution by Top Barangays', 14, finalYAge);

    const topBarangays = demographics.sortedBarangays.slice(0, 6);
    const brgySummaryRows = topBarangays.map((bg) => [
      `Brgy. ${bg.name}`,
      bg.count,
      bg.count * 2,
      `${bg.percentage}% of cohort`,
    ]);

    autoTable(doc, {
      startY: finalYAge + 3,
      head: [['Barangay Name', 'Couples Count', 'Individuals Count', 'Distribution %']],
      body: brgySummaryRows,
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        textColor: [15, 23, 42],
      },
      headStyles: {
        fillColor: [217, 119, 6],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { halign: 'center', cellWidth: 40 },
        2: { halign: 'center', cellWidth: 40 },
        3: { halign: 'center', cellWidth: 40 },
      },
      margin: { left: 14, right: 14 },
    });

    // =========================================================================
    // PAGE 2: GEOGRAPHIC PLOTTED MAP OF TUY, BATANGAS
    // =========================================================================
    doc.addPage('a4', 'landscape');

    // Page 2 Header
    doc.setFillColor(36, 60, 129);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Geographic Plotted Directory Map • Municipality of Tuy, Batangas', 14, 11);

    doc.setFontSize(8.5);
    doc.setTextColor(224, 231, 255);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Displaying ${filteredCouples.length} participant couple markers across Tuy Barangays`,
      pageWidth - 14,
      11,
      { align: 'right' }
    );

    // Plotted Map Image
    const mapImg = generateTuyPlottedMapImage(filteredCouples);
    if (mapImg) {
      doc.addImage(mapImg, 'PNG', 14, 22, pageWidth - 28, 155);
    }

    // Map Footnote
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Saint Vincent Ferrer Parish • Municipality of Tuy, Batangas • Coordinate Reference: WGS84 Centroid [14.0228° N, 120.7289° E]',
      14,
      pageHeight - 12
    );

    // =========================================================================
    // PAGES 3+: DIFFERENT TABLES FOR EACH AGE BRACKET
    // "put in different table the age brackets"
    // =========================================================================

    // Group filtered couples by their primary age bracket (husband or wife bracket)
    const couplesByAgeBracket: Record<string, CLPCouple[]> = {
      '20-30': [],
      '31-40': [],
      '41-50': [],
      '51-60': [],
      '61-plus': [],
      unknown: [],
    };

    filteredCouples.forEach((c) => {
      // Determine couple bracket: prioritize husband, then wife
      const hBracket = getCoupleAgeBracketKey(c.husbandBirthday);
      const wBracket = getCoupleAgeBracketKey(c.wifeBirthday);
      const chosenBracket = hBracket !== 'unknown' ? hBracket : wBracket;
      if (couplesByAgeBracket[chosenBracket]) {
        couplesByAgeBracket[chosenBracket].push(c);
      } else {
        couplesByAgeBracket.unknown.push(c);
      }
    });

    REPORT_AGE_BRACKETS.forEach((bracket, bIdx) => {
      const bracketCouples = couplesByAgeBracket[bracket.key] || [];
      if (!bracketCouples.length) return;

      doc.addPage('a4', 'landscape');

      // Top mini header
      doc.setFillColor(36, 60, 129);
      doc.rect(0, 0, pageWidth, 16, 'F');

      // Accent color stripe for this age bracket
      const stripeColors: Record<string, [number, number, number]> = {
        '20-30': [5, 150, 105], // emerald
        '31-40': [37, 99, 235], // blue
        '41-50': [124, 58, 237], // purple
        '51-60': [217, 119, 6], // amber
        '61-plus': [225, 29, 72], // rose
        unknown: [100, 116, 139], // slate
      };
      const stripe = stripeColors[bracket.key] || [36, 60, 129];
      doc.setFillColor(stripe[0], stripe[1], stripe[2]);
      doc.rect(0, 16, pageWidth, 2, 'F');

      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `5.${bIdx + 1}. Age Bracket Roster Table: ${bracket.label.toUpperCase()} (${bracket.sublabel.toUpperCase()}) — ${bracketCouples.length} Couples (${bracketCouples.length * 2} Individuals)`,
        14,
        11
      );

      doc.setFontSize(8);
      doc.setTextColor(224, 231, 255);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Age Range: ${bracket.range} • Status: Active Roster`,
        pageWidth - 14,
        11,
        { align: 'right' }
      );

      // Dedicated Table for this Age Bracket
      const bracketRows = bracketCouples.map((c, idx) => {
        const hAge = computeAgeString(c.husbandBirthday);
        const wAge = computeAgeString(c.wifeBirthday);

        const husbandDesc =
          hAge !== '—'
            ? `${c.husbandLastName}, ${c.husbandFirstName}\nAge: ${hAge} yrs${
                c.husbandContact ? `\nTel: ${c.husbandContact}` : ''
              }${c.husbandOccupation ? `\nWork: ${c.husbandOccupation}` : ''}`
            : `${c.husbandLastName}, ${c.husbandFirstName}${
                c.husbandContact ? `\nTel: ${c.husbandContact}` : ''
              }`;

        const wifeDesc =
          wAge !== '—'
            ? `${c.wifeLastName}, ${c.wifeFirstName}\nAge: ${wAge} yrs${
                c.wifeContact ? `\nTel: ${c.wifeContact}` : ''
              }${c.wifeOccupation ? `\nWork: ${c.wifeOccupation}` : ''}`
            : `${c.wifeLastName}, ${c.wifeFirstName}${
                c.wifeContact ? `\nTel: ${c.wifeContact}` : ''
              }`;

        const marriageDesc = c.weddingAnniversary
          ? `${c.weddingAnniversary}\n(${computeYearsMarried(c.weddingAnniversary)})`
          : '—';

        const locationDesc = `${c.address || `Brgy. ${c.barangay}`}\nBrgy. ${c.barangay}, Tuy\nGPS: ${c.coordinates ? c.coordinates[1].toFixed(3) : 0}, ${c.coordinates ? c.coordinates[0].toFixed(3) : 0}`;

        return [
          idx + 1,
          husbandDesc,
          wifeDesc,
          marriageDesc,
          locationDesc,
          c.status || 'Active',
        ];
      });

      autoTable(doc, {
        startY: 23,
        head: [
          [
            '#',
            'Husband Details (Age, Contact, Occupation)',
            'Wife Details (Age, Contact, Occupation)',
            'Wedding Anniversary',
            'Address, Barangay & GPS',
            'Status',
          ],
        ],
        body: bracketRows,
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: stripe,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 70 },
          2: { cellWidth: 70 },
          3: { halign: 'center', cellWidth: 32 },
          4: { cellWidth: 67 },
          5: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
      });
    });

    // Page numbering and footer for all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Couples for Christ Tuy Chapter • "Building the Church of the Home and Building the Church of the Poor"',
        14,
        pageHeight - 6
      );
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 25, pageHeight - 6);
    }

    const sanitizedBatch = currentClp.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`CFC_Tuy_${sanitizedBatch}_Comprehensive_Report.pdf`);

    if (onToast) {
      onToast(`Successfully generated PDF report with Graphs, Pie Chart, Map & Age Tables!`);
    }
  } catch (err) {
    console.error('Error generating PDF report:', err);
    if (onToast) {
      onToast('Failed to generate PDF. You can also print the report directly.');
    }
  }
}
