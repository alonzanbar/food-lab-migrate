/**
 * Writes `supabase/migrations/<ts>_sync_step_definitions_from_catalog.sql` when the
 * merged catalog content changes. Updates `meta/step_definitions_catalog.sha256`.
 *
 * Run via: npm run generate:step-definitions-migration
 * (also runs from `prebuild` before `vite build`.)
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { StepDefinitionSeed } from "../src/domain/process/seeds/types";
import { allStepDefinitionSeeds } from "../src/domain/process/seeds/all-step-definition-seeds";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const META_DIR = join(ROOT, "supabase/migrations/meta");
const META_PATH = join(META_DIR, "step_definitions_catalog.sha256");
const MIGRATIONS_DIR = join(ROOT, "supabase/migrations");

function sqlStringLiteral(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

function canonicalCatalogPayload(seeds: StepDefinitionSeed[]): string {
  const sorted = [...seeds].sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify(sorted);
}

function computeHash(payload: string): string {
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

function emitUpsertSql(s: StepDefinitionSeed): string {
  const schemaJson = JSON.stringify(s.schema);
  const defBeh = s.default_validation_behavior
    ? `${sqlStringLiteral(JSON.stringify(s.default_validation_behavior))}::jsonb`
    : "NULL";
  const desc = s.description === null ? "NULL" : sqlStringLiteral(s.description);

  return `INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)
VALUES (
  ${sqlStringLiteral(s.id)}::uuid,
  NULL,
  ${sqlStringLiteral(s.code)},
  ${sqlStringLiteral(s.step_type)}::public.step_type,
  ${sqlStringLiteral(s.name_he)},
  ${sqlStringLiteral(s.name_en)},
  ${desc},
  ${sqlStringLiteral(s.input_mode)}::public.input_mode,
  ${sqlStringLiteral(schemaJson)}::jsonb,
  ${s.supports_matrix},
  ${defBeh}
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  code = EXCLUDED.code,
  step_type = EXCLUDED.step_type,
  name_he = EXCLUDED.name_he,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  input_mode = EXCLUDED.input_mode,
  schema = EXCLUDED.schema,
  supports_matrix = EXCLUDED.supports_matrix,
  default_validation_behavior = EXCLUDED.default_validation_behavior;
`;
}

/** 14-digit UTC timestamp from wall clock (YYYYMMDDHHmmss). */
function wallClockMigrationPrefix(): number {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return Number(
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`,
  );
}

/** Strictly after every `NNNNNNNNNNNNNN_*.sql` in migrations (avoids out-of-order inserts). */
function nextMigrationTimestamp(): string {
  let maxPrefix = 0;
  if (existsSync(MIGRATIONS_DIR)) {
    for (const name of readdirSync(MIGRATIONS_DIR)) {
      const m = /^(\d{14})_/.exec(name);
      if (m) maxPrefix = Math.max(maxPrefix, Number(m[1]));
    }
  }
  const next = Math.max(maxPrefix, wallClockMigrationPrefix()) + 1;
  return String(next);
}

const payload = canonicalCatalogPayload(allStepDefinitionSeeds);
const newHash = computeHash(payload);

let existing = "";
if (existsSync(META_PATH)) {
  existing = readFileSync(META_PATH, "utf8").trim();
}

if (existing === newHash) {
  console.log("step_definitions catalog unchanged; no migration written.");
  process.exit(0);
}

mkdirSync(META_DIR, { recursive: true });
const ts = nextMigrationTimestamp();
const migName = `${ts}_sync_step_definitions_from_catalog.sql`;
const migPath = join(MIGRATIONS_DIR, migName);

let sql = `-- Sync global step_definitions from TS catalog (tenant_id NULL).
-- Source: src/domain/process/seeds/all-step-definition-seeds.ts
-- Catalog sha256: ${newHash}
-- Regenerate: npm run build (prebuild) or npm run generate:step-definitions-migration

`;

for (const s of [...allStepDefinitionSeeds].sort((a, b) => a.id.localeCompare(b.id))) {
  sql += `${emitUpsertSql(s)}\n`;
}

writeFileSync(migPath, sql, "utf8");
writeFileSync(META_PATH, `${newHash}\n`, "utf8");
console.log(`Wrote ${migPath}`);
console.log(`Updated ${META_PATH}`);
