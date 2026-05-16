// ===== profile.js =====
const SESSION_KEY = 'cb_session';
const USERS_KEY   = 'cb_users';

// Guard — redirect if not logged in
const sessionEmail = localStorage.getItem(SESSION_KEY);
if (!sessionEmail) {
  window.location.href = 'auth.html?redirect=profile.html';
}

const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
const currentUser = users[sessionEmail] || {};

const ADDR_KEY   = `cb_addresses_${sessionEmail}`;
const ORDERS_KEY = `cb_orders_${sessionEmail}`;

// ---- Populate sidebar ----
function getInitials(name) {
  return (name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

document.getElementById('sidebar-initials').textContent = getInitials(currentUser.name);
document.getElementById('sidebar-name').textContent     = currentUser.name  || 'User';
document.getElementById('sidebar-email').textContent    = sessionEmail;

// ---- Section switching ----
const navItems   = document.querySelectorAll('.profile-nav-item');
const panels     = document.querySelectorAll('.profile-panel');

function switchSection(hash) {
  const target = hash.replace('#', '') || 'profile';
  navItems.forEach(item => item.classList.toggle('active', item.dataset.section === target));
  panels.forEach(panel => panel.classList.toggle('active', panel.id === `panel-${target}`));

  // Load panel content
  if (target === 'profile')   loadProfilePanel();
  if (target === 'addresses') loadAddressPanel();
  if (target === 'orders')    loadOrdersPanel();
}

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    history.pushState(null, '', `#${section}`);
    switchSection(`#${section}`);
  });
});

window.addEventListener('hashchange', () => switchSection(window.location.hash));

// ---- Logout ----
document.getElementById('profile-logout-btn').addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
});

// ==============================
// PANEL: My Profile
// ==============================
function loadProfilePanel() {
  document.getElementById('edit-name').value  = currentUser.name  || '';
  document.getElementById('edit-email').value = currentUser.email || sessionEmail;
  document.getElementById('edit-phone').value = currentUser.phone || '';
}

document.getElementById('profile-edit-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name  = document.getElementById('edit-name').value.trim();
  const phone = document.getElementById('edit-phone').value.trim();
  const msg   = document.getElementById('profile-save-msg');

  users[sessionEmail].name  = name;
  users[sessionEmail].phone = phone;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Update sidebar
  document.getElementById('sidebar-initials').textContent = getInitials(name);
  document.getElementById('sidebar-name').textContent     = name;

  msg.textContent = '✅ Profile saved successfully!';
  setTimeout(() => { msg.textContent = ''; }, 3000);
});

// ==============================
// PANEL: Saved Addresses
// ==============================
function getAddresses() {
  return JSON.parse(localStorage.getItem(ADDR_KEY) || '[]');
}
function saveAddresses(arr) {
  localStorage.setItem(ADDR_KEY, JSON.stringify(arr));
}

function loadAddressPanel() {
  const addresses  = getAddresses();
  const list       = document.getElementById('address-list');
  const emptyMsg   = document.getElementById('address-empty');

  list.innerHTML = '';

  if (addresses.length === 0) {
    emptyMsg.style.display = 'block';
  } else {
    emptyMsg.style.display = 'none';
    addresses.forEach((addr, idx) => {
      const card = document.createElement('div');
      card.className = 'addr-card';
      card.innerHTML = `
        <div class="addr-card-info">
          <span class="addr-label">${addr.label}</span>
          <span class="addr-text">${addr.address}</span>
        </div>
        <button class="addr-delete-btn" data-idx="${idx}" aria-label="Delete address">🗑️</button>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.addr-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const arr = getAddresses();
        arr.splice(Number(btn.dataset.idx), 1);
        saveAddresses(arr);
        loadAddressPanel();
      });
    });
  }
}

document.getElementById('add-address-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const label   = document.getElementById('addr-label').value.trim();
  const address = document.getElementById('addr-text').value.trim();
  const msg     = document.getElementById('addr-save-msg');

  if (!label || !address) return;

  const arr = getAddresses();
  arr.push({ label, address });
  saveAddresses(arr);

  document.getElementById('addr-label').value = '';
  document.getElementById('addr-text').value  = '';
  msg.textContent = '✅ Address saved!';
  setTimeout(() => { msg.textContent = ''; }, 2000);
  loadAddressPanel();
});

// ==============================
// PANEL: Order History
// ==============================
function loadOrdersPanel() {
  const orders   = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  const list     = document.getElementById('orders-list');
  const emptyMsg = document.getElementById('orders-empty');

  list.innerHTML = '';

  if (orders.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';
  // Show newest first
  [...orders].reverse().forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';
    const itemsHtml = order.items.map(i =>
      `<li>${i.name} × ${i.quantity} — ₹${i.price * i.quantity}</li>`
    ).join('');

    card.innerHTML = `
      <div class="order-card-header">
        <span class="order-id">Order #${order.id}</span>
        <span class="order-date">${new Date(order.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
      </div>
      <ul class="order-items">${itemsHtml}</ul>
      <div class="order-total">Total: <strong>₹${order.total}</strong></div>
    `;
    list.appendChild(card);
  });
}

// ---- Init ----
switchSection(window.location.hash || '#profile');
