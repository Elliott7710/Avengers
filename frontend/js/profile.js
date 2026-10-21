async function loadProfile() {
  const caption = document.getElementById("profile-caption");

  try {
    // 1. Get the currently signed-in user.
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError) {
      throw authError;
    }

    // 2. Redirect to login if no user is signed in.
    if (!user) {
      window.location.replace("signin.html");
      return;
    }

    // 3. Fetch this user's profile from Supabase.
    console.log("Signed-in user ID:", user.id);
    console.log("Signed-in email:", user.email);
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("full_name, username, role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    // 4. Prepare the values to display.
    const name = profile.full_name || user.user_metadata?.full_name || "User";

    const username = profile.username || user.user_metadata?.username || "—";

    const role = profile.role || "employee";
    const initial = name.trim().charAt(0).toUpperCase() || "U";

    // 5. Update the profile card.
    document.getElementById("profile-name").textContent = name;
    document.getElementById("profile-email").textContent = user.email || "—";

    document.getElementById("detail-name").textContent = name;
    document.getElementById("detail-username").textContent = username;
    document.getElementById("detail-role").textContent = role;

    // 6. Update the sidebar and top navigation.
    document.getElementById("sidebar-name").textContent = name;
    document.getElementById("sidebar-role").textContent = role;
    document.getElementById("topbar-name").textContent = name;

    document.getElementById("sidebar-avatar").textContent = initial;
    document.getElementById("topbar-avatar").textContent = initial;
    document.getElementById("profile-avatar").textContent = initial;

    // 7. Show a success message.
    caption.textContent = "Your account information is up to date.";
  } catch (error) {
    console.error("Profile loading error:", error);

    caption.textContent = "Unable to load your profile. Please try again.";
  }
}

// Run when the page loads.
loadProfile();
