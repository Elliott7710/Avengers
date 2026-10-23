(async function () {
  const results = JSON.parse(localStorage.getItem("teams-test-results") || "[]");
  const assert = (value, label) => {
    if (!value) throw new Error(label);
    results.push(label);
    localStorage.setItem("teams-test-results", JSON.stringify(results));
  };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const finish = passed => {
    document.body.dataset.testResult = passed ? "passed" : "failed";
    const output = document.createElement("pre");
    output.id = "test-results";
    output.textContent = JSON.stringify(results);
    document.body.append(output);
  };
  try {
    const context = await window.FlowGuardTeams.ready();
    // Let each document finish loading before starting another navigation.
    await delay(100);
    const phase = localStorage.getItem("teams-test-phase") || "start";
    if (phase === "start") {
      assert(context.currentTeam.id === "team-a", "First available team selected");
      assert(document.querySelectorAll(".team-switcher option").length === 2, "Multiple team memberships listed");
      assert(!document.querySelector("#team-management img"), "Team names are escaped, not interpreted as HTML");
      document.getElementById("team-create-invite").click();
      await delay(50);
      assert(document.getElementById("team-invite-result").textContent === teamInviteToken, "Manager can generate a shareable invitation");
      assert(!document.getElementById("team-invite-result").hidden, "Invitation is visible only after generation");
      document.getElementById("team-invite-code").value = "invalid";
      document.getElementById("team-join-form").requestSubmit();
      await delay(50);
      assert(document.getElementById("team-feedback").textContent.includes("invalid"), "Failed invitation displays a clear error");
      document.getElementById("team-name").value = "Beta";
      localStorage.setItem("teams-test-phase", "created");
      document.getElementById("team-create-form").requestSubmit();
      return;
    }
    if (phase === "created") {
      assert(context.currentTeam.id === "team-b" && context.currentTeam.role === "manager", "Creating a team selects it and preserves manager role");
      document.getElementById("team-invite-code").value = teamInviteToken;
      localStorage.setItem("teams-test-phase", "joined");
      document.getElementById("team-join-form").requestSubmit();
      return;
    }
    if (phase === "joined") {
      assert(context.currentTeam.id === "team-c" && context.currentTeam.role === "employee", "Joining an invitation selects the team with employee role");
      assert(!document.getElementById("team-create-invite") && !document.getElementById("team-create-form"), "Employee team hides manager controls");
      const selector = document.querySelector(".team-switcher select");
      selector.value = "team-a";
      localStorage.setItem("teams-test-phase", "switched");
      selector.dispatchEvent(new Event("change", {bubbles: true}));
      return;
    }
    assert(context.currentTeam.id === "team-a", "Team switcher changes the active team across navigation");
    assert(document.getElementById("team-create-invite"), "Switching teams uses that team's manager role");
    finish(true);
  } catch (error) {
    results.push(`FAIL: ${error.stack || error}`);
    finish(false);
  }
})();
