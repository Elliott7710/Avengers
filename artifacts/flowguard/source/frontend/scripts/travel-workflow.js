(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FlowGuardTravelWorkflow = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  // Demo policy v1. Keep this threshold aligned with travel_workflow.sql.
  const BUDGET_THRESHOLD = 1000;
  function validateTravel(data) {
    for (const key of ["traveller", "destination", "start", "end", "purpose"]) {
      if (typeof data[key] !== "string" || !data[key].trim()) {
        throw new Error(`${key === "start" ? "Departure" : key === "end" ? "Return" : key[0].toUpperCase() + key.slice(1)} is required.`);
      }
    }
    for (const key of ["start", "end"]) {
      const value = data[key];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-") || !Number.isFinite(Date.parse(value + "T00:00:00Z")) ||
          new Date(value + "T00:00:00Z").toISOString().slice(0, 10) !== value) {
        throw new Error("Enter valid departure and return dates.");
      }
    }
    if (data.end < data.start) throw new Error("Return date cannot be before departure.");
    const cost = data.cost;
    if (!["number", "string"].includes(typeof cost) ||
        !/^\d+(\.\d{1,2})?$/.test(String(cost)) ||
        !Number.isFinite(Number(cost)) || Number(cost) < 0 ||
        Number(cost) > 999999999.99 ||
        Math.abs(Number(cost) * 100 - Math.round(Number(cost) * 100)) > 0.00001) {
      throw new Error("Estimated cost must be a non-negative amount with at most two decimal places (maximum MYR 999,999,999.99).");
    }
    return true;
  }
  function evaluateRule(data) {
    validateTravel(data);
    const high = Number(data.cost) > BUDGET_THRESHOLD;
    return {
      code: high ? "high_budget" : "standard",
      label: high ? "Over demo budget — manager review required" : "Within demo budget — manager approval required",
      threshold: BUDGET_THRESHOLD
    };
  }
  function availableActions(record, role, userId) {
    if (!record || role !== "manager" || record.ownerId === userId) return [];
    if (record.status === "Requested") return ["approve", "reject"];
    if (record.status === "Approved") return ["book"];
    return [];
  }
  function canEdit(record, userId) {
    return !record || (record.ownerId === userId && record.status === "Requested");
  }
  function assertDecision(record, action, role, userId, note) {
    if (!availableActions(record, role, userId).includes(action)) {
      throw new Error("This action is not allowed. Refresh the request; only another manager can decide or book it.");
    }
    if (typeof note !== "string" || !note.trim()) throw new Error("A decision or booking note is required.");
    if (note.trim().length > 1000) throw new Error("Keep the note to 1,000 characters or fewer.");
    return {approve: "Approved", reject: "Rejected", book: "Booked"}[action];
  }
  return {BUDGET_THRESHOLD, validateTravel, evaluateRule, availableActions, canEdit, assertDecision};
});
