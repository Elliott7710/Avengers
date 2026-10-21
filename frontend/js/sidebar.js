const sidebar = document.querySelector(".sidebar");
const sidebarNav = sidebar?.querySelector(".nav");
const appShell = document.querySelector(".app-shell");

if (sidebar && sidebarNav && appShell) {
  sidebar.id = "workspace-sidebar";

  const adminLink = document.createElement("a");
  adminLink.className = "nav-btn";
  adminLink.href = "admin.html";
  adminLink.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v5c0 5 3.4 8.2 8 10 4.6-1.8 8-5 8-10V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg><span>Admin</span>';
  adminLink.title = "Admin";
  if (document.body.dataset.page === "admin") {
    adminLink.classList.add("active");
    adminLink.setAttribute("aria-current", "page");
  }
  sidebarNav.append(adminLink);

  const toggle = document.createElement("button");
  toggle.className = "sidebar-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-controls", sidebar.id);
  toggle.innerHTML = '<span class="sidebar-toggle-icon" aria-hidden="true">‹</span><span class="sidebar-toggle-label">Collapse sidebar</span>';
  sidebar.querySelector(".brand")?.after(toggle);

  const storageKey = "flowguard-sidebar-collapsed";
  const setCollapsed = collapsed => {
    appShell.classList.toggle("sidebar-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    toggle.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
    toggle.querySelector(".sidebar-toggle-icon").textContent = collapsed ? "›" : "‹";
    toggle.querySelector(".sidebar-toggle-label").textContent = collapsed ? "Expand sidebar" : "Collapse sidebar";
  };

  let isCollapsed = false;
  try {
    isCollapsed = localStorage.getItem(storageKey) === "true";
  } catch (error) {
    console.warn("Could not read the sidebar preference:", error);
  }
  setCollapsed(isCollapsed);

  toggle.addEventListener("click", () => {
    isCollapsed = !appShell.classList.contains("sidebar-collapsed");
    setCollapsed(isCollapsed);
    try {
      localStorage.setItem(storageKey, String(isCollapsed));
    } catch (error) {
      console.warn("Could not save the sidebar preference:", error);
    }
  });
}
