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
      {label: "Estimated spend", fn: r => money(sum(r, "cost"))}
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

const KEY = "flowguard-modules-v1";
let DB;
try { DB = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { DB = {}; }
MODULES.forEach(m => { if (!Array.isArray(DB[m.id])) DB[m.id] = []; });
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} };

const S = {mod: document.body.dataset.page, q: "", filter: "all", edit: null};
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const sum = (rows, k) => rows.reduce((t, r) => t + (parseFloat(r[k]) || 0), 0);
const money = n => new Intl.NumberFormat("en-US", {style: "currency", currency: CURRENCY}).format(n);
const fdate = d => d ? new Date(d + "T00:00").toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"}) : "—";
const mod = () => MODULES.find(m => m.id === S.mod);
const rows = () => DB[S.mod];

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
  if (col.type === "money") return money(parseFloat(v));
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
  $("#toolbar").innerHTML = all.length ? `
    <input id="q" placeholder="Search ${esc(m.label.toLowerCase())}…" value="${esc(S.q)}">
    ${f ? `<select id="filter"><option value="all">All ${esc(f.label.toLowerCase())}</option>${f.options.map(o => `<option ${S.filter === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>` : ""}` : "";

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
      <tbody>${shown.map(r => `<tr data-open="${esc(r.id)}">${m.columns.map(c => `<td class="${c.type === "money" ? "num" : ""}">${cell(c, r)}</td>`).join("")}</tr>`).join("")}</tbody>
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
  const rec = S.edit.id ? rows().find(r => r.id === S.edit.id) : null;
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

function saveRecord() {
  const m = mod(), vals = {};
  for (const f of m.fields) {
    const raw = document.querySelector(`#drawer [data-k="${f.key}"]`).value.trim();
    if (f.required && !raw) return ($("#err").textContent = `${f.label} is required.`);
    if (f.type === "number" && raw !== "" && !(parseFloat(raw) >= 0)) return ($("#err").textContent = `${f.label} must be a number.`);
    vals[f.key] = f.type === "number" && raw !== "" ? parseFloat(raw) : raw;
  }
  const rec = S.edit.id ? rows().find(r => r.id === S.edit.id) : null;
  if (rec) Object.assign(rec, vals);
  else DB[m.id].unshift({id: nextId(m), ...vals});
  save();
  toast(rec ? "Changes saved" : `${m.label}: ${m.singular} added`);
  S.edit = null;
  render();
}

function render() { renderPage(); renderDrawer(); }

/* ---------- events ---------- */

document.addEventListener("click", e => {
  const t = e.target;
  let x;
  if (t.closest("#newBtn") || t.closest("[data-new]")) { S.edit = {id: null}; return render(); }
  if (t.closest("[data-close]")) { S.edit = null; return render(); }
  if (t.closest("[data-save]")) return saveRecord();
  if (t.closest("[data-delete]")) {
    if (confirm("Delete this record?")) { DB[S.mod] = rows().filter(r => r.id !== S.edit.id); save(); S.edit = null; toast("Deleted"); render(); }
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

render();