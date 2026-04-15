/**
 * Executive-style A4 run summary PDF (pdf-lib, Deno).
 *
 * Layout “components” (single module for Edge deploy simplicity):
 * - drawReportHeader → ReportHeader
 * - drawSummaryCards → SummaryCards
 * - drawPhaseHeader / phase loop → PhaseSection
 * - drawStepCard / drawStepTitleBand → StepCard
 * - drawStatusBadge → StatusBadge
 * - drawKeyValueGrid → KeyValueGrid
 * - drawMatrixPaginated → DataTable
 * - drawFinalSummary → FinalSummary
 * - drawFootersFixed → PdfFooter
 */
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1?target=deno";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "https://esm.sh/pdf-lib@1.17.1?target=deno";
import { normalizeHebrewPdfDashes } from "../_shared/hebrewPdfRtlLayout.ts";
import { applyHebrewWordVisualReorder } from "../_shared/hebrewPdfVisualReorder.ts";
import type { Lang } from "../_shared/runSummaryPdfFlatten.ts";
import type { MatrixColumnDef, ReportStatus, RunReport, RunReportField, RunReportPhase, RunReportStep } from "../_shared/runReportModel.ts";

export const PAGE_W = 595;
export const PAGE_H = 842;
const MARGIN = 44;
const FOOTER_H = 46;
const HEBREW_REG_URL =
  "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansHebrew/NotoSansHebrew-Regular.ttf";
const HEBREW_BOLD_URL =
  "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansHebrew/NotoSansHebrew-Bold.ttf";

const C = {
  accent: rgb(0.06, 0.38, 0.42),
  accentSoft: rgb(0.88, 0.93, 0.94),
  ink: rgb(0.12, 0.14, 0.16),
  muted: rgb(0.38, 0.4, 0.44),
  hairline: rgb(0.86, 0.88, 0.9),
  cardBg: rgb(0.99, 0.995, 1),
  white: rgb(1, 1, 1),
  completed: rgb(0.12, 0.58, 0.32),
  completedBg: rgb(0.9, 0.97, 0.92),
  pending: rgb(0.78, 0.48, 0.08),
  pendingBg: rgb(1, 0.95, 0.86),
  failed: rgb(0.75, 0.18, 0.2),
  failedBg: rgb(1, 0.92, 0.92),
  tableHead: rgb(0.9, 0.93, 0.95),
  grid: rgb(0.72, 0.75, 0.78),
};

const SZ = {
  docTitle: 22,
  section: 15,
  cardTitle: 11,
  body: 12,
  small: 9.5,
  pill: 8.5,
  tableHead: 9,
  tableCell: 9.5,
};

function isHebrewChar(ch: string): boolean {
  return /[\u0590-\u05FF]/.test(ch);
}

function segmentByScript(text: string): { text: string; he: boolean }[] {
  const segs: { text: string; he: boolean }[] = [];
  if (!text) return segs;
  let buf = "";
  let he: boolean | null = null;
  for (const ch of text) {
    const h = isHebrewChar(ch);
    if (he === null) he = h;
    if (h === he) buf += ch;
    else {
      if (buf) segs.push({ text: buf, he });
      buf = ch;
      he = h;
    }
  }
  if (buf) segs.push({ text: buf, he: he! });
  return segs;
}

function pickSegFont(
  seg: { text: string; he: boolean },
  heFont: PDFFont,
  heBold: PDFFont | null,
  latinFont: PDFFont,
  latinBold: PDFFont,
  labelLatinBold: boolean,
  heUseBold: boolean,
): PDFFont {
  return seg.he
    ? (heUseBold ? heBold ?? heFont : heFont) ?? latinFont
    : labelLatinBold
      ? latinBold
      : latinFont;
}

/**
 * pdf-lib places glyphs in string order along +x. For multi-word Hebrew, that puts the logical
 * first word on the left; readers expect it on the right. Paint words in logical order from the
 * line's right edge without mutating strings (catalog copy stays correct).
 */
function drawRtlHebrewWordsPaint(
  page: PDFPage,
  xLeft: number,
  y: number,
  size: number,
  line: string,
  heFont: PDFFont,
  heBold: PDFFont | null,
  latinFont: PDFFont,
  latinBold: PDFFont,
  labelLatinBold: boolean,
  heUseBold: boolean,
  color: RGB,
): void {
  const normalized = line.trim().replace(/\s+/g, " ");
  const words = normalized.split(" ").filter(Boolean);
  if (words.length <= 1) {
    let xPos = xLeft;
    for (const seg of segmentByScript(line)) {
      const f = pickSegFont(seg, heFont, heBold, latinFont, latinBold, labelLatinBold, heUseBold);
      page.drawText(seg.text, { x: xPos, y, size, font: f, color });
      xPos += f.widthOfTextAtSize(seg.text, size);
    }
    return;
  }
  const spaceW = heFont.widthOfTextAtSize(" ", size);
  const total = lineWidthFromString(normalized, size, heFont, heBold, latinFont, latinBold, labelLatinBold, heUseBold);
  let right = xLeft + total;
  for (let i = 0; i < words.length; i++) {
    const w = words[i]!;
    const ww = lineWidthFromString(w, size, heFont, heBold, latinFont, latinBold, labelLatinBold, heUseBold);
    right -= ww;
    let xPos = right;
    for (const seg of segmentByScript(w)) {
      const f = pickSegFont(seg, heFont, heBold, latinFont, latinBold, labelLatinBold, heUseBold);
      page.drawText(seg.text, { x: xPos, y, size, font: f, color });
      xPos += f.widthOfTextAtSize(seg.text, size);
    }
    if (i < words.length - 1) right -= spaceW;
  }
}

/**
 * pdf-lib has no bidi: place script segments in storage order from the physical right edge
 * (logical Hebrew reads right-to-left). Multi-word Hebrew *segments* get per-word RTL paint.
 * Dash normalization merges many "Hebrew — Hebrew" titles into one Hebrew run for word paint.
 */
function drawRtlVisualLine(
  page: PDFPage,
  xLeft: number,
  y: number,
  size: number,
  line: string,
  heFont: PDFFont,
  heBold: PDFFont | null,
  latinFont: PDFFont,
  latinBold: PDFFont,
  labelLatinBold: boolean,
  heUseBold: boolean,
  color: RGB,
): void {
  const normalized = normalizeHebrewPdfDashes(line);
  const trimmed = normalized.trim();
  if (!trimmed) return;
  const segs = segmentByScript(trimmed);
  if (!segs.length) return;
  const total = lineWidthFromString(trimmed, size, heFont, heBold, latinFont, latinBold, labelLatinBold, heUseBold);
  let right = xLeft + total;
  for (const seg of segs) {
    const f = pickSegFont(seg, heFont, heBold, latinFont, latinBold, labelLatinBold, heUseBold);
    const sw = f.widthOfTextAtSize(seg.text, size);
    right -= sw;
    if (seg.he && /\s/.test(seg.text)) {
      drawRtlHebrewWordsPaint(
        page,
        right,
        y,
        size,
        seg.text,
        heFont,
        heBold,
        latinFont,
        latinBold,
        labelLatinBold,
        heUseBold,
        color,
      );
    } else {
      page.drawText(seg.text, { x: right, y, size, font: f, color });
    }
  }
}

function lineWidthFromString(
  line: string,
  size: number,
  heFont: PDFFont | null,
  heBold: PDFFont | null,
  latinFont: PDFFont,
  latinBold: PDFFont,
  labelLatinBold: boolean,
  heUseBold: boolean,
): number {
  let w = 0;
  for (const s of segmentByScript(line)) {
    const f = s.he
      ? (heUseBold ? heBold ?? heFont : heFont) ?? latinFont
      : labelLatinBold
        ? latinBold
        : latinFont;
    w += f.widthOfTextAtSize(s.text, size);
  }
  return w;
}

function wrapText(font: PDFFont, text: string, maxW: number, size: number): string[] {
  const t = text.replace(/\r\n/g, "\n").trim() || " ";
  const lines: string[] = [];
  for (const para of t.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    let cur = "";
    for (const w of words) {
      const trial = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(trial, size) <= maxW) cur = trial;
      else {
        if (cur) lines.push(cur);
        if (font.widthOfTextAtSize(w, size) <= maxW) cur = w;
        else {
          let chunk = "";
          for (const ch of w) {
            const t2 = chunk + ch;
            if (font.widthOfTextAtSize(t2, size) <= maxW) chunk = t2;
            else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          cur = chunk;
        }
      }
    }
    if (cur) lines.push(cur);
  }
  return lines.length ? lines : [" "];
}

function wrapTextMixed(
  text: string,
  maxW: number,
  size: number,
  heFont: PDFFont | null,
  heBold: PDFFont | null,
  latinFont: PDFFont,
  latinBold: PDFFont,
  labelLatinBold: boolean,
  heUseBold: boolean,
): string[] {
  const prepared = heFont ? normalizeHebrewPdfDashes(applyHebrewWordVisualReorder(text)) : text;
  const t = prepared.replace(/\r\n/g, "\n").trim() || " ";
  const lines: string[] = [];
  for (const para of t.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    let cur = "";
    for (const w of words) {
      const trial = cur ? `${cur} ${w}` : w;
      if (lineWidthFromString(trial, size, heFont, heBold, latinFont, latinBold, labelLatinBold, heUseBold) <= maxW) {
        cur = trial;
      } else {
        if (cur) lines.push(cur);
        if (lineWidthFromString(w, size, heFont, heBold, latinFont, latinBold, labelLatinBold, heUseBold) <= maxW) {
          cur = w;
        } else {
          let chunk = "";
          for (const ch of w) {
            const t2 = chunk + ch;
            if (lineWidthFromString(t2, size, heFont, heBold, latinFont, latinBold, labelLatinBold, heUseBold) <= maxW) {
              chunk = t2;
            } else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          cur = chunk;
        }
      }
    }
    if (cur) lines.push(cur);
  }
  return lines.length ? lines : [" "];
}

function drawLineMixed(
  page: PDFPage,
  x: number,
  y: number,
  size: number,
  line: string,
  heFont: PDFFont | null,
  heBold: PDFFont | null,
  latinFont: PDFFont,
  latinBold: PDFFont,
  labelLatinBold: boolean,
  heUseBold: boolean,
  color: RGB,
  /** Hebrew PDF: place multi-word Hebrew lines word-by-word from the right (pdf-lib is LTR-only). */
  rtlWordPaint = false,
): void {
  if (rtlWordPaint && heFont && /[\u0590-\u05FF]/.test(line)) {
    drawRtlVisualLine(
      page,
      x,
      y,
      size,
      line,
      heFont,
      heBold,
      latinFont,
      latinBold,
      labelLatinBold,
      heUseBold,
      color,
    );
    return;
  }
  let xPos = x;
  for (const seg of segmentByScript(line)) {
    const f = seg.he
      ? (heUseBold ? heBold ?? heFont : heFont) ?? latinFont
      : labelLatinBold
        ? latinBold
        : latinFont;
    page.drawText(seg.text, { x: xPos, y, size, font: f, color });
    xPos += f.widthOfTextAtSize(seg.text, size);
  }
}

function truncateLatin(text: string, font: PDFFont, size: number, maxW: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxW) return text;
  const ell = "…";
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const s = text.slice(0, mid) + ell;
    if (font.widthOfTextAtSize(s, size) <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + ell;
}

type GenCtx = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  maxW: number;
  lang: Lang;
  rtl: boolean;
  heFont: PDFFont | null;
  heBold: PDFFont | null;
  latinFont: PDFFont;
  latinBold: PDFFont;
  bottomY: number;
};

/** Physical right edge of the content column (inside margins). */
const contentRightX = () => PAGE_W - MARGIN;

function mixedWidth(
  line: string,
  size: number,
  ctx: GenCtx,
  labelLatinBold: boolean,
  heUseBold: boolean,
): number {
  return lineWidthFromString(line, size, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, labelLatinBold, heUseBold);
}

function drawMixedLineAt(
  ctx: GenCtx,
  x: number,
  y: number,
  size: number,
  line: string,
  labelLatinBold: boolean,
  heUseBold: boolean,
  color: RGB,
  /** Line came from `wrapTextMixed` (already paragraph-reordered); do not reorder again. */
  fromWrap = false,
): void {
  const lineUse =
    !fromWrap && ctx.heFont && ctx.lang === "he"
      ? applyHebrewWordVisualReorder(line)
      : line;
  drawLineMixed(
    ctx.page,
    x,
    y,
    size,
    lineUse,
    ctx.heFont,
    ctx.heBold,
    ctx.latinFont,
    ctx.latinBold,
    labelLatinBold,
    heUseBold,
    color,
    ctx.rtl && ctx.lang === "he",
  );
}

function accentStripeX(ctx: GenCtx): number {
  return ctx.rtl ? MARGIN + ctx.maxW - 3.2 : MARGIN;
}

function newPage(ctx: GenCtx): void {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.y = PAGE_H - MARGIN;
}

function ensureSpace(ctx: GenCtx, need: number): void {
  if (ctx.y - need < ctx.bottomY) newPage(ctx);
}

function statusColors(st: ReportStatus): { fg: RGB; bg: RGB } {
  if (st === "failed") return { fg: C.failed, bg: C.failedBg };
  if (st === "pending") return { fg: C.pending, bg: C.pendingBg };
  return { fg: C.completed, bg: C.completedBg };
}

function drawPill(
  ctx: GenCtx,
  x: number,
  yTop: number,
  text: string,
  fg: RGB,
  bg: RGB,
): number {
  const padX = 8;
  const padY = 4;
  const textOut = ctx.lang === "he" && ctx.heFont ? applyHebrewWordVisualReorder(text) : text;
  const tw = lineWidthFromString(textOut, SZ.pill, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, false);
  const w = tw + padX * 2;
  const h = SZ.pill + padY * 2;
  const yRect = yTop - h;
  ctx.page.drawRectangle({
    x,
    y: yRect,
    width: w,
    height: h,
    color: bg,
    borderColor: fg,
    borderWidth: 0.4,
  });
  const ty = yRect + padY + 1;
  if (ctx.lang === "he" && ctx.heFont) {
    drawLineMixed(
      ctx.page,
      x + padX,
      ty,
      SZ.pill,
      textOut,
      ctx.heFont,
      ctx.heBold,
      ctx.latinFont,
      ctx.latinBold,
      false,
      false,
      fg,
      ctx.rtl && ctx.lang === "he",
    );
  } else {
    ctx.page.drawText(text, { x: x + padX, y: ty, size: SZ.pill, font: ctx.latinFont, color: fg });
  }
  return w + 6;
}

function drawReportHeader(ctx: GenCtx, r: RunReport): void {
  const bandH = 118;
  ensureSpace(ctx, bandH + 24);
  const top = ctx.y;
  const bottom = top - bandH;
  ctx.page.drawRectangle({
    x: MARGIN,
    y: bottom,
    width: ctx.maxW,
    height: bandH,
    color: C.accentSoft,
    borderColor: C.hairline,
    borderWidth: 0.5,
  });
  const logoW = 72;
  const logoH = 40;
  const logoX = r.rtl ? PAGE_W - MARGIN - logoW : MARGIN + 8;
  ctx.page.drawRectangle({
    x: logoX,
    y: bottom + bandH - logoH - 12,
    width: logoW,
    height: logoH,
    color: C.white,
    borderColor: C.hairline,
    borderWidth: 0.45,
  });
  const logoHint = r.lang === "he" ? "לוגו" : "Logo";
  const logoY = bottom + bandH - logoH - 2;
  const logoHintW =
    ctx.lang === "he" && ctx.heFont
      ? mixedWidth(logoHint, SZ.small, ctx, false, false)
      : ctx.latinFont.widthOfTextAtSize(logoHint, SZ.small);
  const logoHintX = logoX + (logoW - logoHintW) / 2;
  if (r.lang === "he" && ctx.heFont) {
    drawLineMixed(
      ctx.page,
      logoHintX,
      logoY,
      SZ.small,
      logoHint,
      ctx.heFont,
      ctx.heBold,
      ctx.latinFont,
      ctx.latinBold,
      false,
      false,
      C.muted,
      r.rtl && r.lang === "he",
    );
  } else {
    ctx.page.drawText(logoHint, {
      x: logoHintX,
      y: logoY,
      size: SZ.small,
      font: ctx.latinFont,
      color: C.muted,
    });
  }

  const textMaxW = ctx.maxW - logoW - 36;
  const textLeft = MARGIN + logoW + 20;
  const textRightBound = logoX - 14;
  let ty = bottom + bandH - 18;

  const titleLines =
    ctx.lang === "he" && ctx.heFont
      ? wrapTextMixed(r.reportTitle, textMaxW, SZ.docTitle, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, true)
      : wrapText(ctx.latinBold, r.reportTitle, textMaxW, SZ.docTitle);
  for (const ln of titleLines) {
    const tx = ctx.rtl
      ? textRightBound - mixedWidth(ln, SZ.docTitle, ctx, false, true)
      : textLeft;
    if (ctx.lang === "he" && ctx.heFont) {
      drawMixedLineAt(ctx, tx, ty, SZ.docTitle, ln, false, true, C.accent, true);
    } else {
      ctx.page.drawText(ln, { x: tx, y: ty, size: SZ.docTitle, font: ctx.latinBold, color: C.accent });
    }
    ty -= SZ.docTitle + 5;
  }
  ty -= 2;

  const sub = `${r.processName}  ·  ${r.lang === "he" ? "מזהה ריצה" : "Run ID"}: ${r.runId.slice(0, 8)}…`;
  const subLines =
    ctx.lang === "he" && ctx.heFont
      ? wrapTextMixed(sub, textMaxW, SZ.body, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, false)
      : wrapText(ctx.latinFont, sub, textMaxW, SZ.body);
  for (const ln of subLines) {
    const sx = ctx.rtl ? textRightBound - mixedWidth(ln, SZ.body, ctx, false, false) : textLeft;
    if (ctx.lang === "he" && ctx.heFont) {
      drawMixedLineAt(ctx, sx, ty, SZ.body, ln, false, false, C.ink, true);
    } else ctx.page.drawText(ln, { x: sx, y: ty, size: SZ.body, font: ctx.latinFont, color: C.ink });
    ty -= SZ.body + 3;
  }
  const genLine = `${r.lang === "he" ? "נוצר" : "Generated"}: ${r.createdAt.replace("T", " ").slice(0, 19)} UTC`;
  const gx = ctx.rtl ? textRightBound - mixedWidth(genLine, SZ.small, ctx, false, false) : textLeft;
  if (ctx.lang === "he" && ctx.heFont) {
    drawMixedLineAt(ctx, gx, ty, SZ.small, genLine, false, false, C.muted);
  } else {
    ctx.page.drawText(genLine, { x: gx, y: ty, size: SZ.small, font: ctx.latinFont, color: C.muted });
  }

  const pillY = bottom + 14;
  const oc = statusColors(r.overallStatus);
  const overallLabel =
    r.lang === "he"
      ? r.overallStatus === "completed"
        ? "סטטוס כללי: הושלם"
        : r.overallStatus === "failed"
          ? "סטטוס כללי: נכשל"
          : "סטטוס כללי: פתוח"
      : `Overall: ${r.overallStatus}`;
  const stepsPill =
    r.lang === "he"
      ? `שלבים: ${r.completedSteps} הושלמו / ${r.pendingSteps} ממתינים`
      : `Steps: ${r.completedSteps} done / ${r.pendingSteps} open`;

  if (!ctx.rtl) {
    let px = MARGIN + 10;
    px += drawPill(ctx, px, pillY, overallLabel, oc.fg, oc.bg);
    drawPill(ctx, px, pillY, stepsPill, C.muted, rgb(0.94, 0.95, 0.96));
  } else {
    const padX = 8;
    const padY = 4;
    const pillH = SZ.pill + padY * 2;
    const yRectBase = pillY - pillH;
    let rightEdge = contentRightX() - 10;
    const drawPillRtl = (text: string, fg: RGB, bg: RGB) => {
      const textOut = ctx.lang === "he" && ctx.heFont ? applyHebrewWordVisualReorder(text) : text;
      const tw = lineWidthFromString(textOut, SZ.pill, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, false);
      const w = tw + padX * 2;
      const x = rightEdge - w;
      ctx.page.drawRectangle({
        x,
        y: yRectBase,
        width: w,
        height: pillH,
        color: bg,
        borderColor: fg,
        borderWidth: 0.4,
      });
      const ty = yRectBase + padY + 1;
      if (ctx.lang === "he" && ctx.heFont) {
        drawLineMixed(
          ctx.page,
          x + padX,
          ty,
          SZ.pill,
          textOut,
          ctx.heFont,
          ctx.heBold,
          ctx.latinFont,
          ctx.latinBold,
          false,
          false,
          fg,
          true,
        );
      } else {
        ctx.page.drawText(text, { x: x + padX, y: ty, size: SZ.pill, font: ctx.latinFont, color: fg });
      }
      rightEdge = x - 6;
    };
    drawPillRtl(overallLabel, oc.fg, oc.bg);
    drawPillRtl(stepsPill, C.muted, rgb(0.94, 0.95, 0.96));
  }

  ctx.y = bottom - 18;
}

function drawSummaryCards(ctx: GenCtx, r: RunReport): void {
  const labelsHe: [string, keyof RunReport][] = [
    ["תהליך", "processName"],
    ["אצווה", "batchId"],
    ["סטטוס ריצה", "overallStatus"],
    ["התחלה", "startedAt"],
    ["סיום", "endedAt"],
    ["משך", "durationLabel"],
    ["הושלמו", "completedSteps"],
    ["ממתינים", "pendingSteps"],
  ];
  const labelsEn: [string, keyof RunReport][] = [
    ["Process", "processName"],
    ["Batch", "batchId"],
    ["Run status", "overallStatus"],
    ["Started", "startedAt"],
    ["Ended", "endedAt"],
    ["Duration", "durationLabel"],
    ["Completed", "completedSteps"],
    ["Pending", "pendingSteps"],
  ];
  const pairs = r.lang === "he" ? labelsHe : labelsEn;
  const gap = 10;
  const cols = 2;
  const cardW = (ctx.maxW - gap) / cols;
  const cardH = 52;
  const rows = Math.ceil(pairs.length / cols);
  const blockH = rows * (cardH + gap) + 8;
  ensureSpace(ctx, blockH + 28);

  const sumTitle = r.lang === "he" ? "תקציר מנהלים" : "Executive summary";
  const sumTitleDisp = r.lang === "he" && ctx.heFont ? applyHebrewWordVisualReorder(sumTitle) : sumTitle;
  const sumX = ctx.rtl
    ? contentRightX() -
      (r.lang === "he" && ctx.heFont ? mixedWidth(sumTitleDisp, SZ.section, ctx, false, true) : ctx.latinBold.widthOfTextAtSize(sumTitle, SZ.section))
    : MARGIN;
  if (r.lang === "he" && ctx.heFont) {
    drawMixedLineAt(ctx, sumX, ctx.y, SZ.section, sumTitleDisp, false, true, C.accent, true);
  } else {
    ctx.page.drawText(sumTitle, { x: sumX, y: ctx.y, size: SZ.section, font: ctx.latinBold, color: C.accent });
  }
  ctx.y -= SZ.section + 10;

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (idx >= pairs.length) break;
      const [lab, key] = pairs[idx++];
      const physCol = ctx.rtl ? cols - 1 - col : col;
      const x0 = MARGIN + physCol * (cardW + gap);
      const yTop = ctx.y;
      const yBot = yTop - cardH;
      ctx.page.drawRectangle({
        x: x0,
        y: yBot,
        width: cardW,
        height: cardH,
        color: C.cardBg,
        borderColor: C.hairline,
        borderWidth: 0.5,
      });
      const raw = r[key];
      const val =
        key === "overallStatus"
          ? r.lang === "he"
            ? raw === "completed"
              ? "הושלם"
              : raw === "failed"
                ? "נכשל"
                : "פתוח"
            : String(raw)
          : key === "batchId" || key === "startedAt" || key === "endedAt"
            ? (raw == null || raw === "" ? "—" : String(raw))
            : typeof raw === "number"
              ? String(raw)
              : String(raw ?? "—");
      const valDisplay =
        key === "processName" && r.lang === "he" && ctx.heFont
          ? (wrapTextMixed(val, cardW - 20, SZ.body, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, false)[0] ??
            val)
          : key === "processName"
            ? truncateLatin(val, ctx.latinFont, SZ.body, cardW - 20)
            : val;

      const labelY = yTop - 14;
      const valY = yTop - 34;
      const innerPad = 10;
      const cardInnerRight = x0 + cardW - innerPad;
      if (ctx.lang === "he" && ctx.heFont) {
        const lw = mixedWidth(lab, SZ.cardTitle, ctx, true, true);
        const vx = ctx.rtl ? cardInnerRight - mixedWidth(valDisplay, SZ.body, ctx, false, false) : x0 + innerPad;
        const lx = ctx.rtl ? cardInnerRight - lw : x0 + innerPad;
        drawMixedLineAt(ctx, lx, labelY, SZ.cardTitle, lab, true, true, C.muted, false);
        drawMixedLineAt(ctx, vx, valY, SZ.body, valDisplay, false, false, C.ink, true);
      } else {
        const lx = ctx.rtl ? cardInnerRight - ctx.latinBold.widthOfTextAtSize(lab, SZ.cardTitle) : x0 + innerPad;
        const vx = ctx.rtl ? cardInnerRight - ctx.latinFont.widthOfTextAtSize(valDisplay, SZ.body) : x0 + innerPad;
        ctx.page.drawText(lab, { x: lx, y: labelY, size: SZ.cardTitle, font: ctx.latinBold, color: C.muted });
        ctx.page.drawText(valDisplay, { x: vx, y: valY, size: SZ.body, font: ctx.latinFont, color: C.ink });
      }
    }
    ctx.y -= cardH + gap;
  }
  ctx.y -= 6;
}

function drawSectionDivider(ctx: GenCtx): void {
  ensureSpace(ctx, 16);
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: MARGIN + ctx.maxW, y: ctx.y },
    thickness: 0.6,
    color: C.hairline,
  });
  ctx.y -= 14;
}

function drawPhaseHeader(ctx: GenCtx, phase: RunReportPhase): void {
  const innerPad = 12;
  const titleMax = ctx.maxW - innerPad * 2;
  /** Hebrew: avoid "label — name" in one draw (em dash splits script runs and breaks RTL word paint). */
  const wrapped =
    ctx.lang === "he" && ctx.heFont
      ? [
          ...wrapTextMixed(phase.orderLabel, titleMax, SZ.section, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, true),
          ...wrapTextMixed(phase.name, titleMax, SZ.section, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, true),
        ]
      : wrapText(
          ctx.latinBold,
          `${phase.orderLabel} — ${phase.name}`,
          titleMax,
          SZ.section,
        );
  const lines = Math.max(1, wrapped.length);
  const bandH = 16 + lines * (SZ.section + 4);
  ensureSpace(ctx, bandH + 28);

  const top = ctx.y;
  const bot = top - bandH;
  ctx.page.drawRectangle({
    x: MARGIN,
    y: bot,
    width: ctx.maxW,
    height: bandH,
    color: C.accentSoft,
    borderColor: C.accent,
    borderWidth: 0.8,
  });
  const sc = statusColors(phase.status);
  const badge = phase.statusLabel;
  const badgeOut = ctx.lang === "he" && ctx.heFont ? applyHebrewWordVisualReorder(badge) : badge;
  const badgeW = lineWidthFromString(badgeOut, SZ.small, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, false) + 14;
  const badgeX = ctx.rtl ? MARGIN + 10 : MARGIN + ctx.maxW - badgeW - 10;
  ctx.page.drawRectangle({
    x: badgeX,
    y: bot + bandH - 22,
    width: badgeW,
    height: 16,
    color: sc.bg,
    borderColor: sc.fg,
    borderWidth: 0.35,
  });
  const bty = bot + bandH - 18;
  const bx = ctx.rtl ? badgeX + 4 : MARGIN + ctx.maxW - badgeW - 4;
  if (ctx.lang === "he" && ctx.heFont) {
    drawLineMixed(
      ctx.page,
      bx,
      bty,
      SZ.small,
      badgeOut,
      ctx.heFont,
      ctx.heBold,
      ctx.latinFont,
      ctx.latinBold,
      false,
      false,
      sc.fg,
      ctx.rtl && ctx.lang === "he",
    );
  } else {
    ctx.page.drawText(badge, { x: bx, y: bty, size: SZ.small, font: ctx.latinFont, color: sc.fg });
  }

  const titlePad = MARGIN + innerPad;
  const titleRight = MARGIN + ctx.maxW - innerPad;
  let ly = bot + bandH - SZ.section - 8;
  for (const ln of wrapped) {
    const tx = ctx.rtl ? titleRight - mixedWidth(ln, SZ.section, ctx, false, true) : titlePad;
    if (ctx.lang === "he" && ctx.heFont) {
      drawMixedLineAt(ctx, tx, ly, SZ.section, ln, false, true, C.accent, true);
    } else {
      ctx.page.drawText(ln, { x: tx, y: ly, size: SZ.section, font: ctx.latinBold, color: C.accent });
    }
    ly -= SZ.section + 4;
  }
  ctx.y = bot - 12;
}

function drawStatusBadge(ctx: GenCtx, x: number, y: number, step: RunReportStep): number {
  const { fg, bg } = statusColors(step.status);
  const text = step.statusLabel;
  const textOut = ctx.lang === "he" && ctx.heFont ? applyHebrewWordVisualReorder(text) : text;
  const w =
    lineWidthFromString(textOut, SZ.small, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, false) + 12;
  const h = 16;
  ctx.page.drawRectangle({ x, y: y - h, width: w, height: h, color: bg, borderColor: fg, borderWidth: 0.35 });
  const ty = y - h + 4;
  if (ctx.lang === "he" && ctx.heFont) {
    drawLineMixed(
      ctx.page,
      x + 6,
      ty,
      SZ.small,
      textOut,
      ctx.heFont,
      ctx.heBold,
      ctx.latinFont,
      ctx.latinBold,
      false,
      false,
      fg,
      ctx.rtl && ctx.lang === "he",
    );
  } else {
    ctx.page.drawText(text, { x: x + 6, y: ty, size: SZ.small, font: ctx.latinFont, color: fg });
  }
  return w;
}

function drawKeyValueGrid(ctx: GenCtx, fields: RunReportField[]): void {
  const labelColW = Math.min(220, ctx.maxW * 0.42);
  const valueMaxW = ctx.maxW - labelColW - 24;
  const valueColRight = MARGIN + valueMaxW + 8;
  const rowGap = 4;
  for (const row of fields) {
    const label = row.label || "";
    const val = row.value === null || row.value === undefined ? "" : String(row.value);
    const labelLines =
      ctx.lang === "he" && ctx.heFont
        ? wrapTextMixed(label, labelColW - 8, SZ.cardTitle, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, true, true)
        : wrapText(ctx.latinBold, label, labelColW - 8, SZ.cardTitle);
    const valueLines =
      ctx.lang === "he" && ctx.heFont
        ? wrapTextMixed(val || "—", valueMaxW, SZ.body, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, false)
        : wrapText(ctx.latinFont, val || "—", valueMaxW, SZ.body);
    const lines = Math.max(labelLines.length, valueLines.length);
    const rowH = lines * (SZ.body + 2) + rowGap + 6;
    ensureSpace(ctx, rowH);

    const baseY = ctx.y;
    for (let i = 0; i < lines; i++) {
      const yLine = baseY - 12 - i * (SZ.body + 2);
      const labelRight = MARGIN + ctx.maxW - 8;
      const lv = labelLines[i];
      if (lv !== undefined) {
        const lw = lineWidthFromString(lv, SZ.cardTitle, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, true, true);
        const lx = labelRight - lw;
        if (ctx.lang === "he" && ctx.heFont) {
          drawLineMixed(
            ctx.page,
            lx,
            yLine,
            SZ.cardTitle,
            lv,
            ctx.heFont,
            ctx.heBold,
            ctx.latinFont,
            ctx.latinBold,
            true,
            true,
            C.muted,
            ctx.rtl && ctx.lang === "he",
          );
        } else ctx.page.drawText(lv, { x: lx, y: yLine, size: SZ.cardTitle, font: ctx.latinBold, color: C.muted });
      }
      const vv = valueLines[i];
      if (vv !== undefined) {
        const vw = ctx.lang === "he" && ctx.heFont
          ? mixedWidth(vv, SZ.body, ctx, false, false)
          : ctx.latinFont.widthOfTextAtSize(vv, SZ.body);
        const vx = ctx.rtl ? valueColRight - vw : MARGIN + 8;
        if (ctx.lang === "he" && ctx.heFont) {
          drawMixedLineAt(ctx, vx, yLine, SZ.body, vv, false, false, C.ink, true);
        } else ctx.page.drawText(vv, { x: vx, y: yLine, size: SZ.body, font: ctx.latinFont, color: C.ink });
      }
    }
    ctx.y = baseY - rowH;
  }
}

function drawMatrixChunk(
  ctx: GenCtx,
  columns: MatrixColumnDef[],
  dataRows: Record<string, unknown>[],
  lang: Lang,
  headerOnly: boolean,
  omitted: number,
): void {
  const HEADER_H = 20;
  const ROW_H = 17;
  const omitH = omitted > 0 && !headerOnly ? ROW_H : 0;
  const rowCount = headerOnly ? 0 : dataRows.length;
  const totalH = HEADER_H + rowCount * ROW_H + omitH + 6;
  ensureSpace(ctx, totalH + 10);

  const tableTop = ctx.y;
  const tableBottom = tableTop - totalH;
  const n = Math.max(columns.length, 1);
  const colW = ctx.maxW / n;

  ctx.page.drawRectangle({
    x: MARGIN,
    y: tableBottom,
    width: ctx.maxW,
    height: totalH,
    borderColor: C.grid,
    borderWidth: 0.55,
    color: C.white,
  });

  const headerBottom = tableBottom + totalH - HEADER_H;
  ctx.page.drawRectangle({
    x: MARGIN,
    y: headerBottom,
    width: ctx.maxW,
    height: HEADER_H,
    color: C.tableHead,
  });

  const headBase = headerBottom + HEADER_H - 7;
  for (let j = 0; j < columns.length; j++) {
    const pj = ctx.rtl ? n - 1 - j : j;
    const x0 = MARGIN + pj * colW;
    const label = lang === "he" ? columns[j].label_he : columns[j].label_en;
    const cellMax = colW - 10;
    const cellText =
      ctx.lang === "he" && ctx.heFont
        ? (wrapTextMixed(label, cellMax, SZ.tableHead, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, true, true)[0] ?? label)
        : truncateLatin(label, ctx.latinBold, SZ.tableHead, cellMax);
    const headTw = ctx.lang === "he" && ctx.heFont
      ? mixedWidth(cellText, SZ.tableHead, ctx, true, true)
      : ctx.latinBold.widthOfTextAtSize(cellText, SZ.tableHead);
    const hx = ctx.rtl ? x0 + colW - 5 - headTw : x0 + 5;
    if (ctx.lang === "he" && ctx.heFont) {
      drawLineMixed(
        ctx.page,
        hx,
        headBase,
        SZ.tableHead,
        cellText,
        ctx.heFont,
        ctx.heBold,
        ctx.latinFont,
        ctx.latinBold,
        true,
        true,
        C.ink,
        ctx.rtl && ctx.lang === "he",
      );
    } else {
      ctx.page.drawText(cellText, { x: hx, y: headBase, size: SZ.tableHead, font: ctx.latinBold, color: C.ink });
    }
  }
  for (let k = 1; k < n; k++) {
    const vx = MARGIN + k * colW;
    ctx.page.drawLine({
      start: { x: vx, y: tableBottom },
      end: { x: vx, y: tableBottom + totalH },
      thickness: 0.4,
      color: C.grid,
    });
  }
  ctx.page.drawLine({
    start: { x: MARGIN, y: headerBottom },
    end: { x: MARGIN + ctx.maxW, y: headerBottom },
    thickness: 0.5,
    color: C.grid,
  });

  for (let i = 0; i < rowCount; i++) {
    const rowBottom = headerBottom - i * ROW_H;
    const baseline = rowBottom - 6;
    ctx.page.drawLine({
      start: { x: MARGIN, y: rowBottom },
      end: { x: MARGIN + ctx.maxW, y: rowBottom },
      thickness: 0.35,
      color: C.grid,
    });
    const row = dataRows[i]!;
    for (let j = 0; j < columns.length; j++) {
      const pj = ctx.rtl ? n - 1 - j : j;
      const x0 = MARGIN + pj * colW;
      const raw = String(row[columns[j]!.key] ?? "");
      const cellMax = colW - 10;
      const cellText =
        ctx.lang === "he" && ctx.heFont
          ? (wrapTextMixed(raw, cellMax, SZ.tableCell, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, false)[0] ?? raw)
          : truncateLatin(raw, ctx.latinFont, SZ.tableCell, cellMax);
      const cellTw = ctx.lang === "he" && ctx.heFont
        ? mixedWidth(cellText, SZ.tableCell, ctx, false, false)
        : ctx.latinFont.widthOfTextAtSize(cellText, SZ.tableCell);
      const cx = ctx.rtl ? x0 + colW - 5 - cellTw : x0 + 5;
      if (ctx.lang === "he" && ctx.heFont) {
        drawLineMixed(
          ctx.page,
          cx,
          baseline,
          SZ.tableCell,
          cellText,
          ctx.heFont,
          ctx.heBold,
          ctx.latinFont,
          ctx.latinBold,
          false,
          false,
          C.ink,
          ctx.rtl && ctx.lang === "he",
        );
      } else ctx.page.drawText(cellText, { x: cx, y: baseline, size: SZ.tableCell, font: ctx.latinFont, color: C.ink });
    }
  }

  if (omitted > 0 && !headerOnly) {
    const noteY = tableBottom + omitH - 6;
    const msg =
      lang === "he" ? `… ${omitted} שורות נוספות הושמטו` : `… ${omitted} more row(s) omitted`;
    const noteW =
      lang === "he" && ctx.heFont
        ? mixedWidth(msg, SZ.small, ctx, false, false)
        : ctx.latinFont.widthOfTextAtSize(msg, SZ.small);
    const noteX = ctx.rtl ? contentRightX() - 8 - noteW : MARGIN + 8;
    if (lang === "he" && ctx.heFont) {
      drawLineMixed(
        ctx.page,
        noteX,
        noteY,
        SZ.small,
        msg,
        ctx.heFont,
        ctx.heBold,
        ctx.latinFont,
        ctx.latinBold,
        false,
        false,
        C.muted,
        ctx.rtl && ctx.lang === "he",
      );
    } else {
      ctx.page.drawText(msg, {
        x: noteX,
        y: noteY,
        size: SZ.small,
        font: ctx.latinFont,
        color: C.muted,
      });
    }
  }

  ctx.y = tableBottom - 10;
}

function drawMatrixPaginated(ctx: GenCtx, columns: MatrixColumnDef[], rows: Record<string, unknown>[], omitted: number): void {
  const MAX_ROWS = 14;
  let offset = 0;
  if (rows.length === 0) {
    drawMatrixChunk(ctx, columns, [], ctx.lang, true, omitted);
    return;
  }
  while (offset < rows.length) {
    const chunk = rows.slice(offset, offset + MAX_ROWS);
    const isLast = offset + chunk.length >= rows.length;
    drawMatrixChunk(ctx, columns, chunk, ctx.lang, false, isLast ? omitted : 0);
    offset += MAX_ROWS;
    if (offset < rows.length) newPage(ctx);
  }
}

function estimateNonMatrixStepHeight(ctx: GenCtx, step: RunReportStep): number {
  const titleMaxW = ctx.maxW - 100;
  const titleLines =
    ctx.lang === "he" && ctx.heFont
      ? wrapTextMixed(step.name, titleMaxW, SZ.body, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, true)
      : wrapText(ctx.latinBold, step.name, titleMaxW, SZ.body);
  let h = 24 + titleLines.length * (SZ.body + 3) + 10;
  const hasFields = step.fields.length > 0;
  if (!hasFields) h += 32;
  else {
    const labelColW = Math.min(220, ctx.maxW * 0.42);
    const valueMaxW = ctx.maxW - labelColW - 24;
    for (const row of step.fields) {
      const vl =
        ctx.lang === "he" && ctx.heFont
          ? wrapTextMixed(String(row.value ?? ""), valueMaxW, SZ.body, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, false).length
          : wrapText(ctx.latinFont, String(row.value ?? ""), valueMaxW, SZ.body).length;
      const ll =
        ctx.lang === "he" && ctx.heFont
          ? wrapTextMixed(row.label || "", labelColW - 8, SZ.cardTitle, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, true, true).length
          : wrapText(ctx.latinBold, row.label || "", labelColW - 8, SZ.cardTitle).length;
      h += Math.max(vl, ll) * (SZ.body + 2) + 12;
    }
  }
  return h + 28;
}

function drawStepTitleBand(ctx: GenCtx, step: RunReportStep, bandH: number): void {
  const cardTop = ctx.y;
  const cardBottom = cardTop - bandH;
  const soft =
    step.status === "completed"
      ? rgb(0.98, 1, 0.99)
      : step.status === "pending"
        ? rgb(1, 0.99, 0.97)
        : rgb(1, 0.97, 0.97);
  ctx.page.drawRectangle({
    x: MARGIN,
    y: cardBottom,
    width: ctx.maxW,
    height: bandH,
    color: soft,
    borderColor: C.hairline,
    borderWidth: 0.45,
  });
  ctx.page.drawRectangle({
    x: accentStripeX(ctx),
    y: cardBottom,
    width: 3.2,
    height: bandH,
    color: C.accent,
  });
  const titleMaxW = ctx.maxW - 100;
  const titleLines =
    ctx.lang === "he" && ctx.heFont
      ? wrapTextMixed(step.name, titleMaxW, SZ.body, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, true)
      : wrapText(ctx.latinBold, step.name, titleMaxW, SZ.body);
  let cy = cardTop - 14;
  const badgeLeft = ctx.rtl ? MARGIN + 10 : MARGIN + ctx.maxW - 86;
  drawStatusBadge(ctx, badgeLeft, cy + 12, step);
  for (const ln of titleLines) {
    const tx = ctx.rtl ? contentRightX() - 12 - mixedWidth(ln, SZ.body, ctx, false, true) : MARGIN + 12;
    if (ctx.lang === "he" && ctx.heFont) {
      drawMixedLineAt(ctx, tx, cy, SZ.body, ln, false, true, C.ink, true);
    } else ctx.page.drawText(ln, { x: tx, y: cy, size: SZ.body, font: ctx.latinBold, color: C.ink });
    cy -= SZ.body + 3;
  }
  ctx.y = cardBottom - 8;
}

function drawStepCard(ctx: GenCtx, step: RunReportStep): void {
  const hasMatrix = !!(step.matrix && step.matrix.columns.length > 0);
  const hasFields = step.fields.length > 0;
  const empty = !hasMatrix && !hasFields;

  const titleMaxW = ctx.maxW - 100;
  const titleLines =
    ctx.lang === "he" && ctx.heFont
      ? wrapTextMixed(step.name, titleMaxW, SZ.body, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, true)
      : wrapText(ctx.latinBold, step.name, titleMaxW, SZ.body);
  const titleBandH = 18 + titleLines.length * (SZ.body + 3);

  if (hasMatrix && step.matrix) {
    ensureSpace(ctx, titleBandH + 14);
    drawStepTitleBand(ctx, step, titleBandH);
    drawMatrixPaginated(ctx, step.matrix.columns, step.matrix.rows, step.matrix.omittedRowCount);
    ctx.y -= 8;
    return;
  }

  const est = Math.min(480, Math.max(titleBandH + 20, estimateNonMatrixStepHeight(ctx, step)));
  ensureSpace(ctx, Math.max(MIN_STEP, est));
  const cardTop = ctx.y;
  const cardBottom = cardTop - est;
  const soft =
    step.status === "completed"
      ? rgb(0.98, 1, 0.99)
      : step.status === "pending"
        ? rgb(1, 0.99, 0.97)
        : rgb(1, 0.97, 0.97);
  ctx.page.drawRectangle({
    x: MARGIN,
    y: cardBottom,
    width: ctx.maxW,
    height: est,
    color: soft,
    borderColor: C.hairline,
    borderWidth: 0.45,
  });
  ctx.page.drawRectangle({
    x: accentStripeX(ctx),
    y: cardBottom,
    width: 3.2,
    height: est,
    color: C.accent,
  });

  let cy = cardTop - 14;
  const badgeLeft2 = ctx.rtl ? MARGIN + 10 : MARGIN + ctx.maxW - 86;
  drawStatusBadge(ctx, badgeLeft2, cy + 12, step);
  for (const ln of titleLines) {
    const tx = ctx.rtl ? contentRightX() - 12 - mixedWidth(ln, SZ.body, ctx, false, true) : MARGIN + 12;
    if (ctx.lang === "he" && ctx.heFont) {
      drawMixedLineAt(ctx, tx, cy, SZ.body, ln, false, true, C.ink, true);
    } else ctx.page.drawText(ln, { x: tx, y: cy, size: SZ.body, font: ctx.latinBold, color: C.ink });
    cy -= SZ.body + 3;
  }
  cy -= 8;
  ctx.y = cy;

  if (empty) {
    ensureSpace(ctx, 22);
    const msg = ctx.lang === "he" ? "אין נתונים" : "(no data)";
    const msgDisp = ctx.lang === "he" && ctx.heFont ? applyHebrewWordVisualReorder(msg) : msg;
    const mw = ctx.lang === "he" && ctx.heFont ? mixedWidth(msgDisp, SZ.body, ctx, false, false) : ctx.latinFont.widthOfTextAtSize(msg, SZ.body);
    const mx = ctx.rtl ? contentRightX() - 14 - mw : MARGIN + 14;
    if (ctx.lang === "he" && ctx.heFont) {
      drawMixedLineAt(ctx, mx, ctx.y - 10, SZ.body, msgDisp, false, false, C.muted, true);
    } else ctx.page.drawText(msg, { x: mx, y: ctx.y - 10, size: SZ.body, font: ctx.latinFont, color: C.muted });
    ctx.y -= 26;
  } else {
    drawKeyValueGrid(ctx, step.fields);
  }

  ctx.y = Math.min(ctx.y - 10, cardBottom - 8);
}

function drawFinalSummary(ctx: GenCtx, r: RunReport): void {
  const title = r.lang === "he" ? "סיכום ייצור סופי ואישורים" : "Final production summary & approvals";
  const rows = r.finalSummary.length ? r.finalSummary : [{ label: r.lang === "he" ? "אין נתונים" : "No data", value: "—" }];
  let est = 56;
  for (const row of rows) {
    const lw =
      ctx.lang === "he" && ctx.heFont
        ? wrapTextMixed(row.label, 200, SZ.cardTitle, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, true, true).length
        : wrapText(ctx.latinBold, row.label, 200, SZ.cardTitle).length;
    const vw =
      ctx.lang === "he" && ctx.heFont
        ? wrapTextMixed(String(row.value ?? ""), ctx.maxW - 240, SZ.body, ctx.heFont, ctx.heBold, ctx.latinFont, ctx.latinBold, false, false)
            .length
        : wrapText(ctx.latinFont, String(row.value ?? ""), ctx.maxW - 240, SZ.body).length;
    est += Math.max(lw, vw) * (SZ.body + 2) + 8;
  }
  est += 48;
  ensureSpace(ctx, est + 20);

  ctx.page.drawRectangle({
    x: MARGIN - 2,
    y: ctx.y - est,
    width: ctx.maxW + 4,
    height: est,
    color: rgb(0.94, 0.97, 0.98),
    borderColor: C.accent,
    borderWidth: 1.2,
  });

  let ly = ctx.y - 18;
  const titleDisp = ctx.lang === "he" && ctx.heFont ? applyHebrewWordVisualReorder(title) : title;
  const titleTw = ctx.lang === "he" && ctx.heFont ? mixedWidth(titleDisp, SZ.section, ctx, false, true) : ctx.latinBold.widthOfTextAtSize(title, SZ.section);
  const titleX = ctx.rtl ? contentRightX() - 10 - titleTw : MARGIN + 10;
  if (ctx.lang === "he" && ctx.heFont) {
    drawMixedLineAt(ctx, titleX, ly, SZ.section, titleDisp, false, true, C.accent, true);
  } else ctx.page.drawText(title, { x: titleX, y: ly, size: SZ.section, font: ctx.latinBold, color: C.accent });
  ly -= SZ.section + 14;
  ctx.y = ly + 4;
  drawKeyValueGrid(ctx, rows);
  ctx.y -= 8;
}

function drawFootersFixed(
  pages: PDFPage[],
  latinFont: PDFFont,
  heFont: PDFFont | null,
  heBold: PDFFont | null,
  lang: Lang,
  rtl: boolean,
  runId: string,
  generatedAt: string,
): void {
  const total = pages.length;
  for (let i = 0; i < total; i++) {
    const page = pages[i]!;
    const fy = 28;
    page.drawLine({
      start: { x: MARGIN, y: 50 },
      end: { x: PAGE_W - MARGIN, y: 50 },
      thickness: 0.4,
      color: C.hairline,
    });
    const rid = runId.length > 36 ? `${runId.slice(0, 8)}…` : runId;
    const runLine = `${lang === "he" ? "מזהה ריצה" : "Run"}: ${rid}`;
    const mid = `${lang === "he" ? "נוצר" : "Generated"}: ${generatedAt.replace("T", " ").slice(0, 19)} UTC`;
    const pageLine = `${i + 1} / ${total}`;
    const midW =
      lang === "he" && heFont
        ? lineWidthFromString(mid, SZ.small, heFont, heBold, latinFont, latinFont, false, false)
        : latinFont.widthOfTextAtSize(mid, SZ.small);
    const midX = (PAGE_W - midW) / 2;

    if (rtl) {
      page.drawText(pageLine, { x: MARGIN, y: fy, size: SZ.small, font: latinFont, color: C.muted });
      if (lang === "he" && heFont) {
        drawLineMixed(page, midX, fy, SZ.small, mid, heFont, heBold, latinFont, latinFont, false, false, C.muted, rtl && lang === "he");
      } else {
        page.drawText(mid, { x: midX, y: fy, size: SZ.small, font: latinFont, color: C.muted });
      }
      const runW =
        lang === "he" && heFont
          ? lineWidthFromString(runLine, SZ.small, heFont, heBold, latinFont, latinFont, false, false)
          : latinFont.widthOfTextAtSize(runLine, SZ.small);
      const runX = PAGE_W - MARGIN - runW;
      if (lang === "he" && heFont) {
        drawLineMixed(page, runX, fy, SZ.small, runLine, heFont, heBold, latinFont, latinFont, false, false, C.muted, rtl && lang === "he");
      } else {
        page.drawText(runLine, { x: runX, y: fy, size: SZ.small, font: latinFont, color: C.muted });
      }
    } else {
      if (lang === "he" && heFont) {
        drawLineMixed(page, MARGIN, fy, SZ.small, runLine, heFont, heBold, latinFont, latinFont, false, false, C.muted, rtl && lang === "he");
      } else {
        page.drawText(runLine, { x: MARGIN, y: fy, size: SZ.small, font: latinFont, color: C.muted });
      }
      if (lang === "he" && heFont) {
        drawLineMixed(page, midX, fy, SZ.small, mid, heFont, heBold, latinFont, latinFont, false, false, C.muted, rtl && lang === "he");
      } else {
        page.drawText(mid, { x: midX, y: fy, size: SZ.small, font: latinFont, color: C.muted });
      }
      const rw = latinFont.widthOfTextAtSize(pageLine, SZ.small);
      page.drawText(pageLine, { x: PAGE_W - MARGIN - rw, y: fy, size: SZ.small, font: latinFont, color: C.muted });
    }
  }
}

const MIN_PHASE_BLOCK = 100;
const MIN_STEP = 64;

export async function generateRunReportPdfBytes(report: RunReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const latinFont = await doc.embedFont(StandardFonts.Helvetica);
  const latinBold = await doc.embedFont(StandardFonts.HelveticaBold);
  let heFont: PDFFont | null = null;
  let heBold: PDFFont | null = null;
  if (report.lang === "he") {
    const [r1, r2] = await Promise.all([fetch(HEBREW_REG_URL), fetch(HEBREW_BOLD_URL)]);
    if (!r1.ok || !r2.ok) throw new Error("Failed to load Hebrew fonts");
    heFont = await doc.embedFont(await r1.arrayBuffer());
    heBold = await doc.embedFont(await r2.arrayBuffer());
  }

  let page = doc.addPage([PAGE_W, PAGE_H]);
  const maxW = PAGE_W - MARGIN * 2;
  const bottomY = MARGIN + FOOTER_H;
  const ctx: GenCtx = {
    doc,
    page,
    y: PAGE_H - MARGIN,
    maxW,
    lang: report.lang,
    rtl: report.rtl,
    heFont,
    heBold,
    latinFont,
    latinBold,
    bottomY,
  };

  drawReportHeader(ctx, report);
  drawSummaryCards(ctx, report);
  drawSectionDivider(ctx);

  for (const phase of report.phases) {
    ensureSpace(ctx, MIN_PHASE_BLOCK);
    drawPhaseHeader(ctx, phase);
    for (const step of phase.steps) {
      ensureSpace(ctx, MIN_STEP);
      drawStepCard(ctx, step);
    }
    drawSectionDivider(ctx);
  }

  drawFinalSummary(ctx, report);

  const pages = doc.getPages();
  drawFootersFixed(pages, latinFont, heFont, heBold, report.lang, report.rtl, report.runId, report.createdAt);

  return doc.save();
}
