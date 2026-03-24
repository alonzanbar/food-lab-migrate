# Process engine seeds

## Global `step_definitions`

- **Source of truth:** [`steps/catalog.ts`](steps/catalog.ts) — `globalStepDefinitionSeeds`, stable UUIDs in `GLOBAL_STEP_DEFINITION_IDS`.
- **SQL companion:** `supabase/migrations/*_seed_global_step_definitions.sql` — same rows for `tenant_id IS NULL` (superuser-maintained templates per RLS).

### Regenerate SQL after editing the catalog

```bash
npm run seed:sql > supabase/migrations/YYYYMMDDHHMMSS_seed_global_step_definitions.sql
```

Review the diff, replace the old seed migration if you are only updating rows (or add a new migration with `DELETE`/`INSERT` if you need a forward-only change). Do not duplicate migration timestamps.

**Tenant-scoped** `process_definitions`, phases, `process_steps`, and `standards` are **not** seeded here — configure in admin.
