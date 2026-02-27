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
}

export async function generateInvoicePDF(data: InvoiceData): Promise<jsPDF> {
  const logoData = await loadLogoBase64();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  let y = drawCompactHeader(doc, pageW, logoData);

  // Title row: "INVOICE" left, meta right
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_RED);
  doc.text("INVOICE", margin, y + 6);

  // Meta block — right side
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  const metaX = pageW - margin;
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice No:`, metaX - 45, y + 1);
  doc.setFont("helvetica", "normal");
  doc.text(data.invoiceNumber, metaX, y + 1, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text(`Date:`, metaX - 45, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(data.date, metaX, y + 6, { align: "right" });

  y += 14;

  // Bill To section — compact box
  doc.setFillColor(248, 248, 248);
  const billBoxH = data.clientAddress ? 18 : 13;
  doc.roundedRect(margin, y, pageW - margin * 2, billBoxH, 1.5, 1.5, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_TEAL);
  doc.text("BILL TO", margin + 4, y + 4.5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(data.clientName, margin + 4, y + 9.5);

  if (data.clientAddress) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(data.clientAddress, margin + 4, y + 14);
  }

  y += billBoxH + 5;

  // Items table
  autoTable(doc, {
    startY: y,
    head: [["#", "Description", "Amount (KD)"]],
    body: [["1", data.description, formatKD(data.amountKd)]],
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: DARK },
    headStyles: {
      fillColor: BRAND_TEAL,
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      2: { cellWidth: 32, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 2;

  // Total row
  const totalBoxW = 70;
  const totalBoxX = pageW - margin - totalBoxW;
  doc.setFillColor(...BRAND_RED);
  doc.roundedRect(totalBoxX, y, totalBoxW, 9, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL:", totalBoxX + 5, y + 6.2);
  doc.text(formatKD(data.amountKd), totalBoxX + totalBoxW - 5, y + 6.2, { align: "right" });
  y += 14;

  // Amount in words
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...GRAY);
  doc.text(`Amount in words: ${amountToWords(data.amountKd)}`, margin, y);
  y += 7;

  // Payment terms
  if (data.paymentTerms) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_TEAL);
    doc.text("Payment Terms", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.setFontSize(8);
    const termLines = doc.splitTextToSize(data.paymentTerms, pageW - margin * 2);
    doc.text(termLines, margin, y);
    y += termLines.length * 3.5 + 3;
  }

  // Notes
  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_TEAL);
    doc.text("Notes", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const noteLines = doc.splitTextToSize(data.notes, pageW - margin * 2);
    doc.text(noteLines, margin, y);
  }

  // Thank you
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_TEAL);
  doc.text("Thank you for your business.", pageW / 2, pageH - 16, { align: "center" });

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
