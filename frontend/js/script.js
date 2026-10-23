/* =====================================================================
   FlowGuard module template
   ---------------------------------------------------------------------
   Every page is described by one object in MODULES. To add a module,
   copy a block, change the id and the settings, and it appears in the
   nav automatically. The code below the MODULES list does not need to
   change.

   Module settings
     id        unique short name, used for saving
     label     name shown in the nav and the page title
     singular  used in buttons and messages ("New request")
     prefix    start of the generated record ID (TRV-001, INS-001…)
     icon      SVG path markup for the nav button
     filter    (optional) key of a select field to filter the table by
     fields    the form: key, label, type, required, options, placeholder
               types: text, number, date, select, textarea
     columns   the table: key, label, and optional type:
               money, date, chip
     stats     cards on top: label and fn(rows) that returns the value
   ===================================================================== */

const CURRENCY = "MYR"; // change to "USD", "SGD", etc.

const MODULES = [
  {
    id: "travel",
    label: "Travel",
    singular: "request",
    prefix: "TRV",
    icon: '<path d="M2.5 13.5 21 4l-4 16-5.5-5-3 3-.5-5Z"/><path d="m11.5 15 9.5-11"/>',
    filter: "status",
    fields: [
      {key: "traveller", label: "Traveller", type: "text", required: true, placeholder: "Full name"},
      {key: "destination", label: "Destination", type: "text", required: true, placeholder: "City or country"},
      {key: "start", label: "Departure", type: "date", required: true},
      {key: "end", label: "Return", type: "date", required: true},
      {key: "cost", label: "Estimated cost", type: "number", required: true, placeholder: "0.00"},
      {key: "claim", label: "Linked claim (optional)", type: "text", placeholder: "e.g. CLM-001"},
      {key: "purpose", label: "Purpose", type: "textarea", required: true, placeholder: "Why is this trip needed?"}
    ],
    columns: [
      {key: "id", label: "Request"},
      {key: "traveller", label: "Traveller"},
      {key: "destination", label: "Destination"},
      {key: "start", label: "Departure", type: "date"},
      {key: "cost", label: "Cost", type: "money"},
      {key: "claim", label: "Claim"},
      {key: "status", label: "Status", type: "chip"}
    ],
    stats: [
      {label: "Requests", fn: r => r.length},
      {label: "Awaiting approval", fn: r => r.filter(x => x.status === "Requested").length},
      {label: "Approved or booked", fn: r => r.filter(x => x.status === "Approved" || x.status === "Booked").length},
      {label: "Estimated spend", fn: r => {
        try {
          return money(window.FlowGuardCalculations.sumEstimatedSpend(r));
        } catch {
          return "Check travel costs";
        }
      }}
    ]
  },
  {
    id: "insights",
    label: "Insights",
    singular: "entry",
    prefix: "INS",
    icon: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    filter: "team",
    fields: [
      {key: "team", label: "Team", type: "select", required: true, options: ["Call centre", "Online support", "Developers", "Testers"]},
      {key: "name", label: "Person or team name", type: "text", required: true, placeholder: "Who is this about?"},
      {key: "period", label: "Period start", type: "date", required: true},
      {key: "metric", label: "Metric", type: "text", required: true, placeholder: "e.g. Average call time (min)"},
      {key: "value", label: "Value", type: "number", required: true, placeholder: "0"},
      {key: "note", label: "Coaching note", type: "textarea", placeholder: "A prompt for a conversation, not a score"}
    ],
    columns: [
      {key: "id", label: "Entry"},
      {key: "team", label: "Team", type: "chip"},
      {key: "name", label: "Name"},
      {key: "period", label: "Period", type: "date"},
      {key: "metric", label: "Metric"},
      {key: "value", label: "Value"},
      {key: "note", label: "Coaching note"}
    ],
    stats: [
      {label: "Entries", fn: r => r.length},
      {label: "Teams covered", fn: r => new Set(r.map(x => x.team)).size},
      {label: "People or teams", fn: r => new Set(r.map(x => x.name.toLowerCase())).size},
      {label: "Latest period", fn: r => r.length ? fdate(r.map(x => x.period).sort().pop()) : "—"}
    ]
  }
];

/* ---------------------------------------------------------------------
   Everything below is the engine. You normally don't need to edit it.
   --------------------------------------------------------------------- */

const LEGACY_KEY = "flowguard-modules-v1";
const MIGRATION_USER_KEY = "flowguard-modules-migrated-user-v1";
const LEGACY_NOTICE_KEY = "flowguard-travel-legacy-review-v1";
const TABLES = {travel: "flowguard_travel_records", insights: "flowguard_insight_records"};
const DB = {travel: [], insights: []};
let currentUser;
let currentRole;
let ready = false;
let migrationNotice = "";
let workflowReady = false;
let workflowMessage = "";
let activity = [];
let activityState = "loading";
let activityError = "";
let busy = false;
let refreshingWorkflow = false;
let workflowRefreshError = "";
let drawerRenderedKey = null;
let drawerDraft = null;
const pageModule = MODULES.find(module => module.id === document.body.dataset.page);
const requestedFilter = new URLSearchParams(window.location.search).get("status");
const optionsForFilter = module => module?.id === "travel"
  ? ["Requested", "Approved", "Booked", "Rejected"]
  : module?.fields.find(field => field.key === module.filter)?.options || [];
const initialFilter = pageModule?.filter === "status" &&
  optionsForFilter(pageModule).includes(requestedFilter)
  ? requestedFilter
  : "all";
const S = {mod: document.body.dataset.page, q: "", filter: initialFilter, edit: null};
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const money = n => new Intl.NumberFormat("en-US", {style: "currency", currency: CURRENCY}).format(n);
const fdate = d => d ? new Date(d + "T00:00").toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"}) : "—";
const mod = () => MODULES.find(m => m.id === S.mod);
const rows = () => DB[S.mod];
const tableFor = moduleId => TABLES[moduleId];

function showLoadError(message) {
  $("#table").innerHTML = `<div class="card"><div class="empty">${esc(message)}<br><button type="button" class="run-btn" data-retry>Try again</button></div></div>`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const isTerminalLegacyTravel = record => ["approved", "booked", "rejected"].includes(String(record?.status || "").trim().toLowerCase());

function getLegacyData() {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return {raw: null, data: {}};
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Your older browser records could not be read. They are still saved on this device; do not clear this browser's site data.");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Your older browser records have an unexpected format. They are still saved on this device and need to be recovered before continuing.");
  }
  for (const module of MODULES) {
    if (data[module.id] !== undefined && !Array.isArray(data[module.id])) {
      throw new Error(`Older ${module.label.toLowerCase()} records have an unexpected format. They are still saved on this device.`);
    }
  }
  return {raw, data};
}

async function migrateLegacyData() {
  const {raw, data} = getLegacyData();
  if (!raw) return;
  const savedNotice = localStorage.getItem(`${LEGACY_NOTICE_KEY}:${currentUser.id}`);
  if (savedNotice) migrationNotice = savedNotice;

  const recordCount = MODULES.reduce((count, module) => count + (data[module.id] || []).length, 0);
  if (!recordCount) return;

  const claimedBy = localStorage.getItem(MIGRATION_USER_KEY);
  if (claimedBy === currentUser.id) return;
  if (claimedBy && claimedBy !== currentUser.id) {
    migrationNotice = "Older browser records were already migrated to a different account. They remain on this device and were not copied to this account.";
    return;
  }
  if (!window.confirm(`This browser contains ${recordCount} older travel and/or insights record(s). Import them into the signed-in account (${currentUser.email || "current account"})? Continue only if this account owns those records. The browser copy will be kept.`)) {
    migrationNotice = "Import was not started. Your older records remain on this device; sign in with the account that owns them and reload to try again.";
    return;
  }

  let deferredTravel = false;
  for (const module of MODULES) {
    const oldRecords = data[module.id] || [];
    if (!oldRecords.length) continue;
    const importable = module.id === "travel"
      ? oldRecords.filter(record => !isTerminalLegacyTravel(record))
      : oldRecords;
    const skippedTerminalTravel = module.id === "travel" ? oldRecords.length - importable.length : 0;
    if (skippedTerminalTravel) {
      migrationNotice = `${skippedTerminalTravel} older travel request(s) marked Approved, Booked or Rejected were not imported. Review and resubmit them manually; the original browser copy remains available.`;
      localStorage.setItem(`${LEGACY_NOTICE_KEY}:${currentUser.id}`, migrationNotice);
    }
    if (module.id === "travel" && !workflowReady) {
      if (oldRecords.length) {
        const deferredMessage = `${workflowMessage} Older travel records were not imported; the browser copy remains available.`;
        migrationNotice = migrationNotice ? `${migrationNotice} ${deferredMessage}` : deferredMessage;
      }
      deferredTravel = true;
      continue;
    }
    if (!importable.length) continue;

    const {data: existing, error: readError} = await supabaseClient
      .from(tableFor(module.id))
      .select("record_id, data")
      .eq("owner_id", currentUser.id);
    if (readError) throw new Error(`Could not check existing ${module.label.toLowerCase()} before import: ${readError.message}`);

    const existingById = new Map((existing || []).map(record => [record.record_id, record.data]));
    const imports = [];
    for (let index = 0; index < oldRecords.length; index++) {
      const oldRecord = oldRecords[index];
      if (!oldRecord || typeof oldRecord !== "object" || Array.isArray(oldRecord)) {
        throw new Error(`An older ${module.singular} is invalid. Nothing was removed from this browser; correct or export the saved data before retrying.`);
      }
      if (module.id === "travel" && isTerminalLegacyTravel(oldRecord)) continue;
      const recordId = typeof oldRecord.id === "string" && oldRecord.id.trim()
        ? oldRecord.id.trim()
        : `${module.prefix}-LEGACY-${String(index + 1).padStart(3, "0")}`;
      const recordData = {...oldRecord};
      delete recordData.id;
      delete recordData.dbId;
      delete recordData.ownerId;
      if (module.id === "travel") recordData.status = "Requested";

      if (existingById.has(recordId)) {
        const comparableExisting = module.id === "travel"
          ? pickTravelFields(existingById.get(recordId))
          : existingById.get(recordId);
        const comparableImport = module.id === "travel" ? pickTravelFields(recordData) : recordData;
        if (canonicalJson(comparableExisting) !== canonicalJson(comparableImport)) {
          throw new Error(`An older ${module.singular} (${recordId}) conflicts with a saved account record. Nothing was overwritten; the browser copy is still available.`);
        }
        continue;
      }
      imports.push({owner_id: currentUser.id, record_id: recordId, data: recordData});
    }

    if (imports.length) {
      const {error} = await supabaseClient.from(tableFor(module.id)).insert(imports);
      if (error) throw new Error(`Could not import older ${module.label.toLowerCase()} records: ${error.message}. The browser copy is still available; retry after resolving the issue.`);
    }
  }

  // Keep the old key as a recoverable copy. The marker prevents importing it
  // into a second account on a shared browser.
  if (!deferredTravel) localStorage.setItem(MIGRATION_USER_KEY, currentUser.id);
}

function pickTravelFields(data) {
  const keys = ["traveller", "destination", "start", "end", "cost", "claim", "purpose", "status"];
  return Object.fromEntries(keys.filter(key => data?.[key] !== undefined).map(key => [key, data[key]]));
}

async function loadRecords() {
  for (const module of MODULES) {
    let result = await supabaseClient
      .from(tableFor(module.id))
      .select(module.id === "travel" ? "id, owner_id, record_id, data, updated_at" : "id, owner_id, record_id, data")
      .order("created_at", {ascending: false});
    if (module.id === "travel" && result.error && !workflowReady) {
      result = await supabaseClient.from(tableFor(module.id))
        .select("id, owner_id, record_id, data")
        .order("created_at", {ascending: false});
    }
    if (result.error) {
      if (S.mod === module.id) throw new Error(`Could not load ${module.label.toLowerCase()} records: ${result.error.message}`);
      continue;
    }
    DB[module.id] = (result.data || []).map(record => ({
      ...(record.data || {}),
      id: record.record_id,
      dbId: record.id,
      ownerId: record.owner_id,
      ...(module.id === "travel" && record.updated_at ? {updatedAt: record.updated_at} : {})
    }));
  }
}

async function checkTravelWorkflow() {
  try {
    const {data, error} = await supabaseClient.rpc("flowguard_travel_workflow_version");
    if (error || Number(data) !== 1) throw error || new Error("Workflow version 1 is not available.");
    workflowReady = true;
    workflowMessage = "";
  } catch (error) {
    workflowReady = false;
    workflowMessage = `Travel approvals are not set up yet. Ask your workspace administrator to apply the travel workflow migration (version 1). ${error?.message || ""}`.trim();
  }
}

async function loadActivity(travelId = null) {
  if (!travelId) {
    activityState = "loading";
    activityError = "";
    renderActivity();
  }
  try {
    let query = supabaseClient.from("flowguard_travel_activity")
      .select("id,travel_id,record_id,action,actor_role,from_status,to_status,note,rule_code,created_at")
      .order("created_at", {ascending: false}).limit(100);
    if (travelId) query = query.eq("travel_id", travelId);
    const {data, error} = await query;
    if (error) throw error;
    if (!travelId) {
      activity = data || [];
      activityState = activity.length ? "ready" : "empty";
      renderActivity();
    } else if (String(S.edit?.id) === String(travelId)) {
      S.drawerActivity = {state: data?.length ? "ready" : "empty", items: data || [], error: ""};
      if (!busy) renderDrawer();
    }
  } catch (error) {
    const message = error.message || "Could not load travel history.";
    if (!travelId) {
      activityState = "error";
      activityError = message;
      renderActivity();
    } else if (String(S.edit?.id) === String(travelId)) {
      S.drawerActivity = {state: "error", items: [], error: message};
      if (!busy) renderDrawer();
    }
  }
}

async function refreshWorkflow() {
  if (refreshingWorkflow || busy) return;
  refreshingWorkflow = true;
  workflowRefreshError = "";
  renderPage();
  try {
    await checkTravelWorkflow();
    await loadRecords();
    await loadActivity();
  } catch (error) {
    workflowRefreshError = error.message || "Could not refresh travel requests.";
  } finally {
    refreshingWorkflow = false;
    $("#newBtn").disabled = S.mod === "travel" && !workflowReady;
    render();
  }
}

function showMutationError(target, error) {
  if (!target) return;
  const message = error?.message || "The change could not be saved.";
  const stale = /changed elsewhere|no longer available|updated_at|conflict|stale|refresh/i.test(message);
  target.innerHTML = `${esc(message)}${stale ? ' <button type="button" class="btn-ghost" data-refresh-workflow>Refresh records and activity</button>' : ""}`;
}

async function initialize() {
  ready = false;
  migrationNotice = "";
  $("#newBtn").disabled = true;
  $("#table").textContent = "Loading records…";
  try {
    const {data: {user}, error: authError} = await supabaseClient.auth.getUser();
    if (authError?.name === "AuthSessionMissingError") {
      window.location.replace("signin.html");
      return;
    }
    if (authError) throw authError;
    if (!user) {
      window.location.replace("signin.html");
      return;
    }
    currentUser = user;

    const {data: profile, error: profileError} = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;
    currentRole = (profile.role || "employee").toLowerCase().trim();
    if (!["employee", "manager"].includes(currentRole)) throw new Error("This account has an unsupported role.");
    document.body.dataset.role = currentRole;

    await checkTravelWorkflow();
    try {
      await migrateLegacyData();
    } catch (error) {
      console.error("Legacy record migration error:", error);
      migrationNotice = error.message || "Older browser records could not be imported and remain on this device.";
    }
    await loadRecords();
    ready = true;
    $("#newBtn").disabled = S.mod === "travel" && !workflowReady;
    render();
    if (S.mod === "travel") loadActivity();
  } catch (error) {
    console.error("Travel and insights loading error:", error);
    showLoadError(error.message || "Unable to load records. Please try again.");
  }
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2200);
}

function cell(col, row) {
  const v = row[col.key];
  if (v === undefined || v === "") return "—";
  if (col.type === "money") {
    const amount = Number(v);
    return Number.isFinite(amount) && amount >= 0 ? money(amount) : "Invalid amount";
  }
  if (col.type === "date") return fdate(v);
  if (col.type === "chip") return `<span class="chip c-${esc(String(v).toLowerCase().replace(/\s+/g, "-"))}">${esc(v)}</span>`;
  return esc(v);
}

function nextId(m) {
  const n = DB[m.id].reduce((max, r) => Math.max(max, parseInt(String(r.id).split("-")[1], 10) || 0), 0) + 1;
  return `${m.prefix}-${String(n).padStart(3, "0")}`;
}

/* ---------- module page ---------- */

function renderPage() {
  const m = mod(), all = rows();

  $("#stats").innerHTML = m.stats.map(s => `<div class="stat"><b>${esc(s.fn(all))}</b><span>${esc(s.label)}</span></div>`).join("");

  const f = m.filter && m.fields.find(x => x.key === m.filter);
  const filterOptions = optionsForFilter(m);
  const filterKey = m.id === "travel" ? "status" : f?.key;
  const controls = all.length ? `
    <input id="q" placeholder="Search ${esc(m.label.toLowerCase())}…" value="${esc(S.q)}">
    ${filterKey ? `<select id="filter" aria-label="Filter by ${esc(filterKey)}"><option value="all">All ${esc(filterKey === "status" ? "statuses" : f.label.toLowerCase())}</option>${filterOptions.map(o => `<option ${S.filter === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>` : ""}` : "";
  $("#toolbar").innerHTML = `${m.id === "travel" && !workflowReady ? `<div class="setup-notice" role="status">${esc(workflowMessage)}</div>` : ""}${migrationNotice ? `<p class="sub migration-notice">${esc(migrationNotice)}</p>` : ""}${controls}`;

  if (!all.length) {
    $("#table").innerHTML = `<div class="card"><div class="empty">No ${esc(m.label.toLowerCase())} ${esc(m.singular)}s yet.<br>${m.id === "travel" && !workflowReady ? "Travel setup is required before creating requests." : "Add your first one to get started."}<br>${m.id !== "travel" || workflowReady ? `<button type="button" class="run-btn" data-new>+ New ${esc(m.singular)}</button>` : ""}</div></div>${m.id === "travel" ? activityMarkup() : ""}`;
    return;
  }

  const q = S.q.trim().toLowerCase();
  const shown = all.filter(r =>
    (!filterKey || S.filter === "all" || r[filterKey] === S.filter) &&
    (!q || Object.values(r).join(" ").toLowerCase().includes(q)));

  $("#table").innerHTML = `
    <div class="card"><table>
      <thead><tr>${m.columns.map(c => `<th class="${c.type === "money" ? "num" : ""}">${esc(c.label)}</th>`).join("")}</tr></thead>
      <tbody>${shown.map(r => `<tr data-open="${esc(r.dbId)}" tabindex="0" role="button" aria-label="Open request ${esc(r.id)}">${m.columns.map(c => `<td class="${c.type === "money" ? "num" : ""}">${cell(c, r)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>${shown.length ? "" : '<div class="empty">Nothing matches your search.</div>'}</div>
    <p class="sub">Showing ${shown.length} of ${all.length}</p>${m.id === "travel" ? activityMarkup() : ""}`;
}

function formatActivity(item) {
  const action = String(item.action || "").replace(/_/g, " ");
  const details = [item.from_status && `${item.from_status}`, item.to_status && `to ${item.to_status}`].filter(Boolean).join(" ");
  const date = item.created_at ? new Date(item.created_at).toLocaleString() : "—";
  return `<li class="history-item"><div class="history-top"><strong>${esc(action || "Update")}</strong><time>${esc(date)}</time></div><div class="history-meta"><span>${esc(item.record_id || "Request")}</span>${details ? `<span>${esc(details)}</span>` : ""}<span>${esc(item.actor_role || "member")}</span></div>${item.note ? `<p>${esc(item.note)}</p>` : ""}</li>`;
}

function activityMarkup() {
  let content = "";
  if (activityState === "loading") content = `<div class="history-state" aria-live="polite"><span class="skeleton-line"></span><span class="skeleton-line short"></span></div>`;
  else if (activityState === "error") content = `<div class="history-state" role="alert">${esc(activityError)} <button type="button" class="btn-ghost" data-refresh-workflow>Retry</button></div>`;
  else if (activityState === "empty") content = `<div class="history-state">No activity recorded yet. New actions will appear here.</div>`;
  else content = `<ol class="history-list">${activity.map(formatActivity).join("")}</ol>`;
  return `<section class="activity-panel" aria-labelledby="activityTitle"><div class="activity-heading"><div><h2 id="activityTitle">Recent travel activity</h2><p>Latest 100 events visible to your account.</p></div><button type="button" class="btn-ghost" data-refresh-workflow aria-label="Refresh travel requests and activity" ${refreshingWorkflow || busy ? "disabled" : ""}>${refreshingWorkflow ? "Refreshing…" : "Refresh all"}</button></div>${workflowRefreshError ? `<div class="history-state" role="alert">${esc(workflowRefreshError)}</div>` : ""}${content}</section>`;
}

function renderActivity() {
  if (S.mod === "travel" && ready) renderPage();
}

/* ---------- drawer form ---------- */

function inputFor(f, value) {
  const v = value ?? "";
  const common = `id="field-${f.key}" data-k="${f.key}" ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""} ${f.required ? "required" : ""}`;
  if (f.type === "textarea") return `<textarea ${common}>${esc(v)}</textarea>`;
  if (f.type === "select") return `<select ${common}>${f.options.map(o => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  return `<input ${common} type="${f.type}" ${f.type === "number" ? 'step="0.01" min="0"' : ""} value="${esc(v)}">`;
}

function renderDrawer() {
  const el = $("#drawer");
  if (!S.edit) {
    const wasOpen = el.classList.contains("open");
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
    el.inert = true;
    el.innerHTML = "";
    drawerRenderedKey = null;
    drawerDraft = null;
    if (wasOpen) {
      if (S.returnFocus?.isConnected) S.returnFocus.focus();
      else if (S.returnFocus?.dataset?.open) document.querySelector(`[data-open="${CSS.escape(S.returnFocus.dataset.open)}"]`)?.focus();
      else $("#newBtn")?.focus();
    }
    return;
  }
  const draftKey = S.edit.id ? String(S.edit.id) : "__new__";
  if (el.classList.contains("open") && drawerRenderedKey === draftKey) {
    const fields = {};
    el.querySelectorAll("[data-k]").forEach(field => { fields[field.dataset.k] = field.value; });
    const note = el.querySelector("[data-decision-note]")?.value;
    drawerDraft = {key: draftKey, fields, ...(note !== undefined ? {note} : {})};
  } else if (drawerDraft?.key !== draftKey) drawerDraft = null;
  drawerRenderedKey = draftKey;
  const wasOpen = el.classList.contains("open");
  const activeInside = el.contains(document.activeElement) ? document.activeElement : null;
  const activeId = activeInside?.id;
  const activeAction = activeInside?.dataset?.decision ? `[data-decision="${activeInside.dataset.decision}"]`
    : activeInside?.hasAttribute("data-refresh-drawer-history") ? "[data-refresh-drawer-history]" : null;
  const m = mod();
  const rec = S.edit.id ? rows().find(r => r.dbId === S.edit.id) : null;
  if (m.id === "travel") {
    const canWrite = !busy && workflowReady && FlowGuardTravelWorkflow.canEdit(rec, currentUser.id);
    const isNew = !rec;
    const isEditable = isNew || canWrite;
    const status = rec?.status || "Requested";
    const rule = rec ? safeRule(rec) : null;
    const actions = rec && workflowReady ? FlowGuardTravelWorkflow.availableActions(rec, currentRole, currentUser.id) : [];
    const drawerHistory = S.drawerActivity || {state: "loading", items: [], error: ""};
    const historyBody = drawerHistory.state === "loading"
      ? `<div class="history-state"><span class="skeleton-line"></span></div>`
      : drawerHistory.state === "error"
        ? `<div class="history-state" role="alert">${esc(drawerHistory.error)} <button type="button" class="btn-ghost" data-refresh-drawer-history>Retry</button></div>`
        : drawerHistory.state === "empty"
          ? `<div class="history-state">No recorded history for this request yet.</div>`
          : `<ol class="history-list">${drawerHistory.items.map(formatActivity).join("")}</ol>`;
    const statusPanel = rec ? `<section class="request-summary">
      <div class="summary-status"><span>Current status</span><span class="chip c-${esc(status.toLowerCase())}">${esc(status)}</span></div>
      <div class="summary-rule"><strong>Rule evaluation</strong><span>${esc(rule?.label || "Rule details unavailable")}</span><small>${rule ? `Demo threshold: ${money(rule.threshold)}. All requests require approval by another manager.` : ""}</small></div>
      <p class="next-step">${esc(nextStep(rec, actions))}</p>
    </section>` : "";
    const fields = m.fields.map(f => {
      const value = drawerDraft?.key === draftKey && Object.hasOwn(drawerDraft.fields, f.key)
        ? drawerDraft.fields[f.key]
        : rec ? rec[f.key] : "";
      if (isEditable) return `<div class="field"><label for="field-${f.key}">${esc(f.label)}${f.required ? " *" : ""}</label>${inputFor(f, value)}</div>`;
      return `<div class="detail-field"><span>${esc(f.label)}</span><strong>${esc(value || "—")}</strong></div>`;
    }).join("");
    const decisionNote = drawerDraft?.key === draftKey ? drawerDraft.note || "" : "";
    const actionsMarkup = actions.length ? `<section class="decision-box"><h3>Manager decision</h3><label for="decisionNote">Decision note <span>(required, up to 1,000 characters)</span></label><textarea id="decisionNote" maxlength="1000" data-decision-note placeholder="Record the reason for this decision" ${busy ? "disabled" : ""}>${esc(decisionNote)}</textarea><div class="decision-actions">${actions.map(action => `<button type="button" class="${action === "reject" ? "btn-ghost decision-reject" : "run-btn"}" data-decision="${action}" ${busy ? "disabled" : ""}>${action === "approve" ? "Approve" : action === "reject" ? "Reject" : "Mark booked"}</button>`).join("")}</div><div class="err" id="decisionErr" role="alert"></div></section>` : "";
    const footer = isEditable
      ? `<div class="d-foot">${rec ? `<button type="button" class="btn-ghost" data-delete ${canWrite ? "" : "disabled"}>Delete</button>` : `<button type="button" class="btn-ghost" data-close>Cancel</button>`}<button type="button" class="run-btn" data-save ${canWrite ? "" : "disabled"}>${isNew ? "Submit request" : "Save changes"}</button></div>`
      : `<div class="d-foot"><button type="button" class="btn-ghost" data-close>Close</button></div>`;
    const preview = isEditable ? `<div class="rule-preview" id="rulePreview" aria-live="polite">Enter valid trip details to preview the approval rule.</div>` : "";
    el.innerHTML = `<div class="d-head"><div><span class="eyebrow">${rec ? "Travel request" : "New request"}</span><h2>${rec ? esc(rec.id) : "Submit a travel request"}</h2></div><button type="button" class="x-btn" data-close aria-label="Close request details">&times;</button></div>
      <div class="d-body">${workflowReady ? "" : `<div class="setup-notice" role="alert">${esc(workflowMessage)} Travel requests are read-only until setup is complete.</div>`}${statusPanel}${fields}${preview}${actionsMarkup}
      ${rec ? `<section class="drawer-history"><div class="activity-heading"><div><h3>Request history</h3><p>Activity attached to this request.</p></div><button type="button" class="btn-ghost" data-refresh-drawer-history>Refresh</button></div>${historyBody}</section>` : ""}
      <div class="err" id="err" role="alert"></div></div>${footer}`;
    el.classList.add("open");
    el.inert = false;
    el.setAttribute("aria-hidden", "false");
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "drawerTitle");
    const title = el.querySelector(".d-head h2");
    if (title) title.id = "drawerTitle";
    if (activeId) el.querySelector(`#${CSS.escape(activeId)}`)?.focus();
    else if (activeAction) el.querySelector(activeAction)?.focus();
    else if (!wasOpen && isNew && !S.drawerFocused) {
      S.drawerFocused = true;
      el.querySelector("#field-traveller")?.focus();
    } else if (!wasOpen) {
      S.drawerFocused = true;
      el.querySelector("[data-close]")?.focus();
    }
    return;
  }
  el.innerHTML = `
    <div class="d-head"><h2>${rec ? esc(rec.id) : `New ${esc(m.singular)}`}</h2><button type="button" class="x-btn" data-close aria-label="Close">&times;</button></div>
    <div class="d-body">
      ${m.fields.map(f => `<div class="field"><label>${esc(f.label)}</label>${inputFor(f, rec ? rec[f.key] : "")}</div>`).join("")}
      <div class="err" id="err"></div>
    </div>
    <div class="d-foot">
      ${rec ? '<button type="button" class="btn-ghost" data-delete>Delete</button>' : '<button type="button" class="btn-ghost" data-close>Cancel</button>'}
      <button type="button" class="run-btn" data-save>${rec ? "Save changes" : `Add ${esc(m.singular)}`}</button>
    </div>`;
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
  el.inert = false;
  const first = el.querySelector("input, select, textarea");
  if (first && !rec) first.focus();
  drawerRenderedKey = draftKey;
}

function safeRule(record) {
  try { return FlowGuardTravelWorkflow.evaluateRule(record); } catch { return null; }
}

function nextStep(record, actions) {
  if (record.status === "Requested") return actions.length ? "Next step: an independent manager must approve or reject this request." : "Next step: awaiting a manager other than the requester.";
  if (record.status === "Approved") return actions.includes("book") ? "Next step: mark the approved trip as booked." : "Next step: booking is pending.";
  if (record.status === "Booked") return "This request is booked; no further action is available.";
  return "This request is closed.";
}

async function saveRecord() {
  if (busy) return;
  const m = mod(), vals = {};
  const rec = S.edit.id ? rows().find(r => r.dbId === S.edit.id) : null;
  if (m.id === "travel" && (!workflowReady || !FlowGuardTravelWorkflow.canEdit(rec, currentUser.id))) return;
  for (const f of m.fields) {
    const input = document.querySelector(`#drawer [data-k="${f.key}"]`);
    if (!input) continue;
    const raw = input.value.trim();
    if (f.required && !raw) return ($("#err").textContent = `${f.label} is required.`);
    if (f.type === "number" && raw !== "") {
      const amount = Number(raw);
      if (!Number.isFinite(amount) || amount < 0) return ($("#err").textContent = `${f.label} must be a non-negative number.`);
      vals[f.key] = amount;
    } else vals[f.key] = raw;
  }
  if (m.id === "travel") {
    try { FlowGuardTravelWorkflow.validateTravel(vals); }
    catch (error) { $("#err").textContent = error.message; return; }
    if (!rec) vals.status = "Requested";
    else vals.status = rec.status;
  }
  busy = true;
  lockMutations(true);
  try {
    if (rec) {
      const updated = {...rec};
      for (const key of ["id", "dbId", "ownerId", "updatedAt"]) delete updated[key];
      const nextData = {...updated, ...vals};
      let updateQuery = supabaseClient
        .from(tableFor(m.id))
        .update({data: nextData})
        .eq("id", rec.dbId);
      if (m.id === "travel") updateQuery = updateQuery.eq("updated_at", rec.updatedAt);
      const {data, error} = await updateQuery
        .select(m.id === "travel" ? "id, owner_id, record_id, data, updated_at" : "id, owner_id, record_id, data")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("This request changed elsewhere or is no longer available. Refresh records and activity before trying again.");
      Object.assign(rec, data.data || {}, {id: data.record_id, dbId: data.id, ownerId: data.owner_id, updatedAt: data.updated_at});
    } else {
      const payload = m.id === "travel" ? {...vals, status: "Requested"} : vals;
      const {data, error} = await supabaseClient
        .from(tableFor(m.id))
        .insert({owner_id: currentUser.id, record_id: nextId(m), data: payload})
        .select(m.id === "travel" ? "id, owner_id, record_id, data, updated_at" : "id, owner_id, record_id, data")
        .single();
      if (error) throw error;
      DB[m.id].unshift({...data.data, id: data.record_id, dbId: data.id, ownerId: data.owner_id, ...(m.id === "travel" ? {updatedAt: data.updated_at} : {})});
    }
  } catch (error) {
    showMutationError($("#err"), error);
    return;
  } finally {
    busy = false;
    lockMutations(false);
  }
  toast(rec ? "Changes saved" : `${m.label}: ${m.singular} added`);
  S.edit = null;
  S.drawerFocused = false;
  drawerDraft = null;
  if (m.id === "travel") {
    busy = true;
    lockMutations(true);
    renderDrawer();
    try {
      await loadRecords();
      await loadActivity();
    } catch (error) {
      workflowRefreshError = `Saved successfully, but the refreshed list could not be loaded (${error.message || "unknown error"}). Use Refresh all; do not resubmit.`;
    } finally {
      busy = false;
      lockMutations(false);
      renderPage();
    }
  } else {
    render();
  }
}

function lockMutations(locked) {
  const applyLock = element => {
    if (locked) {
      if (!("lockPreviousDisabled" in element.dataset)) element.dataset.lockPreviousDisabled = String(element.disabled);
      element.disabled = true;
    } else if ("lockPreviousDisabled" in element.dataset) {
      element.disabled = element.dataset.lockPreviousDisabled === "true";
      delete element.dataset.lockPreviousDisabled;
    }
  };
  if ($("#newBtn")) applyLock($("#newBtn"));
  document.querySelectorAll("[data-new]").forEach(applyLock);
  $("#drawer")?.querySelectorAll("[data-save], [data-delete], [data-decision], [data-k], [data-decision-note]").forEach(applyLock);
}

function render() { renderPage(); renderDrawer(); }

/* ---------- events ---------- */

document.addEventListener("click", e => {
  const t = e.target;
  let x;
  if ((t.closest("#newBtn") || t.closest("[data-new]")) && ready && !busy && (S.mod !== "travel" || workflowReady)) {
    S.returnFocus = t.closest("#newBtn") || t.closest("[data-new]");
    S.drawerFocused = false;
    drawerDraft = null;
    S.drawerActivity = null;
    S.edit = {id: null};
    render();
    if (S.mod === "travel") updateRulePreview();
    return;
  }
  if (t.closest("[data-retry]")) return initialize();
  if (t.closest("[data-refresh-workflow]")) return refreshWorkflow();
  if (t.closest("[data-refresh-history]")) return loadActivity();
  if (t.closest("[data-refresh-drawer-history]") && S.edit?.id) {
    S.drawerActivity = {state: "loading", items: [], error: ""};
    renderDrawer();
    return loadActivity(S.edit.id);
  }
  if (t.closest("[data-close]")) {
    if (busy) return;
    S.edit = null;
    S.drawerFocused = false;
    drawerDraft = null;
    return render();
  }
  if (t.closest("[data-save]")) return saveRecord();
  if ((x = t.closest("[data-decision]"))) return decideTravel(x.dataset.decision);
  if (t.closest("[data-delete]")) {
    const noun = mod().id === "travel" ? "request" : mod().singular;
    if (!busy && confirm(`Delete this ${noun}?${mod().id === "travel" ? " Its activity remains in recent travel history." : ""}`)) deleteRecord();
    return;
  }
  if ((x = t.closest("[data-open]")) && !busy) {
    S.returnFocus = x;
    S.drawerFocused = false;
    drawerDraft = null;
    S.drawerActivity = {state: "loading", items: [], error: ""};
    S.edit = {id: x.dataset.open};
    render();
    if (S.mod === "travel") loadActivity(x.dataset.open);
    return;
  }
});

document.addEventListener("input", e => {
  if (S.mod === "travel" && e.target.matches("#drawer [data-k]")) updateRulePreview();
  if (e.target.id === "q") {
    S.q = e.target.value;
    const p = e.target.selectionStart;
    renderPage();
    const q = $("#q"); q.focus(); q.setSelectionRange(p, p);
  }
});

document.addEventListener("change", e => {
  if (e.target.id === "filter") { S.filter = e.target.value; renderPage(); }
});

document.addEventListener("keydown", e => {
  if (e.target.matches("[data-open]") && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    e.target.click();
  }
  if (e.key === "Escape" && S.edit && !busy) {
    S.edit = null;
    S.drawerFocused = false;
    drawerDraft = null;
    render();
  }
  if (e.key === "Tab" && S.edit) {
    const drawer = $("#drawer");
    const focusable = [...drawer.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')].filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

function updateRulePreview() {
  const target = $("#rulePreview");
  if (!target) return;
  const data = {};
  for (const key of ["traveller", "destination", "start", "end", "purpose", "cost"]) {
    const input = document.querySelector(`#drawer [data-k="${key}"]`);
    data[key] = input ? input.value.trim() : "";
  }
  try {
    const rule = FlowGuardTravelWorkflow.evaluateRule(data);
    target.className = `rule-preview ${rule.code}`;
    target.innerHTML = `<strong>${esc(rule.label)}</strong><span>${esc(money(rule.threshold))} demo threshold. Every request needs approval from another manager.</span>`;
  } catch {
    target.className = "rule-preview";
    target.textContent = "Enter valid traveller, destination, dates, purpose and cost to preview the approval rule.";
  }
}

async function decideTravel(action) {
  if (busy || !workflowReady || !S.edit?.id) return;
  const record = rows().find(item => item.dbId === S.edit.id);
  if (!record) return;
  const note = $("#decisionNote")?.value || "";
  try { FlowGuardTravelWorkflow.assertDecision(record, action, currentRole, currentUser.id, note); }
  catch (error) { $("#decisionErr").textContent = error.message; return; }
  busy = true;
  lockMutations(true);
  if ($("#decisionErr")) $("#decisionErr").textContent = "";
  let decisionSaved = false;
  let refreshFailure = "";
  try {
    const {data, error} = await supabaseClient.rpc("flowguard_decide_travel", {
      p_id: record.dbId,
      p_action: action,
      p_note: note.trim(),
      p_expected_updated_at: record.updatedAt
    });
    if (error) throw error;
    if (!data || Array.isArray(data) || typeof data !== "object" || !data.id) {
      throw new Error("The decision response was unexpected. Refresh the request before continuing.");
    }
    decisionSaved = true;
    try {
      await Promise.all([loadRecords(), loadActivity(), loadActivity(record.dbId)]);
    } catch (error) {
      refreshFailure = error.message || "Could not refresh the saved decision.";
      workflowRefreshError = `Decision saved successfully, but records could not be refreshed (${refreshFailure}). Use Refresh all; do not repeat the decision.`;
    }
  } catch (error) {
    showMutationError($("#decisionErr"), error);
  } finally {
    busy = false;
    lockMutations(false);
  }
  if (decisionSaved) {
    toast(action === "book" ? "Request marked booked" : action === "approve" ? "Request approved" : "Request rejected");
    render();
  }
}

async function deleteRecord() {
  const module = mod();
  const record = rows().find(row => row.dbId === S.edit.id);
  if (!record) return;
  if (module.id === "travel" && (!workflowReady || !FlowGuardTravelWorkflow.canEdit(record, currentUser.id) || busy)) return;
  busy = true;
  lockMutations(true);
  try {
    let deletion = supabaseClient.from(tableFor(module.id)).delete().eq("id", record.dbId);
    if (module.id === "travel") deletion = deletion.eq("updated_at", record.updatedAt);
    const {data, error} = await deletion.select(module.id === "travel" ? "id, updated_at" : "id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("This record changed elsewhere or is no longer available. Refresh records and activity before trying again.");
  } catch (error) {
    showMutationError($("#err"), error);
    return;
  } finally {
    busy = false;
    lockMutations(false);
  }
  DB[module.id] = rows().filter(row => row.dbId !== record.dbId);
  S.edit = null;
  S.drawerFocused = false;
  drawerDraft = null;
  toast("Deleted");
  render();
  try {
    await loadRecords();
    if (module.id === "travel") await loadActivity();
    render();
  } catch (error) {
    if (module.id === "travel") {
      workflowRefreshError = `Deleted successfully, but the refreshed list could not be loaded (${error.message || "unknown error"}). Use Refresh all; do not resubmit.`;
      render();
    } else {
      toast("Deleted. The refreshed list is unavailable; reload to check the current records.");
    }
  }
}

initialize();