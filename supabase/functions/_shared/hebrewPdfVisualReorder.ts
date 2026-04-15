/**
 * Previously reversed space-separated words for pdf-lib LTR drawing. That broke
 * correct logical Hebrew from the catalog (e.g. "בקרת זמנים" → "זמנים בקרת",
 * "גודל הפילטר" → "הפילטר גודל", "אין נתונים" → "נתונים אין"). Step/phase
 * labels and matrix headers are stored in proper Hebrew order; keep identity.
 *
 * Export retained so `reportLayout.ts` call sites stay stable.
 */
export function applyHebrewWordVisualReorder(text: string): string {
  return text;
}
