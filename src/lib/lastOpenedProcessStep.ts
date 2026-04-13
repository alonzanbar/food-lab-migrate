const KEY_PREFIX = "ffd.lastProcessStep.v1";

export type LastOpenedProcessStepPayload = {
  processDefinitionId: string;
  phaseId: string;
  stepRunId: string;
};

function storageKey(tenantId: string, runId: string) {
  return `${KEY_PREFIX}:${tenantId}:${runId}`;
}

export function readLastOpenedStep(
  tenantId: string | null | undefined,
  runId: string | undefined,
): LastOpenedProcessStepPayload | null {
  if (!tenantId || !runId) return null;
  try {
    const raw = localStorage.getItem(storageKey(tenantId, runId));
    if (!raw) return null;
    const o = JSON.parse(raw) as LastOpenedProcessStepPayload;
    if (o?.processDefinitionId && o?.phaseId != null && o?.stepRunId) return o;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeLastOpenedStep(
  tenantId: string | null | undefined,
  runId: string | undefined,
  payload: LastOpenedProcessStepPayload,
) {
  if (!tenantId || !runId) return;
  try {
    localStorage.setItem(storageKey(tenantId, runId), JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearLastOpenedStep(tenantId: string | null | undefined, runId: string | undefined) {
  if (!tenantId || !runId) return;
  try {
    localStorage.removeItem(storageKey(tenantId, runId));
  } catch {
    /* ignore */
  }
}
