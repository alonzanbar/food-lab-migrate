/**
 * Prints SQL upserts for all global `step_definitions` from merged TS catalogs (stdout).
 * For committed migrations use: npm run generate:step-definitions-migration
 */
import { allStepDefinitionSeeds } from "../src/domain/process/seeds/all-step-definition-seeds";
import type { StepDefinitionSeed } from "../src/domain/process/seeds/types";

function sqlStringLiteral(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
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

console.log("-- Merged global step_definitions (tenant_id NULL), upsert SQL.");
console.log("-- Source: src/domain/process/seeds/all-step-definition-seeds.ts");
console.log("-- npm run seed:sql  |  committed migrations: npm run generate:step-definitions-migration");
console.log("");

for (const s of [...allStepDefinitionSeeds].sort((a, b) => a.id.localeCompare(b.id))) {
  console.log(emitUpsertSql(s));
  console.log("");
}
