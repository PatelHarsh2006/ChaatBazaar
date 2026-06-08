(function () {
  const USERS_KEY = "users";
  const SESSION_KEY = "loggedInUser";
  const THEME_KEY = "theme";

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn(`Failed to parse localStorage key: ${key}`, error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getUsers() {
    return readJSON(USERS_KEY, []);
  }

  function getSessionUser() {
    return readJSON(SESSION_KEY, null);
  }

  function setSessionUser(user) {
    writeJSON(SESSION_KEY, user);
  }

  function clearSessionUser() {
    localStorage.removeItem(SESSION_KEY);
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"'`\/]/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "`": "&#96;",
        "/": "&#47;"
      }[character] || character;
    });
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
  }

  function validatePhone(phone) {
    return /^\d{10}$/.test(String(phone || "").trim());
  }

  function setFieldError(inputId, message) {
    const errorEl = document.getElementById(`${inputId}-error`);
    if (!errorEl) return;

    errorEl.textContent = message;
    errorEl.classList.toggle("active", Boolean(message));
  }

  function setFormMessage(formId, message, type) {
    const form = document.getElementById(formId);
    if (!form) return;

    const messageEl = form.querySelector(".form-message");
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.classList.remove("success", "error");
    if (type) {
      messageEl.classList.add(type);
    }
  }

  function clearFormErrors(fieldIds, formId) {
    fieldIds.forEach((fieldId) => setFieldError(fieldId, ""));
    setFormMessage(formId, "", "");
  }

  function getThemePreference() {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  }

  function updateThemeToggleState(theme) {
    const themeToggle = document.getElementById("theme-toggle");
    if (!themeToggle) return;

    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  function applyTheme(theme) {
    const normalizedTheme = theme === "dark" ? "dark" : "light";
    document.body.classList.toggle("dark", normalizedTheme === "dark");
    updateThemeToggleState(normalizedTheme);
  }

  function setupThemeToggle() {
    applyTheme(getThemePreference());

    const themeToggle = document.getElementById("theme-toggle");
    if (!themeToggle) return;

    themeToggle.addEventListener("click", function () {
      const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
      localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  }

  function closeProfileDropdown(options) {
    const profileMenu = document.querySelector("[data-profile-menu]");
    const profileToggle = document.getElementById("profileToggle");

    if (!profileMenu || !profileToggle) return;

    profileMenu.classList.remove("open");
    profileToggle.setAttribute("aria-expanded", "false");

    if (options && options.focusToggle) {
      profileToggle.focus();
    }
  }

  function setupProfileDropdown() {
    const profileMenu = document.querySelector("[data-profile-menu]");
    const profileToggle = document.getElementById("profileToggle");
    const logoutBtn = document.getElementById("logoutBtn");

    if (!profileMenu || !profileToggle) return;

    const openProfileDropdown = function () {
      profileMenu.classList.add("open");
      profileToggle.setAttribute("aria-expanded", "true");
    };

    const handleDocumentClick = function (event) {
      if (!profileMenu.contains(event.target)) {
        closeProfileDropdown();
      }
    };

    const handleEscapeKey = function (event) {
      if (event.key === "Escape") {
        closeProfileDropdown({ focusToggle: true });
      }
    };

    profileToggle.addEventListener("click", function (event) {
      event.stopPropagation();

      if (profileMenu.classList.contains("open")) {
        closeProfileDropdown();
      } else {
        openProfileDropdown();
      }
    });

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleEscapeKey);

    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        clearSessionUser();
        window.location.href = "index.html";
      });
    }
  }

  // Navbar session rendering.
  // Why: every page needs the same logged-out/login and logged-in/profile state.
  function renderAuthNav() {
    const authNavItem = document.getElementById("authNavItem");
    if (!authNavItem) return;

    const loggedInUser = getSessionUser();
    if (!loggedInUser || !loggedInUser.name) {
      authNavItem.innerHTML = '<a href="login.html" class="login-btn-nav" aria-label="Go to login page">Login</a>';
      return;
    }

    const safeName = escapeHTML(String(loggedInUser.name).trim());
    const safeEmail = escapeHTML(String(loggedInUser.email || "").trim());

    authNavItem.innerHTML = `
      <div class="profile-menu" data-profile-menu>
        <button
          type="button"
          class="profile-toggle"
          id="profileToggle"
          aria-haspopup="true"
          aria-expanded="false"
          aria-label="Open profile menu"
        >
          <span class="profile-avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 12c2.76 0 5-2.46 5-5.5S14.76 1 12 1 7 3.46 7 6.5 9.24 12 12 12Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M4 23c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </span>
          <span class="sr-only">Open profile menu for ${safeName}</span>
        </button>
        <div class="profile-dropdown" id="profileDropdown" role="menu" aria-label="Account menu">
          <div class="profile-dropdown-header">
            <span class="profile-dropdown-name">${safeName}</span>
            <span class="profile-dropdown-email">${safeEmail}</span>
          </div>
          <a href="profile.html" role="menuitem">Profile</a>
          <a href="dashboard.html" role="menuitem">Dashboard</a>
          <button type="button" class="profile-dropdown-logout" id="logoutBtn">Logout</button>
        </div>
      </div>
    `;

    setupProfileDropdown();
  }

  function handleLoginPage() {
    const loginForm = document.getElementById("login-form");
    if (!loginForm) return;

    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const emailInput = document.getElementById("login-email");
      const passwordInput = document.getElementById("login-password");
      const email = normalizeEmail(emailInput ? emailInput.value : "");
      const password = String(passwordInput ? passwordInput.value : "").trim();

      clearFormErrors(["login-email", "login-password"], "login-form");

      let hasError = false;

      if (!validateEmail(email)) {
        setFieldError("login-email", "Please enter a valid email address.");
        hasError = true;
      }

      if (password.length < 6) {
        setFieldError("login-password", "Password must be at least 6 characters.");
        hasError = true;
      }

      if (hasError) {
        setFormMessage("login-form", "Please fix the highlighted fields.", "error");
        return;
      }

      const users = getUsers();
      const matchedUser = users.find(
        (user) => normalizeEmail(user.email) === email && String(user.password || "") === password
      );

      if (!matchedUser) {
        setFormMessage("login-form", "Invalid email or password. Please try again.", "error");
        return;
      }

      setSessionUser({
        name: matchedUser.name,
        email: matchedUser.email,
        phone: matchedUser.phone,
        location: matchedUser.location,
        loginAt: new Date().toISOString()
      });

      setFormMessage("login-form", "Login successful. Redirecting...", "success");
      window.location.href = "index.html";
    });
  }

  function handleSignupPage() {
    const signupForm = document.getElementById("signup-form");
    if (!signupForm) return;

    signupForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const nameInput = document.getElementById("signup-name");
      const emailInput = document.getElementById("signup-email");
      const passwordInput = document.getElementById("signup-password");
      const phoneInput = document.getElementById("signup-phone");
      const locationInput = document.getElementById("signup-location");

      const name = String(nameInput ? nameInput.value : "").trim();
      const email = normalizeEmail(emailInput ? emailInput.value : "");
      const password = String(passwordInput ? passwordInput.value : "").trim();
      const phone = String(phoneInput ? phoneInput.value : "").trim();
      const location = String(locationInput ? locationInput.value : "").trim();

      clearFormErrors(
        ["signup-name", "signup-email", "signup-password", "signup-phone", "signup-location"],
        "signup-form"
      );

      let hasError = false;

      if (!name) {
        setFieldError("signup-name", "Name is required.");
        hasError = true;
      }

      if (!validateEmail(email)) {
        setFieldError("signup-email", "Please enter a valid email address.");
        hasError = true;
      }

      if (password.length < 6) {
        setFieldError("signup-password", "Password must be at least 6 characters.");
        hasError = true;
      }

      if (!validatePhone(phone)) {
        setFieldError("signup-phone", "Phone number must contain exactly 10 digits.");
        hasError = true;
      }

      if (!location) {
        setFieldError("signup-location", "Location is required.");
        hasError = true;
      }

      const users = getUsers();
      const emailAlreadyExists = users.some((user) => normalizeEmail(user.email) === email);
      if (emailAlreadyExists) {
        setFieldError("signup-email", "This email is already registered. Please log in.");
        hasError = true;
      }

      if (hasError) {
        setFormMessage("signup-form", "Please fix the highlighted fields.", "error");
        return;
      }

      const newUser = {
        name,
        email,
        password,
        phone,
        location,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      writeJSON(USERS_KEY, users);

      // Auto-login after successful registration as requested.
      setSessionUser({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        location: newUser.location,
        loginAt: new Date().toISOString()
      });

      setFormMessage("signup-form", "Account created successfully. Redirecting...", "success");
      window.location.href = "index.html";
    });
  }

  function populateProfilePage() {
    if (document.body.dataset.pageType !== "profile") return;

    const loggedInUser = getSessionUser();
    if (!loggedInUser) return;

    const profileMap = {
      "profile-name-value": loggedInUser.name || "",
      "profile-email-value": loggedInUser.email || "",
      "profile-phone-value": loggedInUser.phone || "",
      "profile-location-value": loggedInUser.location || ""
    };

    Object.keys(profileMap).forEach((elementId) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = profileMap[elementId];
      }
    });

    const profileInitial = document.getElementById("profile-avatar-initial");
    if (profileInitial) {
      profileInitial.textContent = String(loggedInUser.name || "U").trim().charAt(0).toUpperCase() || "U";
    }
  }

  function populateDashboardPage() {
    if (document.body.dataset.pageType !== "dashboard") return;

    const loggedInUser = getSessionUser();
    if (!loggedInUser) return;

    const nameElement = document.getElementById("dashboard-user-name");
    if (nameElement) {
      nameElement.textContent = loggedInUser.name || "User";
    }
  }

  function redirectIfAuthenticationStateMismatchesPage() {
    const pageType = document.body.dataset.pageType || "";
    const loggedInUser = getSessionUser();

    if ((pageType === "profile" || pageType === "dashboard") && !loggedInUser) {
      window.location.href = "login.html";
      return true;
    }

    if ((pageType === "login" || pageType === "signup") && loggedInUser) {
      window.location.href = "index.html";
      return true;
    }

    return false;
  }

  function init() {
    if (redirectIfAuthenticationStateMismatchesPage()) {
      return;
    }

    setupThemeToggle();
    renderAuthNav();
    handleLoginPage();
    handleSignupPage();
    populateProfilePage();
    populateDashboardPage();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
