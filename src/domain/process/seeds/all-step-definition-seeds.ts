import type { StepDefinitionSeed } from "./types";
import { globalStepDefinitionSeeds } from "./steps/catalog";
import { eggs4035V2StepSeeds } from "./steps/catalog-4035-v2";

/** All global-template `step_definitions` seeds (`tenant_id` NULL). Order: legacy global, then 4035 v2. */
export const allStepDefinitionSeeds: StepDefinitionSeed[] = [
  ...globalStepDefinitionSeeds,
  ...eggs4035V2StepSeeds,
];
