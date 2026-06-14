const html = document.documentElement;
const btn = document.getElementById("theme-toggle");

// restore theme
const saved = localStorage.getItem("theme");
if (saved) {
  html.setAttribute("data-theme", saved);
}

// click event
btn.addEventListener("click", () => {
  const current = html.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";

  html.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});