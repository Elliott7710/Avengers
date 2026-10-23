// Offline browser rehearsal of the real frontend. No app routes/auth are changed.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {spawnSync} = require("node:child_process");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "flowguard-ui-"));
try {
  const inline = file => `<script>${fs.readFileSync(file, "utf8")}</script>`;
  let html = fs.readFileSync("frontend/travel.html", "utf8")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<link[^>]+stylesheet[^>]*>/g, "");
  html = html.replace("</head>", `<style>${fs.readFileSync("frontend/css/style.css", "utf8")}</style></head>`);
  html = html.replace("</body>", [
    inline("tests/fixtures/travel-browser-client.js"),
    inline("frontend/js/calculations.js"),
    inline("frontend/js/travel-workflow.js"),
    inline("frontend/js/script.js"),
    inline("tests/fixtures/travel-browser-scenarios.js"),
    "</body>"
  ].join("\n"));
  const file = path.join(dir, "rehearsal.html");
  fs.writeFileSync(file, html);
  const run = spawnSync("chromium", [
    "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--disable-background-networking", "--no-first-run", `--user-data-dir=${dir}/browser`,
    "--virtual-time-budget=15000", "--dump-dom", `file://${file}`
  ], {encoding: "utf8", timeout: 45000, maxBuffer: 5 * 1024 * 1024});
  const result = run.stdout?.match(/<pre id="test-results">([\s\S]*?)<\/pre>/)?.[1];
  console.log(result?.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&") || "Browser rehearsal did not return a result.");
  if (run.error || run.status !== 0 || !run.stdout.includes('data-test-result="passed"')) {
    if (run.error) console.error(run.error.message);
    process.exitCode = 1;
  } else console.log("PASS offline browser workflow rehearsal (simulated API; not live Supabase).");
} finally {
  fs.rmSync(dir, {recursive: true, force: true, maxRetries: 3, retryDelay: 100});
}
