# Feature: Process matrix row-entry flow

## 1. Context
- Problem: Matrix/tabular steps become hard to use on small screens and operators need faster repetitive row entry without losing hierarchy context.
- Users: Worker users filling production process steps during runs.
- Constraints:
  - Keep process hierarchy explicit (Process -> Run -> Phase -> Step).
  - Do not auto-advance across step/phase boundaries.
  - Reuse current dynamic schema-driven form model.

## 2. Scope
### In scope
- Define matrix-step action model with three clear actions:
  - Back
  - Save & Add Row
  - Finish
- Define dual presentation for matrix data:
  - Desktop/tablet wide: tabular grid
  - Mobile: one active row as a stacked form
- Define behavior for row persistence vs step completion.
- Define expected navigation behavior after each action.
- Define required labels/messages and validation behavior.
- Define responsive behavior for matrix entry in worker step fill.

### Out of scope
- Redesign of non-matrix (`single_form`) step UX.
- Process phase/order logic changes.
- Backend schema changes for process entities.

## 3. User Flows
### Primary flow
1. Worker opens a matrix step in process run.
2. Worker fills current row object fields (e.g. package/container metrics).
3. Worker taps `Save & Add Row`.
4. System saves current matrix payload as in-progress and appends a new empty row.
5. Worker repeats row entry as needed.
6. Worker taps `Finish`.
7. System completes current step and returns to parent step list (same phase level).

### Alternate/error flows
- Missing required field in current row:
  - Show validation message and do not save/add row.
- Save draft/update failure:
  - Show generic error toast/message.
  - Keep user on current step with entered data intact.
- Finish failure:
  - Show error; do not navigate away.
- Back tapped with unsaved edits:
  - Preserve current state behavior (no forced reset).
  - Navigate one level up only.

## 4. Screens & Components
## Screen: Worker matrix step fill (`ProcessStepFill`)
- Components:
  - Hierarchy navigation bar
  - Step title
  - Dynamic matrix form (responsive modes)
    - Table mode for wider screens
    - Row-form mode for small screens
  - Row switcher for mobile mode (Row chips + Add Row)
  - Footer action row for matrix mode
- States:
  - Loading: show loading state while fetching step run/schema.
  - Empty: not applicable for matrix schema with at least one row (initialize first row).
  - Error: toast/message on load/save/finish failure.
  - Success:
    - Save & Add Row: row appended, stay on page.
    - Finish: step completed, return to parent level.
  - Disabled: action buttons disabled while submission/saving is in progress.

## 5. Interaction Rules
- Back behavior:
  - Always navigate to parent hierarchy level (phase step list for current run/phase).
  - Never means “previous row”.
- Save behavior (`Save & Add Row`):
  - Validate required fields in current working row.
  - Persist current matrix payload as draft/in-progress for step run.
  - Append a new empty row object.
  - Keep user on same step screen.
  - Do not complete step/run.
- Finish behavior:
  - Validate according to existing step submit rules.
  - Mark step run as completed.
  - Trigger existing final-step behavior if this is final step.
  - Navigate back to parent step list.
- Validation behavior:
  - Required fields block save/finish.
  - Use clear, existing project-style error feedback.
- Navigation boundaries:
  - No automatic transition to next step or next phase after finish.
  - User explicitly selects next step from parent list.

## 6. Responsive Rules
- Mobile:
  - Keep controls large and reachable.
  - Keep action row persistent at bottom of form section.
  - Present one active row as a vertical field form (stacked inputs).
  - Provide row switcher (`Row N`) and add-row action.
  - Avoid forcing full-width horizontal table navigation for primary editing.
- Tablet:
  - Prefer table mode when width allows.
- Desktop:
  - Same action semantics; table can remain full width where available.

## 7. Copy & i18n
- Labels/messages:
  - Back (existing common label)
  - Save & Add Row
  - Finish Step
- Proposed translation keys:
  - `process.saveAndAddRow`
  - `process.finishStep`

## 8. Accessibility
- Keyboard/focus:
  - Buttons reachable by tab in logical order: Back -> Save & Add Row -> Finish.
  - After Save & Add Row, focus should move to first editable field in newly added row (preferred enhancement).
- ARIA:
  - Use semantic button elements with accessible labels.
- Contrast/touch targets:
  - Ensure minimum touch target size for action buttons.
  - Preserve existing design-system contrast levels.

## 9. Acceptance Criteria
- [ ] AC-1: In matrix mode, UI exposes exactly three actions: Back, Save & Add Row, Finish.
- [ ] AC-2: Back navigates one hierarchy level up and does not behave as previous-row navigation.
- [ ] AC-3: Save & Add Row persists data without completing the step and appends a new empty row.
- [ ] AC-4: Finish completes the current step and returns to parent step list without auto-advancing to another step/phase.
- [ ] AC-5: Required-field validation blocks both Save & Add Row and Finish until resolved.
- [ ] AC-6: Non-matrix step behavior remains unchanged.
- [ ] AC-7: New action labels are localized through i18n keys.
- [ ] AC-8: On small screens, matrix step renders an active-row form view instead of requiring full table editing.
- [ ] AC-9: Row switcher allows selecting existing rows and adding a new row in mobile mode.
- [ ] AC-10: Desktop/tablet table mode remains available and functionally equivalent.

## 10. Open Questions
- [ ] Should Save & Add Row trigger a lightweight success toast each time, or remain silent for speed?
- [ ] Should Back show a confirmation only when there are unsaved local edits not yet persisted?
