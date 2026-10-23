const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const {createHash} = require("node:crypto");

const root = path.join(__dirname, "frontend");
const port = Number(process.env.PORT || 5000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

http.createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end("Method not allowed");
  }

  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://server").pathname);
    if (pathname === "/config/supabase.js" || pathname === "/api/config/supabase.js") {
      const projectUrl = process.env.FLOWGUARD_SUPABASE_URL || "";
      const publishableKey = process.env.FLOWGUARD_SUPABASE_PUBLISHABLE_KEY || "";
      let validUrl = false;
      try {
        const parsed = new URL(projectUrl);
        validUrl = parsed.protocol === "https:" && Boolean(parsed.hostname) &&
          !parsed.username && !parsed.password && !parsed.search && !parsed.hash &&
          (parsed.pathname === "/" || parsed.pathname === "");
      } catch {}
      const validPublishableKey =
        /^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(publishableKey) ||
        /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(publishableKey);
      let serviceRoleKey = false;
      if (publishableKey.startsWith("eyJ")) {
        try {
          const claims = JSON.parse(Buffer.from(publishableKey.split(".")[1], "base64url").toString("utf8"));
          serviceRoleKey = claims.role === "service_role";
        } catch {
          // Malformed legacy keys are rejected below without echoing their value.
        }
      }
      const config = validUrl && validPublishableKey && !serviceRoleKey
        ? `window.FLOWGUARD_SUPABASE_CONFIG = ${JSON.stringify({
            url: projectUrl.replace(/\/+$/, ""),
            publishableKey,
          }).replace(/</g, "\\u003c")};`
        : "window.FLOWGUARD_SUPABASE_CONFIG_ERROR = true;";
      res.writeHead(200, {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      });
      return res.end(req.method === "HEAD" ? undefined : config);
    }
    const file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    const content = await fs.readFile(file);
    const etag = `"${createHash("sha256").update(content).digest("hex")}"`;
    const headers = {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "public, no-cache",
      "ETag": etag,
      "X-Content-Type-Options": "nosniff",
    };
    // Revalidate on every visit so a new deployment never serves stale code.
    if (req.headers["if-none-match"]?.split(",").some(value => value.trim().replace(/^W\//, "") === etag)) {
      res.writeHead(304, headers);
      return res.end();
    }
    res.writeHead(200, headers);
    res.end(req.method === "HEAD" ? undefined : content);
  } catch (error) {
    const status = error instanceof URIError ? 400
      : ["ENOENT", "ENOTDIR", "EISDIR"].includes(error.code) ? 404 : 500;
    if (status === 500) console.error(error);
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(status === 400 ? "Bad request" : status === 404 ? "Not found" : "Server error");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`FlowGuard is listening on 0.0.0.0:${port}`);
});
