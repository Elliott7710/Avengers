// Offline interaction rehearsal; no real Supabase requests or auth bypasses.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {spawnSync} = require("node:child_process");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "flowguard-teams-ui-"));
try {
  const inline = file => `<script>${fs.readFileSync(file, "utf8")}</script>`;
  let html = fs.readFileSync("frontend/overview.html", "utf8")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<link[^>]+stylesheet[^>]*>/g, "");
  html = html.replace("</head>", `<style>${fs.readFileSync("frontend/css/style.css", "utf8")}\n${fs.readFileSync("frontend/css/teams.css", "utf8")}</style></head>`);
  html = html.replace("</body>", [
    inline("tests/fixtures/team-browser-client.js"),
    inline("frontend/js/data-cache.js"),
    inline("frontend/js/teams.js"),
    inline("tests/fixtures/team-browser-scenarios.js"),
    "</body>"
  ].join("\n"));
  const file = path.join(dir, "teams.html");
  fs.writeFileSync(file, html);
  const run = spawnSync("chromium", [
    "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--disable-background-networking", "--no-first-run", `--user-data-dir=${dir}/browser`,
    "--virtual-time-budget=12000", "--dump-dom", `file://${file}`
  ], {encoding: "utf8", timeout: 60000, maxBuffer: 5 * 1024 * 1024});
  const result = run.stdout?.match(/<pre id="test-results">([\s\S]*?)<\/pre>/)?.[1];
  console.log(result?.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&") || "Team rehearsal did not return a result.");
  if (run.error || run.status !== 0 || !run.stdout.includes('data-test-result="passed"')) {
    if (run.error) console.error(run.error.message);
    process.exitCode = 1;
  } else console.log("PASS offline team invitation and switching rehearsal (not live Supabase).");
} finally {
  fs.rmSync(dir, {recursive: true, force: true, maxRetries: 3, retryDelay: 100});
}
