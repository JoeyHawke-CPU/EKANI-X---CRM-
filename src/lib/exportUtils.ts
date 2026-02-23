import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ---------- CSV ----------
export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- PDF ----------
interface PDFOptions {
  title: string;
  subtitle?: string;
  summaryRows?: { label: string; value: string }[];
  tableHeaders: string[];
  tableRows: string[][];
  filename: string;
  orientation?: "portrait" | "landscape";
}

export function downloadPDF(opts: PDFOptions) {
  const doc = new jsPDF({ orientation: opts.orientation || "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(opts.title, pageW / 2, 18, { align: "center" });

  let y = 26;

  if (opts.subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(opts.subtitle, pageW / 2, y, { align: "center" });
    y += 6;
  }

  // Summary block
  if (opts.summaryRows && opts.summaryRows.length > 0) {
    y += 2;
    doc.setFontSize(9);
    opts.summaryRows.forEach((row) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${row.label}: `, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(row.value, 14 + doc.getTextWidth(`${row.label}: `), y);
      y += 5;
    });
    y += 2;
  }

  // Table
  autoTable(doc, {
    startY: y,
    head: [opts.tableHeaders],
    body: opts.tableRows,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 10, right: 10 },
  });

  doc.save(opts.filename);
}
