/** Em/en dash → Hebrew maqaf (U+05BE) so script segmentation treats title punctuation as Hebrew runs. */
export function normalizeHebrewPdfDashes(line: string): string {
  return line.replace(/\u2014/g, "\u05BE").replace(/\u2013/g, "\u05BE");
}
