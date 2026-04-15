import { describe, expect, it } from "vitest";
import { applyHebrewWordVisualReorder } from "../../supabase/functions/_shared/hebrewPdfVisualReorder.ts";

describe("applyHebrewWordVisualReorder", () => {
  it("leaves catalog Hebrew unchanged (identity)", () => {
    expect(applyHebrewWordVisualReorder("בקרת זמנים")).toBe("בקרת זמנים");
    expect(applyHebrewWordVisualReorder("גודל הפילטר")).toBe("גודל הפילטר");
    expect(applyHebrewWordVisualReorder("אין נתונים")).toBe("אין נתונים");
    expect(applyHebrewWordVisualReorder("פסטור לפני ואישור התאמה")).toBe("פסטור לפני ואישור התאמה");
  });

  it("does not reorder two-word phrases", () => {
    expect(applyHebrewWordVisualReorder("תהליך עבודה")).toBe("תהליך עבודה");
  });

  it("passes through lines with colon or dash unchanged", () => {
    expect(applyHebrewWordVisualReorder("תווית: ערך ארוך מספיק")).toBe("תווית: ערך ארוך מספיק");
    expect(applyHebrewWordVisualReorder("שלב א — שבירה ארוכה")).toBe("שלב א — שבירה ארוכה");
  });
});
