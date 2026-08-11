(function () {
  const USERS_KEY       = "users";
  const SESSION_KEY     = "loggedInUser";
  const SESSION_CHK_KEY = "loggedInUser_check"; 
  const THEME_KEY       = "theme";
  const SESSION_TTL_MS  = 7 * 24 * 60 * 60 * 1000;

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

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data    = encoder.encode(password);
    const hashBuf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuf))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
  }

  function computeChecksum(payload) {
    return btoa(encodeURIComponent(payload)).slice(0, 24);
  }

  function setSessionUser(user) {
    const payload  = JSON.stringify(user);
    const checksum = computeChecksum(payload);
    localStorage.setItem(SESSION_KEY,     payload);
    localStorage.setItem(SESSION_CHK_KEY, checksum);
  }
  
  function getSessionUser() {
    const payload  = localStorage.getItem(SESSION_KEY);
    const checksum = localStorage.getItem(SESSION_CHK_KEY);

    if (!payload) return null;
    if (computeChecksum(payload) !== checksum) {
      clearSessionUser();
      console.warn("Session integrity check failed. Session cleared.");
      return null;
    }

    let user;
    try {
      user = JSON.parse(payload);
    } catch {
      clearSessionUser();
      return null;
    }
    if (user.loginAt) {
      const age = Date.now() - new Date(user.loginAt).getTime();
      if (age > SESSION_TTL_MS) {
        clearSessionUser();
        return null;
      }
    }

    return user;
  }

  function clearSessionUser() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_CHK_KEY);
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"'`\/]/g, function (ch) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "`": "&#96;",
        "/": "&#47;"
      }[ch] || ch;
    });
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
  }

  function validatePhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    return digits.length === 10 ||
      (digits.length === 12 && digits.startsWith("91"));
  }

  function validatePassword(password) {
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must include at least one uppercase letter.";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must include at least one number.";
    }
    return null; 
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
    if (type) messageEl.classList.add(type);
  }

  function clearFormErrors(fieldIds, formId) {
    fieldIds.forEach(function (id) { setFieldError(id, ""); });
    setFormMessage(formId, "", "");
  }

  function setSubmitLoading(form, loading, originalLabel) {
    const btn = form ? form.querySelector('button[type="submit"]') : null;
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? "Please wait…" : (originalLabel || "Submit");
  }

  function setupPasswordToggle(inputId, toggleId) {
    const input  = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    if (!input || !toggle) return;

    toggle.addEventListener("click", function () {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      toggle.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );
      toggle.textContent = isPassword ? "Hide" : "Show";
    });
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
    const profileMenu   = document.querySelector("[data-profile-menu]");
    const profileToggle = document.getElementById("profileToggle");
    if (!profileMenu || !profileToggle) return;
    profileMenu.classList.remove("open");
    profileToggle.setAttribute("aria-expanded", "false");
    if (options && options.focusToggle) profileToggle.focus();
  }

  function setupProfileDropdown() {
    const profileMenu   = document.querySelector("[data-profile-menu]");
    const profileToggle = document.getElementById("profileToggle");
    const logoutBtn     = document.getElementById("logoutBtn");

    if (!profileMenu || !profileToggle) return;

    const openProfileDropdown = function () {
      profileMenu.classList.add("open");
      profileToggle.setAttribute("aria-expanded", "true");
    };

    profileToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      profileMenu.classList.contains("open")
        ? closeProfileDropdown()
        : openProfileDropdown();
    });

    document.addEventListener("click", function (event) {
      if (!profileMenu.contains(event.target)) closeProfileDropdown();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeProfileDropdown({ focusToggle: true });
    });

    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        clearSessionUser();
        window.location.href = "index.html";
      });
    }
  }

  function renderAuthNav() {
    const authNavItem = document.getElementById("authNavItem");
    if (!authNavItem) return;

    const loggedInUser = getSessionUser();
    if (!loggedInUser || !loggedInUser.name) {
      authNavItem.innerHTML =
        '<a href="login.html" class="login-btn-nav" aria-label="Go to login page">Login</a>';
      return;
    }
    
    const safeName  = escapeHTML(String(loggedInUser.name).trim());
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
    setupPasswordToggle("login-password", "login-password-toggle");

    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const emailInput    = document.getElementById("login-email");
      const passwordInput = document.getElementById("login-password");
      const email = normalizeEmail(emailInput ? emailInput.value : "");
      const password = String(passwordInput ? passwordInput.value : "");

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

      setSubmitLoading(loginForm, true);

      try {
        const hashedInput = await hashPassword(password);
        const users       = getUsers();

        const matchedUser = users.find(function (user) {
          return (
            normalizeEmail(user.email) === email &&
            String(user.password || "") === hashedInput
          );
        });

        if (!matchedUser) {
          setFormMessage(
            "login-form",
            "Invalid email or password. Please try again.",
            "error"
          );
          setSubmitLoading(loginForm, false, "Login");
          return;
        }

        setSessionUser({
          name:     matchedUser.name,
          email:    matchedUser.email,
          phone:    matchedUser.phone,
          location: matchedUser.location,
          loginAt:  new Date().toISOString()
        });
        
        setFormMessage("login-form", "Login successful. Redirecting…", "success");
        setTimeout(function () {
          window.location.href = "index.html";
        }, 800);

      } catch (err) {
        console.error("Login error:", err);
        setFormMessage("login-form", "Something went wrong. Please try again.", "error");
        setSubmitLoading(loginForm, false, "Login");
      }
    });
  }

  function handleSignupPage() {
    const signupForm = document.getElementById("signup-form");
    if (!signupForm) return;

    setupPasswordToggle("signup-password", "signup-password-toggle");

    signupForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const nameInput     = document.getElementById("signup-name");
      const emailInput    = document.getElementById("signup-email");
      const passwordInput = document.getElementById("signup-password");
      const phoneInput    = document.getElementById("signup-phone");
      const locationInput = document.getElementById("signup-location");

      const name     = String(nameInput     ? nameInput.value     : "").trim();
      const email    = normalizeEmail(emailInput ? emailInput.value : "");
      const password = String(passwordInput ? passwordInput.value : "");
      const phone    = String(phoneInput    ? phoneInput.value    : "").trim();
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
      
      const users = getUsers();
      if (!validateEmail(email)) {
        setFieldError("signup-email", "Please enter a valid email address.");
        hasError = true;
      } else if (users.some(function (u) { return normalizeEmail(u.email) === email; })) {
        setFieldError("signup-email", "This email is already registered. Please log in.");
        hasError = true;
      }

      const pwError = validatePassword(password);
      if (pwError) {
        setFieldError("signup-password", pwError);
        hasError = true;
      }
      if (!validatePhone(phone)) {
        setFieldError("signup-phone", "Enter a valid 10-digit phone number.");
        hasError = true;
      }
      if (!location) {
        setFieldError("signup-location", "Location is required.");
        hasError = true;
      }

      if (hasError) {
        setFormMessage("signup-form", "Please fix the highlighted fields.", "error");
        return;
      }

      setSubmitLoading(signupForm, true);

      try {
        const hashedPassword = await hashPassword(password);

        const newUser = {
          name,
          email,
          password: hashedPassword,
          phone,
          location,
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeJSON(USERS_KEY, users);

        setSessionUser({
          name:     newUser.name,
          email:    newUser.email,
          phone:    newUser.phone,
          location: newUser.location,
          loginAt:  new Date().toISOString()
        });

        setFormMessage("signup-form", "Account created! Redirecting…", "success");
        setTimeout(function () {
          window.location.href = "index.html";
        }, 800);

      } catch (err) {
        console.error("Signup error:", err);
        setFormMessage("signup-form", "Something went wrong. Please try again.", "error");
        setSubmitLoading(signupForm, false, "Create Account");
      }
    });
  }

  function populateProfilePage() {
    if (document.body.dataset.pageType !== "profile") return;

    const loggedInUser = getSessionUser();
    if (!loggedInUser) return;
    const profileMap = {
      "profile-name-value":     loggedInUser.name     || "",
      "profile-email-value":    loggedInUser.email    || "",
      "profile-phone-value":    loggedInUser.phone    || "",
      "profile-location-value": loggedInUser.location || ""
    };

    Object.keys(profileMap).forEach(function (elementId) {
      const el = document.getElementById(elementId);
      if (el) el.textContent = profileMap[elementId];
    });
    
    const profileInitial = document.getElementById("profile-avatar-initial");
    if (profileInitial) {
      const safeName = escapeHTML(String(loggedInUser.name || "U").trim());
      profileInitial.textContent = safeName.charAt(0).toUpperCase() || "U";
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
    const pageType     = document.body.dataset.pageType || "";
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
    if (redirectIfAuthenticationStateMismatchesPage()) return;
    setupThemeToggle();
    renderAuthNav();
    handleLoginPage();
    handleSignupPage();
    populateProfilePage();
    populateDashboardPage();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
