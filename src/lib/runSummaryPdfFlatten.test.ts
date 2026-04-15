import { describe, expect, it } from "vitest";
import { flattenCaptured } from "../../supabase/functions/_shared/runSummaryPdfFlatten.ts";

describe("flattenCaptured", () => {
  it("renders matrix header and rows", () => {
    const schema = {
      input_mode: "matrix",
      columns: [
        { key: "a", label_he: "א", label_en: "A" },
        { key: "b", label_he: "ב", label_en: "B" },
      ],
    };
    const lines = flattenCaptured({ rows: [{ a: "1", b: "2" }] }, schema, "matrix", "en");
    expect(lines[0]).toBe("A | B");
    expect(lines[1]).toMatch(/^1\./);
    expect(lines[1]).toContain("1");
    expect(lines[1]).toContain("2");
  });

  it("renders single_form label and value", () => {
    const schema = {
      input_mode: "single_form",
      fields: [{ key: "qty", label_he: "כמות", label_en: "Qty" }],
    };
    const lines = flattenCaptured({ qty: 42 }, schema, "single_form", "en");
    expect(lines).toEqual(["Qty: 42"]);
  });

  it("uses placeholder when captured is empty", () => {
    const schema = { input_mode: "single_form", fields: [] };
    expect(flattenCaptured({}, schema, "single_form", "en")).toEqual(["(no data)"]);
    expect(flattenCaptured({}, schema, "single_form", "he")).toEqual(["אין נתונים"]);
  });
});
