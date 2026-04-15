---
name: tech-support-process-config
description: Configure tenant processes using existing step definitions only. Use when technical customer support needs to create processes, connect existing steps to phases, and set parameterization/default values without creating new step definitions.
---

# Technical Support Process Config

## Purpose
This skill is for support-driven process setup in tenant scope:
- create process definitions
- create phases/order
- connect existing steps to process phases
- configure parameterization and default values

It must **never** create or modify step catalog definitions.

## Allowed Operations
1. Create/update `process_definitions` for a tenant.
2. Create/update `process_phases` and ordering.
3. Insert/update `process_steps` using existing `step_definition_id`.
4. Configure values in `process_steps.parameterization` and related process-level config fields (including optional flat `field_defaults` keyed like schema field/column `key` for per-process defaults—see app merge in `src/lib/mergeStepFieldDefaults.ts`).

## Forbidden Operations
1. Any `INSERT` into `step_definitions`.
2. Any schema/catalog authoring of new step structures.
3. Any migration generation for new steps.
4. Destructive/unrelated DB operations outside process configuration scope.

## Required Workflow
1. Confirm tenant context and requested process scope.
2. Fetch and present matching existing steps from `step_definitions`.
3. Validate each requested step exists before linking.
4. Create/ensure process definition and phases in intended order.
5. Link steps in `process_steps` with explicit `order_index`.
6. Apply parameter/default value configuration.
7. Return a concise change report with affected IDs and ordering.

## Behavior on Missing Step Requests
If user requests a step that does not exist, respond with:

"I can only use existing step definitions. Please provide an existing step code/ID, or escalate for product/catalog step creation."

Do not attempt to create a replacement step definition.

## Completion Checklist
- [ ] No writes to `step_definitions`
- [ ] Every linked step exists in `step_definitions`
- [ ] Phase and step ordering validated
- [ ] Parameter/default values applied only to allowed config fields
- [ ] Final summary includes created/updated process, phases, and linked step IDs

## Output Template
Use this response format after execution:

1. **Process**
   - id/code/name
2. **Phases**
   - phase order list
3. **Linked Steps**
   - phase -> ordered step codes/ids
4. **Configured Values**
   - parameterization/default value highlights
5. **Notes**
   - warnings, skipped items, and escalation items
