(function attachCalculations(root, factory) {
  const calculations = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = calculations;
  } else {
    root.FlowGuardCalculations = calculations;
  }
})(typeof globalThis === "object" ? globalThis : this, function createCalculations() {
  const estimatedSpendStatuses = new Set(["Requested", "Approved", "Booked"]);

  function sumEstimatedSpend(rows) {
    const totalCents = rows.reduce((sum, row) => {
      if (!estimatedSpendStatuses.has(row.status)) return sum;

      if (row.cost === null || row.cost === undefined || (typeof row.cost === "string" && !row.cost.trim())) {
        throw new TypeError("An active travel request has no cost.");
      }
      const cost = Number(row.cost);
      if (!Number.isFinite(cost) || cost < 0) {
        throw new TypeError("An active travel request has an invalid cost.");
      }

      const cents = Math.round((cost + Number.EPSILON) * 100);
      if (!Number.isSafeInteger(cents) || !Number.isSafeInteger(sum + cents)) {
        throw new RangeError("Estimated spend exceeds the supported currency range.");
      }
      return sum + cents;
    }, 0);

    return totalCents / 100;
  }

  return {sumEstimatedSpend};
});
