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
      {key: "status", label: "Status", type: "select", options: ["Requested", "Approved", "Booked", "Rejected"]},
      {key: "purpose", label: "Purpose", type: "textarea", placeholder: "Why is this trip needed?"}
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
const TABLES = {travel: "flowguard_travel_records", insights: "flowguard_insight_records"};
const DB = {travel: [], insights: []};
let currentUser;
let currentRole;
let ready = false;
let migrationNotice = "";
const pageModule = MODULES.find(module => module.id === document.body.dataset.page);
const requestedFilter = new URLSearchParams(window.location.search).get("status");
const initialFilter = pageModule?.filter === "status" &&
  pageModule.fields.find(field => field.key === pageModule.filter)?.options.includes(requestedFilter)
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

  for (const module of MODULES) {
    const oldRecords = data[module.id] || [];
    if (!oldRecords.length) continue;

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
      const recordId = typeof oldRecord.id === "string" && oldRecord.id.trim()
        ? oldRecord.id.trim()
        : `${module.prefix}-LEGACY-${String(index + 1).padStart(3, "0")}`;
      const recordData = {...oldRecord};
      delete recordData.id;
      delete recordData.dbId;
      delete recordData.ownerId;

      if (existingById.has(recordId)) {
        if (canonicalJson(existingById.get(recordId)) !== canonicalJson(recordData)) {
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
  localStorage.setItem(MIGRATION_USER_KEY, currentUser.id);
}

async function loadRecords() {
  for (const module of MODULES) {
    const {data, error} = await supabaseClient
      .from(tableFor(module.id))
      .select("id, owner_id, record_id, data")
      .order("created_at", {ascending: false});
    if (error) throw new Error(`Could not load ${module.label.toLowerCase()} records: ${error.message}`);
    DB[module.id] = (data || []).map(record => ({
      ...(record.data || {}),
      id: record.record_id,
      dbId: record.id,
      ownerId: record.owner_id
    }));
  }
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

    try {
      await migrateLegacyData();
    } catch (error) {
      console.error("Legacy record migration error:", error);
      migrationNotice = error.message || "Older browser records could not be imported and remain on this device.";
    }
    await loadRecords();
    ready = true;
    $("#newBtn").disabled = false;
    render();
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
  const controls = all.length ? `
    <input id="q" placeholder="Search ${esc(m.label.toLowerCase())}…" value="${esc(S.q)}">
    ${f ? `<select id="filter"><option value="all">All ${esc(f.label.toLowerCase())}</option>${f.options.map(o => `<option ${S.filter === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>` : ""}` : "";
  $("#toolbar").innerHTML = `${migrationNotice ? `<p class="sub">${esc(migrationNotice)}</p>` : ""}${controls}`;

  if (!all.length) {
    $("#table").innerHTML = `<div class="card"><div class="empty">No ${esc(m.label.toLowerCase())} ${esc(m.singular)}s yet.<br>Add your first one to get started.<br><button type="button" class="run-btn" data-new>+ New ${esc(m.singular)}</button></div></div>`;
    return;
  }

  const q = S.q.trim().toLowerCase();
  const shown = all.filter(r =>
    (!f || S.filter === "all" || r[f.key] === S.filter) &&
    (!q || Object.values(r).join(" ").toLowerCase().includes(q)));

  $("#table").innerHTML = `
    <div class="card"><table>
      <thead><tr>${m.columns.map(c => `<th class="${c.type === "money" ? "num" : ""}">${esc(c.label)}</th>`).join("")}</tr></thead>
      <tbody>${shown.map(r => `<tr data-open="${esc(r.dbId)}">${m.columns.map(c => `<td class="${c.type === "money" ? "num" : ""}">${cell(c, r)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>${shown.length ? "" : '<div class="empty">Nothing matches your search.</div>'}</div>
    <p class="sub">Showing ${shown.length} of ${all.length}</p>`;
}

/* ---------- drawer form ---------- */

function inputFor(f, value) {
  const v = value ?? "";
  const common = `data-k="${f.key}" ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""}`;
  if (f.type === "textarea") return `<textarea ${common}>${esc(v)}</textarea>`;
  if (f.type === "select") return `<select ${common}>${f.options.map(o => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  return `<input ${common} type="${f.type}" ${f.type === "number" ? 'step="0.01" min="0"' : ""} value="${esc(v)}">`;
}

function renderDrawer() {
  const el = $("#drawer");
  if (!S.edit) { el.classList.remove("open"); el.innerHTML = ""; return; }
  const m = mod();
  const rec = S.edit.id ? rows().find(r => r.dbId === S.edit.id) : null;
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
  const first = el.querySelector("input, select, textarea");
  if (first && !rec) first.focus();
}

async function saveRecord() {
  const m = mod(), vals = {};
  for (const f of m.fields) {
    const raw = document.querySelector(`#drawer [data-k="${f.key}"]`).value.trim();
    if (f.required && !raw) return ($("#err").textContent = `${f.label} is required.`);
    if (f.type === "number" && raw !== "") {
      const amount = Number(raw);
      if (!Number.isFinite(amount) || amount < 0) return ($("#err").textContent = `${f.label} must be a non-negative number.`);
      vals[f.key] = amount;
    } else {
      vals[f.key] = raw;
    }
  }
  const rec = S.edit.id ? rows().find(r => r.dbId === S.edit.id) : null;
  try {
    if (rec) {
      const {data, error} = await supabaseClient
        .from(tableFor(m.id))
        .update({data: vals})
        .eq("id", rec.dbId)
        .select("id, owner_id, record_id, data")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("This record is no longer available to your account.");
      Object.assign(rec, data.data || {}, {id: data.record_id, dbId: data.id, ownerId: data.owner_id});
    } else {
      const {data, error} = await supabaseClient
        .from(tableFor(m.id))
        .insert({owner_id: currentUser.id, record_id: nextId(m), data: vals})
        .select("id, owner_id, record_id, data")
        .single();
      if (error) throw error;
      DB[m.id].unshift({...data.data, id: data.record_id, dbId: data.id, ownerId: data.owner_id});
    }
  } catch (error) {
    $("#err").textContent = error.message || "The record could not be saved.";
    return;
  }
  toast(rec ? "Changes saved" : `${m.label}: ${m.singular} added`);
  S.edit = null;
  render();
}

function render() { renderPage(); renderDrawer(); }

/* ---------- events ---------- */

document.addEventListener("click", e => {
  const t = e.target;
  let x;
  if ((t.closest("#newBtn") || t.closest("[data-new]")) && ready) { S.edit = {id: null}; return render(); }
  if (t.closest("[data-retry]")) return initialize();
  if (t.closest("[data-close]")) { S.edit = null; return render(); }
  if (t.closest("[data-save]")) return saveRecord();
  if (t.closest("[data-delete]")) {
    if (confirm("Delete this record?")) deleteRecord();
    return;
  }
  if ((x = t.closest("[data-open]"))) { S.edit = {id: x.dataset.open}; return render(); }
});

document.addEventListener("input", e => {
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
  if (e.key === "Escape" && S.edit) { S.edit = null; render(); }
});

async function deleteRecord() {
  const module = mod();
  const record = rows().find(row => row.dbId === S.edit.id);
  if (!record) return;
  try {
    const {data, error} = await supabaseClient
      .from(tableFor(module.id))
      .delete()
      .eq("id", record.dbId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("This record is no longer available to your account.");
    DB[module.id] = rows().filter(row => row.dbId !== record.dbId);
    S.edit = null;
    toast("Deleted");
    render();
  } catch (error) {
    $("#err").textContent = error.message || "The record could not be deleted.";
  }
}

initialize();