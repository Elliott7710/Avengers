import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/config/supabase.js", (_req, res) => {
  const projectUrl = process.env.FLOWGUARD_SUPABASE_URL || "";
  const publishableKey = process.env.FLOWGUARD_SUPABASE_PUBLISHABLE_KEY || "";

  let validUrl = false;
  try {
    const parsed = new URL(projectUrl);
    validUrl =
      parsed.protocol === "https:" &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash &&
      (parsed.pathname === "/" || parsed.pathname === "");
  } catch {
    // Missing or malformed URLs are reported to the browser without echoing values.
  }

  const isPublishableKey = /^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(
    publishableKey,
  );
  let isLegacyAnonKey = false;
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(publishableKey)) {
    try {
      const claims = JSON.parse(
        Buffer.from(publishableKey.split(".")[1], "base64url").toString("utf8"),
      ) as { role?: unknown };
      isLegacyAnonKey = claims.role === "anon";
    } catch {
      // Reject malformed legacy keys without exposing or logging them.
    }
  }

  const config = validUrl && (isPublishableKey || isLegacyAnonKey)
    ? `window.FLOWGUARD_SUPABASE_CONFIG = ${JSON.stringify({
        url: projectUrl.replace(/\/+$/, ""),
        publishableKey,
      }).replace(/</g, "\\u003c")};`
    : "window.FLOWGUARD_SUPABASE_CONFIG_ERROR = true;";

  res
    .type("application/javascript")
    .set("Cache-Control", "no-store")
    .set("X-Content-Type-Options", "nosniff")
    .set("Referrer-Policy", "no-referrer")
    .send(config);
});

export default router;
