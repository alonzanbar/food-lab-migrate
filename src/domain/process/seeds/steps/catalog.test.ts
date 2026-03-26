import { describe, expect, it } from "vitest";
import { allStepDefinitionSeeds } from "../all-step-definition-seeds";
import { globalStepDefinitionSeeds, globalStepDefinitionsByCode } from "./catalog";
import { eggs4035V2StepSeeds } from "./catalog-4035-v2";
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

  it("4035 v2 seeds have unique ids and codes vs global catalog", () => {
    const all = [...globalStepDefinitionSeeds, ...eggs4035V2StepSeeds];
    const codes = all.map((s) => s.code);
    const ids = all.map((s) => s.id);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of eggs4035V2StepSeeds) {
      expect(() => stepDefinitionSeedSchema.parse(s)).not.toThrow();
    }
  });
});

describe("allStepDefinitionSeeds", () => {
  it("matches global + 4035 v2 union with unique ids and codes", () => {
    expect(allStepDefinitionSeeds.length).toBe(
      globalStepDefinitionSeeds.length + eggs4035V2StepSeeds.length,
    );
    const codes = allStepDefinitionSeeds.map((s) => s.code);
    const ids = allStepDefinitionSeeds.map((s) => s.id);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of allStepDefinitionSeeds) {
      expect(() => stepDefinitionSeedSchema.parse(s)).not.toThrow();
    }
  });
});
