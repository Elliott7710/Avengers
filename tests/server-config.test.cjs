const test = require("node:test");
const assert = require("node:assert/strict");
const {spawn} = require("node:child_process");
const http = require("node:http");
const path = require("node:path");
let nextPort = 54500;

async function withServer(config, run) {
  const port = nextPort++;
  const env = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    PORT: String(port),
    FLOWGUARD_SUPABASE_URL: config.url || "",
    FLOWGUARD_SUPABASE_PUBLISHABLE_KEY: config.key || ""
  };
  const child = spawn(process.execPath, ["server.cjs"], {
    cwd: path.resolve(__dirname, ".."),
    env,
    stdio: ["ignore", "ignore", "ignore"]
  });
  try {
    let response;
    for (let attempt = 0; attempt < 80; attempt++) {
      try {
        response = await fetch(`http://127.0.0.1:${port}/config/supabase.js`);
        break;
      } catch {
        if (child.exitCode !== null) throw new Error(`Test server exited with ${child.exitCode}`);
        await new Promise(resolve => setTimeout(resolve, 25));
      }
    }
    assert.ok(response, "test config endpoint starts");
    return await run(port, response);
  } finally {
    child.kill("SIGTERM");
    await new Promise(resolve => {
      if (child.exitCode !== null) return resolve();
      child.once("exit", resolve);
      setTimeout(() => { child.kill("SIGKILL"); resolve(); }, 1000).unref();
    });
  }
}

test("serves only valid browser-safe project config without caching", async () => {
  const url = "https://demo-project.supabase.co";
  const key = "sb_publishable_testFixture0123456789";
  await withServer({url, key}, async (port, response) => {
    const body = await response.text();
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /javascript/);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(body, /FLOWGUARD_SUPABASE_CONFIG =/);
    assert.ok(body.includes(url));
    assert.ok(body.includes(key));
    assert.doesNotMatch(body, /service_role|secret_fixture/i);

    const head = await fetch(`http://127.0.0.1:${port}/config/supabase.js`, {method: "HEAD"});
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    const post = await fetch(`http://127.0.0.1:${port}/config/supabase.js`, {method: "POST"});
    assert.equal(post.status, 405);
  });
});

test("fails closed on missing, malformed, and privileged keys without echoing values", async () => {
  const privilegedClaims = Buffer.from(JSON.stringify({role: "service_role"})).toString("base64url");
  const serviceRoleKey = `eyJhbGciOiJIUzI1NiJ9.${privilegedClaims}.testSignature`;
  for (const config of [
    {url: "", key: ""},
    {url: "http://demo-project.supabase.co", key: "sb_publishable_testFixture0123456789"},
    {url: "https://demo-project.supabase.co?redirect=https://attacker.test", key: "sb_publishable_testFixture0123456789"},
    {url: "https://demo-project.supabase.co", key: "invalid-secret-fixture"},
    {url: "https://demo-project.supabase.co", key: serviceRoleKey}
  ]) {
    await withServer(config, async (_port, response) => {
      const body = await response.text();
      assert.equal(response.status, 200);
      assert.match(body, /FLOWGUARD_SUPABASE_CONFIG_ERROR/);
      assert.doesNotMatch(body, /demo-project|service_role|invalid-secret-fixture|secretFixture/i);
    });
  }
});

test("all signed-in pages load runtime config before initializing the client", () => {
  const fs = require("node:fs");
  const pages = ["signin", "registration", "overview", "travel", "insights", "profile"];
  for (const page of pages) {
    const html = fs.readFileSync(`frontend/${page}.html`, "utf8");
    assert.ok(html.indexOf('/config/supabase.js') >= 0, `${page} loads runtime config`);
    assert.ok(html.indexOf('/config/supabase.js') < html.indexOf('js/supabase.js'), `${page} loads config before client`);
  }
  assert.doesNotMatch(fs.readFileSync("frontend/js/supabase.js", "utf8"), /supabase\.co|sb_publishable/);
});
