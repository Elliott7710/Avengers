const assert = require("node:assert/strict");
const test = require("node:test");
const {sumEstimatedSpend} = require("../frontend/js/calculations.js");

test("estimated spend includes requested, approved, and booked requests only", () => {
  const rows = [
    {status: "Requested", cost: 100},
    {status: "Approved", cost: 200},
    {status: "Booked", cost: 300},
    {status: "Rejected", cost: 900}
  ];

  assert.equal(sumEstimatedSpend(rows), 600);
});

test("estimated spend uses cent precision for decimal costs", () => {
  const rows = [
    {status: "Requested", cost: 0.1},
    {status: "Approved", cost: 0.2},
    {status: "Booked", cost: 0.3}
  ];

  assert.equal(sumEstimatedSpend(rows), 0.6);
});

test("an invalid rejected cost does not affect active estimated spend", () => {
  assert.equal(sumEstimatedSpend([
    {status: "Requested", cost: 12.5},
    {status: "Rejected", cost: "invalid"}
  ]), 12.5);
});

test("an invalid active cost is reported instead of silently counted as zero", () => {
  assert.throws(
    () => sumEstimatedSpend([{status: "Booked", cost: "12.5oops"}]),
    /invalid cost/
  );
});

test("empty travel data has zero estimated spend", () => {
  assert.equal(sumEstimatedSpend([]), 0);
});
