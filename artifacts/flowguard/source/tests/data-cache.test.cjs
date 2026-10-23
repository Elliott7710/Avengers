const test = require("node:test");
const assert = require("node:assert/strict");
const {createCache, createDataClient} = require("../frontend/js/data-cache.js");

test("cache coalesces concurrent requests, expires and supports forced refresh", async () => {
  let clock = 0, calls = 0;
  const cache = createCache(() => clock);
  const load = async () => ++calls;
  assert.deepEqual(await Promise.all([cache.read("a", load, 15), cache.read("a", load, 15)]), [1, 1]);
  clock = 14;
  assert.equal(await cache.read("a", load, 15), 1);
  clock = 15;
  assert.equal(await cache.read("a", load, 15), 2);
  assert.equal(await cache.read("a", load, 15, true), 3);
  cache.clear();
  assert.equal(await cache.read("a", load, 15), 4);
});

test("failed requests are not cached or silently replaced with stale data", async () => {
  const cache = createCache();
  await assert.rejects(cache.read("a", () => Promise.reject(new Error("Offline"))), /Offline/);
  assert.equal(await cache.read("a", () => "online"), "online");
  await cache.read("b", () => ({error: {message: "Denied"}}));
  assert.equal(await cache.read("b", () => "recovered"), "recovered");
});

test("invalidated pending requests cannot repopulate the cache", async () => {
  const cache = createCache();
  let resolve;
  const pending = cache.read("a", () => new Promise(done => { resolve = done; }));
  await Promise.resolve();
  cache.clear();
  assert.equal(await cache.read("a", () => "new"), "new");
  resolve("old");
  await pending;
  assert.equal(await cache.read("a", () => "unexpected"), "new");
});

test("records are isolated by user, team, role, module and query limit", async () => {
  let calls = 0;
  const filters = [];
  const client = {
    auth: {getUser: async () => ({data: {user: {id: "a"}}})},
    from(table) {
      const query = {
        select() { return this; }, order() { return this; }, limit() { return this; },
        eq(key, value) { filters.push([key, value]); return this; },
        then(resolve) { calls++; resolve({data: [{table, call: calls}]}); }
      };
      return query;
    }
  };
  const data = createDataClient(client);
  const user = {id: "a"}, team = {id: "one", role: "employee"};
  const first = await data.records(user, team, "travel");
  assert.deepEqual(await data.records(user, team, "travel"), first);
  assert.equal(calls, 1);
  await data.records({id: "b"}, team, "travel");
  await data.records(user, {...team, id: "two"}, "travel");
  await data.records(user, {...team, role: "manager"}, "travel");
  await data.records(user, team, "insights");
  await data.records(user, team, "travel", false, 100);
  assert.equal(calls, 6);
  assert.ok(filters.some(([key, value]) => key === "owner_id" && value === user.id));
  await assert.rejects(data.records(null, team, "travel"), /signed-in/);
  data.clear();
  await data.records(user, team, "travel");
  assert.equal(calls, 7);
});
