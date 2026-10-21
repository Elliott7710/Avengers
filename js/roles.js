async function initializeRoleNavigation() {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      window.location.replace("login.html");
      return;
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    const role = (profile.role || "employee").toLowerCase().trim();

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

    console.log("Role navigation initialized:", role);
  } catch (error) {
    console.error("Role navigation error:", error);
  }
}

initializeRoleNavigation();
