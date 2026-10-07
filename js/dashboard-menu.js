const menuToggle = document.querySelector(".menu-toggle");
const menuBackdrop = document.querySelector(".menu-backdrop");
const dashboardLayout = document.querySelector(".dashboard-layout");
const sidebar = document.getElementById("dashboard-sidebar");
const closeMenuButton = document.querySelector(".sidebar-close");

if (
  !menuToggle ||
  !menuBackdrop ||
  !dashboardLayout ||
  !sidebar ||
  !closeMenuButton
) {
  throw new Error("Dashboard navigation menu controls are missing.");
}

function setMenuOpen(isOpen, returnFocus = false) {
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu",
  );
  sidebar.classList.toggle("is-open", isOpen);
  dashboardLayout.classList.toggle("menu-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);

  if (returnFocus) {
    menuToggle.focus();
  }
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";
  setMenuOpen(isOpen);

  if (isOpen) {
    closeMenuButton.focus();
  }
});

menuBackdrop.addEventListener("click", () => setMenuOpen(false, true));
closeMenuButton.addEventListener("click", () => setMenuOpen(false, true));

sidebar.querySelectorAll(".sidebar-nav a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuToggle.getAttribute("aria-expanded") === "true"
  ) {
    setMenuOpen(false, true);
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) {
    setMenuOpen(false);
  }
});
