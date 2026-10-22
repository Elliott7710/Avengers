(function (root, factory) {
  const model = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = model;
  }
  if (root) {
    root.FlowGuardNotificationsModel = model;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const STATUS_LABELS = {
    requested: "Awaiting manager review",
    approved: "Approved",
    booked: "Booked",
    rejected: "Not approved",
  };

  function buildNotifications(records, role, userId) {
    const normalizedRole = String(role || "").toLowerCase().trim();
    if (!Array.isArray(records) || !["employee", "manager"].includes(normalizedRole)) {
      return [];
    }

    return records.flatMap((record) => {
      const data = record?.data && typeof record.data === "object" ? record.data : {};
      const status = String(data.status || "").toLowerCase().trim();
      const recordId = String(record?.id || record?.record_id || "");
      if (!recordId) return [];

      if (normalizedRole === "manager") {
        if (status !== "requested") return [];
        const traveller = String(data.traveller || "Team member");
        const destination = String(data.destination || "Travel request");
        return [{
          id: `${recordId}:requested`,
          title: destination,
          description: `${traveller} · Awaiting manager review`,
          status: "Needs review",
          href: "travel.html?status=Requested",
        }];
      }

      if (record?.owner_id !== userId || !STATUS_LABELS[status]) return [];
      const href = `travel.html?status=${encodeURIComponent(
        status.charAt(0).toUpperCase() + status.slice(1),
      )}`;
      return [{
        id: `${recordId}:${status}`,
        title: String(data.destination || data.traveller || "Travel request"),
        description: STATUS_LABELS[status],
        status: STATUS_LABELS[status],
        href,
      }];
    });
  }

  function getUnreadNotifications(items, readIds, initialized) {
    if (!initialized || !Array.isArray(items)) return [];
    const read = readIds instanceof Set ? readIds : new Set(readIds || []);
    return items.filter((item) => !read.has(item.id));
  }

  return {buildNotifications, getUnreadNotifications};
});
