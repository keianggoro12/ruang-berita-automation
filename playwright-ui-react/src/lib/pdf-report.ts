import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDuration, testDuration, testTitle, type TestResult } from "./types";

export const BRAND = "Automation Newsroom Pustaka Runner";

const STATUS_RGB: Record<string, [number, number, number]> = {
  passed: [22, 163, 74],
  failed: [220, 38, 38],
  running: [234, 179, 8],
  skipped: [107, 114, 128],
};

interface ReportOptions {
  scope: string;
  tests: TestResult[];
  generatedAt?: Date;
}

export function downloadSummaryPdf({ scope, tests, generatedAt = new Date() }: ReportOptions): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 72, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(BRAND, margin, 33);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225);
  doc.text("Test Execution Report", margin, 52);

  const passed = tests.filter((t) => t.status === "passed").length;
  const failed = tests.filter((t) => t.status === "failed").length;
  const totalDuration = tests.reduce((sum, t) => sum + testDuration(t), 0);

  doc.setTextColor(55, 65, 81);
  doc.setFontSize(10);
  doc.text(`Scope: ${scope}`, margin, 94);
  doc.text(`Generated: ${generatedAt.toLocaleString()}`, margin, 108);

  const stats: Array<{ label: string; value: string; rgb: [number, number, number] }> = [
    { label: "Total", value: String(tests.length), rgb: [37, 99, 235] },
    { label: "Passed", value: String(passed), rgb: [22, 163, 74] },
    { label: "Failed", value: String(failed), rgb: [220, 38, 38] },
    { label: "Duration", value: formatDuration(totalDuration), rgb: [109, 40, 217] },
  ];
  const boxW = (pageWidth - margin * 2 - 3 * 10) / 4;
  stats.forEach((stat, i) => {
    const x = margin + i * (boxW + 10);
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(x, 124, boxW, 54, 6, 6, "F");
    doc.setTextColor(...stat.rgb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(stat.value, x + 12, 150);
    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(stat.label.toUpperCase(), x + 12, 166);
  });

  autoTable(doc, {
    startY: 196,
    head: [["No", "Status", "Test", "Suite", "Duration"]],
    body: tests.map((t, i) => [
      String(i + 1),
      t.status.toUpperCase(),
      testTitle(t),
      t.suite,
      formatDuration(testDuration(t)),
    ]),
    styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak", valign: "middle" },
    headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 26, halign: "center" },
      1: { cellWidth: 62, fontStyle: "bold" },
      4: { cellWidth: 72, halign: "right" },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.column.index === 1) {
        data.cell.styles.textColor = STATUS_RGB[String(data.cell.raw).toLowerCase()] || [107, 114, 128];
      }
    },
  });

  let y = ((doc as any).lastAutoTable?.finalY ?? 220) + 26;

  tests.forEach((t, i) => {
    if (y > pageHeight - 120) {
      doc.addPage();
      y = 60;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...(STATUS_RGB[t.status] || [55, 65, 81]));
    const heading = doc.splitTextToSize(`${i + 1}. [${t.status.toUpperCase()}] ${testTitle(t)}`, pageWidth - margin * 2);
    doc.text(heading, margin, y);
    y += heading.length * 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`Suite: ${t.suite}   |   Run: ${t.run}   |   Duration: ${formatDuration(testDuration(t))}`, margin, y);
    y += 16;

    const logs = (t.logs || []).map((l) => l.text).filter((line) => line && line.trim());
    if (logs.length) {
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(31, 41, 55);
      for (const line of logs) {
        const wrapped = doc.splitTextToSize(line.replace(/\t/g, "  "), pageWidth - margin * 2);
        for (const w of wrapped) {
          if (y > pageHeight - 50) {
            doc.addPage();
            y = 60;
          }
          doc.text(w, margin, y);
          y += 10;
        }
      }
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("(no logs captured)", margin, y);
      y += 12;
    }
    y += 16;
  });

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(BRAND, margin, pageHeight - 20);
    doc.text(`Page ${p} / ${pageCount}`, pageWidth - margin, pageHeight - 20, { align: "right" });
  }

  const stamp = generatedAt.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  doc.save(`report-${stamp}.pdf`);
}
