(function () {
  const toggle = document.querySelector(".notification-button");
  const model = window.FlowGuardNotificationsModel;
  if (!toggle || !model || typeof supabaseClient === "undefined") return;

  toggle.id = "notification-toggle";
  toggle.setAttribute("aria-haspopup", "dialog");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "notification-panel");

  const panel = document.createElement("section");
  panel.className = "notification-panel";
  panel.id = "notification-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "notification-title");
  panel.innerHTML = `
    <div class="notification-panel-header">
      <div>
        <p class="notification-kicker" id="notification-audience">Updates</p>
        <h2 id="notification-title">Notifications</h2>
      </div>
      <button class="notification-close" type="button" aria-label="Close notifications">&times;</button>
    </div>
    <p class="notification-summary" id="notification-summary" role="status" aria-live="polite">Loading notifications…</p>
    <ul class="notification-list" id="notification-list"></ul>
    <div class="notification-empty" id="notification-empty" hidden></div>
    <nav class="notification-actions" id="notification-actions" aria-label="Notification actions"></nav>
  `;
  (toggle.closest(".topbar-actions") || document.body).append(panel);

  const badge = toggle.querySelector(".notification-badge");
  const summary = panel.querySelector("#notification-summary");
  const audience = panel.querySelector("#notification-audience");
  const list = panel.querySelector("#notification-list");
  const empty = panel.querySelector("#notification-empty");
  const actions = panel.querySelector("#notification-actions");
  const closeButton = panel.querySelector(".notification-close");

  function storageKey(userId) {
    return `flowguard-notifications-read-v1:${userId}`;
  }

  function readState(userId) {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey(userId)) || "null");
      return {
        initialized: parsed?.initialized === true,
        read: new Set(Array.isArray(parsed?.read) ? parsed.read : []),
      };
    } catch {
      return {initialized: false, read: new Set()};
    }
  }

  function saveState(userId, state) {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify({
        initialized: state.initialized,
        read: [...state.read].slice(-1000),
      }));
    } catch {
      // Keep notifications usable when browser storage is unavailable.
    }
  }

  function setBadge(count) {
    if (!badge) return;
    badge.hidden = count < 1;
    badge.textContent = count > 99 ? "99+" : String(count);
    toggle.setAttribute(
      "aria-label",
      count ? `Notifications, ${count} unread` : "Notifications",
    );
  }

  function addAction(label, href, className) {
    const link = document.createElement("a");
    link.className = className;
    link.href = href;
    link.textContent = label;
    actions.append(link);
  }

  function renderItems(items) {
    list.replaceChildren();
    for (const item of items.slice(0, 8)) {
      const entry = document.createElement("li");
      const link = document.createElement("a");
      const content = document.createElement("span");
      const title = document.createElement("strong");
      const description = document.createElement("span");
      const status = document.createElement("span");

      link.className = "notification-item";
      link.href = item.href;
      title.textContent = item.title;
      description.textContent = item.description;
      content.className = "notification-item-copy";
      content.append(title, description);
      status.className = "notification-status";
      status.textContent = item.status;
      link.append(content, status);
      entry.append(link);
      list.append(entry);
    }
  }

  function renderActions(role) {
    actions.replaceChildren();
    if (role === "manager") {
      addAction("Review travel queue", "travel.html?status=Requested", "notification-action-primary");
    } else {
      addAction("View my travel requests", "travel.html", "notification-action-primary");
    }
    addAction("Open team insights", "insights.html", "notification-action-secondary");
  }

  async function refresh(markRead = false) {
    summary.textContent = "Loading notifications…";
    empty.hidden = true;
    list.replaceChildren();
    actions.replaceChildren();

    try {
      const teamContext = await window.FlowGuardTeams.ready();
      const user = teamContext?.user;
      const authError = null;
      if (authError?.name === "AuthSessionMissingError" || !user) {
        setBadge(0);
        summary.textContent = user ? "Join a team to view notifications." : "Sign in to view notifications.";
        return;
      }
      if (authError) throw authError;
      if (!teamContext.currentTeam) {
        setBadge(0);
        summary.textContent = "Join a team to view notifications.";
        return;
      }
      const role = teamContext.currentTeam.role;
      if (!["employee", "manager"].includes(role)) {
        throw new Error("Notifications are unavailable for this account role.");
      }

      let query = supabaseClient
        .from("flowguard_travel_records")
        .select("id, owner_id, record_id, data, created_at")
        .eq("team_id", teamContext.currentTeam.id)
        .order("created_at", {ascending: false})
        .limit(100);
      if (role === "employee") query = query.eq("owner_id", user.id);

      const {data: records, error: recordsError} = await query;
      if (recordsError) throw recordsError;

      const items = model.buildNotifications(records || [], role, user.id);
      const state = readState(user.id);
      if (!state.initialized) {
        // Existing requests form the initial baseline; only later changes are new.
        for (const item of items) state.read.add(item.id);
        state.initialized = true;
      }

      let unread = model.getUnreadNotifications(items, state.read, state.initialized);
      if (markRead) {
        for (const item of items) state.read.add(item.id);
        unread = [];
      }
      saveState(user.id, state);
      setBadge(unread.length);

      audience.textContent = role === "manager" ? "Manager review queue" : "Travel updates";
      const managerCount = role === "manager" ? items.length : 0;
      summary.textContent = role === "manager"
        ? `${managerCount} travel ${managerCount === 1 ? "request is" : "requests are"} awaiting review.${unread.length ? ` ${unread.length} new.` : ""}`
        : `${items.length} travel ${items.length === 1 ? "request" : "requests"} with status updates.${unread.length ? ` ${unread.length} new.` : ""}`;

      renderItems(items);
      renderActions(role);
      empty.hidden = items.length > 0;
      empty.textContent = role === "manager"
        ? "No travel requests are waiting for manager review."
        : "No travel requests yet. Start one from the Travel page.";
    } catch (error) {
      if (error?.name === "AuthSessionMissingError") {
        setBadge(0);
        summary.textContent = "Sign in to view notifications.";
        return;
      }
      console.error("Notifications could not be loaded:", error);
      setBadge(0);
      summary.textContent = error.message || "Notifications could not be loaded.";
      empty.hidden = true;
    }
  }

  function closePanel(restoreFocus = false) {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener("click", async () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    toggle.setAttribute("aria-expanded", String(opening));
    if (opening) {
      await refresh(true);
      closeButton.focus();
    }
  });

  closeButton.addEventListener("click", () => closePanel(true));
  panel.addEventListener("click", (event) => {
    if (event.target.closest("a")) closePanel();
  });
  document.addEventListener("click", (event) => {
    if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) {
      closePanel();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closePanel(true);
  });

  refresh();
})();
