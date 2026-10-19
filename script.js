const KEY = 'flowguard-v2';
const EMPTY = () => ({invoices: [], orders: [], audit: []});
let DB;
try { DB = JSON.parse(localStorage.getItem(KEY)) || EMPTY(); } catch (e) { DB = EMPTY(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} }

/* mode: null | {t:'inv', id} | {t:'new-inv'} | {t:'new-ord'} */
const S = {view: 'dashboard', mode: null, q: '', status: 'all', vendor: 'all'};
const STATUS = {needs_review: 'Needs review', changes_requested: 'Changes requested', approved: 'Approved', rejected: 'Rejected'};
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const money = n => new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(n);
const fdate = d => d ? new Date(d + 'T00:00').toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : '—';
const fstamp = t => new Date(t).toLocaleString('en-US', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
const chip = s => `<span class="chip c-${s}">${STATUS[s] || s}</span>`;
const inv = id => DB.invoices.find(i => i.id === id);
const ord = id => DB.orders.find(o => o.id === id);
const pending = () => DB.invoices.filter(i => i.status === 'needs_review');
const sameAmt = (a, b) => Math.abs(a - b) < 0.005;

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- system checks ---------- */
function runChecks(i) {
  const c = [];
  const missing = [];
  if (!i.vendor.trim()) missing.push('vendor');
  if (!i.date) missing.push('invoice date');
  if (!i.due) missing.push('due date');
  if (!(i.total > 0)) missing.push('total');
  c.push({ok: !missing.length, text: missing.length ? 'Missing or invalid: ' + missing.join(', ') : 'All required fields present'});

  const okDates = !i.date || !i.due || i.due >= i.date;
  c.push({ok: okDates, text: okDates ? 'Due date is on or after the invoice date' : 'Due date is before the invoice date'});

  const dup = DB.invoices.find(o => o.id !== i.id && o.vendor.trim().toLowerCase() === i.vendor.trim().toLowerCase() && sameAmt(o.total, i.total));
  c.push({ok: !dup, text: dup ? `Possible duplicate of ${dup.id} (same vendor and amount)` : 'No duplicates found'});

  if (!i.po) c.push({ok: false, text: 'No purchase order referenced'});
  else {
    const o = ord(i.po);
    if (!o) c.push({ok: false, text: `${i.po} is not in your orders`});
    else if (!sameAmt(o.total, i.total)) c.push({ok: false, text: `Total ${money(i.total)} differs from ${o.id} (${money(o.total)})`});
    else c.push({ok: true, text: `Matches ${o.id} (${money(o.total)})`});
  }
  return c;
}
const flagged = i => runChecks(i).filter(x => !x.ok).length;
function orderMatch(o) {
  const m = DB.invoices.find(i => i.po === o.id);
  if (!m) return {k: 'none', t: 'No invoice yet', inv: null};
  return sameAmt(m.total, o.total) ? {k: 'matched', t: 'Matched', inv: m} : {k: 'mismatch', t: 'Amount mismatch', inv: m};
}

/* ---------- views ---------- */
function viewDashboard() {
  const q = DB.invoices.filter(i => i.status === 'needs_review' || i.status === 'changes_requested');
  const stats = [
    [pending().length, 'Needs review'],
    [DB.invoices.filter(i => i.status === 'changes_requested').length, 'Requested changes'],
    [DB.invoices.filter(i => i.status === 'approved').length, 'Approved'],
    [DB.invoices.filter(i => i.status === 'needs_review' && flagged(i)).length, 'Flagged'],
    [money(q.reduce((s, i) => s + i.total, 0)), 'Total in queue']
  ];
  const attn = pending().sort((a, b) => flagged(b) - flagged(a)).slice(0, 5);
  const recent = DB.audit.slice(0, 6);
  return `
    <div class="stats">${stats.map(s => `<div class="stat"><b>${esc(s[0])}</b><span>${s[1]}</span></div>`).join('')}</div>
    <div class="grid2">
      <div class="card"><div class="card-h">Needs your attention</div>
        ${attn.length ? `<ul class="list">${attn.map(i => `<li data-open="${esc(i.id)}"><div><b>${esc(i.id)}</b><div class="sub">${esc(i.vendor)} · ${money(i.total)}</div></div>${flagged(i) ? `<span class="chip c-mismatch">${flagged(i)} flagged</span>` : `<span class="chip c-matched">Clean</span>`}</li>`).join('')}</ul>`
          : `<div class="empty">Nothing to review yet.<br>Add your first invoice to get started.<br><button class="run-btn" data-new="inv">+ New invoice</button></div>`}
      </div>
      <div class="card"><div class="card-h">Recent decisions</div>
        ${recent.length ? `<ul class="list">${recent.map(a => `<li><div><b>${esc(a.action)}</b> · ${esc(a.invoice)}<div class="sub">${esc(a.reason || 'No reason given')}</div></div><span class="sub">${fstamp(a.ts)}</span></li>`).join('')}</ul>`
          : `<div class="empty">No decisions recorded yet.</div>`}
      </div>
    </div>`;
}

function viewInvoices() {
  if (!DB.invoices.length) return `<div class="card"><div class="empty">No invoices yet.<br>Enter an invoice and FlowGuard will validate it, check for duplicates and match it to an order.<br><button class="run-btn" data-new="inv">+ New invoice</button></div></div>`;
  const vendors = [...new Set(DB.invoices.map(i => i.vendor))].sort();
  const q = S.q.trim().toLowerCase();
  const rows = DB.invoices.filter(i => (S.status === 'all' || i.status === S.status) && (S.vendor === 'all' || i.vendor === S.vendor) && (!q || (i.id + ' ' + i.vendor + ' ' + i.po).toLowerCase().includes(q)));
  return `
    <div class="toolbar">
      <input id="q" placeholder="Search invoices, vendors or PO numbers…" value="${esc(S.q)}">
      <select id="fStatus"><option value="all">All statuses</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${S.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select id="fVendor"><option value="all">All vendors</option>${vendors.map(v => `<option ${S.vendor === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>
    </div>
    <div class="card"><table>
      <thead><tr><th>Invoice</th><th>Vendor</th><th>Due date</th><th class="num">Total</th><th>Checks</th><th>Status</th></tr></thead>
      <tbody>${rows.map(i => { const f = flagged(i); return `<tr data-open="${esc(i.id)}" class="${S.mode && S.mode.id === i.id ? 'sel' : ''}"><td><b>${esc(i.id)}</b></td><td>${esc(i.vendor)}</td><td>${fdate(i.due)}</td><td class="num">${money(i.total)}</td><td>${f ? `<span class="chip c-mismatch">${f} flagged</span>` : `<span class="chip c-matched">Passed</span>`}</td><td>${chip(i.status)}</td></tr>`; }).join('')}</tbody>
    </table>${rows.length ? '' : '<div class="empty">No invoices match your filters.</div>'}</div>
    <p class="sub" style="margin-top:10px">Showing ${rows.length} of ${DB.invoices.length}</p>`;
}

function viewOrders() {
  if (!DB.orders.length) return `<div class="card"><div class="empty">No orders yet.<br>Add purchase orders so invoices can be matched against them.<br><button class="run-btn" data-new="ord">+ New order</button></div></div>`;
  return `<div class="card"><table>
    <thead><tr><th>Order</th><th>Vendor</th><th>Date</th><th class="num">Total</th><th>Status</th><th>Invoice match</th><th></th></tr></thead>
    <tbody>${DB.orders.map(o => { const m = orderMatch(o); return `<tr ${m.inv ? `data-open="${esc(m.inv.id)}"` : ''}><td><b>${esc(o.id)}</b></td><td>${esc(o.vendor)}</td><td>${fdate(o.date)}</td><td class="num">${money(o.total)}</td>
      <td><select data-ostatus="${esc(o.id)}">${['open', 'shipped', 'delivered'].map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select></td>
      <td><span class="chip c-${m.k}">${m.t}</span>${m.inv ? ` <span class="sub">${esc(m.inv.id)}</span>` : ''}</td>
      <td><button class="x-btn" data-delord="${esc(o.id)}" aria-label="Delete order">&times;</button></td></tr>`; }).join('')}</tbody>
  </table></div>`;
}

function viewAudit() {
  if (!DB.audit.length) return `<div class="card"><div class="empty">Every decision is saved here with its timestamp, reason and outcome.<br>Nothing recorded yet.</div></div>`;
  return `<div class="card"><table>
    <thead><tr><th>When</th><th>Invoice</th><th>Decision</th><th>Reason</th><th>Outcome</th></tr></thead>
    <tbody>${DB.audit.map(a => `<tr><td>${fstamp(a.ts)}</td><td><b>${esc(a.invoice)}</b></td><td>${esc(a.action)}<div class="sub">by ${esc(a.by)}</div></td><td>${esc(a.reason || '—')}</td><td>${esc(a.outcome)}</td></tr>`).join('')}</tbody>
  </table></div>`;
}

/* ---------- drawer ---------- */
const row = (label, html) => `<div class="field"><label>${label}</label>${html}</div>`;
function invoiceFields(i, lock, isNew) {
  const d = lock ? 'disabled' : '';
  const poOptions = `<datalist id="pos">${DB.orders.map(o => `<option value="${esc(o.id)}">${esc(o.vendor)}</option>`).join('')}</datalist>`;
  return row('Invoice no.', `<input data-f="id" value="${esc(i.id)}" placeholder="e.g. INV-0001" ${isNew ? '' : 'disabled'}>`)
    + row('Vendor', `<input data-f="vendor" value="${esc(i.vendor)}" placeholder="Vendor name" ${d}>`)
    + row('Invoice date', `<input data-f="date" type="date" value="${esc(i.date)}" ${d}>`)
    + row('Due date', `<input data-f="due" type="date" value="${esc(i.due)}" ${d}>`)
    + row('Total (USD)', `<input data-f="total" type="number" step="0.01" min="0" value="${i.total || ''}" placeholder="0.00" ${d}>`)
    + row('Purchase order', `<input data-f="po" list="pos" value="${esc(i.po)}" placeholder="optional" ${d}>`) + poOptions;
}

function renderDrawer() {
  const el = $('#drawer'), m = S.mode;
  if (!m) { el.classList.remove('open'); el.innerHTML = ''; return; }

  if (m.t === 'new-inv') {
    el.innerHTML = `<div class="d-head"><h2>New invoice</h2><button class="x-btn" data-close aria-label="Close">&times;</button></div>
      <div class="d-body">${invoiceFields({id: '', vendor: '', date: '', due: '', total: 0, po: ''}, false, true)}<div class="err" id="err"></div></div>
      <div class="d-foot"><button class="btn-ghost" data-close>Cancel</button><button class="run-btn" data-save="inv">Add &amp; run checks</button></div>`;
  } else if (m.t === 'new-ord') {
    el.innerHTML = `<div class="d-head"><h2>New order</h2><button class="x-btn" data-close aria-label="Close">&times;</button></div>
      <div class="d-body">
        ${row('Order no.', '<input data-o="id" placeholder="e.g. PO-1001">')}
        ${row('Vendor', '<input data-o="vendor" placeholder="Vendor name">')}
        ${row('Order date', '<input data-o="date" type="date">')}
        ${row('Total (USD)', '<input data-o="total" type="number" step="0.01" min="0" placeholder="0.00">')}
        ${row('Status', '<select data-o="status"><option value="open">Open</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select>')}
        <div class="err" id="err"></div></div>
      <div class="d-foot"><button class="btn-ghost" data-close>Cancel</button><button class="run-btn" data-save="ord">Add order</button></div>`;
  } else {
    const i = inv(m.id); if (!i) { S.mode = null; return renderDrawer(); }
    const checks = runChecks(i), f = checks.filter(c => !c.ok).length;
    const done = i.status === 'approved' || i.status === 'rejected';
    el.innerHTML = `<div class="d-head"><div><h2>${esc(i.id)}</h2>${chip(i.status)}</div><button class="x-btn" data-close aria-label="Close">&times;</button></div>
      <div class="d-body">
        <div class="note ${f ? '' : 'good'}">${f ? `${f} check${f > 1 ? 's' : ''} flagged. Review before deciding.` : 'All system checks passed.'}</div>
        <div class="sec">Invoice details</div>${invoiceFields(i, done, false)}
        <div class="sec">System checks</div>
        <ul class="checks">${checks.map(c => `<li><span class="ck ${c.ok ? 'ok' : 'bad'}">${c.ok ? '✓' : '!'}</span>${esc(c.text)}</li>`).join('')}</ul>
        ${done ? `<p class="sub" style="margin-top:12px">Decision recorded. See the Audit log.</p>` : `<div class="sec">Reason (required to reject or request changes)</div><textarea id="reason" placeholder="Why this decision?"></textarea><div class="err" id="err"></div>`}
      </div>
      <div class="d-foot">${done ? `<button class="btn-ghost" data-delinv="${esc(i.id)}">Delete</button>` : `<button class="btn-ghost" data-act="rejected">Reject</button><button class="btn-ghost" data-act="changes_requested">Request changes</button><button class="run-btn" data-act="approved">Approve</button>`}</div>`;
  }
  el.classList.add('open');
}

function readForm(attr) {
  const o = {};
  document.querySelectorAll(`#drawer [${attr}]`).forEach(x => { o[x.getAttribute(attr)] = x.value; });
  return o;
}
const setErr = t => { $('#err').textContent = t; };

function saveInvoice() {
  const v = readForm('data-f');
  const id = (v.id || '').trim();
  if (!id) return setErr('Enter an invoice number.');
  if (inv(id)) return setErr(`${id} already exists.`);
  if (!v.vendor.trim()) return setErr('Enter the vendor name.');
  if (!v.date || !v.due) return setErr('Enter the invoice and due dates.');
  if (!(parseFloat(v.total) > 0)) return setErr('Enter a total above zero.');
  DB.invoices.unshift({id, vendor: v.vendor.trim(), date: v.date, due: v.due, total: parseFloat(v.total), po: (v.po || '').trim(), status: 'needs_review'});
  save(); toast(`${id} added`); S.view = 'invoices'; S.mode = {t: 'inv', id}; render();
}
function saveOrder() {
  const v = readForm('data-o');
  const id = (v.id || '').trim();
  if (!id) return setErr('Enter an order number.');
  if (ord(id)) return setErr(`${id} already exists.`);
  if (!v.vendor.trim()) return setErr('Enter the vendor name.');
  if (!v.date) return setErr('Enter the order date.');
  if (!(parseFloat(v.total) > 0)) return setErr('Enter a total above zero.');
  DB.orders.unshift({id, vendor: v.vendor.trim(), date: v.date, total: parseFloat(v.total), status: v.status});
  save(); toast(`${id} added`); S.view = 'orders'; S.mode = null; render();
}
function decide(act) {
  const i = inv(S.mode.id); if (!i) return;
  const reason = $('#reason').value.trim();
  if (act !== 'approved' && !reason) { setErr('Please add a reason first.'); $('#reason').focus(); return; }
  const v = readForm('data-f');
  if (v.vendor !== undefined) { i.vendor = v.vendor.trim() || i.vendor; i.date = v.date || i.date; i.due = v.due || i.due; i.total = parseFloat(v.total) > 0 ? parseFloat(v.total) : i.total; i.po = (v.po || '').trim(); }
  i.status = act;
  const label = {approved: 'Approved', rejected: 'Rejected', changes_requested: 'Requested changes'}[act];
  const outcome = {approved: 'Approved for payment', rejected: 'Rejected, will not be paid', changes_requested: 'Sent back to vendor for corrections'}[act];
  DB.audit.unshift({ts: Date.now(), invoice: i.id, action: label, reason, outcome, by: 'Owner'});
  save(); toast(`${i.id}: ${label.toLowerCase()}`); S.mode = null; render();
}

/* ---------- render + events ---------- */
const TITLES = {dashboard: 'Dashboard', invoices: 'Invoices', orders: 'Orders', audit: 'Audit log'};
function render() {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === S.view));
  $('#title').textContent = TITLES[S.view];
  const n = pending().length; $('#navCount').textContent = n; $('#navCount').hidden = !n;
  $('#barActions').innerHTML = S.view === 'orders' ? '<button class="run-btn" data-new="ord">+ New order</button>'
    : S.view === 'audit' ? '' : '<button class="run-btn" data-new="inv">+ New invoice</button>';
  $('#content').innerHTML = {dashboard: viewDashboard, invoices: viewInvoices, orders: viewOrders, audit: viewAudit}[S.view]();
  renderDrawer();
}

document.addEventListener('click', e => {
  const t = e.target;
  let x;
  if ((x = t.closest('.nav-btn'))) { S.view = x.dataset.view; S.mode = null; return render(); }
  if ((x = t.closest('[data-new]'))) { S.mode = {t: x.dataset.new === 'inv' ? 'new-inv' : 'new-ord'}; return render(); }
  if (t.closest('[data-close]')) { S.mode = null; return render(); }
  if ((x = t.closest('[data-save]'))) return x.dataset.save === 'inv' ? saveInvoice() : saveOrder();
  if ((x = t.closest('[data-act]'))) return decide(x.dataset.act);
  if ((x = t.closest('[data-delord]'))) { DB.orders = DB.orders.filter(o => o.id !== x.dataset.delord); save(); toast('Order deleted'); return render(); }
  if ((x = t.closest('[data-delinv]'))) { DB.invoices = DB.invoices.filter(i => i.id !== x.dataset.delinv); save(); S.mode = null; toast('Invoice deleted'); return render(); }
  if (t.closest('select')) return;
  if ((x = t.closest('[data-open]'))) { S.mode = {t: 'inv', id: x.dataset.open}; if (S.view !== 'invoices') S.view = 'invoices'; return render(); }
  if (t.id === 'clearBtn' && confirm('Delete all invoices, orders and the audit log?')) { DB = EMPTY(); save(); S.mode = null; render(); toast('All data cleared'); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') { S.q = e.target.value; const p = e.target.selectionStart; render(); const q = $('#q'); q.focus(); q.setSelectionRange(p, p); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'fStatus') { S.status = t.value; render(); }
  if (t.id === 'fVendor') { S.vendor = t.value; render(); }
  if (t.dataset.ostatus) { const o = ord(t.dataset.ostatus); if (o) { o.status = t.value; save(); } }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.mode) { S.mode = null; render(); } });

render();