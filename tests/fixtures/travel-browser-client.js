// Test-only, in-memory API simulator. Never loaded by the application.
let testSession = {id: "employee-a", role: "employee"};
const testStore = {flowguard_travel_records: [], flowguard_insight_records: [], flowguard_travel_activity: []};
let testSequence = 0;
const testStamp = () => new Date(1800000000000 + ++testSequence).toISOString();
const testClone = value => JSON.parse(JSON.stringify(value));
function testLog(record, action, previous, note) {
  testStore.flowguard_travel_activity.unshift({
    id: `event-${++testSequence}`, travel_id: record.id, owner_id: record.owner_id,
    record_id: record.record_id, actor_role: testSession.role, action,
    from_status: previous, to_status: action === "deleted" ? null : record.data.status,
    note, rule_code: record.data.rule_code, created_at: testStamp()
  });
}
let testWorkflowInstalled = true;
let testDecisions = 0;
const supabaseClient = {
  auth: {getUser: async () => ({data: {user: {id: testSession.id, email: "synthetic@example.invalid"}}})},
  async rpc(name, args) {
    if (name === "flowguard_travel_workflow_version") {
      return testWorkflowInstalled ? {data: 1} : {error: {message: "Test: migration absent"}};
    }
    if (name !== "flowguard_decide_travel") return {error: {message: "Unknown test RPC"}};
    testDecisions++;
    await new Promise(resolve => setTimeout(resolve, 30));
    const rec = testStore.flowguard_travel_records.find(row => row.id === args.p_id);
    if (!rec || rec.updated_at !== args.p_expected_updated_at) return {error: {message: "This request changed. Refresh it before deciding"}};
    try {
      const following = FlowGuardTravelWorkflow.assertDecision(
        {...rec.data, ownerId: rec.owner_id}, args.p_action, testSession.role, testSession.id, args.p_note);
      const previous = rec.data.status;
      rec.data.status = following;
      rec.data.decision_note = args.p_note;
      rec.updated_at = testStamp();
      testLog(rec, following.toLowerCase(), previous, args.p_note);
      return {data: testClone(rec)};
    } catch (error) { return {error: {message: error.message}}; }
  },
  from(table) {
    const query = {
      operation: "read", filters: [], payload: null, one: false, max: Infinity,
      select() { return this; },
      order() { return this; },
      limit(n) { this.max = n; return this; },
      eq(key, value) { this.filters.push([key, value]); return this; },
      insert(payload) { this.operation = "insert"; this.payload = payload; return this; },
      update(payload) { this.operation = "update"; this.payload = payload; return this; },
      delete() { this.operation = "delete"; return this; },
      single() { this.one = true; return this; },
      maybeSingle() { this.one = true; return this; },
      async then(resolve, reject) {
        try {
          if (table === "profiles") return resolve({data: {role: testSession.role}});
          if (!testStore[table]) return resolve({error: {message: "Unknown test table"}});
          let found = testStore[table].filter(row => this.filters.every(([key, value]) => {
            if (value === undefined) throw new Error("Undefined query filter");
            return row[key] === value;
          }));
          if (testSession.role !== "manager") found = found.filter(row => row.owner_id === testSession.id);
          if (this.operation === "insert") {
            const payloads = Array.isArray(this.payload) ? this.payload : [this.payload];
            found = payloads.map(payload => {
              const rec = {...testClone(payload), id: `record-${++testSequence}`, created_at: testStamp(), updated_at: testStamp()};
              if (table === "flowguard_travel_records") {
                const rule = FlowGuardTravelWorkflow.evaluateRule(rec.data);
                rec.data.rule_code = rule.code;
                rec.data.rule_threshold = rule.threshold;
                testLog(rec, "submitted", null, "Request submitted for manager approval.");
              }
              testStore[table].unshift(rec);
              return rec;
            });
          } else if (this.operation === "update") {
            for (const rec of found) {
              rec.data = testClone(this.payload.data);
              rec.updated_at = testStamp();
              if (table === "flowguard_travel_records") {
                const rule = FlowGuardTravelWorkflow.evaluateRule(rec.data);
                rec.data.rule_code = rule.code;
                rec.data.rule_threshold = rule.threshold;
                testLog(rec, "edited", "Requested", "Pending request details updated.");
              }
            }
          } else if (this.operation === "delete") {
            for (const rec of found) {
              if (table === "flowguard_travel_records") testLog(rec, "deleted", rec.data.status, "Pending request deleted.");
              testStore[table] = testStore[table].filter(row => row.id !== rec.id);
            }
          }
          // Exercise history arriving while the user is typing a form/decision.
          if (table === "flowguard_travel_activity") await new Promise(done => setTimeout(done, 30));
          const data = this.one ? found[0] || null : found.slice(0, this.max);
          return resolve({data: testClone(data)});
        } catch (error) { return reject(error); }
      }
    };
    return query;
  }
};
window.confirm = () => true;
