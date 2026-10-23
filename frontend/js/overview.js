async function loadOverview() {
  try {
    const teamContext = await window.FlowGuardTeams.ready();
    // 1. Check whether a user is signed in.
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      window.location.replace("login.html");
      return;
    }

    // 2. Fetch the signed-in user's profile.
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    // 3. Prepare the user's information.
    const name = profile.full_name || user.user_metadata?.full_name || "User";

    const role = teamContext?.currentTeam?.role || "employee";

    // Only allow roles supported by this application.
    if (!["employee", "manager"].includes(role)) {
      throw new Error(`Unsupported account role: ${role}`);
    }

    const initial = name.trim().charAt(0).toUpperCase() || "U";

    // 4. Store the role on the page.
    document.body.dataset.role = role;

    // 5. Safely update HTML elements.
    function setText(id, value) {
      const element = document.getElementById(id);

      if (!element) {
        console.error(`Missing HTML element: #${id}`);
        return false;
      }

      element.textContent = value;
      return true;
    }

    setText("welcome-heading", `Good to see you, ${name}.`);

    setText("sidebar-name", name);
    setText("sidebar-role", role);
    setText("topbar-name", name);

    setText("sidebar-avatar", initial);
    setText("topbar-avatar", initial);

    // 6. Show or hide role-specific navigation and modules.
    document.querySelectorAll("[data-role-required]").forEach((element) => {
      const requiredRole = element.dataset.roleRequired;

      element.hidden = requiredRole !== role;
    });

  } catch (error) {
    console.error("Overview loading error:", error);
  }
}

// Run the function when this script loads.
loadOverview();
