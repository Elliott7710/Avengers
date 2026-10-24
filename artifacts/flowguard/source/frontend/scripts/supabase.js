if (window.FLOWGUARD_SUPABASE_CONFIG_ERROR || !window.FLOWGUARD_SUPABASE_CONFIG) {
  const notice = document.createElement("div");
  notice.setAttribute("role", "alert");
  notice.textContent =
    "FlowGuard's Supabase project URL or publishable key is missing or invalid. Check the Replit Secrets for this app.";
  notice.style.cssText =
    "position:fixed;z-index:10000;inset:16px 16px auto;padding:16px;background:#7f1d1d;color:white;border-radius:8px;font:16px/1.5 system-ui";
  document.body.prepend(notice);
  throw new Error("Supabase client configuration is unavailable.");
}

const supabaseClient = window.supabase.createClient(
  window.FLOWGUARD_SUPABASE_CONFIG.url,
  window.FLOWGUARD_SUPABASE_CONFIG.publishableKey,
);
