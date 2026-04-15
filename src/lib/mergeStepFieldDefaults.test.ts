import { describe, expect, it } from "vitest";
import {
  isKeyProvided,
  mergeFlatStepInitial,
  mergeMatrixRowsInitial,
  pickFieldDefaults,
} from "./mergeStepFieldDefaults";

describe("pickFieldDefaults", () => {
  it("returns undefined for missing or invalid field_defaults", () => {
    expect(pickFieldDefaults(undefined)).toBeUndefined();
    expect(pickFieldDefaults({})).toBeUndefined();
    expect(pickFieldDefaults({ field_defaults: [1, 2] })).toBeUndefined();
    expect(pickFieldDefaults({ field_defaults: "x" })).toBeUndefined();
  });

  it("returns plain object field_defaults", () => {
    expect(pickFieldDefaults({ field_defaults: { a: 1 } })).toEqual({ a: 1 });
  });
});

describe("mergeFlatStepInitial", () => {
  it("prefers captured when key is provided", () => {
    const out = mergeFlatStepInitial(
      { x: "from-captured", y: "" },
      { x: "from-process", z: "z-default" },
      [
        { key: "x", default_value: "from-schema" },
        { key: "y", default_value: "y-schema" },
        { key: "z" },
      ],
    );
    expect(out.x).toBe("from-captured");
    expect(out.y).toBe("");
    expect(out.z).toBe("z-default");
  });

  it("uses process field_defaults over schema default_value", () => {
    const out = mergeFlatStepInitial(
      {},
      { a: "proc" },
      [{ key: "a", default_value: "schema" }],
    );
    expect(out.a).toBe("proc");
  });

  it("falls back to schema default_value", () => {
    const out = mergeFlatStepInitial({}, undefined, [{ key: "a", default_value: "schema" }]);
    expect(out.a).toBe("schema");
  });

  it("preserves explicit null in captured", () => {
    const cap: Record<string, unknown> = {};
    cap.a = null;
    expect(isKeyProvided(cap, "a")).toBe(true);
    const out = mergeFlatStepInitial(cap, { a: "proc" }, [{ key: "a", default_value: "schema" }]);
    expect(out.a).toBeNull();
  });
});

describe("mergeMatrixRowsInitial", () => {
  it("fills missing cells per row", () => {
    const { rows } = mergeMatrixRowsInitial(
      { rows: [{ a: "1" }, {}] },
      { b: "proc-b" },
      [
        { key: "a", default_value: "def-a" },
        { key: "b", default_value: "def-b" },
      ],
    );
    expect(rows[0]?.a).toBe("1");
    expect(rows[0]?.b).toBe("proc-b");
    expect(rows[1]?.a).toBe("def-a");
    expect(rows[1]?.b).toBe("proc-b");
  });

  it("returns empty rows array when no rows in captured", () => {
    expect(mergeMatrixRowsInitial({}, { a: 1 }, [{ key: "a" }])).toEqual({ rows: [] });
  });
});
