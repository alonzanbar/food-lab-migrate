import type { TranslationKey } from "@/i18n/translations";

/**
 * Stable option values stored in captured_data (e.g. English).
 * Display labels follow UI language via translations.
 */
const APPROVAL_SELECT_KEYS: Record<string, TranslationKey> = {
  approved: "process.approved",
  "not approved": "process.notApproved",
};

function normalizeSelectOptionValue(opt: string): string {
  return opt.trim().toLowerCase().replace(/\s+/g, " ");
}

export function translateSelectOptionLabel(
  opt: string,
  translate: (key: TranslationKey) => string,
): string {
  const key = APPROVAL_SELECT_KEYS[normalizeSelectOptionValue(opt)];
  return key ? translate(key) : opt;
}
