import PDFDocument from "pdfkit";
type PdfDoc = InstanceType<typeof PDFDocument>;

export const BOOKING_REPORT_THEME = {
  page: {
    margin: 42,
    footerReserve: 26,
  },
  colors: {
    text: "#111827",
    muted: "#6B7280",
    border: "#D1D5DB",
    panel: "#F8FAFC",
    panelAlt: "#F3F4F6",
    headerBg: "#0F172A",
    headerText: "#FFFFFF",
    success: "#059669",
    successBg: "#ECFDF5",
  },
  typography: {
    title: 18,
    subtitle: 10,
    section: 12,
    body: 10,
    label: 9,
  },
} as const;

export function formatUtcTimestamp(date: Date | null | undefined): string {
  if (!date) return "N/A";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second} UTC`;
}

export function formatCoordinate(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "N/A";
  }
  return value.toFixed(6);
}

export function formatDurationBetween(
  start: Date | null | undefined,
  end: Date | null | undefined
): string {
  if (!start || !end) return "N/A";
  const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
  if (!Number.isFinite(seconds) || seconds < 0) return "N/A";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

export function drawSectionHeader(doc: PdfDoc, text: string, y: number, width: number) {
  doc
    .fillColor(BOOKING_REPORT_THEME.colors.text)
    .fontSize(BOOKING_REPORT_THEME.typography.section)
    .text(text, BOOKING_REPORT_THEME.page.margin, y, { width, lineBreak: false });

  const lineY = y + 16;
  doc
    .strokeColor(BOOKING_REPORT_THEME.colors.border)
    .lineWidth(1)
    .moveTo(BOOKING_REPORT_THEME.page.margin, lineY)
    .lineTo(BOOKING_REPORT_THEME.page.margin + width, lineY)
    .stroke();
}

export function drawStatusChip(doc: PdfDoc, status: string, x: number, y: number) {
  const chipHeight = 16;
  const padding = 8;
  const textWidth = doc
    .fontSize(BOOKING_REPORT_THEME.typography.label)
    .widthOfString(status.toUpperCase());
  const chipWidth = textWidth + padding * 2;

  doc
    .roundedRect(x, y, chipWidth, chipHeight, 8)
    .fillAndStroke(BOOKING_REPORT_THEME.colors.successBg, BOOKING_REPORT_THEME.colors.success);
  doc
    .fillColor(BOOKING_REPORT_THEME.colors.success)
    .fontSize(BOOKING_REPORT_THEME.typography.label)
    .text(status.toUpperCase(), x + padding, y + 4, { lineBreak: false });
}

export function drawKpiCard(
  doc: PdfDoc,
  opts: { title: string; value: string; x: number; y: number; width: number; height: number }
) {
  doc
    .roundedRect(opts.x, opts.y, opts.width, opts.height, 8)
    .fillAndStroke(BOOKING_REPORT_THEME.colors.panel, BOOKING_REPORT_THEME.colors.border);

  doc
    .fillColor(BOOKING_REPORT_THEME.colors.muted)
    .fontSize(BOOKING_REPORT_THEME.typography.label)
    .text(opts.title, opts.x + 10, opts.y + 10, {
      width: opts.width - 20,
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .fillColor(BOOKING_REPORT_THEME.colors.text)
    .fontSize(BOOKING_REPORT_THEME.typography.body)
    .text(opts.value, opts.x + 10, opts.y + 26, {
      width: opts.width - 20,
      lineBreak: false,
      ellipsis: true,
    });
}

export function drawKeyValueGrid(
  doc: PdfDoc,
  opts: {
    rows: Array<{ label: string; value: string }>;
    x: number;
    y: number;
    width: number;
    rowHeight?: number;
  }
) {
  const rowHeight = opts.rowHeight ?? 18;
  const labelWidth = Math.floor(opts.width * 0.34);
  opts.rows.forEach((row, index) => {
    const rowY = opts.y + index * rowHeight;
    doc
      .fillColor(BOOKING_REPORT_THEME.colors.muted)
      .fontSize(BOOKING_REPORT_THEME.typography.label)
      .text(row.label, opts.x + 8, rowY + 5, {
        width: labelWidth - 12,
        lineBreak: false,
        ellipsis: true,
      });

    doc
      .fillColor(BOOKING_REPORT_THEME.colors.text)
      .fontSize(BOOKING_REPORT_THEME.typography.body)
      .text(row.value, opts.x + labelWidth, rowY + 5, {
        width: opts.width - labelWidth - 8,
        lineBreak: false,
        ellipsis: true,
      });

    doc
      .strokeColor(BOOKING_REPORT_THEME.colors.border)
      .lineWidth(0.5)
      .moveTo(opts.x, rowY + rowHeight)
      .lineTo(opts.x + opts.width, rowY + rowHeight)
      .stroke();
  });
}

export function drawTable(
  doc: PdfDoc,
  opts: {
    x: number;
    y: number;
    width: number;
    columns: Array<{ key: string; label: string; widthRatio: number }>;
    rows: Array<Record<string, string>>;
    rowHeight?: number;
    onNewPage?: (nextY: number) => number;
  }
) {
  const rowHeight = opts.rowHeight ?? 22;
  const colWidths = normalizeColumnWidths(opts.columns.map((col) => col.widthRatio), opts.width);
  let cursorY = opts.y;

  const drawHeader = () => {
    doc
      .rect(opts.x, cursorY, opts.width, rowHeight)
      .fillAndStroke(BOOKING_REPORT_THEME.colors.panelAlt, BOOKING_REPORT_THEME.colors.border);
    let cx = opts.x;
    opts.columns.forEach((col, idx) => {
      const width = colWidths[idx];
      doc
        .fillColor(BOOKING_REPORT_THEME.colors.muted)
        .fontSize(BOOKING_REPORT_THEME.typography.label)
        .text(col.label, cx + 6, cursorY + 6, {
          width: width - 12,
          lineBreak: false,
          ellipsis: true,
        });
      cx += width;
    });
    cursorY += rowHeight;
  };

  drawHeader();

  opts.rows.forEach((row, rowIndex) => {
    const usableBottom =
      doc.page.height - doc.page.margins.bottom - BOOKING_REPORT_THEME.page.footerReserve;
    if (cursorY + rowHeight > usableBottom) {
      if (opts.onNewPage) {
        cursorY = opts.onNewPage(BOOKING_REPORT_THEME.page.margin);
      } else {
        doc.addPage();
        cursorY = BOOKING_REPORT_THEME.page.margin;
      }
      drawHeader();
    }

    doc
      .rect(opts.x, cursorY, opts.width, rowHeight)
      .fillAndStroke(
        rowIndex % 2 === 0 ? "#FFFFFF" : BOOKING_REPORT_THEME.colors.panel,
        BOOKING_REPORT_THEME.colors.border
      );

    let cx = opts.x;
    opts.columns.forEach((col, idx) => {
      const width = colWidths[idx];
      doc
        .fillColor(BOOKING_REPORT_THEME.colors.text)
        .fontSize(BOOKING_REPORT_THEME.typography.body)
        .text(row[col.key] ?? "N/A", cx + 6, cursorY + 6, {
          width: width - 12,
          lineBreak: false,
          ellipsis: true,
        });
      cx += width;
    });

    cursorY += rowHeight;
  });

  return cursorY;
}

export function hasVerticalSpace(doc: PdfDoc, neededHeight: number): boolean {
  const usableBottom =
    doc.page.height - doc.page.margins.bottom - BOOKING_REPORT_THEME.page.footerReserve;
  return doc.y + neededHeight <= usableBottom;
}

export function ensureVerticalSpace(doc: PdfDoc, neededHeight: number) {
  if (!hasVerticalSpace(doc, neededHeight)) {
    doc.addPage();
    doc.y = BOOKING_REPORT_THEME.page.margin;
  }
}

export function drawPageFooter(
  doc: PdfDoc,
  pageNumber: number,
  generatedAt: string,
  providerId: string
) {
  const footerY = doc.page.height - doc.page.margins.bottom - 14;
  doc
    .strokeColor(BOOKING_REPORT_THEME.colors.border)
    .lineWidth(0.5)
    .moveTo(BOOKING_REPORT_THEME.page.margin, footerY - 4)
    .lineTo(doc.page.width - BOOKING_REPORT_THEME.page.margin, footerY - 4)
    .stroke();

  doc
    .fillColor(BOOKING_REPORT_THEME.colors.muted)
    .fontSize(8)
    .text(`Generated ${generatedAt}`, BOOKING_REPORT_THEME.page.margin, footerY, {
      width: doc.page.width - BOOKING_REPORT_THEME.page.margin * 2,
      lineBreak: false,
      ellipsis: true,
    });
  doc
    .fillColor(BOOKING_REPORT_THEME.colors.muted)
    .fontSize(8)
    .text(`Provider ${providerId}`, BOOKING_REPORT_THEME.page.margin, footerY, {
      align: "center",
      width: doc.page.width - BOOKING_REPORT_THEME.page.margin * 2,
      lineBreak: false,
      ellipsis: true,
    });
  doc
    .fillColor(BOOKING_REPORT_THEME.colors.muted)
    .fontSize(8)
    .text(`Page ${pageNumber}`, BOOKING_REPORT_THEME.page.margin, footerY, {
      align: "right",
      width: doc.page.width - BOOKING_REPORT_THEME.page.margin * 2,
      lineBreak: false,
    });
}

function normalizeColumnWidths(ratios: number[], fullWidth: number): number[] {
  const total = ratios.reduce((sum, ratio) => sum + ratio, 0);
  if (total <= 0) {
    return ratios.map(() => fullWidth / ratios.length);
  }
  return ratios.map((ratio) => (fullWidth * ratio) / total);
}
