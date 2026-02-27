import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ekaniBannerUrl from "@/assets/ekani-banner.png";

// Brand colors (from logo)
const BRAND_RED: [number, number, number] = [220, 53, 69];
const BRAND_TEAL: [number, number, number] = [22, 160, 133];
const DARK: [number, number, number] = [33, 33, 33];
const GRAY: [number, number, number] = [100, 100, 100];
const LIGHT_GRAY: [number, number, number] = [150, 150, 150];

const COMPANY = {
  address: "8 Mall, Office No. 41, Salem Mubarak Street, Block 2, Salmiya, Kuwait",
  tel: "+965 65715935",
  email: "hello@ekani.ai",
  web: "www.ekani.ai",
  cr: "CR No.: 538190",
};

// Cache the logo as base64 so we can embed it in the PDF
let logoCachePromise: Promise<string> | null = null;

function loadLogoBase64(): Promise<string> {
  if (logoCachePromise) return logoCachePromise;
  logoCachePromise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = ekaniBannerUrl;
  });
  return logoCachePromise;
}

function formatKD(amount: number): string {
  const dinars = Math.floor(amount);
  const fils = Math.round((amount - dinars) * 1000);
  return `KD ${dinars}.${fils.toString().padStart(3, "0")}`;
}

function amountToWords(amount: number): string {
  const dinars = Math.floor(amount);
  const fils = Math.round((amount - dinars) * 1000);
  let result = `Kuwaiti Dinars ${dinars}`;
  if (fils > 0) result += ` and ${fils} Fils`;
  return result;
}

function drawCompactHeader(doc: jsPDF, pageW: number, logoData: string): number {
  const margin = 14;
  let y = 10;

  // Logo — centered, compact
  if (logoData) {
    const logoH = 18;
    const logoW = logoH * 4.5; // wide banner aspect
    doc.addImage(logoData, "PNG", (pageW - logoW) / 2, y, logoW, logoH);
    y += logoH + 3;
  } else {
    // Fallback text header
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_RED);
    doc.text("EKANI AI CONSULTANCY", pageW / 2, y + 6, { align: "center" });
    y += 12;
  }

  // Thin accent line
  doc.setDrawColor(...BRAND_RED);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 1;
  doc.setDrawColor(...BRAND_TEAL);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);

  return y + 4;
}

function drawSingleLineFooter(doc: jsPDF, pageW: number) {
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const footerY = pageH - 10;

  // Accent line
  doc.setDrawColor(...BRAND_RED);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 3, pageW - margin, footerY - 3);

  // Single line with all info
  doc.setFontSize(6.5);
  doc.setTextColor(...LIGHT_GRAY);
  doc.setFont("helvetica", "normal");
  const footerText = `${COMPANY.address}  |  TEL: ${COMPANY.tel}  |  ${COMPANY.email}  |  ${COMPANY.web}  |  ${COMPANY.cr}`;
  doc.text(footerText, pageW / 2, footerY, { align: "center" });
}

// ===== TERMS & CONDITIONS =====
const TERMS_AND_CONDITIONS = [
  { title: "Payment Terms", body: "All projects require either 100% advance payment before commencement, or 50% advance payment with the remaining 50% payable before final delivery/go-live. Work will not begin without the advance payment." },
  { title: "Late or Pending Payments", body: "EKANI AI Consultancy reserves the right to pause or withhold project delivery, credentials, or live deployment until full payment is received." },
  { title: "Scope of Work", body: "This invoice covers only the services specified in the approved quotation or agreement. Any additional features, revisions beyond agreed limits, or scope changes will be charged separately." },
  { title: "Non-Refund Policy", body: "All payments are non-refundable once work has commenced, including consultation, AI setup, automation configuration, design, development, or strategy services." },
  { title: "Project Timelines", body: "Delivery timelines depend on timely client approvals, content submission, and required access credentials. Client-side delays may extend the agreed timeline." },
  { title: "Domain & Hosting", body: "Domain registration and hosting services are the responsibility of the client unless explicitly stated otherwise in the quotation. EKANI is not liable for hosting downtime, third-party server issues, or domain-related disputes." },
  { title: "Third-Party Costs", body: "Any third-party costs including API usage (WhatsApp, AI tokens, SMS, payment gateways), plugins, integrations, or external subscriptions are billed separately unless clearly included in writing." },
  { title: "Ownership & Intellectual Property", body: "Final deliverables will be transferred to the client only after full payment clearance. EKANI retains the right to showcase completed work for portfolio and marketing purposes unless agreed otherwise in writing." },
  { title: "Service Suspension", body: "Ongoing services (maintenance, AI automation, marketing retainers, etc.) may be suspended if payments are overdue." },
  { title: "Jurisdiction", body: "All agreements are governed by the laws of the State of Kuwait." },
];

function drawTermsAndConditions(doc: jsPDF, pageW: number, margin: number) {
  doc.addPage();
  let y = 18;

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_RED);
  doc.text("Terms & Conditions", pageW / 2, y, { align: "center" });
  y += 3;

  doc.setDrawColor(...BRAND_RED);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  const maxW = pageW - margin * 2;
  const pageH = doc.internal.pageSize.getHeight();

  TERMS_AND_CONDITIONS.forEach((term, idx) => {
    // Check if we need a new page
    if (y > pageH - 30) {
      drawSingleLineFooter(doc, pageW);
      doc.addPage();
      y = 18;
    }

    // Number + Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_TEAL);
    doc.text(`${idx + 1}. ${term.title}`, margin, y);
    y += 4;

    // Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(term.body, maxW);
    doc.text(lines, margin, y);
    y += lines.length * 3.2 + 3;
  });

  drawSingleLineFooter(doc, pageW);
}

// ===== INVOICE PDF =====
interface InvoiceData {
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientAddress?: string;
  description: string;
  amountKd: number;
  paymentTerms?: string;
  notes?: string;
  salesRepName?: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<jsPDF> {
  const logoData = await loadLogoBase64();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentW = pageW - margin * 2;

  let y = drawCompactHeader(doc, pageW, logoData);

  // ── Title row: "INVOICE" left, meta right ──
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_RED);
  doc.text("INVOICE", margin, y + 5);

  // Meta block — right-aligned, tighter
  const metaX = pageW - margin;
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice No:", metaX - 40, y + 1);
  doc.setFont("helvetica", "normal");
  doc.text(data.invoiceNumber, metaX, y + 1, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text("Date:", metaX - 40, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(data.date, metaX, y + 5, { align: "right" });

  y += 11;

  // ── Bill To + Sales Rep — side by side ──
  const halfW = (contentW - 4) / 2;
  const billBoxH = data.clientAddress ? 16 : 12;

  // Bill To box
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, halfW, billBoxH, 1, 1, "F");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_TEAL);
  doc.text("BILL TO", margin + 3, y + 4);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(data.clientName, margin + 3, y + 8.5);
  if (data.clientAddress) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    const addrLines = doc.splitTextToSize(data.clientAddress, halfW - 6);
    doc.text(addrLines, margin + 3, y + 12.5);
  }

  // Sales Rep box (right side)
  if (data.salesRepName) {
    const repX = margin + halfW + 4;
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(repX, y, halfW, billBoxH, 1, 1, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_TEAL);
    doc.text("SALES REPRESENTATIVE", repX + 3, y + 4);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(data.salesRepName, repX + 3, y + 8.5);
  }

  y += billBoxH + 4;

  // ── Items table ──
  autoTable(doc, {
    startY: y,
    head: [["#", "Description", "Amount (KD)"]],
    body: [["1", data.description, formatKD(data.amountKd)]],
    styles: { fontSize: 8, cellPadding: 2, textColor: DARK },
    headStyles: {
      fillColor: BRAND_TEAL,
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      2: { cellWidth: 28, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 2;

  // ── Total row ──
  const totalBoxW = 65;
  const totalBoxX = pageW - margin - totalBoxW;
  doc.setFillColor(...BRAND_RED);
  doc.roundedRect(totalBoxX, y, totalBoxW, 8, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL:", totalBoxX + 4, y + 5.5);
  doc.text(formatKD(data.amountKd), totalBoxX + totalBoxW - 4, y + 5.5, { align: "right" });

  // Amount in words — right-aligned under total
  y += 11;
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...GRAY);
  doc.text(`Amount in words: ${amountToWords(data.amountKd)}`, margin, y);

  y += 5;

  // ── Condensed Terms & Conditions ──
  doc.setDrawColor(...BRAND_RED);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 3;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_RED);
  doc.text("Terms & Conditions", margin, y);
  y += 3.5;

  const tcFontSize = 5.5;
  const lineH = 2.6;
  doc.setFontSize(tcFontSize);

  TERMS_AND_CONDITIONS.forEach((term, idx) => {
    // Title inline with body for compactness
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_TEAL);
    const titleText = `${idx + 1}. ${term.title}: `;
    const titleW = doc.getTextWidth(titleText);

    doc.text(titleText, margin, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    // Wrap body text starting after the title on line 1
    const bodyLines = doc.splitTextToSize(term.body, contentW - titleW);
    if (bodyLines.length > 0) {
      doc.text(bodyLines[0], margin + titleW, y);
    }
    // Remaining lines at full width
    if (bodyLines.length > 1) {
      const remaining = bodyLines.slice(1);
      const remainingWrapped = doc.splitTextToSize(remaining.join(" "), contentW);
      y += lineH;
      doc.text(remainingWrapped, margin, y);
      y += (remainingWrapped.length - 1) * lineH;
    }
    y += lineH + 0.5;
  });

  // ── Thank you ──
  y += 1;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_TEAL);
  doc.text("Thank you for your business.", pageW / 2, y, { align: "center" });

  drawSingleLineFooter(doc, pageW);

  return doc;
}

// ===== RECEIPT PDF =====
interface ReceiptData {
  receiptNumber: string;
  date: string;
  clientName: string;
  amountKd: number;
  paymentMethod: string;
  chequeReference?: string;
  bankName?: string;
  description: string;
}

export async function generateReceiptPDF(data: ReceiptData): Promise<jsPDF> {
  const logoData = await loadLogoBase64();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  let y = drawCompactHeader(doc, pageW, logoData);

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_RED);
  doc.text("RECEIPT VOUCHER", margin, y + 6);
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("سند قبض", pageW - margin, y + 6, { align: "right" });

  // Meta — right side
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  const metaX = pageW - margin;
  doc.setFont("helvetica", "bold");
  doc.text(`Receipt No:`, metaX - 45, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(data.receiptNumber, metaX, y + 12, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(`Date:`, metaX - 45, y + 17);
  doc.setFont("helvetica", "normal");
  doc.text(data.date, metaX, y + 17, { align: "right" });

  y += 24;

  // Fields grid
  const drawField = (label: string, value: string, x: number, currentY: number, w: number) => {
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(x, currentY - 4, w, 12, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...BRAND_TEAL);
    doc.text(label, x + 3, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(value, x + 3, currentY + 5.5);
  };

  const colW = (pageW - margin * 2 - 4) / 2;

  drawField("Received From", data.clientName, margin, y, pageW - margin * 2);
  y += 16;

  drawField("Amount", formatKD(data.amountKd), margin, y, colW);
  drawField("Payment Method", data.paymentMethod, margin + colW + 4, y, colW);
  y += 16;

  if (data.paymentMethod === "Cheque" && data.chequeReference) {
    drawField("Cheque No", data.chequeReference, margin, y, colW);
    if (data.bankName) {
      drawField("Bank", data.bankName, margin + colW + 4, y, colW);
    }
    y += 16;
  } else if (data.bankName) {
    drawField("Bank", data.bankName, margin, y, colW);
    y += 16;
  }

  // Amount in words
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...GRAY);
  doc.text(`(${amountToWords(data.amountKd)})`, margin, y);
  y += 8;

  // Description
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_TEAL);
  doc.text("Description", margin, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  const descLines = doc.splitTextToSize(data.description, pageW - margin * 2);
  doc.text(descLines, margin, y);
  y += descLines.length * 4 + 12;

  // Signature block
  const sigY = Math.max(y, 190);
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(margin, sigY, margin + 60, sigY);
  doc.line(pageW - margin - 60, sigY, pageW - margin, sigY);
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("Accountant Signature", margin, sigY + 4);
  doc.text("Client Signature", pageW - margin - 60, sigY + 4);

  // Thank you
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_TEAL);
  doc.text("Thank you for your business.", pageW / 2, pageH - 16, { align: "center" });

  drawSingleLineFooter(doc, pageW);

  return doc;
}
