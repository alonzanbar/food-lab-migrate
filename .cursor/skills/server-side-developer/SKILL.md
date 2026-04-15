---
name: server-side-developer
description: >-
  Supabase Postgres migrations, RLS-aware data access, and Deno Edge Functions for this repo.
  Use when implementing or reviewing server-side work: SQL migrations, `supabase/functions/*`,
  shared Edge modules, auth/cors patterns, process engine DB shape, or Vitest for shared/domain
  code—not Vite/React UI unless the change is strictly required to wire a server contract.
---

# Server-side developer (factory-forms-digital)

## Stack (what “server” means here)

| Layer | Tech | Location |
|-------|------|----------|
| Database | PostgreSQL (Supabase) | [`supabase/migrations/*.sql`](supabase/migrations) |
| API (hosted) | Supabase client + RLS from app | [`src/integrations/supabase`](src/integrations/supabase) |
| API (custom) | Deno Edge Functions | [`supabase/functions/<name>/index.ts`](supabase/functions) |
| Shared Edge logic | Deno TS modules | [`supabase/functions/_shared/*.ts`](supabase/functions/_shared) |
| Domain types / Zod | TypeScript | [`src/domain/process`](src/domain/process) |
| Tests | Vitest | [`src/**/*.test.ts`](src), run `npm run test` |

Edge functions use **Deno** (URL imports, e.g. `https://deno.land/std@...`, `https://esm.sh/...`). Do not assume Node `require` or `package.json` dependencies inside `supabase/functions/` unless the project already uses that pattern for a given file.

## Instructions

1. **Migrations**
   - Prefer additive, idempotent-friendly SQL (`IF NOT EXISTS`, guarded inserts) consistent with existing migrations.
   - Keep enums and column names aligned with [`src/domain/process/schemas.ts`](src/domain/process/schemas.ts) when touching process engine tables.
   - Tenant-specific process wiring lives in tenant migrations (e.g. `process_definitions`, `process_phases`, `process_steps`); global step catalog sync follows `npm run generate:step-definitions-migration` / catalog scripts—see repo `package.json` scripts.

2. **Edge Functions**
   - Follow existing entry pattern: `serve` from `std/http`, CORS via [`supabase/functions/_shared/auth.ts`](supabase/functions/_shared/auth.ts) (`corsHeaders`, `getAuthedContext`, `json`).
   - Respect [`supabase/config.toml`](supabase/config.toml) per-function `verify_jwt`; many routes disable gateway JWT and enforce auth in code—match neighboring functions.
   - After resolving the user, enforce **tenant isolation**: derive `tenant_id` from JWT/profile and scope every `select`/`update`/`insert` accordingly; avoid trusting client-supplied tenant id alone.

3. **Shared modules**
   - Put cross-function logic under [`supabase/functions/_shared/`](supabase/functions/_shared) so Edge deploy bundles stay coherent.
   - Keep imports Deno-compatible (explicit `.ts` extensions where the repo already uses them).

4. **Process engine data model** (high level)
   - `step_definitions`: global catalog (schema JSON for forms).
   - `process_steps`: per–process-definition instance; `parameterization` / `ui_config` JSON for overrides—see [.cursor/skills/tech-support-process-config/SKILL.md](.cursor/skills/tech-support-process-config/SKILL.md) for support boundaries vs catalog.
   - `process_step_runs.captured_data`: submitted payload shape must match step schema for that run.

5. **Verification**
   - Run `npm run test` after TS changes that affect shared/domain code or client parsers of server contracts.
   - For Edge-only changes, run `deno check` on touched files when Deno is available, or rely on `supabase functions serve` locally before deploy.

## Boundaries (do not)

- **Do not** expand server PRs into large unrelated React refactors; keep client diffs limited to what consumes the new API or types.
- **Do not** insert or alter `step_definitions` when the task is tenant process configuration—use the **tech-support-process-config** skill instead.
- **Do not** store secrets in migrations or commit `.env`; use Supabase secrets / env for Edge.
- **Do not** bypass RLS with service role in the browser; service role belongs in Edge (or other trusted server) only, behind auth checks already in the codebase pattern.
- **Do not** add heavy dependencies to Edge functions without team agreement (bundle size and cold start).

## When this skill overlaps others

- **Postgres query/schema tuning** in this repo: also follow [.agents/skills/supabase-postgres-best-practices/SKILL.md](.agents/skills/supabase-postgres-best-practices/SKILL.md) when present.
- **Support-only process wiring** (no catalog changes): prefer **tech-support-process-config**.

## Quick checklist before finishing a server change

- [ ] Tenant (or auth) scope enforced for multi-tenant tables
- [ ] New SQL migration is ordered and safe to apply on existing DBs
- [ ] Edge function: CORS + method guard + error JSON shape consistent with siblings
- [ ] Types/schemas updated if JSON contract or table shape changed
- [ ] `npm run test` (or justified N/A) noted for the PR
