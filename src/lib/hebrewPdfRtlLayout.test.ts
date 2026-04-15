import { describe, expect, it } from "vitest";
import { normalizeHebrewPdfDashes } from "../../supabase/functions/_shared/hebrewPdfRtlLayout.ts";

describe("normalizeHebrewPdfDashes", () => {
  it("replaces em dash and en dash with Hebrew maqaf", () => {
    const s = "א\u2014ב";
    expect(normalizeHebrewPdfDashes(s)).toBe("א\u05BEב");
    expect(normalizeHebrewPdfDashes("א\u2013ב")).toBe("א\u05BEב");
  });

  it("leaves plain text unchanged when no special dashes", () => {
    expect(normalizeHebrewPdfDashes("בקרת זמנים")).toBe("בקרת זמנים");
  });
});
