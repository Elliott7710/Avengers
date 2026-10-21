const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.join(__dirname, "frontend");
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
    const file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    const content = await fs.readFile(file);
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch (error) {
    const status = error instanceof URIError ? 400
      : ["ENOENT", "ENOTDIR", "EISDIR"].includes(error.code) ? 404 : 500;
    if (status === 500) console.error(error);
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(status === 400 ? "Bad request" : status === 404 ? "Not found" : "Server error");
  }
}).listen(5000, "0.0.0.0", () => {
  console.log("FlowGuard is listening on 0.0.0.0:5000");
});
