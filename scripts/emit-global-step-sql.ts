/**
 * Prints SQL INSERTs for global `step_definitions` from the TS catalog.
 *
 * Regenerate migration file:
 *   npm run seed:sql > supabase/migrations/20260320120000_seed_global_step_definitions.sql
 * (adjust filename / review diff before commit)
 */
import { globalStepDefinitionSeeds } from "../src/domain/process/seeds/steps/catalog";

function sqlStringLiteral(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

console.log("-- Global step_definitions seed (tenant_id NULL).");
console.log("-- Source of truth: src/domain/process/seeds/steps/catalog.ts");
console.log("-- Regenerate: npm run seed:sql");
console.log("");

for (const s of globalStepDefinitionSeeds) {
  const schemaJson = JSON.stringify(s.schema);
  const defBeh = s.default_validation_behavior
    ? `${sqlStringLiteral(JSON.stringify(s.default_validation_behavior))}::jsonb`
    : "NULL";

  console.log(
    `INSERT INTO public.step_definitions (id, tenant_id, code, step_type, name_he, name_en, description, input_mode, schema, supports_matrix, default_validation_behavior)`,
  );
  console.log(`VALUES (`);
  console.log(`  ${sqlStringLiteral(s.id)}::uuid,`);
  console.log(`  NULL,`);
  console.log(`  ${sqlStringLiteral(s.code)},`);
  console.log(`  ${sqlStringLiteral(s.step_type)}::public.step_type,`);
  console.log(`  ${sqlStringLiteral(s.name_he)},`);
  console.log(`  ${sqlStringLiteral(s.name_en)},`);
  console.log(`  ${s.description === null ? "NULL" : sqlStringLiteral(s.description)},`);
  console.log(`  ${sqlStringLiteral(s.input_mode)}::public.input_mode,`);
  console.log(`  ${sqlStringLiteral(schemaJson)}::jsonb,`);
  console.log(`  ${s.supports_matrix},`);
  console.log(`  ${defBeh}`);
  console.log(`);`);
  console.log("");
}
