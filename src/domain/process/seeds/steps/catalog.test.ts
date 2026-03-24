import { describe, expect, it } from "vitest";
import { globalStepDefinitionSeeds, globalStepDefinitionsByCode } from "./catalog";
import { stepDefinitionSeedSchema } from "../../schemas";

describe("globalStepDefinitionSeeds", () => {
  it("has unique codes and ids", () => {
    const codes = globalStepDefinitionSeeds.map((s) => s.code);
    const ids = globalStepDefinitionSeeds.map((s) => s.id);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("matches Zod seed schema", () => {
    for (const s of globalStepDefinitionSeeds) {
      expect(() => stepDefinitionSeedSchema.parse(s)).not.toThrow();
    }
  });

  it("exposes by-code map", () => {
    expect(globalStepDefinitionsByCode.breaking_crush?.code).toBe("breaking_crush");
  });
});
