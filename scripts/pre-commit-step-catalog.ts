/**
 * Husky pre-commit: if staged files touch step seed catalogs, ensure migrations/hash are in sync.
 */
import { execSync } from "node:child_process";

function stagedFiles(): string[] {
  return execSync("git diff --cached --name-only", { encoding: "utf8" })
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

const touchesStepSeeds = stagedFiles().some((f) =>
  f.startsWith("src/domain/process/seeds/steps/"),
);

if (!touchesStepSeeds) {
  process.exit(0);
}

execSync("npm run generate:step-definitions-migration", {
  stdio: "inherit",
  cwd: process.cwd(),
});

const artifactPaths = "supabase/migrations/ supabase/migrations/meta/step_definitions_catalog.sha256";
const unstagedArtifacts = execSync(`git diff --name-only -- ${artifactPaths}`, {
  encoding: "utf8",
}).trim();
const untrackedArtifacts = execSync(`git ls-files --others --exclude-standard -- ${artifactPaths}`, {
  encoding: "utf8",
}).trim();
if (unstagedArtifacts || untrackedArtifacts) {
  console.error(`
Step seed catalogs changed but migration artifacts are not fully committed.

Run:
  npm run generate:step-definitions-migration   # if you skipped build
  git add supabase/migrations/ supabase/migrations/meta/step_definitions_catalog.sha256
Then commit again.
`);
  process.exit(1);
}
