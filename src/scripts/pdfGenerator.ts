/**
 * PDF Report Generator using jsPDF
 * Generates a branded Netwrix ROI Analysis Report
 */

import { jsPDF } from 'jspdf';
import type { ROIResults } from './calculator';
import { formatCurrency, formatROI, formatPayback } from './calculator';

// Brand colors
const NIGHTWATCH = [26, 21, 54] as const;
const ACCESS_WHITE = [252, 250, 245] as const;
const VIGILANT_BLUE = [88, 81, 219] as const;
const BEACON_GREEN = [65, 242, 124] as const;
const DATAWAVE_BLUE = [33, 158, 188] as const;
const FLASHPOINT_ORANGE = [243, 106, 29] as const;

interface ReportData {
  email: string;
  country: string;
  endpoints: number;
  annualRevenue: string;
  admins: number;
  limitedAdmins: number;
  adminSalary: number;
  itSalary: number;
  results: ROIResults;
}

/**
 * Load an image as base64 data URL
 */
async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Draw the gradient accent bar at the top of the page
 */
function drawHeaderAccent(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Gradient bar across top
  const barHeight = 6;
  const steps = 100;
  const stepWidth = pageWidth / steps;

  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const r = Math.round(BEACON_GREEN[0] + (VIGILANT_BLUE[0] - BEACON_GREEN[0]) * t);
    const g = Math.round(BEACON_GREEN[1] + (VIGILANT_BLUE[1] - BEACON_GREEN[1]) * t);
    const b = Math.round(BEACON_GREEN[2] + (VIGILANT_BLUE[2] - BEACON_GREEN[2]) * t);
    doc.setFillColor(r, g, b);
    doc.rect(i * stepWidth, 0, stepWidth + 0.5, barHeight, 'F');
  }
}

/**
 * Draw a metric card box
 */
function drawMetricCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  accentColor: readonly [number, number, number] = VIGILANT_BLUE
): void {
  // Card background
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, height, 3, 3, 'F');

  // Card border
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 3, 3, 'S');

  // Accent line at top of card
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(x, y, width, 2, 'F');

  // Value text
  doc.setFontSize(27);
  doc.setTextColor(NIGHTWATCH[0], NIGHTWATCH[1], NIGHTWATCH[2]);
  doc.text(value, x + width / 2, y + 19, { align: 'center' });

  // Label text
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(label, x + width / 2, y + 28, { align: 'center' });
}

/**
 * Draw the breach cost callout box
 * Replaces the old Investment Breakdown and chart sections
 */
function drawBreachCallout(
  doc: jsPDF,
  x: number,
  y: number,
  width: number
): void {
  const boxHeight = 42;
  const padding = 8;

  // Background fill — subtle warm gradient approximation
  doc.setFillColor(255, 250, 245);
  doc.roundedRect(x, y, width, boxHeight, 3, 3, 'F');

  // Border
  doc.setDrawColor(FLASHPOINT_ORANGE[0], FLASHPOINT_ORANGE[1], FLASHPOINT_ORANGE[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, width, boxHeight, 3, 3, 'S');

  // Orange accent bar at top
  doc.setFillColor(FLASHPOINT_ORANGE[0], FLASHPOINT_ORANGE[1], FLASHPOINT_ORANGE[2]);
  doc.rect(x, y, width, 2.5, 'F');

  // Shield icon placeholder (🛡️) — draw a small colored circle instead
  doc.setFillColor(FLASHPOINT_ORANGE[0], FLASHPOINT_ORANGE[1], FLASHPOINT_ORANGE[2]);
  doc.circle(x + padding + 5, y + 14, 5, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('!', x + padding + 5, y + 17, { align: 'center' });

  // Title
  const textX = x + padding + 16;
  doc.setFontSize(12);
  doc.setTextColor(NIGHTWATCH[0], NIGHTWATCH[1], NIGHTWATCH[2]);
  doc.text('Additional Risk Consideration', textX, y + 14);

  // Main stat line
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('The average US breach in 2025 cost', textX, y + 23);

  // Highlighted amounts — track cursor, measure width at current font size before switching
  let curX = textX;
  const gap = 3;

  doc.setFontSize(13);
  doc.setTextColor(FLASHPOINT_ORANGE[0], FLASHPOINT_ORANGE[1], FLASHPOINT_ORANGE[2]);
  doc.text('$10.22M', curX, y + 31);
  curX += doc.getTextWidth('$10.22M') + gap;

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('or', curX, y + 31);
  curX += doc.getTextWidth('or') + gap;

  doc.setFontSize(13);
  doc.setTextColor(FLASHPOINT_ORANGE[0], FLASHPOINT_ORANGE[1], FLASHPOINT_ORANGE[2]);
  doc.text('$166', curX, y + 31);
  curX += doc.getTextWidth('$166') + gap;

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('per PII record.', curX, y + 31);

  // Source attribution
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('— IBM Cost of a Data Breach Report 2025', textX, y + 38);
}

/**
 * Draw the "How Your Annual Savings Were Calculated" assumptions block
 */
function drawSavingsAssumptions(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  itSavings: number,
  adminSavings: number
): void {
  const boxHeight = 32;
  const padding = 8;
  const valueReserve = 26;
  const badgeOffset = 10;
  const labelWidth = width - padding * 2 - badgeOffset - valueReserve;
  const valueX = x + width - padding;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, boxHeight, 3, 3, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, boxHeight, 3, 3, 'S');

  // Section title
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text('HOW YOUR ANNUAL SAVINGS WERE CALCULATED', x + padding, y + 6);

  // Divider
  doc.setDrawColor(235, 235, 235);
  doc.setLineWidth(0.2);
  doc.line(x + padding, y + 9, x + width - padding, y + 9);

  // Row 1 — IT staff
  doc.setFontSize(8.5);
  doc.setTextColor(VIGILANT_BLUE[0], VIGILANT_BLUE[1], VIGILANT_BLUE[2]);
  doc.text('5%', x + padding, y + 17);
  doc.setTextColor(80, 80, 80);
  doc.text(
    doc.splitTextToSize('reduction in IT & security staff time — password rotation, GPO policies, local access management', labelWidth),
    x + padding + badgeOffset, y + 17
  );
  doc.setFontSize(9.5);
  doc.setTextColor(NIGHTWATCH[0], NIGHTWATCH[1], NIGHTWATCH[2]);
  doc.text(formatCurrency(itSavings), valueX, y + 17, { align: 'right' });

  // Row 2 — IAM staff
  doc.setFontSize(8.5);
  doc.setTextColor(VIGILANT_BLUE[0], VIGILANT_BLUE[1], VIGILANT_BLUE[2]);
  doc.text('25%', x + padding, y + 26);
  doc.setTextColor(80, 80, 80);
  doc.text(
    doc.splitTextToSize('reduction in IAM staff time — implementing, maintaining, and auditing zero-standing privilege', labelWidth),
    x + padding + badgeOffset, y + 26
  );
  doc.setFontSize(9.5);
  doc.setTextColor(NIGHTWATCH[0], NIGHTWATCH[1], NIGHTWATCH[2]);
  doc.text(formatCurrency(adminSavings), valueX, y + 26, { align: 'right' });
}

/**
 * Draw the breach risk reduction example block
 */
function drawBreachRiskBlock(
  doc: jsPDF,
  x: number,
  y: number,
  width: number
): void {
  const boxHeight = 28;
  const padding = 8;
  const badgeOffset = 18;
  const valueReserve = 24;
  const labelWidth = width - padding * 2 - badgeOffset - valueReserve;
  const valueX = x + width - padding;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, boxHeight, 3, 3, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, boxHeight, 3, 3, 'S');

  // Section title
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text('BREACH RISK REDUCTION — 3-YEAR EXPECTED COST EXAMPLE', x + padding, y + 5);

  // Divider
  doc.setDrawColor(235, 235, 235);
  doc.setLineWidth(0.2);
  doc.line(x + padding, y + 8, x + width - padding, y + 8);

  // Row 1 — without PAM
  doc.setFontSize(8.5);
  doc.setTextColor(FLASHPOINT_ORANGE[0], FLASHPOINT_ORANGE[1], FLASHPOINT_ORANGE[2]);
  doc.text('3% / yr', x + padding, y + 16);
  doc.setTextColor(80, 80, 80);
  doc.text(
    doc.splitTextToSize('breach probability without PAM — $10.22M x (1 - 0.97^3)', labelWidth),
    x + padding + badgeOffset, y + 16
  );
  doc.setFontSize(9.5);
  doc.setTextColor(FLASHPOINT_ORANGE[0], FLASHPOINT_ORANGE[1], FLASHPOINT_ORANGE[2]);
  doc.text('$892,000', valueX, y + 16, { align: 'right' });

  // Row 2 — with PAM
  doc.setFontSize(8.5);
  doc.setTextColor(35, 130, 70);
  doc.text('1.5% / yr', x + padding, y + 24);
  doc.setTextColor(80, 80, 80);
  doc.text(
    doc.splitTextToSize('breach probability with PAM (50% reduction) — $10.22M x (1 - 0.985^3)', labelWidth),
    x + padding + badgeOffset, y + 24
  );
  doc.setFontSize(9.5);
  doc.setTextColor(35, 130, 70);
  doc.text('$453,000', valueX, y + 24, { align: 'right' });
}

/**
 * Generate the branded ROI PDF report
 */
export async function generatePDF(data: ReportData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Page background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header gradient accent
  drawHeaderAccent(doc);

  // Logo (top-right) — 40×8mm preserves native ~5:1 aspect ratio
  try {
    const logoBase64 = await loadImageAsBase64('/images/Netwrix_Logo_Dark.jpg');
    doc.addImage(logoBase64, 'JPEG', pageWidth - margin - 40, 14, 40, 8);
  } catch {
    // Fallback: draw text logo
    doc.setFontSize(14);
    doc.setTextColor(NIGHTWATCH[0], NIGHTWATCH[1], NIGHTWATCH[2]);
    doc.text('NETWRIX', pageWidth - margin - 30, 20);
  }

  // Title
  let yPos = 32;
  doc.setFontSize(22);
  doc.setTextColor(NIGHTWATCH[0], NIGHTWATCH[1], NIGHTWATCH[2]);
  doc.text('ROI Analysis Report', margin, yPos);

  // Subtitle with date
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Prepared for ${data.email} • ${dateStr}`, margin, yPos);

  // Divider line
  yPos += 5;
  doc.setDrawColor(VIGILANT_BLUE[0], VIGILANT_BLUE[1], VIGILANT_BLUE[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, margin + 60, yPos);

  // Summary metrics section
  yPos += 12;
  doc.setFontSize(13);
  doc.setTextColor(NIGHTWATCH[0], NIGHTWATCH[1], NIGHTWATCH[2]);
  doc.text('Summary Metrics', margin, yPos);

  // Metric cards - 3 across top row
  yPos += 6;
  const cardWidth = (contentWidth - 8) / 3;
  const cardHeight = 30;

  drawMetricCard(
    doc, margin, yPos, cardWidth, cardHeight,
    'Initial Investment',
    formatCurrency(data.results.initialInvestment),
    DATAWAVE_BLUE
  );

  drawMetricCard(
    doc, margin + cardWidth + 4, yPos, cardWidth, cardHeight,
    'Annual Cost Savings',
    formatCurrency(data.results.annualSavings),
    BEACON_GREEN
  );

  drawMetricCard(
    doc, margin + (cardWidth + 4) * 2, yPos, cardWidth, cardHeight,
    '3-Year Discounted Savings',
    formatCurrency(data.results.discountedSavings),
    VIGILANT_BLUE
  );

  // Second row - 2 cards centered
  yPos += cardHeight + 6;
  const card2Width = (contentWidth - 4) / 2;

  drawMetricCard(
    doc, margin, yPos, card2Width, cardHeight,
    'Return on Investment',
    formatROI(data.results.roi),
    BEACON_GREEN
  );

  drawMetricCard(
    doc, margin + card2Width + 4, yPos, card2Width, cardHeight,
    'Payback Period',
    formatPayback(data.results.paybackMonths),
    DATAWAVE_BLUE
  );

  // Savings assumptions block
  yPos += cardHeight + 8;
  const itSavings = 0.05 * (data.limitedAdmins - data.admins) * data.itSalary;
  const adminSavings = 0.25 * data.admins * data.adminSalary;
  drawSavingsAssumptions(doc, margin, yPos, contentWidth, itSavings, adminSavings);

  // Breach cost callout
  yPos += 38;
  drawBreachCallout(doc, margin, yPos, contentWidth);

  // Breach risk reduction block
  yPos += 48;
  drawBreachRiskBlock(doc, margin, yPos, contentWidth);

  // Disclaimer — placed dynamically after last content block
  const breachRiskHeight = 28;
  const disclaimerY = yPos + breachRiskHeight + 6;
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text(
    'This document is for informational purposes only and does not constitute a commitment from Netwrix Corporation of any return on investment from the Netwrix products or services. Netwrix hereby disclaims all warranties related to the information in this document, whether express or implied, including but not limited to the implied warranties of merchantability and fitness for a particular purpose. This document does not provide you with any legal rights whatsoever including, without limitation, with respect to the information you submitted to generate an estimated return on investment or the estimated return on investment generated by that information. You may copy and use this document only for your internal, reference purposes.',
    margin,
    disclaimerY,
    { align: 'left', maxWidth: contentWidth }
  );

  // Footer
  const footerY = pageHeight - 8;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `Netwrix ROI Calculator • Generated ${dateStr}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  return doc.output('blob');
}

/**
 * Generate and download the PDF
 */
export async function downloadPDF(data: ReportData): Promise<Blob> {
  const blob = await generatePDF(data);

  // Trigger browser download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const emailPrefix = data.email.split('@')[0];
  link.download = `Netwrix_ROI_Report_${emailPrefix}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return blob;
}
