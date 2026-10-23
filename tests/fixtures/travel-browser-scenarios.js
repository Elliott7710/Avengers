(async function () {
  const results = [];
  const assert = (condition, label) => { if (!condition) throw new Error(label); results.push(label); };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function until(predicate, label) {
    for (let i = 0; i < 120; i++) {
      if (predicate()) return;
      await delay(20);
    }
    throw new Error(`Timed out: ${label}`);
  }
  const click = selector => {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Missing control: ${selector}`);
    el.click();
  };
  const fill = (key, value) => {
    const el = document.querySelector(`#drawer [data-k="${key}"]`);
    if (!el) throw new Error(`Missing field ${key}`);
    el.value = value;
    el.dispatchEvent(new Event("input", {bubbles: true}));
  };
  async function session(id, role) {
    S.edit = null;
    testSession = {id, role};
    window.FlowGuardData.clear(); // Simulate the SDK's auth-state change.
    await initialize();
    await delay(60);
  }
  async function addTravel(cost = "1500") {
    click("#newBtn");
    fill("traveller", "Synthetic Employee");
    fill("destination", "Demo City");
    fill("start", "2026-11-02");
    fill("end", "2026-11-04");
    fill("cost", cost);
    fill("purpose", "Synthetic client review");
    assert(!document.querySelector('[data-k="status"]'), "No employee-selectable status");
    assert(document.querySelector("#rulePreview").textContent.includes("manager"), "Live review preview");
    click("[data-save]");
    await until(() => !busy && !S.edit, "save travel");
    return testStore.flowguard_travel_records[0];
  }
  function open(record) { click(`[data-open="${record.id}"]`); }
  try {
    await until(() => ready, "initialization");
    const first = await addTravel();
    assert(first.data.status === "Requested", "Submission starts Requested");
    open(first);
    fill("cost", "1000");
    await delay(80);
    assert(document.querySelector('[data-k="cost"]').value === "1000", "History load preserves edit draft");
    click("[data-save]");
    await until(() => !busy && !S.edit, "edit travel");
    assert(first.data.rule_code === "standard", "Edit recalculates review flag");
    assert(!document.querySelector("[data-decision]"), "Employee has no decision control");

    await session("manager-b", "manager");
    open(first);
    click('[data-decision="approve"]');
    assert(document.querySelector("#decisionErr").textContent.includes("required"), "Empty decision note blocked");
    document.querySelector("#decisionNote").value = "Reviewed demo request";
    await delay(80);
    assert(document.querySelector("#decisionNote").value === "Reviewed demo request", "History load preserves decision note");
    click('[data-decision="approve"]');
    // Second click must not send another mutation while the first is pending.
    decideTravel("approve");
    await until(() => !busy && first.data.status === "Approved", "manager approval");
    assert(testDecisions === 1, "Double approval submit blocked");
    assert(document.querySelector('[data-decision="book"]'), "Approved request offers booking");
    document.querySelector("#decisionNote").value = "Synthetic confirmation only";
    click('[data-decision="book"]');
    await until(() => !busy && first.data.status === "Booked", "booking");
    assert(!document.querySelector("[data-save]"), "Booked request is read-only");
    assert(document.querySelector("#drawer").textContent.includes("Synthetic confirmation only"), "Decision note visible");

    await session("employee-a", "employee");
    open(first);
    assert(!document.querySelector("[data-save]") && !document.querySelector("[data-delete]"), "Employee final-state edit/delete hidden");
    await delay(60);
    assert(document.querySelector(".drawer-history").textContent.includes("approved"), "Employee sees approval history");
    click("[data-close]");
    const rejected = await addTravel("200");
    await session("manager-b", "manager");
    open(rejected);
    document.querySelector("#decisionNote").value = "Not needed for this demo";
    click('[data-decision="reject"]');
    await until(() => !busy && rejected.data.status === "Rejected", "rejection");
    assert(!document.querySelector("[data-decision]"), "Rejected request is closed");

    await session("employee-a", "employee");
    const pending = await addTravel("50");
    open(pending);
    click("[data-delete]");
    await until(() => !busy && !S.edit, "pending delete");
    assert(!testStore.flowguard_travel_records.includes(pending), "Pending request deleted");
    assert(testStore.flowguard_travel_activity.some(event => event.travel_id === pending.id && event.action === "deleted"), "Deletion history retained");
    await session("employee-other", "employee");
    assert(DB.travel.length === 0, "Other employee has no unrelated requests");
    await session("manager-b", "manager");
    const own = await addTravel("300");
    open(own);
    assert(!document.querySelector("[data-decision]"), "Manager cannot self-approve");
    click("[data-close]");

    testWorkflowInstalled = false;
    await initialize();
    assert(document.querySelector("#newBtn").disabled, "Missing migration disables travel writes");
    assert(document.querySelector(".setup-notice"), "Missing migration shows setup guidance");
    S.mod = "insights";
    await session("employee-a", "employee");
    click("#newBtn");
    fill("team", "Developers");
    fill("name", "Synthetic Team");
    fill("period", "2026-11-02");
    fill("metric", "Demo response time");
    fill("value", "5");
    fill("note", "Synthetic coaching note");
    click("[data-save]");
    await until(() => !busy && !S.edit, "insights create");
    const insight = testStore.flowguard_insight_records[0];
    open(insight);
    fill("value", "4");
    click("[data-save]");
    await until(() => !busy && !S.edit, "insights edit");
    assert(insight.data.value === 4, "Insights edit works without travel migration");
    await session("employee-other", "employee");
    open(insight);
    assert(document.querySelector("#drawer").textContent.includes("Synthetic Team"), "Employee can view another team member’s Insight");
    assert(!document.querySelector("[data-save]") && !document.querySelector("[data-delete]"), "Employee cannot edit/delete another member’s Insight");
    document.body.dataset.testResult = "passed";
  } catch (error) {
    document.body.dataset.testResult = "failed";
    results.push(`FAIL: ${error.stack || error}`);
  }
  const output = document.createElement("pre");
  output.id = "test-results";
  output.textContent = JSON.stringify(results);
  document.body.append(output);
})();
