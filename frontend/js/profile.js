let privacyRequestUser = null;

document.getElementById("profile-sign-out").addEventListener("click", async event => {
  const button = event.currentTarget;
  const feedback = document.getElementById("profile-sign-out-feedback");

  if (button.disabled) return;

  feedback.textContent = "";
  button.disabled = true;
  button.textContent = "Signing out…";

  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    window.location.replace("signin.html");
  } catch (error) {
    console.error("Profile sign-out error:", error);
    feedback.textContent = "Unable to sign out. Please try again.";
    button.disabled = false;
    button.textContent = "Sign out";
  }
});

async function loadProfile() {
  const caption = document.getElementById("profile-caption");

  try {
    // 1. Get the currently signed-in user.
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError?.name === "AuthSessionMissingError") {
      window.location.replace("signin.html");
      return;
    }

    if (authError) {
      throw authError;
    }

    // 2. Redirect to login if no user is signed in.
    if (!user) {
      window.location.replace("signin.html");
      return;
    }
    privacyRequestUser = user;

    // 3. Fetch this user's profile from Supabase.
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
    // Normalize the role for consistent comparisons.
    const normalizedRole = role.toLowerCase().trim();

    document.body.dataset.role = normalizedRole;

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
    await loadPrivacyRequests(user);
  } catch (error) {
    console.error("Profile loading error:", error);

    caption.textContent = "Unable to load your profile. Please try again.";
  }
}

const privacyRequestLabels = {
  deletion: "Delete my account and associated data",
  access: "Request access to my data",
  correction: "Request a correction",
  other: "Other privacy request",
};

const privacyRequestStatusLabels = {
  open: "Open",
  in_review: "In review",
  needs_info: "Needs information",
  completed: "Completed",
};

async function loadPrivacyRequests(user) {
  const historyMessage = document.getElementById("privacy-request-history-message");
  const list = document.getElementById("privacy-request-list");
  const {data, error} = await supabaseClient
    .from("flowguard_privacy_requests")
    .select("id, request_type, status, created_at")
    .eq("requester_id", user.id)
    .order("created_at", {ascending: false})
    .limit(10);

  list.replaceChildren();
  if (error) {
    historyMessage.textContent = "Request history is unavailable. The privacy-request service may not be configured yet.";
    return;
  }

  historyMessage.textContent = data.length ? "" : "You have not submitted any privacy requests.";
  for (const request of data) {
    const item = document.createElement("li");
    const label = document.createElement("span");
    const status = document.createElement("span");
    const date = document.createElement("time");
    const createdAt = new Date(request.created_at);

    item.className = "privacy-request-item";
    label.textContent = privacyRequestLabels[request.request_type] || "Privacy request";
    status.className = "privacy-request-status";
    status.textContent = privacyRequestStatusLabels[request.status] || "Pending";
    date.dateTime = createdAt.toISOString();
    date.textContent = new Intl.DateTimeFormat("en-MY", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(createdAt);
    item.append(label, status, date);
    list.append(item);
  }
}

document.getElementById("privacy-request-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.getElementById("privacy-request-feedback");
  const submitButton = document.getElementById("privacy-request-submit");
  const requestType = form.elements.request_type.value;
  const details = form.elements.details.value.trim();

  if (!privacyRequestUser) {
    feedback.textContent = "Sign in again before submitting a privacy request.";
    return;
  }
  if (requestType === "deletion" && !window.confirm(
    "Submit a request to delete your account and associated data? This sends a request to FlowGuard operators; it does not delete anything immediately."
  )) {
    return;
  }

  feedback.textContent = "";
  submitButton.disabled = true;
  try {
    const {error} = await supabaseClient
      .from("flowguard_privacy_requests")
      .insert({
        requester_id: privacyRequestUser.id,
        request_type: requestType,
        details: details || null,
      });
    if (error) throw error;

    form.reset();
    feedback.textContent = "Request submitted. FlowGuard operators will review it; your account has not been deleted.";
    await loadPrivacyRequests(privacyRequestUser);
  } catch {
    feedback.textContent = "Your request could not be submitted. Please try again later.";
  } finally {
    submitButton.disabled = false;
  }
});

// Run when the page loads.
loadProfile();
