/** Domain model for executive run summary PDFs (Edge + tests). */

export type ReportStatus = "completed" | "pending" | "failed";

export type RunReportField = { label: string; value: string | number | null };

export type MatrixColumnDef = { key: string; label_he: string; label_en: string; field_type?: string };

export type RunReportStep = {
  name: string;
  status: ReportStatus;
  /** Localized short text for status pill */
  statusLabel: string;
  fields: RunReportField[];
  matrix: {
    columns: MatrixColumnDef[];
    rows: Record<string, unknown>[];
    omittedRowCount: number;
  } | null;
  note?: string;
};

export type RunReportPhase = {
  name: string;
  /** e.g. שלב א */
  orderLabel: string;
  status: ReportStatus;
  statusLabel: string;
  steps: RunReportStep[];
};

export type RunReport = {
  reportTitle: string;
  createdAt: string;
  runId: string;
  processName: string;
  processCode?: string;
  processVersion?: string;
  batchId?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  overallStatus: ReportStatus;
  completedSteps: number;
  pendingSteps: number;
  failedSteps: number;
  skippedSteps: number;
  durationLabel: string;
  phases: RunReportPhase[];
  finalSummary: RunReportField[];
  /** Primary document direction */
  rtl: boolean;
  lang: "he" | "en";
};

/** Rich mock for design review / CLI sample output. */
export function createMockRunReport(): RunReport {
  return {
    reportTitle: "סיכום ריצת ייצור",
    createdAt: "2026-03-30T08:15:00.000Z",
    runId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    processName: "ייצור ביצים מפוסטרות — קו 4035",
    processCode: "PAST_EGG_4035",
    processVersion: "2",
    batchId: "B-2026-0318-07",
    startedAt: "2026-03-18T05:40:00.000Z",
    endedAt: "2026-03-18T14:22:00.000Z",
    overallStatus: "completed",
    completedSteps: 11,
    pendingSteps: 1,
    failedSteps: 0,
    skippedSteps: 0,
    durationLabel: "8 שעות ו־42 דקות",
    rtl: true,
    lang: "he",
    phases: [
      {
        name: "שבירה",
        orderLabel: "שלב א",
        status: "completed",
        statusLabel: "הושלם",
        steps: [
          {
            name: "קבלת חומר גלם",
            status: "completed",
            statusLabel: "הושלם",
            matrix: null,
            fields: [
              { label: "ספק", value: "מזון איכות בע״מ" },
              { label: "טמפרטורת קבלה", value: "4 °C" },
              { label: "הערות", value: null },
            ],
          },
          {
            name: "בדיקת נוזל שבירה",
            status: "pending",
            statusLabel: "ממתין",
            matrix: null,
            fields: [],
          },
        ],
      },
      {
        name: "פסטור",
        orderLabel: "שלב ב",
        status: "completed",
        statusLabel: "הושלם",
        steps: [
          {
            name: "רישום פרמטרי פסטור",
            status: "completed",
            statusLabel: "הושלם",
            matrix: {
              columns: [
                { key: "t", label_he: "זמן", label_en: "Time" },
                { key: "temp", label_he: "טמפ׳ °C", label_en: "Temp °C" },
                { key: "ok", label_he: "תקין", label_en: "OK" },
              ],
              rows: [
                { t: "06:10", temp: "64.2", ok: "תקין" },
                { t: "06:45", temp: "64.5", ok: "תקין" },
                { t: "07:20", temp: "64.1", ok: "תקין" },
              ],
              omittedRowCount: 0,
            },
            fields: [],
          },
        ],
      },
      {
        name: "אריזה",
        orderLabel: "שלב ג",
        status: "completed",
        statusLabel: "הושלם",
        steps: [
          {
            name: "מילוי אריזות",
            status: "completed",
            statusLabel: "הושלם",
            matrix: null,
            fields: [
              { label: "קו אריזה", value: "A" },
              { label: "משקל ממוצע", value: "500 גרם" },
            ],
          },
        ],
      },
      {
        name: "הקפאה בשוק פריזר",
        orderLabel: "שלב ד",
        status: "completed",
        statusLabel: "הושלם",
        steps: [
          {
            name: "העברה לפריזר",
            status: "completed",
            statusLabel: "הושלם",
            matrix: null,
            fields: [{ label: "יעד פריזר", value: "PF-12" }],
          },
        ],
      },
    ],
    finalSummary: [
      { label: "מוצר", value: "ביצים מפוסטרות קרטון 10" },
      { label: "סוג", value: "M" },
      { label: "מספר מנה", value: "LOT-4035-0318" },
      { label: "תאריך ייצור", value: "18/03/2026" },
      { label: "אישור מעבדה", value: "ד״ר כהן" },
      { label: "אישור ייצור", value: "מנהל משמרת" },
      { label: "אישור תהליך סופי", value: "מאושר לשחרור" },
    ],
  };
}
