// Starts a disposable PostgreSQL cluster in /tmp; never uses the linked database.
const {spawnSync} = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "flowguard-workflow-"));
const env = {...process.env, PGHOST: dir, PGPORT: "25432", PGUSER: "flowguard_test", PGDATABASE: "postgres"};
delete env.PGPASSWORD;
delete env.PGSERVICE;
delete env.PGSERVICEFILE;
let started = false;
function run(cmd, args) {
  const result = spawnSync(cmd, args, {env, encoding: "utf8", timeout: 60000});
  if (result.error || result.status !== 0) {
    throw new Error(`${cmd} failed:\n${result.error?.message || ""}\n${result.stderr}\n${result.stdout}`);
  }
  return result.stdout;
}
try {
  run("initdb", ["-D", path.join(dir, "data"), "-U", "flowguard_test", "-A", "trust", "--no-locale"]);
  run("pg_ctl", ["-D", path.join(dir, "data"), "-l", path.join(dir, "postgres.log"), "-o",
    `-k ${dir} -p 25432 -c listen_addresses=''`, "-w", "start"]);
  started = true;
  for (const file of [
    "tests/fixtures/supabase-workflow-stub.sql",
    "backend/sql/profiles.sql",
    "backend/sql/profiles.sql",
    "tests/fixtures/supabase-workflow-users.sql",
    "backend/sql/travel_insights.sql",
    "backend/sql/travel_workflow.sql",
    "backend/sql/travel_workflow.sql", // prove the migration can safely be rerun
    "tests/fixtures/teams-existing-records.sql",
    "backend/sql/teams.sql",
    "tests/fixtures/teams-new-user.sql",
    "backend/sql/teams.sql", // prove the team migration can safely be rerun
    "backend/sql/tests/teams_backfill_test.sql",
    "backend/sql/tests/travel_workflow_test.sql",
    "backend/sql/tests/teams_test.sql"
  ]) {
    const result = run("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-f", file]);
    console.log(`PASS ${file}`);
    if (file.endsWith("_test.sql")) console.log(result);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (started) spawnSync("pg_ctl", ["-D", path.join(dir, "data"), "-m", "immediate", "-w", "stop"], {env, encoding: "utf8"});
  fs.rmSync(dir, {recursive: true, force: true});
}
