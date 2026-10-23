async function initializeRoleNavigation() {
  try {
    const teamContext = await window.FlowGuardTeams.ready();
    if (!teamContext?.user) {
      window.location.replace("login.html");
      return;
    }
    const role = teamContext.currentTeam?.role || "employee";

    // Only recognize roles explicitly supported by FlowGuard.
    if (!["employee", "manager"].includes(role)) {
      throw new Error("Unsupported account role.");
    }

    document.body.dataset.role = role;

    // Hide navigation items requiring a different role.
    document.querySelectorAll("[data-role-required]").forEach((element) => {
      const requiredRole = element.dataset.roleRequired;
      element.hidden = role !== requiredRole;
    });

    console.log("Team role navigation initialized:", role);
  } catch (error) {
    console.error("Role navigation error:", error);
  }
}

initializeRoleNavigation();
