// Test-only Supabase simulator. Never loaded by application routes.
const teamInviteToken = "11111111-1111-4111-8111-111111111111";
const supabaseClient = {
  auth: {getUser: async () => ({data: {user: {id: "synthetic-user"}}})},
  from(table) {
    const query = {
      select() { return this; },
      eq() { return this; },
      order() { return this; },
      then(resolve) {
        if (table !== "flowguard_team_members") return resolve({error: {message: "Unexpected test table"}});
        const memberships = [
          {team_id: "team-a", role: "manager", flowguard_teams: {id: "team-a", name: "<img src=x onerror=alert(1)> Alpha"}},
          {team_id: "team-existing", role: "employee", flowguard_teams: {id: "team-existing", name: "Existing Team"}}
        ];
        if (localStorage.getItem("teams-test-created")) {
          memberships.push({team_id: "team-b", role: "manager", flowguard_teams: {id: "team-b", name: "Beta"}});
        }
        if (localStorage.getItem("teams-test-joined")) {
          memberships.push({team_id: "team-c", role: "employee", flowguard_teams: {id: "team-c", name: "Invited Team"}});
        }
        return resolve({data: memberships});
      }
    };
    return query;
  },
  async rpc(name, args) {
    if (name === "flowguard_create_team_invite" && args.p_team_id === "team-a") return {data: teamInviteToken};
    if (name === "flowguard_create_team" && args.p_name === "Beta") {
      localStorage.setItem("teams-test-created", "yes");
      return {data: "team-b"};
    }
    if (name === "flowguard_join_team" && args.p_token === teamInviteToken) {
      localStorage.setItem("teams-test-joined", "yes");
      return {data: "team-c"};
    }
    return {error: {message: "This invite code is invalid or expired"}};
  }
};
