// ===== auth.js =====
const USERS_KEY         = 'cb_users';
const SESSION_KEY       = 'cb_session';
const LEGACY_USERS_KEY  = 'users';
const LEGACY_SESSION_KEY = 'session';

function getSessionEmail() {
  return localStorage.getItem(SESSION_KEY) || localStorage.getItem(LEGACY_SESSION_KEY);
}

function getUsers() {
  const raw = localStorage.getItem(USERS_KEY) || localStorage.getItem(LEGACY_USERS_KEY) || '{}';
  const users = JSON.parse(raw || '{}');
  if (!localStorage.getItem(USERS_KEY) && localStorage.getItem(LEGACY_USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  return users;
}

// Redirect if already logged in
if (getSessionEmail()) {
  window.location.href = 'profile.html';
}

// ---- Tab switching ----
const tabLogin  = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const formLogin  = document.getElementById('form-login');
const formSignup = document.getElementById('form-signup');

function switchTab(tab) {
  const isLogin = tab === 'login';
  tabLogin.classList.toggle('active', isLogin);
  tabSignup.classList.toggle('active', !isLogin);
  formLogin.classList.toggle('active', isLogin);
  formSignup.classList.toggle('active', !isLogin);
}

tabLogin.addEventListener('click',  () => switchTab('login'));
tabSignup.addEventListener('click', () => switchTab('signup'));

// Open signup tab if URL says so
if (new URLSearchParams(window.location.search).get('tab') === 'signup') {
  switchTab('signup');
}

// ---- Toggle password visibility ----
document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? '🙈' : '👁️';
  });
});

// ---- Login ----
formLogin.addEventListener('submit', (e) => {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl  = document.getElementById('login-error');

  const users = getUsers();
  if (!users[email]) {
    errorEl.textContent = 'No account found with this email.';
    return;
  }
  if (users[email].password !== password) {
    errorEl.textContent = 'Incorrect password.';
    return;
  }
  errorEl.textContent = '';
  localStorage.setItem(SESSION_KEY, email);
  localStorage.setItem(LEGACY_SESSION_KEY, email);

  const redirect = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
  window.location.href = redirect;
});

// ---- Sign Up ----
formSignup.addEventListener('submit', (e) => {
  e.preventDefault();
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const phone    = document.getElementById('signup-phone').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm  = document.getElementById('signup-confirm').value;
  const errorEl  = document.getElementById('signup-error');

  if (password !== confirm) {
    errorEl.textContent = 'Passwords do not match.';
    return;
  }
  if (password.length < 6) {
    errorEl.textContent = 'Password must be at least 6 characters.';
    return;
  }

  const users = getUsers();
  if (users[email]) {
    errorEl.textContent = 'An account with this email already exists.';
    return;
  }

  users[email] = { name, email, phone, password };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(LEGACY_USERS_KEY, JSON.stringify(users));
  localStorage.setItem(SESSION_KEY, email);
  localStorage.setItem(LEGACY_SESSION_KEY, email);
  errorEl.textContent = '';
  window.location.href = 'profile.html';
});
