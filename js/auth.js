(function () {
  const USERS_KEY = "users";
  const SESSION_KEY = "loggedInUser";

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
    return String(email || "")
      .trim()
      .toLowerCase();
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"'`\/]/g, function (character) {
      return (
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
          "`": "&#96;",
          "/": "&#47;",
        }[character] || character
      );
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
        setFieldError(
          "login-password",
          "Password must be at least 6 characters.",
        );
        hasError = true;
      }

      if (hasError) {
        setFormMessage(
          "login-form",
          "Please fix the highlighted fields.",
          "error",
        );
        return;
      }

      const users = getUsers();
      const matchedUser = users.find(
        (user) =>
          normalizeEmail(user.email) === email &&
          String(user.password || "") === password,
      );

      if (!matchedUser) {
        setFormMessage(
          "login-form",
          "Invalid email or password. Please try again.",
          "error",
        );
        return;
      }

      setSessionUser({
        name: matchedUser.name,
        email: matchedUser.email,
        phone: matchedUser.phone,
        location: matchedUser.location,
        loginAt: new Date().toISOString(),
      });

      setFormMessage(
        "login-form",
        "Login successful. Redirecting...",
        "success",
      );
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
        [
          "signup-name",
          "signup-email",
          "signup-password",
          "signup-phone",
          "signup-location",
        ],
        "signup-form",
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
        setFieldError(
          "signup-password",
          "Password must be at least 6 characters.",
        );
        hasError = true;
      }

      if (!validatePhone(phone)) {
        setFieldError(
          "signup-phone",
          "Phone number must contain exactly 10 digits.",
        );
        hasError = true;
      }

      if (!location) {
        setFieldError("signup-location", "Location is required.");
        hasError = true;
      }

      const users = getUsers();
      const emailAlreadyExists = users.some(
        (user) => normalizeEmail(user.email) === email,
      );
      if (emailAlreadyExists) {
        setFieldError(
          "signup-email",
          "This email is already registered. Please log in.",
        );
        hasError = true;
      }

      if (hasError) {
        setFormMessage(
          "signup-form",
          "Please fix the highlighted fields.",
          "error",
        );
        return;
      }

      const newUser = {
        name,
        email,
        password,
        phone,
        location,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      writeJSON(USERS_KEY, users);

      // Auto-login after successful registration as requested.
      setSessionUser({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        location: newUser.location,
        loginAt: new Date().toISOString(),
      });

      setFormMessage(
        "signup-form",
        "Account created successfully. Redirecting...",
        "success",
      );
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
      "profile-location-value": loggedInUser.location || "",
    };

    Object.keys(profileMap).forEach((elementId) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = profileMap[elementId];
      }
    });

    const profileInitial = document.getElementById("profile-avatar-initial");
    if (profileInitial) {
      profileInitial.textContent =
        String(loggedInUser.name || "U")
          .trim()
          .charAt(0)
          .toUpperCase() || "U";
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

    handleLoginPage();
    handleSignupPage();
    populateProfilePage();
    populateDashboardPage();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
