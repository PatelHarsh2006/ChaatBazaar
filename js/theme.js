// ===== Theme Toggle (standalone — for pages that don't load main.js) =====
document.addEventListener("DOMContentLoaded", () => {
  // Restore saved theme on page load
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }

  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem(
        "theme",
        document.body.classList.contains("dark") ? "dark" : "light"
      );
    });
  }
});
