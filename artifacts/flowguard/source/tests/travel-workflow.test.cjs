const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const workflow = require("../frontend/scripts/travel-workflow.js");
const valid = () => ({
  traveller: "Demo Employee", destination: "Demo City",
  start: "2026-11-02", end: "2026-11-04", cost: 800,
  purpose: "Synthetic client meeting", status: "Requested"
});

test("demo budget boundary flags review without ever auto-approving", () => {
  assert.equal(workflow.evaluateRule({...valid(), cost: 1000}).code, "standard");
  assert.equal(workflow.evaluateRule({...valid(), cost: 1000.01}).code, "high_budget");
  assert.match(workflow.evaluateRule(valid()).label, /approval required/);
  assert.equal(valid().status, "Requested");
});

test("dates, required context and monetary values are validated", () => {
  for (const patch of [
    {end: "2026-11-01"}, {start: "2026-02-30"}, {end: "invalid"},
    {purpose: ""}, {destination: " "}, {traveller: null},
    {cost: -1}, {cost: ""}, {cost: null}, {cost: Infinity},
    {cost: 1.001}, {cost: 1000000000}, {cost: false},
    {cost: "1e3"}, {start: "0000-01-01"}
  ]) assert.throws(() => workflow.validateTravel({...valid(), ...patch}));
  assert.equal(workflow.validateTravel({...valid(), cost: 0, end: "2026-11-02"}), true);
});

test("only a different manager can decide or book, following the status sequence", () => {
  const request = {...valid(), ownerId: "employee-a"};
  assert.deepEqual(workflow.availableActions(request, "employee", "employee-a"), []);
  assert.deepEqual(workflow.availableActions(request, "manager", "employee-a"), []);
  assert.deepEqual(workflow.availableActions(request, "manager", "manager-b"), ["approve", "reject"]);
  assert.deepEqual(workflow.availableActions({...request, status: "Approved"}, "manager", "manager-b"), ["book"]);
  for (const status of ["Booked", "Rejected"]) {
    assert.deepEqual(workflow.availableActions({...request, status}, "manager", "manager-b"), []);
  }
  assert.throws(() => workflow.assertDecision(request, "book", "manager", "manager-b", "Booked"), /not allowed/);
  assert.throws(() => workflow.assertDecision(request, "approve", "manager", "manager-b", " "), /note is required/);
  assert.throws(() => workflow.assertDecision(request, "reject", "manager", "manager-b", "x".repeat(1001)), /1,000/);
  assert.equal(workflow.assertDecision(request, "approve", "manager", "manager-b", "Reviewed the estimate"), "Approved");
});

test("only pending requests can be edited by their owner", () => {
  const rec = {...valid(), ownerId: "employee-a"};
  assert.equal(workflow.canEdit(rec, "employee-a"), true);
  assert.equal(workflow.canEdit(rec, "manager-b"), false);
  for (const status of ["Approved", "Booked", "Rejected"]) {
    assert.equal(workflow.canEdit({...rec, status}, "employee-a"), false);
  }
});

test("database and browser use the same documented threshold and guarded writes", () => {
  const sql = fs.readFileSync("backend/sql/travel_workflow.sql", "utf8");
  assert.match(sql, new RegExp(`cost'\\)::numeric > ${workflow.BUDGET_THRESHOLD}`));
  assert.match(sql, /before insert or update or delete/);
  assert.match(sql, /after insert or update or delete/);
  assert.match(sql, /for update;/);
  assert.match(sql, /rec.updated_at is distinct from p_expected_updated_at/);
  assert.match(sql, /revoke all on public.flowguard_travel_activity from public, anon, authenticated/);
});
