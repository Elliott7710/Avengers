const STORAGE_KEY = "flowguard-modules-v1";
const statusChoices = ["Requested", "Approved", "Booked", "Rejected"];
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
})[char]);

const statsElement = document.querySelector("#admin-stats");
const tableElement = document.querySelector("#admin-table");
const messageElement = document.querySelector("#admin-message");
const filterElement = document.querySelector("#admin-filter");
const searchElement = document.querySelector("#admin-search");
let requests = [];

function loadRequests() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    requests = Array.isArray(saved.travel) ? saved.travel : [];
  } catch (error) {
    console.error("Unable to read saved travel requests:", error);
    messageElement.textContent = "Travel requests could not be read from this browser's storage.";
    return false;
  }
  return true;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function render() {
  const pendingCount = requests.filter(request => (request.status || "Requested") === "Requested").length;
  const approvedCount = requests.filter(request => ["Approved", "Booked"].includes(request.status)).length;
  const rejectedCount = requests.filter(request => request.status === "Rejected").length;
  statsElement.innerHTML = [
    ["All requests", requests.length],
    ["Awaiting review", pendingCount],
    ["Approved / booked", approvedCount],
    ["Rejected", rejectedCount]
  ].map(([label, count]) => `<div class="stat"><b>${count}</b><span>${label}</span></div>`).join("");

  const query = searchElement.value.trim().toLowerCase();
  const status = filterElement.value;
  const shown = requests.filter(request => {
    const requestStatus = request.status || "Requested";
    const searchable = [
      request.id,
      request.traveller,
      request.country,
      request.city || request.destination,
      request.purpose
    ].join(" ").toLowerCase();
    return (status === "all" || requestStatus === status) && (!query || searchable.includes(query));
  });

  if (!shown.length) {
    tableElement.innerHTML = '<div class="card"><div class="empty">No travel requests match this view.</div></div>';
    return;
  }

  tableElement.innerHTML = `
    <div class="card admin-table-wrap"><table>
      <thead><tr><th>Request</th><th>Traveller</th><th>Destination</th><th>Dates</th><th>Estimated cost</th><th>Status</th><th>Review</th></tr></thead>
      <tbody>${shown.map(request => {
        const currentStatus = request.status || "Requested";
        const destination = [request.city || request.destination, request.country].filter(Boolean).join(", ");
        const actions = currentStatus === "Requested"
          ? `<button type="button" class="run-btn admin-action" data-status="Approved" data-request="${escapeHtml(request.id)}">Approve</button><button type="button" class="btn-ghost admin-action" data-status="Rejected" data-request="${escapeHtml(request.id)}">Reject</button>`
          : `<select class="admin-status" data-request="${escapeHtml(request.id)}" aria-label="Update status for ${escapeHtml(request.id)}">${statusChoices.map(choice => `<option value="${choice}" ${choice === currentStatus ? "selected" : ""}>${choice}</option>`).join("")}</select>`;
        return `<tr>
          <td><strong>${escapeHtml(request.id)}</strong><div class="admin-purpose">${escapeHtml(request.purpose || "No purpose provided")}</div></td>
          <td>${escapeHtml(request.traveller || "—")}</td>
          <td>${escapeHtml(destination || "—")}</td>
          <td>${escapeHtml(formatDate(request.start))}<div class="admin-purpose">to ${escapeHtml(formatDate(request.end))}</div></td>
          <td>${escapeHtml(new Intl.NumberFormat("en-US", {style: "currency", currency: "MYR"}).format(Number(request.cost) || 0))}</td>
          <td><span class="chip c-${escapeHtml(currentStatus.toLowerCase())}">${escapeHtml(currentStatus)}</span></td>
          <td><div class="admin-actions">${actions}</div></td>
        </tr>`;
      }).join("")}</tbody>
    </table></div><p class="sub">Showing ${shown.length} of ${requests.length} requests</p>`;
}

function saveStatus(requestId, status) {
  const request = requests.find(item => item.id === requestId);
  if (!request || !statusChoices.includes(status)) return;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const storedRequests = Array.isArray(saved.travel) ? saved.travel : [];
    const storedRequest = storedRequests.find(item => item.id === requestId);
    if (!storedRequest) {
      messageElement.textContent = "This request is no longer in browser storage. Refresh and try again.";
      return;
    }
    storedRequest.status = status;
    saved.travel = storedRequests;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    request.status = status;
    messageElement.textContent = `Request ${requestId} marked ${status.toLowerCase()}.`;
    render();
  } catch (error) {
    console.error("Unable to update travel request status:", error);
    messageElement.textContent = "The request status could not be saved.";
  }
}

filterElement.addEventListener("change", render);
searchElement.addEventListener("input", render);
tableElement.addEventListener("click", event => {
  const button = event.target.closest("[data-status][data-request]");
  if (button) saveStatus(button.dataset.request, button.dataset.status);
});
tableElement.addEventListener("change", event => {
  const select = event.target.closest(".admin-status[data-request]");
  if (select) saveStatus(select.dataset.request, select.value);
});

if (loadRequests()) {
  messageElement.textContent = "Prototype inbox: requests are saved only in this browser. Admin access is not yet role-protected; do not use this page for real approvals.";
  render();
}
