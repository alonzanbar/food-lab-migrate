# Process engine seeds

## Global `step_definitions` (TS catalog)

- **Source of truth:** [`steps/catalog.ts`](steps/catalog.ts) (`globalStepDefinitionSeeds`) and [`steps/catalog-4035-v2.ts`](steps/catalog-4035-v2.ts) (`eggs4035V2StepSeeds`).
- **Merged export:** [`all-step-definition-seeds.ts`](all-step-definition-seeds.ts) — `allStepDefinitionSeeds` (used by the generator and tests).

### Sync to Supabase migrations

When the merged catalog **content** changes, a new migration is emitted automatically:

1. **`npm run build`** runs **`prebuild`**, which runs `generate:step-definitions-migration`.
2. Or run **`npm run generate:step-definitions-migration`** directly.

The script compares a **SHA-256** of the canonical catalog JSON to `supabase/migrations/meta/step_definitions_catalog.sha256`. If it differs, it writes:

- `supabase/migrations/<timestamp>_sync_step_definitions_from_catalog.sql` — `INSERT ... ON CONFLICT (id) DO UPDATE` for every global row (`tenant_id` NULL).
- Updates the `.sha256` file (commit both with your catalog change).

**Git:** [`.husky/pre-commit`](../../.husky/pre-commit) runs the same generator when you stage files under `src/domain/process/seeds/steps/`. If migrations or the hash file are not staged, the commit is rejected with instructions.

**CI:** `.github/workflows/verify-step-catalog.yml` fails if the catalog is out of sync with committed migrations.

### Debug: print SQL to stdout

```bash
npm run seed:sql
```

### Historical migrations

Older `*_seed_*_step_definitions.sql` files remain part of history. New sync migrations **upsert** by stable `id` and are safe to apply after them. **Removing** a row from the TS catalog does **not** delete DB rows automatically (avoid breaking `process_steps` references).

**Tenant-scoped** `process_definitions`, phases, `process_steps`, and `standards` are **not** seeded here — configure in admin.
