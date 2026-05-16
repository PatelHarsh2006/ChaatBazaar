// ===== navbar.js =====
// Shared across all pages — injects avatar or Login link into #nav-profile-slot

(function () {
  const session = localStorage.getItem('cb_session');
  const slot = document.getElementById('nav-profile-slot');
  if (!slot) return;

  if (session) {
    const users = JSON.parse(localStorage.getItem('cb_users') || '{}');
    const user = users[session] || {};
    const name = user.name || 'User';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    slot.innerHTML = `
      <div class="nav-avatar-wrapper" id="nav-avatar-wrapper">
        <button class="nav-avatar-btn" id="nav-avatar-btn"
          aria-label="Open profile menu" aria-haspopup="true" aria-expanded="false">
          ${initials}
        </button>
        <div class="nav-profile-dropdown" id="nav-profile-dropdown" role="menu">
          <div class="npd-user">
            <div class="npd-initials">${initials}</div>
            <div class="npd-user-info">
              <div class="npd-name">${name}</div>
              <div class="npd-email">${session}</div>
            </div>
          </div>
          <div class="npd-divider"></div>
          <a href="profile.html#profile"    class="npd-item" role="menuitem">My Profile</a>
          <a href="profile.html#addresses"  class="npd-item" role="menuitem">Saved Addresses</a>
          <a href="profile.html#orders"     class="npd-item" role="menuitem">Order History</a>
          <div class="npd-divider"></div>
          <button class="npd-item npd-logout" id="nav-logout-btn" role="menuitem">Logout</button>
        </div>
      </div>
    `;

    const btn = document.getElementById('nav-avatar-btn');
    const dropdown = document.getElementById('nav-profile-dropdown');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });

    document.getElementById('nav-logout-btn').addEventListener('click', () => {
      localStorage.removeItem('cb_session');
      window.location.href = 'index.html';
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#nav-avatar-wrapper')) {
        dropdown.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

  } else {
    slot.innerHTML = `<a href="auth.html" class="nav-login-link">Login</a>`;
  }
})();
