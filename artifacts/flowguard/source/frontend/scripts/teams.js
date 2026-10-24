(function () {
  "use strict";

  const STORAGE_PREFIX = "flowguard-current-team-v1:";
  let contextPromise;
  let context = null;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g,
    (character) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));

  function relationTeam(value) {
    return Array.isArray(value) ? value[0] || null : value || null;
  }

  function teamStorageKey(userId) {
    return `${STORAGE_PREFIX}${userId}`;
  }

  function navigateToTeam(teamId) {
    try { localStorage.setItem(teamStorageKey(context.user.id), teamId); } catch {}
    const destination = new URL(window.location.href);
    destination.searchParams.set("team", teamId);
    window.location.assign(destination.href);
  }

  function showPanelMessage(message, isError = false) {
    const element = document.getElementById("team-feedback");
    if (!element) return;
    element.textContent = message;
    element.dataset.error = String(isError);
  }

  function renderSwitcher() {
    const actions = document.querySelector(".topbar-actions");
    if (!actions || actions.querySelector(".team-switcher")) return;

    const wrapper = document.createElement("label");
    wrapper.className = "team-switcher";
    const caption = document.createElement("span");
    caption.textContent = "Team";
    wrapper.append(caption);

    if (!context?.memberships?.length) {
      const link = document.createElement("a");
      link.href = "overview.html#teams-panel";
      link.textContent = "Join a team";
      wrapper.append(link);
      actions.prepend(wrapper);
      return;
    }

    const select = document.createElement("select");
    select.setAttribute("aria-label", "Current team");
    for (const membership of context.memberships) {
      const option = document.createElement("option");
      option.value = membership.id;
      option.textContent = `${membership.name} · ${membership.role}`;
      option.selected = membership.id === context.currentTeam.id;
      select.append(option);
    }
    select.addEventListener("change", () => {
      navigateToTeam(select.value);
    });
    wrapper.append(select);
    actions.prepend(wrapper);
  }

  function renderManagementPanel() {
    const host = document.getElementById("team-management");
    if (!host) return;

    const manager = context?.currentTeam?.role === "manager";
    host.innerHTML = `
      <div class="team-panel-card">
        <div class="team-panel-heading">
          <div>
            <div class="eyebrow">Private workspace</div>
            <h2>Teams</h2>
            <p>Travel and Insights are visible only within teams you belong to.</p>
          </div>
          <span class="team-current-role">${context?.currentTeam ? `${escapeHtml(context.currentTeam.name)} · ${escapeHtml(context.currentTeam.role)}` : "No team joined"}</span>
        </div>
        <div class="team-panel-grid">
          <form id="team-join-form" class="team-form">
            <label for="team-invite-code">Join a team with an invite code</label>
            <div class="team-form-row">
              <input id="team-invite-code" name="inviteCode" type="text" autocomplete="off" spellcheck="false" placeholder="Paste the invite code" required />
              <button class="btn-ghost" type="submit">Join team</button>
            </div>
          </form>
          ${manager ? `
            <form id="team-create-form" class="team-form">
              <label for="team-name">Create a team</label>
              <div class="team-form-row">
                <input id="team-name" name="teamName" type="text" maxlength="80" placeholder="Team name" required />
                <button class="btn-ghost" type="submit">Create</button>
              </div>
            </form>
            <div class="team-form">
              <label>Invite someone to ${escapeHtml(context.currentTeam.name)}</label>
              <div class="team-form-row">
                <button id="team-create-invite" class="btn-ghost" type="button">Create invite code</button>
                <button id="team-copy-invite" class="btn-ghost" type="button" hidden>Copy code</button>
              </div>
              <code id="team-invite-result" class="team-invite-result" hidden></code>
              <small>Codes expire after 7 days and can be used by up to 20 accounts. Anyone with a code can join this team as an employee.</small>
            </div>
          ` : ""}
        </div>
        <p id="team-feedback" class="team-feedback" role="status" aria-live="polite"></p>
      </div>`;

    document.getElementById("team-join-form")?.addEventListener("submit", joinTeam);
    document.getElementById("team-create-form")?.addEventListener("submit", createTeam);
    document.getElementById("team-create-invite")?.addEventListener("click", createInvite);
    document.getElementById("team-copy-invite")?.addEventListener("click", copyInvite);
  }

  async function loadContext() {
    const { data: { user }, error: authError } = await window.FlowGuardData.getUser();
    if (authError) throw authError;
    if (!user) {
      if (location.pathname.endsWith("profile.html") ||
          location.pathname.endsWith("overview.html") ||
          location.pathname.endsWith("travel.html") ||
          location.pathname.endsWith("insights.html")) {
        window.location.replace("signin.html");
      }
      return null;
    }

    const { data, error } = await supabaseClient
      .from("flowguard_team_members")
      .select("team_id, role, flowguard_teams(id, name)")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true });
    if (error) {
      throw new Error(`Team setup is not available yet. Ask a workspace manager to apply teams.sql. ${error.message}`);
    }

    const memberships = (data || []).flatMap((row) => {
      const team = relationTeam(row.flowguard_teams);
      if (!team?.id) return [];
      return [{
        id: team.id,
        name: team.name,
        role: String(row.role || "employee").toLowerCase().trim(),
      }];
    });

    let savedTeam = "";
    try { savedTeam = localStorage.getItem(teamStorageKey(user.id)) || ""; } catch {}
    const requestedTeam = new URL(window.location.href).searchParams.get("team") || savedTeam;
    const currentTeam = memberships.find((membership) => membership.id === requestedTeam) || memberships[0] || null;
    context = { user, memberships, currentTeam };
    document.body.dataset.role = currentTeam?.role || "employee";
    if (currentTeam) document.body.dataset.teamId = currentTeam.id;
    renderSwitcher();
    renderManagementPanel();
    if (!memberships.length) {
      showPanelMessage("Join a team with a manager’s invite code to open Travel and Insights.");
    }
    return context;
  }

  function ready() {
    if (!contextPromise) contextPromise = loadContext();
    return contextPromise;
  }

  function getCurrent() {
    return context;
  }

  async function joinTeam(event) {
    event.preventDefault();
    const input = document.getElementById("team-invite-code");
    const token = input?.value.trim();
    if (!token) return;
    const button = event.currentTarget.querySelector('[type="submit"]');
    button.disabled = true;
    showPanelMessage("Joining team…");
    try {
      const { data: teamId, error } = await supabaseClient.rpc("flowguard_join_team", { p_token: token });
      if (error) throw error;
      if (typeof teamId !== "string" || !teamId) throw new Error("Supabase returned an unexpected team response.");
      navigateToTeam(teamId);
    } catch (error) {
      showPanelMessage(error.message || "Unable to join this team.", true);
    } finally {
      button.disabled = false;
    }
  }

  async function createTeam(event) {
    event.preventDefault();
    const input = document.getElementById("team-name");
    const name = input?.value.trim();
    if (!name) return;
    const button = event.currentTarget.querySelector('[type="submit"]');
    button.disabled = true;
    showPanelMessage("Creating team…");
    try {
      const { data: teamId, error } = await supabaseClient.rpc("flowguard_create_team", { p_name: name });
      if (error) throw error;
      if (typeof teamId !== "string" || !teamId) throw new Error("Supabase returned an unexpected team response.");
      navigateToTeam(teamId);
    } catch (error) {
      showPanelMessage(error.message || "Unable to create this team.", true);
    } finally {
      button.disabled = false;
    }
  }

  async function createInvite(event) {
    const button = event.currentTarget;
    button.disabled = true;
    showPanelMessage("Creating invite code…");
    try {
      const { data: token, error } = await supabaseClient.rpc("flowguard_create_team_invite", {
        p_team_id: context.currentTeam.id,
      });
      if (error) throw error;
      if (typeof token !== "string" || !token) throw new Error("Supabase returned an unexpected invite response.");
      const output = document.getElementById("team-invite-result");
      output.textContent = token;
      output.hidden = false;
      document.getElementById("team-copy-invite").hidden = false;
      showPanelMessage("Invite code created. Share it only with people who should join this team.");
    } catch (error) {
      showPanelMessage(error.message || "Unable to create an invite code.", true);
    } finally {
      button.disabled = false;
    }
  }

  async function copyInvite() {
    const code = document.getElementById("team-invite-result")?.textContent;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      showPanelMessage("Invite code copied.");
    } catch {
      showPanelMessage("Copy is unavailable in this browser. Select and copy the code above.");
    }
  }

  window.FlowGuardTeams = { ready, current: getCurrent };
  ready().catch((error) => {
    console.error("Team context could not be loaded:", error);
    const host = document.getElementById("team-management");
    if (host && !host.querySelector("#team-feedback")) {
      host.innerHTML = `
        <div class="team-panel-card">
          <div class="eyebrow">Team setup</div>
          <h2>Teams are not ready</h2>
          <p>Apply the team setup migration in your Supabase project, then reload FlowGuard.</p>
          <p id="team-feedback" class="team-feedback" role="status" aria-live="polite"></p>
        </div>`;
    }
    showPanelMessage(error.message || "Team setup could not be loaded.", true);
  });
})();
