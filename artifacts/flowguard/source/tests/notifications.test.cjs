const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildNotifications,
  getUnreadNotifications,
} = require("../frontend/scripts/notifications-model.js");

const records = [
  {
    id: "request-1",
    owner_id: "employee-a",
    data: {status: "Requested", destination: "Kuala Lumpur", traveller: "Ari"},
  },
  {
    id: "request-2",
    owner_id: "employee-a",
    data: {status: "Approved", destination: "Penang"},
  },
  {
    id: "request-3",
    owner_id: "employee-b",
    data: {status: "Requested", destination: "Johor Bahru", traveller: "Bo"},
  },
  {
    id: "request-4",
    owner_id: "employee-a",
    data: {status: "Rejected", destination: "Ipoh"},
  },
];

test("employee notifications include only that employee's own travel statuses", () => {
  const notifications = buildNotifications(records, "employee", "employee-a");

  assert.deepEqual(
    notifications.map(({id, status}) => [id, status]),
    [
      ["request-1:requested", "Awaiting manager review"],
      ["request-2:approved", "Approved"],
      ["request-4:rejected", "Not approved"],
    ],
  );
});

test("manager notifications include only requests awaiting review", () => {
  const notifications = buildNotifications(records, "manager", "manager-id");

  assert.deepEqual(
    notifications.map(({id, title, href}) => [id, title, href]),
    [
      ["request-1:requested", "Kuala Lumpur", "travel.html?status=Requested"],
      ["request-3:requested", "Johor Bahru", "travel.html?status=Requested"],
    ],
  );
});

test("unread notifications exclude items already marked as read", () => {
  const notifications = buildNotifications(records, "employee", "employee-a");

  assert.deepEqual(
    getUnreadNotifications(notifications, new Set(["request-1:requested"]), true)
      .map(({id}) => id),
    ["request-2:approved", "request-4:rejected"],
  );
});

test("the initial notification baseline does not mark old records as unread", () => {
  const notifications = buildNotifications(records, "manager", "manager-id");
  assert.deepEqual(getUnreadNotifications(notifications, [], false), []);
});

test("each workspace page loads the shared notifications control", () => {
  const fs = require("node:fs");
  const path = require("node:path");

  for (const page of ["overview", "travel", "insights", "profile"]) {
    const html = fs.readFileSync(
      path.join(__dirname, "..", "frontend", `${page}.html`),
      "utf8",
    );
    assert.match(html, /class="notification-button"/, `${page}.html has the button`);
    assert.match(html, /scripts\/notifications-model\.js/, `${page}.html loads the model`);
    assert.match(html, /scripts\/notifications\.js/, `${page}.html loads the panel logic`);
  }
});
