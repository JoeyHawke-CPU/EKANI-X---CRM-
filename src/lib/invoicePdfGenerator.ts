import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COMPANY = {
  nameAr: "شركة ايكاني اي أي لاستشارات تقنية المعلومات",
  nameEn: "EKANI AI CONSULTANCY",
  tagline: "AI Automation Consultancy & Enterprise Intelligence Solutions",
  address: "8 Mall, Office No. 41\nSalem Mubarak Street, Block 2\nSalmiya, Kuwait",
  tel: "+965 65715935",
  email: "hello@ekani.ai",
  web: "www.ekani.ai",
  cr: "Commercial Registration No.: 538190",
};

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

function drawHeader(doc: jsPDF, pageW: number) {
  // Company name in English (bold, large)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(220, 53, 69); // Brand red
  doc.text(COMPANY.nameEn, pageW / 2, 16, { align: "center" });

  // Tagline
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(COMPANY.tagline, pageW / 2, 22, { align: "center" });

  // Address block
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  const addressLines = COMPANY.address.split("\n");
  addressLines.forEach((line, i) => {
    doc.text(line, pageW / 2, 28 + i * 4, { align: "center" });
  });
  doc.text(`TEL: ${COMPANY.tel} | ${COMPANY.email} | ${COMPANY.web}`, pageW / 2, 40, { align: "center" });
  doc.text(COMPANY.cr, pageW / 2, 44, { align: "center" });

  // Separator line
  doc.setDrawColor(22, 160, 133);
  doc.setLineWidth(0.5);
  doc.line(14, 48, pageW - 14, 48);

  return 52;
}

// ---------- INVOICE PDF ----------
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

export function generateInvoicePDF(data: InvoiceData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  let y = drawHeader(doc, pageW);

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(33, 33, 33);
  doc.text("INVOICE", pageW / 2, y, { align: "center" });
  y += 10;

  // Invoice meta
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  doc.setFont("helvetica", "bold");
  doc.text("Invoice No:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.invoiceNumber, 42, y);

  doc.setFont("helvetica", "bold");
  doc.text("Date:", pageW - 60, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.date, pageW - 46, y);
  y += 7;

  // Bill To
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(data.clientName, 14, y);
  y += 5;
  if (data.clientAddress) {
    const addrLines = doc.splitTextToSize(data.clientAddress, 80);
    doc.text(addrLines, 14, y);
    y += addrLines.length * 4;
  }
  y += 5;

  // Table
  autoTable(doc, {
    startY: y,
    head: [["#", "Description", "Amount (KD)"]],
    body: [["1", data.description, formatKD(data.amountKd)]],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 12 },
      2: { cellWidth: 35, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // Total
  doc.setFillColor(245, 245, 245);
  doc.rect(pageW - 80, y, 66, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(33, 33, 33);
  doc.text("TOTAL:", pageW - 76, y + 7);
  doc.text(formatKD(data.amountKd), pageW - 18, y + 7, { align: "right" });
  y += 16;

  // Amount in words
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Amount in words: ${amountToWords(data.amountKd)}`, 14, y);
  y += 8;

  // Payment terms
  if (data.paymentTerms) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text("Payment Terms:", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const termLines = doc.splitTextToSize(data.paymentTerms, pageW - 28);
    doc.text(termLines, 14, y);
    y += termLines.length * 4 + 4;
  }

  // Notes
  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(data.notes, pageW - 28);
    doc.text(noteLines, 14, y);
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(22, 160, 133);
  doc.setLineWidth(0.3);
  doc.line(14, pageH - 16, pageW - 14, pageH - 16);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for your business.", pageW / 2, pageH - 10, { align: "center" });

  return doc;
}

// ---------- RECEIPT PDF ----------
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

export function generateReceiptPDF(data: ReceiptData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  let y = drawHeader(doc, pageW);

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(33, 33, 33);
  doc.text("RECEIPT VOUCHER", pageW / 2, y, { align: "center" });
  y += 4;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("سند قبض", pageW / 2, y + 4, { align: "center" });
  y += 14;

  // Meta fields in a structured layout
  const drawField = (label: string, value: string, x: number, currentY: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(label, x, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(value, x + doc.getTextWidth(label) + 3, currentY);
  };

  drawField("Receipt No:", data.receiptNumber, 14, y);
  drawField("Date:", data.date, pageW / 2, y);
  y += 8;

  drawField("Received From:", data.clientName, 14, y);
  y += 8;

  drawField("Amount:", formatKD(data.amountKd), 14, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`(${amountToWords(data.amountKd)})`, 14, y);
  y += 10;

  drawField("Payment Method:", data.paymentMethod, 14, y);
  if (data.paymentMethod === "Cheque" && data.chequeReference) {
    drawField("Cheque No:", data.chequeReference, pageW / 2, y);
  }
  y += 8;

  if (data.bankName) {
    drawField("Bank:", data.bankName, 14, y);
    y += 8;
  }

  drawField("Description:", "", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const descLines = doc.splitTextToSize(data.description, pageW - 28);
  doc.text(descLines, 14, y);
  y += descLines.length * 5 + 15;

  // Signature block
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);

  const sigY = Math.max(y, 200);
  // Accountant sig
  doc.line(14, sigY, 75, sigY);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Accountant Signature", 14, sigY + 5);

  // Client sig
  doc.line(pageW - 75, sigY, pageW - 14, sigY);
  doc.text("Client Signature", pageW - 75, sigY + 5);

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(22, 160, 133);
  doc.setLineWidth(0.3);
  doc.line(14, pageH - 16, pageW - 14, pageH - 16);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for your business.", pageW / 2, pageH - 10, { align: "center" });

  return doc;
}
