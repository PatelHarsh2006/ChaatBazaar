let menuItems = [];
let currentCategory = "All";
let orders = JSON.parse(localStorage.getItem("chaatOrders")) || [];

let cart = [];
let loyaltyPointsApplied = false;

const COUPON_STORAGE_KEY = "chaatCoupon";

const coupons = {
  WELCOME10: { type: "percent", value: 10 },
  SAVE50: { type: "flat", value: 50 }
};

let activeCoupon = null;

// ===== DOM ELEMENTS =====
const specialsContainer = document.getElementById("specials-cards");
const menuContainer = document.getElementById("menu-cards") || document.getElementById("menu-container");
const cartCount = document.getElementById("cart-count");
const cartSidebar = document.getElementById("cart-sidebar");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total") || document.getElementById("total-price");
const checkoutBtn = document.getElementById("checkout-btn");

const couponCodeInput = document.getElementById("coupon-code-input");
const applyCouponBtn = document.getElementById("apply-coupon-btn");
const removeCouponBtn = document.getElementById("remove-coupon-btn");
const couponMessage = document.getElementById("coupon-message");

function formatPrice(price) {
  return `₹${Number(price || 0).toFixed(0)}`;
}

function getCartSubtotal() {
  return cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
}

// ===== COUPON =====
function calculateCouponDiscount(subtotal) {
  if (!activeCoupon) return 0;

  if (activeCoupon.type === "percent") {
    return Math.min((subtotal * activeCoupon.value) / 100, subtotal);
  }

  if (activeCoupon.type === "flat") {
    return Math.min(activeCoupon.value, subtotal);
  }

  return 0;
}

function validateCoupon(code) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return { valid: false, message: "Enter coupon code" };
  if (!coupons[c]) return { valid: false, message: "Invalid coupon" };
  return { valid: true, code: c, coupon: coupons[c] };
}

// ===== SEARCH HELPERS =====
function highlightText(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return String(text).replace(regex, "<mark>$1</mark>");
}

function fuzzyMatch(t, q) {
  if (!t || !q) return false;
  t = t.toLowerCase();
  q = q.toLowerCase();
  return t.includes(q);
}

// ===== DISCOUNT CALC =====
function getDiscountPercent(item) {
  if (!item.originalPrice || item.originalPrice <= item.price) return 0;
  return Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
}

// ===== CARD UI (FIXED + IMPROVED DISCOUNT UI) =====
function createCard(item, query = "") {
  const card = document.createElement("article");
  card.className = "card";

  const discount = getDiscountPercent(item);
  const hasDiscount = discount > 0;

  const rating = "⭐".repeat(Math.round(item.rating || 5));
  const spice = item.spice === "High" ? "🌶️🌶️🌶️" : item.spice === "Medium" ? "🌶️🌶️" : "🌶️";

  const dietary = item.dietary
    ? item.dietary.map(d => `<span class="tag">${d}</span>`).join(" ")
    : "";

 const priceHTML = hasDiscount
  ? `
    <div class="price-wrapper">
      
      <div class="discount-ribbon">🔥 ${discount}% OFF</div>

      <div class="price-row">
        <span class="original-price">₹${item.originalPrice}</span>
        <span class="final-price">${formatPrice(item.price)}</span>
      </div>

      <div class="savings-text">
        You save ₹${item.originalPrice - item.price}
      </div>

    </div>
  `
  : `
    <div class="price-wrapper">
      <div class="price-row">
        <span class="final-price">${formatPrice(item.price)}</span>
      </div>
    </div>
  `;

  card.innerHTML = `
    <img src="${item.image}" alt="${item.name}" loading="lazy"/>

    <div class="card-content">
      <div class="meta">
        <span>${rating}</span>
        <span>${spice}</span>
      </div>

      <h3>${highlightText(item.name, query)}</h3>
      <p>${highlightText(item.description, query)}</p>

      <div class="tags">${dietary}</div>
    </div>

    <div class="card-footer">
      <div class="price-box">
        ${priceHTML}
      </div>

      <button class="add-btn">Add</button>
    </div>
  `;

  card.querySelector(".add-btn").addEventListener("click", () => {
    addToCart(item.id);
  });

  return card;
}

// ===== FILTER =====
function applyFilters() {
  if (!menuContainer) return;

  let filtered = [...menuItems];

  const search = document.getElementById("search-input")?.value?.toLowerCase();

  if (currentCategory !== "All") {
    filtered = filtered.filter(i => i.category === currentCategory);
  }

  if (search) {
    filtered = filtered.filter(
      i => fuzzyMatch(i.name, search) || fuzzyMatch(i.description, search)
    );
  }

  menuContainer.innerHTML = "";

  if (filtered.length === 0) {
    menuContainer.innerHTML = `<p>No items found</p>`;
    return;
  }

  filtered.forEach(item => {
    menuContainer.appendChild(createCard(item, search));
  });
}

// ===== CART =====
function addToCart(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;

  const existing = cart.find(c => c.item.id === id);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ item, quantity: 1 });
  }

  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.item.id !== id);
  renderCart();
}

function renderCart() {
  if (!cartItemsContainer) return;

  cartItemsContainer.innerHTML = "";

  let subtotal = getCartSubtotal();
  let discount = calculateCouponDiscount(subtotal);
  let total = subtotal - discount;

  cart.forEach(c => {
    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <span>${c.item.name} x ${c.quantity}</span>
      <span>${formatPrice(c.item.price * c.quantity)}</span>
      <button>Remove</button>
    `;

    div.querySelector("button").onclick = () => removeFromCart(c.item.id);

    cartItemsContainer.appendChild(div);
  });

  if (cartTotal) {
    cartTotal.innerHTML = `
      <div>Subtotal: ${formatPrice(subtotal)}</div>
      <div>Discount: -${formatPrice(discount)}</div>
      <div><b>Total: ${formatPrice(total)}</b></div>
    `;
  }

  if (cartCount) {
    cartCount.textContent = cart.reduce((s, c) => s + c.quantity, 0);
  }
}

// ===== COUPON APPLY =====
function applyCoupon() {
  const result = validateCoupon(couponCodeInput?.value);

  if (!result.valid) {
    alert(result.message);
    return;
  }

  activeCoupon = { code: result.code, ...result.coupon };
  alert("Coupon Applied!");
  renderCart();
}

// ===== INIT =====
async function init() {
  const res = await fetch("data/menu.json");
  menuItems = await res.json();

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentCategory = btn.dataset.filter;
      applyFilters();
    });
  });

  document.getElementById("search-input")?.addEventListener("input", applyFilters);

  applyCouponBtn?.addEventListener("click", applyCoupon);

  applyFilters();
  renderCart();
}

document.addEventListener("DOMContentLoaded", init);