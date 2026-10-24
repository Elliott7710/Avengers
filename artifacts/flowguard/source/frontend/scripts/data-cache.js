// Private data stays in page memory, never localStorage or an offline cache.
(function (root) {
  "use strict";
  function createCache(now = Date.now) {
    const entries = new Map();
    return {
      async read(key, loader, ttl = 15000, force = false) {
        const previous = entries.get(key);
        if (!force && previous && (previous.pending || previous.expires > now())) {
          return previous.promise;
        }
        const entry = {pending: true, expires: 0};
        entry.promise = Promise.resolve().then(loader).then(value => {
          entry.pending = false;
          entry.expires = now() + ttl;
          if (value?.error && entries.get(key) === entry) entries.delete(key);
          return value;
        }, error => {
          if (entries.get(key) === entry) entries.delete(key);
          throw error;
        });
        entries.set(key, entry);
        return entry.promise;
      },
      clear() { entries.clear(); }
    };
  }

  function createDataClient(client) {
    const cache = createCache();
    return {
      clear: () => cache.clear(),
      getUser: () => cache.read("authenticated-user", () => client.auth.getUser(), 10000),
      records(user, team, moduleId, force = false, limit = null) {
        if (!user?.id || !team?.id || !["employee", "manager"].includes(team.role) ||
            !["travel", "insights"].includes(moduleId)) {
          return Promise.reject(new Error("A signed-in user and team are required."));
        }
        const key = JSON.stringify(["records", user.id, team.id, team.role, moduleId, limit]);
        return cache.read(key, () => {
          let query = client.from(`flowguard_${moduleId === "travel" ? "travel" : "insight"}_records`)
            .select(moduleId === "travel"
              ? "id, owner_id, team_id, record_id, data, updated_at, created_at"
              : "id, owner_id, team_id, record_id, data")
            .eq("team_id", team.id).order("created_at", {ascending: false});
          if (moduleId === "travel" && team.role === "employee") query = query.eq("owner_id", user.id);
          if (limit) query = query.limit(limit);
          return query;
        }, 15000, force);
      }
    };
  }

  if (typeof module === "object" && module.exports) {
    module.exports = {createCache, createDataClient};
    return;
  }
  const api = createDataClient(supabaseClient);
  const channel = typeof root.BroadcastChannel === "function"
    ? new root.BroadcastChannel("flowguard-cache-invalidation-v1") : null;
  api.invalidate = () => {
    api.clear();
    channel?.postMessage("changed");
    root.dispatchEvent(new Event("flowguard:data-changed"));
  };
  if (channel) channel.onmessage = () => {
    api.clear();
    root.dispatchEvent(new Event("flowguard:data-changed"));
  };
  supabaseClient.auth.onAuthStateChange?.((event) => {
    api.clear();
    if (event === "SIGNED_OUT") root.location.replace("signin.html");
  });
  root.FlowGuardData = api;
})(typeof window === "object" ? window : globalThis);
