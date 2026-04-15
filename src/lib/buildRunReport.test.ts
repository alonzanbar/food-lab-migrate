import { describe, expect, it } from "vitest";
import { buildRunReportFromDb } from "../../supabase/functions/_shared/buildRunReport.ts";
import type { ProcessRunInput, StepRunInput } from "../../supabase/functions/_shared/buildRunReport.ts";

describe("buildRunReportFromDb", () => {
  it("groups phases and maps step status", () => {
    const run: ProcessRunInput = {
      id: "r1",
      status: "completed",
      batch_ref: "B-1",
      started_at: "2026-01-01T10:00:00.000Z",
      completed_at: "2026-01-01T12:00:00.000Z",
      process_definitions: { code: "P", name_he: "תהליך", name_en: "Proc", version: "1" },
    };
    const steps: StepRunInput[] = [
      {
        status: "completed",
        captured_data: { a: "1" },
        process_steps: {
          order_index: 1,
          process_phase_id: "ph1",
          process_phases: { order_index: 1, name_he: "פאזה א", name_en: "A" },
          step_definitions: {
            name_he: "שלב 1",
            name_en: "S1",
            input_mode: "single_form",
            schema: {
              input_mode: "single_form",
              fields: [{ key: "a", label_he: "א", label_en: "A" }],
            },
          },
        },
      },
      {
        status: "pending",
        captured_data: {},
        process_steps: {
          order_index: 2,
          process_phase_id: "ph1",
          process_phases: { order_index: 1, name_he: "פאזה א", name_en: "A" },
          step_definitions: {
            name_he: "שלב 2",
            name_en: "S2",
            input_mode: "single_form",
            schema: { input_mode: "single_form", fields: [] },
          },
        },
      },
    ];
    const report = buildRunReportFromDb(run, steps, "he", "2026-01-01T15:00:00.000Z");
    expect(report.phases).toHaveLength(1);
    expect(report.phases[0].steps).toHaveLength(2);
    expect(report.phases[0].steps[0].status).toBe("completed");
    expect(report.phases[0].steps[1].status).toBe("pending");
    expect(report.completedSteps).toBe(1);
    expect(report.pendingSteps).toBe(1);
  });
});
