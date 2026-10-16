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

const STATUS_LABEL: Record<string, string> = {
  passed: "PASSED",
  failed: "FAILED",
  running: "RUNNING",
  skipped: "SKIPPED",
};

const LOG_RGB: Record<string, [number, number, number]> = {
  "step-ok": [21, 128, 61],
  "step-fail": [185, 28, 28],
  step: [21, 128, 61],
  error: [185, 28, 28],
  stderr: [180, 83, 9],
  system: [37, 99, 235],
  stdout: [71, 85, 105],
};

interface ParsedStep {
  ok: boolean;
  offset: string;
  meta: string;
  title: string;
  duration?: string;
}

function parseStepLine(raw: string): ParsedStep | null {
  const match = raw
    .trim()
    .match(/^\[STEP\]\s*\+([\d.]+)s\s*([✔✘✓✗])\s*\[([^\]]+)\]\s*(.*?)(?:\s*\(([\d.]+)s\))?\s*$/);
  if (!match) return null;
  return {
    ok: match[2] === "✔" || match[2] === "✓",
    offset: match[1],
    meta: match[3],
    title: match[4],
    duration: match[5],
  };
}

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

  const contentW = pageWidth - margin * 2;
  let y = ((doc as any).lastAutoTable?.finalY ?? 220) + 24;

  const ensureSpace = (needed: number): void => {
    if (y + needed > pageHeight - 46) {
      doc.addPage();
      y = 60;
    }
  };

  tests.forEach((test, i) => {
    const statusRgb = STATUS_RGB[test.status] || [55, 65, 81];
    const statusLabel = STATUS_LABEL[test.status] || test.status.toUpperCase();
    const logs = (test.logs || []).filter((l) => l.text && l.text.trim());

    // ── Header band with colored status accent + chip ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    const titleLines = doc.splitTextToSize(`${i + 1}. ${testTitle(test)}`, contentW - 120);
    const headerH = Math.max(26, titleLines.length * 14 + 12);
    ensureSpace(headerH + 10);

    doc.setFillColor(246, 247, 249);
    doc.roundedRect(margin, y, contentW, headerH, 5, 5, "F");
    doc.setFillColor(...statusRgb);
    doc.roundedRect(margin, y, 4, headerH, 2, 2, "F");

    const chipW = 60;
    const chipX = margin + contentW - chipW - 8;
    doc.setFillColor(...statusRgb);
    doc.roundedRect(chipX, y + 7, chipW, 15, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(statusLabel, chipX + chipW / 2, y + 17, { align: "center" });

    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    titleLines.forEach((line: string, li: number) => {
      doc.text(line, margin + 12, y + 17 + li * 14);
    });
    y += headerH + 3;

    // ── Meta line ──
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 128, 140);
    const meta = [
      `Suite: ${test.suite}`,
      `Run: ${test.run}`,
      `Project: ${test.project}`,
      `Duration: ${formatDuration(testDuration(test))}`,
    ].join("   |   ");
    ensureSpace(16);
    doc.text(meta, margin + 4, y + 9);
    y += 18;

    if (!logs.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("(no logs captured)", margin + 12, y + 8);
      y += 18;
      return;
    }

    // ── Step tally ──
    let okCount = 0;
    let failCount = 0;
    for (const log of logs) {
      const step = parseStepLine(log.text);
      if (step) step.ok ? okCount++ : failCount++;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(21, 128, 61);
    doc.text(`Steps: ${okCount} ok`, margin + 4, y + 8);
    if (failCount > 0) {
      const w = doc.getTextWidth(`Steps: ${okCount} ok`);
      doc.setTextColor(185, 28, 28);
      doc.text(`  /  ${failCount} failed`, margin + 4 + w, y + 8);
    }
    y += 16;

    // ── Log lines ──
    const dotX = margin + 5;
    const offsetX = margin + 13;
    const textX = margin + 46;
    const hangIndent = 12;

    for (const log of logs) {
      const step = parseStepLine(log.text);

      if (step) {
        const color = step.ok ? LOG_RGB["step-ok"] : LOG_RGB["step-fail"];
        const rest = `${step.meta}   ${step.title}${step.duration ? `   (${step.duration}s)` : ""}`;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const wrapped = doc.splitTextToSize(rest, pageWidth - margin - textX);

        ensureSpace(13);
        doc.setFillColor(...color);
        doc.circle(dotX, y - 3, 2.2, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(140, 148, 160);
        doc.text(`${step.offset}s`, offsetX, y);
        doc.setFontSize(8.5);
        doc.setTextColor(...color);
        wrapped.forEach((w: string) => {
          ensureSpace(13);
          doc.text(w, textX, y);
          y += 11.5;
        });
        y += 1.5;
      } else {
        const color = LOG_RGB[log.type] || LOG_RGB.stdout;
        doc.setFont("courier", "normal");
        doc.setFontSize(7.8);
        const clean = log.text.replace(/\s+$/, "");
        const wrapped = doc.splitTextToSize(clean, contentW - hangIndent - 8);
        doc.setTextColor(...color);
        wrapped.forEach((w: string, wi: number) => {
          ensureSpace(11);
          doc.text(w, margin + 8 + (wi > 0 ? hangIndent : 0), y);
          y += 10;
        });
      }
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
