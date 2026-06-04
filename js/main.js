// ===== Global State =====
let menuItems = [];
let currentCategory = "All";
let orders = JSON.parse(localStorage.getItem('chaatOrders')) || [];
 
// Initialize cart from cart manager (will be set after DOM loads)
let cart = [];
let loyaltyPointsApplied = false;
 
// Will be initialized in setupCartManager() after document loads
function setupCartManager() {
  if (!window.cartManager) {
    console.error("cartManager is not defined");
    return;
  }

  cart = cartManager.getItems();
 
  // Subscribe to cart changes to keep cart variable in sync
  cartManager.subscribe((items) => {
    cart = [...items];
  });
 
  // Validate cart integrity
  cartManager.validate();
}
 
async function loadMenuData() {
  try {
    const response = await fetch("data/menu.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    menuItems = await response.json();
  } catch (error) {
    console.warn("Failed to load menu data via fetch, attempting fallback script:", error);
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "data/menu-fallback.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      if (window.MENU_FALLBACK) {
        menuItems = window.MENU_FALLBACK;
        console.log("Successfully loaded menu data from fallback script.");
      } else {
        throw new Error("window.MENU_FALLBACK is not defined.");
      }
    } catch (fallbackError) {
      console.error("Failed to load fallback menu data:", fallbackError);
      menuItems = [];
    }
  }
}
 
// ===== Globals =====
const specialsContainer   = document.getElementById("specials-cards");
// FIX: menu.html uses id="menu-container"; index.html uses id="menu-cards"
const menuContainer       = document.getElementById("menu-cards") || document.getElementById("menu-container");
const cartCount           = document.getElementById("cart-count");
const cartSidebar         = document.getElementById("cart-sidebar");
const cartItemsContainer  = document.getElementById("cart-items");
const cartTotal           = document.getElementById("cart-total") || document.getElementById("total-price");
const checkoutBtn         = document.getElementById("checkout-btn");
 
const couponCodeInput     = document.getElementById("coupon-code-input");
const applyCouponBtn      = document.getElementById("apply-coupon-btn");
const removeCouponBtn     = document.getElementById("remove-coupon-btn");
const couponMessage       = document.getElementById("coupon-message");
const couponSubtotalEl    = document.getElementById("coupon-subtotal");
const couponDiscountEl    = document.getElementById("coupon-discount");
const couponDiscountRow   = document.getElementById("coupon-discount-row");
const couponGrandTotalEl  = document.getElementById("coupon-grand-total");
const appliedCouponLabel  = document.getElementById("applied-coupon-label");
 
const COUPON_STORAGE_KEY = 'chaatCoupon';
const coupons = {
  WELCOME10: { type: "percent", value: 10 },
  SAVE50:    { type: "flat",    value: 50  }
};
let activeCoupon = null;
 
// Cart is managed by CartManager - initialized in main startup
 
function formatPrice(price) {
  return `₹${price}`;
}
 
function getCartSubtotal() {
  return cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
}
 
function loadCouponFromStorage() {
  const stored = localStorage.getItem(COUPON_STORAGE_KEY);
  if (!stored) return null;
 
  try {
    const data = JSON.parse(stored);
    if (!data || !data.code) return null;
 
    const code   = String(data.code).trim().toUpperCase();
    const coupon = coupons[code];
    if (!coupon) {
      localStorage.removeItem(COUPON_STORAGE_KEY);
      return null;
    }
 
    activeCoupon = { code, ...coupon };
    return activeCoupon;
  } catch (error) {
    localStorage.removeItem(COUPON_STORAGE_KEY);
    return null;
  }
}
 
function saveCouponToStorage() {
  if (activeCoupon) {
    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify({ code: activeCoupon.code, appliedAt: Date.now() }));
  } else {
    localStorage.removeItem(COUPON_STORAGE_KEY);
  }
}
 
function validateCouponCode(input) {
  const code = String(input || '').trim().toUpperCase();
 
  if (!code) {
    return { valid: false, message: 'Enter a coupon code.' };
  }
 
  const coupon = coupons[code];
  if (!coupon) {
    return { valid: false, message: 'Invalid or expired coupon.' };
  }
 
  return { valid: true, code, coupon };
}
 
function calculateCouponDiscount(subtotal) {
  if (!activeCoupon) return 0;
 
  if (activeCoupon.type === 'percent') {
    return Math.min(Math.round((subtotal * activeCoupon.value) / 100), subtotal);
  }
 
  if (activeCoupon.type === 'flat') {
    return Math.min(activeCoupon.value, subtotal);
  }
 
  return 0;
}
 
function showCouponMessage(message, type = 'success') {
  if (couponMessage) {
    couponMessage.textContent = message;
    couponMessage.classList.toggle('success', type === 'success');
    couponMessage.classList.toggle('error',   type === 'error');
  }
 
  showToast(type === 'success' ? `✅ ${message}` : `⚠️ ${message}`);
}
 
function updateCartSummary() {
  const subtotal = getCartSubtotal();
  const discount = calculateCouponDiscount(subtotal);
  const total    = Math.max(subtotal - discount, 0);
 
  if (couponSubtotalEl)  couponSubtotalEl.textContent  = formatPrice(subtotal);
  if (couponDiscountEl)  couponDiscountEl.textContent  = `- ${formatPrice(discount)}`;
  if (couponDiscountRow) couponDiscountRow.style.display = discount > 0 ? 'flex' : 'none';
 
  if (couponGrandTotalEl) {
    couponGrandTotalEl.textContent = formatPrice(total);
  } else if (cartTotal) {
    cartTotal.textContent = `Total: ${formatPrice(total)}`;
  }
 
  if (appliedCouponLabel) {
    appliedCouponLabel.textContent = activeCoupon ? `Coupon applied: ${activeCoupon.code}` : '';
  }
 
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
}
 
function applyCouponCode() {
  const result = validateCouponCode(couponCodeInput ? couponCodeInput.value : '');
 
  if (!result.valid) {
    activeCoupon = null;
    saveCouponToStorage();
    showCouponMessage(result.message, 'error');
    updateCartSummary();
    return false;
  }
 
  activeCoupon = { code: result.code, ...result.coupon };
  saveCouponToStorage();
  showCouponMessage(`${result.code} applied!`, 'success');
  if (removeCouponBtn) removeCouponBtn.style.display = 'inline-flex';
  updateCartSummary();
  return true;
}
 
function removeCoupon() {
  activeCoupon = null;
  saveCouponToStorage();
 
  if (couponCodeInput) couponCodeInput.value = '';
  if (removeCouponBtn) removeCouponBtn.style.display = 'none';
  showCouponMessage('Coupon removed.', 'success');
  updateCartSummary();
}
 
function setupCouponListeners() {
  if (applyCouponBtn) {
    applyCouponBtn.addEventListener('click', applyCouponCode);
  }
 
  if (couponCodeInput) {
    couponCodeInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyCouponCode();
      }
    });
  }
 
  if (removeCouponBtn) {
    removeCouponBtn.addEventListener('click', removeCoupon);
  }
 
  if (loadCouponFromStorage() && couponCodeInput) {
    couponCodeInput.value = activeCoupon.code;
  }
 
  if (activeCoupon && removeCouponBtn) {
    removeCouponBtn.style.display = 'inline-flex';
  }
 
  updateCartSummary();
}
 
// ===== Fuzzy Match & Highlighter Utilities =====
function fuzzyMatch(target, query) {
  if (!target || !query) return false;

  const t = target.toLowerCase();
  const q = query.toLowerCase();
 
  // 1. Direct Substring Match
  if (t.includes(q)) return true;
 
  // 2. Fuzzy sequencing character lookup
  let qIdx = 0;

  for (let i = 0; i < t.length; i++) {
    if (t[i] === q[qIdx]) {
      qIdx++;

      if (qIdx === q.length) {
        return true;
      }
    }
  }

  return false;
}
 
function highlightText(text, query) {
  if (!text)  return "";
  if (!query) return text;

  const escapedQuery = query.replace(
    /[-\/\\^$*+?.()|[\]{}]/g,
    "\\$&"
  );

  const regex = new RegExp(`(${escapedQuery})`, "gi");
  return text.replace(regex, "<mark class='highlight'>$1</mark>");
}
 
// ===== Render Functions =====
 
function createCard(item, highlightQuery = "") {
  const card = document.createElement("article");

  card.className = "card";
  card.tabIndex  = 0;
  card.setAttribute("aria-label", `${item.name} - ${item.description}. Price: ${formatPrice(item.price)}.`);
 
  const ratingStars  = "⭐".repeat(Math.round(item.rating || 5));
  const dietaryTags  = item.dietary
    ? item.dietary.map(d => `<span class="tag tag-${d}">${d}</span>`).join(" ")
    : "";
  const spiceIcon    = item.spice === "High" ? "🌶️🌶️🌶️" : item.spice === "Medium" ? "🌶️🌶️" : "🌶️";
 
  const highlightedName = highlightText(item.name,        highlightQuery);
  const highlightedDesc = highlightText(item.description, highlightQuery);
 
  const isAvailable      = item.available !== undefined ? item.available : true;
  const outOfStockBadge  = !isAvailable ? '<span class="out-of-stock-badge">Out of Stock ❌</span>' : '';
  const buttonDisabled   = !isAvailable ? 'disabled' : '';
  const buttonColor      = isAvailable  ? '#28a745'  : '#cccccc';
 
  card.innerHTML = `
    <img src="${item.image}" 
         alt="${item.name}" 
         loading="lazy" />

    <div class="card-content">

      <div class="card-meta">
        <span class="rating" title="Rating: ${item.rating || 5.0}">${ratingStars} ${item.rating || '5.0'}</span>
        <span class="spice"  title="Spice level: ${item.spice}">${spiceIcon}</span>
      </div>

      <h3>${highlightedName}</h3>

      <p>${highlightedDesc}</p>
      <div class="card-tags">${dietaryTags}</div>
      ${outOfStockBadge}
    </div>

    <div class="card-footer">
newFeatures
  <div class="price-section">
    <span class="original-price">
      ₹${item.originalPrice}
    </span>

    <span class="price">
      ${formatPrice(item.price)}
    </span>

    <span class="discount-badge">
      ${Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
    </span>
  </div>

  <button class="add-btn" aria-label="Add ${item.name} to cart">
    Add
  </button>
  </div>

      <span class="price">${formatPrice(item.price)}</span>
      <button class="add-btn"
        aria-label="Add ${item.name} to cart"
        ${buttonDisabled}
        style="background-color:${buttonColor}"
      >
        Add
      </button>

    </div>
main
  `;
 
  const addBtn = card.querySelector(".add-btn");
  if (isAvailable) {
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      addToCart(item.id);
    });
  } else {
    addBtn.addEventListener("click", () => alert(`${item.name} is currently out of stock!`));
  }
 
  card.addEventListener("click", () => {
    if (typeof RecentlyViewed !== 'undefined') {
      RecentlyViewed.addItem(item);
      renderRecentlyViewed();
    }
  });
 
  return card;
}
 
function renderSpecials() {
  if (!specialsContainer) return;

  const specials = menuItems.slice(0, 3);
 
  showSkeletonCards(specialsContainer, specials.length);
 
  setTimeout(() => {
    specialsContainer.innerHTML = "";
    specials.forEach(item => specialsContainer.appendChild(createCard(item)));
  }, 1500);
}
 
function renderMenu(filter = "All") {
  currentCategory = filter;
  applyAllFilters();
}
 
function renderRecentlyViewed() {
  const recentlyViewedContainer = document.getElementById("recently-viewed-cards");
  const recentlyViewedSection   = document.getElementById("recently-viewed");
  if (!recentlyViewedContainer || !recentlyViewedSection) return;
 
  if (typeof RecentlyViewed === 'undefined') return;
  const recentItems = RecentlyViewed.getItems();
  recentlyViewedContainer.innerHTML = "";
 
  if (recentItems.length === 0) {
    recentlyViewedSection.style.display = "none";
    return;
  }
 
  recentlyViewedSection.style.display = "block";
  recentItems.forEach(item => recentlyViewedContainer.appendChild(createCard(item)));
}

 newFeatures
// Unified Interactive Filter Engine =====
function renderFavorites() {
  const favoritesContainer = document.getElementById("favorites-container");
  if (!favoritesContainer) return;
 
  if (typeof RecentlyViewed === 'undefined') return;
  const recentItems = RecentlyViewed.getItems();
  favoritesContainer.innerHTML = "";
 
  if (recentItems.length === 0) {
    recentlyViewedSection.style.display =
      "none";

    return;
  }
 
  recentItems.forEach(item => favoritesContainer.appendChild(createCard(item)));
}
 
// ===== Unified Interactive Filter Engine =====

function applyAllFilters() {
  if (!menuContainer) return;
 
  showSkeletonCards(menuContainer, 4);
 
  setTimeout(() => {
    menuContainer.innerHTML = "";
 
    const searchInput = document.getElementById("search-input");
    const query       = searchInput ? searchInput.value.trim() : "";
 
    const priceSlider = document.getElementById("price-range-slider");
    // FIX: use slider's own max as fallback so all items show when slider is at max
    const maxPrice    = priceSlider ? parseFloat(priceSlider.value) : Infinity;
 
    const spiceSelect   = document.getElementById("spice-level-select");
    const selectedSpice = spiceSelect ? spiceSelect.value : "All";
 
    const ratingSelect = document.getElementById("rating-select");
    const minRating    = ratingSelect ? ratingSelect.value : "All";
 
    const veganCheck = document.getElementById("dietary-vegan");
    const gfCheck    = document.getElementById("dietary-gf");
 
    let filtered = menuItems;
 
    if (currentCategory !== "All") {
      filtered = filtered.filter(
        (item) =>
          item.category === currentCategory
      );
    }
 
    if (query) {
      filtered = filtered.filter(item =>
        fuzzyMatch(item.name, query) ||
        (item.description && fuzzyMatch(item.description, query)) ||
        (item.category    && fuzzyMatch(item.category,    query))
      );
    }
 
    filtered = filtered.filter(item => item.price <= maxPrice);
 
    if (selectedSpice !== "All") {
      filtered = filtered.filter(
        (item) =>
          item.spice === selectedSpice
      );
    }
 
    if (minRating !== "All") {
      filtered = filtered.filter(
        (item) =>
          (item.rating || 5) >=
          parseFloat(minRating)
      );
    }
 
    if (veganCheck && veganCheck.checked) {
      filtered = filtered.filter(item => item.dietary && item.dietary.includes("vegan"));
    }

    // Gluten Free
    if (gfCheck && gfCheck.checked) {
      filtered = filtered.filter(
        (item) =>
          item.dietary &&
          item.dietary.includes(
            "gluten-free"
          )
      );
    }
 
    if (filtered.length === 0) {
      menuContainer.innerHTML = `
        <p style="
          text-align:center;
          color:#bf360c;
          font-weight:600;
          margin-top:2rem;
        ">
          No items found matching your filters.
        </p>
      `;

      return;
    }
 
    filtered.forEach(item => menuContainer.appendChild(createCard(item, query)));
  }, 800);
}
 
function renderCart() {
  if (!cartItemsContainer) return;
 
  if (cart.length > 0) {
    showSkeletonCartItems(cart.length);
  }
 
  setTimeout(() => {
    cartItemsContainer.innerHTML = "";
 
    if (cart.length === 0) {
      cartItemsContainer.innerHTML =
        `<p style="text-align:center;color:#5d4037;margin-top:2rem;">
           Your cart is empty.
         </p>`;
      if (checkoutBtn) checkoutBtn.disabled = true;
      if (cartTotal)   cartTotal.textContent = "Total: ₹0";
      updateCartSummary();
      return;
    }
 
    cart.forEach(({ item, quantity }) => {
      const cartItem =
        document.createElement("div");

      cartItem.className = "cart-item";
      cartItem.tabIndex  = 0;
      cartItem.setAttribute(
        "aria-label",
        `${item.name}, quantity ${quantity}, price ${formatPrice(item.price * quantity)}`
      );
 
      cartItem.innerHTML = `
        <img src="${
  item.image ||
  item.img ||
  item.thumbnail ||
  (item.items && item.items[0]?.image) ||
  "https://via.placeholder.com/80"
}" 
alt="${item.name}" />

        <div class="cart-item-info">
          <h4>${item.name}</h4>

          <p>
            ${formatPrice(item.price)} each
          </p>

          <div class="qty-controls">

            <button class="qty-decrease">
              −
            </button>

            <span>${quantity}</span>

            <button class="qty-increase">
              +
            </button>

          </div>
        </div>
        <div style="text-align:right;">
          <p style="font-weight:700;color:#bf360c;">${formatPrice(item.price * quantity)}</p>
          <button class="cart-item-remove">Remove</button>
        </div>
      `;
 
      cartItem.querySelector(".qty-decrease").addEventListener("click", () => removeFromCart(item.id));
      cartItem.querySelector(".qty-increase").addEventListener("click", () => addToCart(item.id));
      cartItem.querySelector(".cart-item-remove").addEventListener("click", () => {
        cartManager.removeItem(item.id);
        updateCartCount();
        updateFavCount();
        renderCart();
      });
 
      cartItemsContainer.appendChild(cartItem);
    });
 
    updateCartSummary();
 
    // Render Loyalty Points Widget
    const points       = typeof loyalty !== 'undefined' ? loyalty.getBalance() : 0;
    const loyaltyDiv   = document.createElement("div");
    loyaltyDiv.className = "cart-loyalty-widget";
 
    const total       = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
    const discountVal = Math.min(points, total);
 
    loyaltyDiv.innerHTML = `
      <div class="loyalty-widget-header">
        <span class="loyalty-icon">🌟</span>
        <div class="loyalty-info">
          <span class="loyalty-title">Loyalty Wallet</span>
          <span class="loyalty-desc">Balance: <strong>${points}</strong> pts (₹${points})</span>
        </div>
      </div>
      ${points > 0 ? `
      <div class="loyalty-redeem-action">
        <label class="loyalty-toggle">
          <input type="checkbox" id="apply-loyalty-checkbox" ${loyaltyPointsApplied ? 'checked' : ''} />
          <span class="toggle-slider"></span>
          <span class="toggle-label">Apply ₹${discountVal} Discount</span>
        </label>
      </div>
      ` : `
      <div class="loyalty-empty-message">
        <span>Earn 10 points for every ₹100 spent!</span>
      </div>
      `}
    `;
 
    cartItemsContainer.appendChild(loyaltyDiv);
 
    const checkbox = loyaltyDiv.querySelector("#apply-loyalty-checkbox");
    if (checkbox) {
      checkbox.addEventListener("change", (e) => {
        loyaltyPointsApplied = e.target.checked;
        const freshDiscount  = Math.min(points, total);
        let totalHtml        = "";
 
        if (loyaltyPointsApplied && points > 0) {
          const finalTotal = total - freshDiscount;
          totalHtml = `
            <div class="cart-total-breakdown">
              <div class="breakdown-row"><span>Subtotal:</span> <span>${formatPrice(total)}</span></div>
              <div class="breakdown-row discount"><span>Loyalty Discount:</span> <span>-${formatPrice(freshDiscount)}</span></div>
              <div class="breakdown-row final"><span>Total:</span> <span>${formatPrice(finalTotal)}</span></div>
            </div>
          `;
        } else {
          totalHtml = `Total: ${formatPrice(total)}`;
        }
 
        if (cartTotal) cartTotal.innerHTML = totalHtml;
      });
    }
 
    // Initial total display
    let totalHtml = "";
    if (loyaltyPointsApplied && points > 0) {
      const finalTotal = total - discountVal;
      totalHtml = `
        <div class="cart-total-breakdown">
          <div class="breakdown-row"><span>Subtotal:</span> <span>${formatPrice(total)}</span></div>
          <div class="breakdown-row discount"><span>Loyalty Discount:</span> <span>-${formatPrice(discountVal)}</span></div>
          <div class="breakdown-row final"><span>Total:</span> <span>${formatPrice(finalTotal)}</span></div>
        </div>
      `;
    } else {
      totalHtml = `Total: ${formatPrice(total)}`;
    }
 
    if (cartTotal)  cartTotal.innerHTML = totalHtml;
    if (checkoutBtn) checkoutBtn.disabled = false;
 
  }, 600);
}
 
function updateCartCount() {
  if (cartCount) {
    const totalCount = cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
    cartCount.textContent = totalCount;
  }
}
 
function updateFavCount() {
  const favCount = document.getElementById("fav-count");
  if (favCount && typeof RecentlyViewed !== 'undefined') {
    favCount.textContent = RecentlyViewed.getItems().length;
  }
}
 
// ===== My Orders Dashboard =====
 
function updateOrderStatuses() {
  let changed = false;
  const now   = Date.now();
 
  orders.forEach(order => {
    if (order.status === "Delivered") return;
 
    const elapsedSeconds = (now - order.timestamp) / 1000;
    let targetStatus = "Pending";
 
    if      (elapsedSeconds >= 45) targetStatus = "Delivered";
    else if (elapsedSeconds >= 25) targetStatus = "On the Way";
    else if (elapsedSeconds >= 10) targetStatus = "Preparing";
 
    if (order.status !== targetStatus) {
      order.status = targetStatus;
      changed      = true;
    }
  });
 
  if (changed) {
    localStorage.setItem('chaatOrders', JSON.stringify(orders));
    renderOrdersList();
  }
}
 
function renderOrdersList() {
  const container = document.getElementById("orders-container");
  if (!container) return;
 
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-orders">
        <h2>No Orders Found</h2>
        <p>You haven't placed any orders yet. Explore our delicious street food menu!</p>
        <a href="menu.html" class="btn-primary" style="display:inline-block;margin-top:1.5rem;text-decoration:none;">Explore Menu</a>
      </div>
    `;
    return;
  }
 
  container.innerHTML = "";
 
  orders.forEach(order => {
    const card = document.createElement("article");
    card.className = "order-card";
 
    const isPreparing = (order.status === "Preparing" || order.status === "On the Way" || order.status === "Delivered") ? "active" : "";
    const isOnWay     = (order.status === "On the Way" || order.status === "Delivered") ? "active" : "";
    const isDelivered = order.status === "Delivered" ? "active" : "";
 
    const statusClass = "status-" + order.status.toLowerCase().replace(/\s+/g, "-");
 
    let itemsHtml = "";
    order.items.forEach(ci => {
      itemsHtml += `
        <div class="order-item-row">
          <span>${ci.item.name} × ${ci.quantity}</span>
          <span>${formatPrice(ci.item.price * ci.quantity)}</span>
        </div>
      `;
    });
 
    card.innerHTML = `
      <div class="order-card-header">
        <div class="order-meta-info">
          <span class="order-id">Order ID: <strong>${order.id}</strong></span>
          <span class="order-date">${order.date}</span>
          ${order.deliveryDistance ? `<span class="order-distance">📍 Distance: ${order.deliveryDistance.toFixed(2)} km</span>` : ""}
        </div>
        <span class="status-badge ${statusClass}">${order.status}</span>
      </div>
 
      <div class="order-timeline">
        <div class="timeline-step active ${order.status === 'Pending' ? 'current' : ''}">
          <div class="step-circle">1</div>
          <span class="step-label">Ordered</span>
        </div>
        <div class="timeline-line ${isPreparing}"></div>
        <div class="timeline-step ${isPreparing} ${order.status === 'Preparing' ? 'current' : ''}">
          <div class="step-circle">2</div>
          <span class="step-label">Preparing</span>
        </div>
        <div class="timeline-line ${isOnWay}"></div>
        <div class="timeline-step ${isOnWay} ${order.status === 'On the Way' ? 'current' : ''}">
          <div class="step-circle">3</div>
          <span class="step-label">On the Way</span>
        </div>
        <div class="timeline-line ${isDelivered}"></div>
        <div class="timeline-step ${isDelivered} ${order.status === 'Delivered' ? 'current' : ''}">
          <div class="step-circle">4</div>
          <span class="step-label">Delivered</span>
        </div>
      </div>
 
      <div class="order-items-list">${itemsHtml}</div>
 
      <div class="order-card-footer">
        ${order.discount && order.discount > 0 ? `
        <div class="order-discount-details" style="font-size:0.9rem;color:#777;margin-bottom:0.5rem;text-align:right;width:100%;">
          <span>Subtotal: ${formatPrice(order.subtotal || (order.total + order.discount))}</span> |
          <span style="color:#e64a19;font-weight:600;">Points Redeemed: ${order.pointsRedeemed || order.discount} (-${formatPrice(order.discount)})</span>
        </div>
        ` : ''}
        ${order.pointsEarned && order.pointsEarned > 0 ? `
        <div class="order-points-earned" style="font-size:0.9rem;color:#28a745;margin-bottom:0.5rem;text-align:right;width:100%;font-weight:600;">
          <span>🌟 Earned +${order.pointsEarned} Loyalty Points</span>
        </div>
        ` : ''}
        <div class="order-total-price">
          <span>Total Paid:</span>
          <strong>${formatPrice(order.total)}</strong>
        </div>
        <button class="btn-reorder" onclick="reorderOrder('${order.id}')">Reorder Items</button>
      </div>
    `;
 
    container.appendChild(card);
  });
}
 
// ===== Global Window Handlers =====
 
window.filterCategory = function (category) {
  currentCategory = category;
 
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach(btn => {
    const isActive = btn.dataset.filter === category;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
 
  applyAllFilters();
  // Scroll to menu container so filtered results are visible
  const menuContainer = document.getElementById('menu-container');
  if (menuContainer) menuContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
 
// FIX: checkout — removed duplicate const declarations that caused SyntaxError
window.checkout = async function () {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return false;
  }
 
  const validationResult = await validateDeliveryLocation();
 
  if (!validationResult.valid) {
    localStorage.setItem(
      "deliveryError",
      JSON.stringify({
        error:              validationResult.error,
        distance:           validationResult.distance,
        restaurantLocation: validationResult.restaurantLocation
      })
    );
    return { deliveryAvailable: false };
  }
 
  // Loyalty points discount
  const subtotal       = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  let loyaltyDiscount  = 0;
  let pointsRedeemed   = 0;
 
  if (loyaltyPointsApplied && typeof loyalty !== 'undefined') {
    const balance    = loyalty.getBalance();
    pointsRedeemed   = Math.min(balance, subtotal);
    loyaltyDiscount  = pointsRedeemed;
    loyalty.redeemPoints(pointsRedeemed);
  }
 
  // Coupon discount (on post-loyalty subtotal)
  const couponDiscount = calculateCouponDiscount(subtotal - loyaltyDiscount);
  const finalTotal     = Math.max(subtotal - loyaltyDiscount - couponDiscount, 0);
 
  // Award loyalty points on final amount paid
  let pointsEarned = 0;
  if (typeof loyalty !== 'undefined') {
    pointsEarned = loyalty.awardPoints(finalTotal);
  }
 
  const newOrder = {
    id:     "CB-" + Math.floor(100000 + Math.random() * 900000),
    date:   new Date().toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour:  '2-digit', minute: '2-digit'
    }),
    timestamp:  Date.now(),
    items:      JSON.parse(JSON.stringify(cart)),
    subtotal:   subtotal,
    discount:   loyaltyDiscount + couponDiscount,
    coupon:     activeCoupon?.code || null,
    pointsRedeemed,
    pointsEarned,
    total:      finalTotal,
    status:     "Pending",
    deliveryAddress: {
      latitude:  validationResult.userLocation.latitude,
      longitude: validationResult.userLocation.longitude,
      source:    validationResult.userLocation.source
    },
    deliveryDistance:   validationResult.distance,
    restaurantLocation: validationResult.restaurantLocation
  };
 
  orders.unshift(newOrder);
  localStorage.setItem('chaatOrders', JSON.stringify(orders));
 
  loyaltyPointsApplied = false;
  activeCoupon         = null;
  saveCouponToStorage();
 
  cartManager.clear();
  updateCartCount();
  updateFavCount();
  renderCart();
 
  if (typeof window.triggerDeliverySimulation === 'function') {
    window.triggerDeliverySimulation();
  } else {
    console.warn('Delivery tracker not ready. Order has been placed.');
  }
 
  return { deliveryAvailable: true };
};
 
window.reorderOrder = function (orderId) {
  const pastOrder = orders.find(o => o.id === orderId);
  if (!pastOrder) return;
 
  pastOrder.items.forEach(orderItem => {
    cartManager.addItem(orderItem.item, orderItem.quantity);
  });
 
  updateCartCount();
  updateFavCount();
  renderCart();
  alert("Items added back to your cart successfully!");
 
  const sidebar = document.getElementById("cart-sidebar");
  if (sidebar) {
    sidebar.setAttribute("aria-hidden", "false");
    sidebar.classList.add("open");
  }
};
 newFeatures

//  Cart Operations 

//  Toast Notification 


 
// ===== Toast Notification =====
 
main
function showToast(message) {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;
 
  toast.textContent = message;
  toast.classList.add("show");
 
  clearTimeout(toast.hideTimeout);
  toast.hideTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}
 
// ===== Cart Operations =====
 
function addToCart(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;
 
  const isAvailable = item.available !== undefined ? item.available : true;
  if (!isAvailable) {
    alert(`${item.name} is currently out of stock!`);
    return;
  }
 
  cartManager.addItem(item, 1);
  updateCartCount();
  updateFavCount();
  renderCart();
  showToast(`🛒 ${item.name} added to cart`);
 
  if (cartCount) {
    cartCount.classList.add("cart-bounce");
    setTimeout(() => cartCount.classList.remove("cart-bounce"), 400);
  }
 
  if (cartSidebar) {
    cartSidebar.setAttribute("aria-hidden", "false");
    cartSidebar.classList.add("open");
  }
}
 
function removeFromCart(id) {
  const cartIndex = cart.findIndex(ci => ci.item.id === id);
  if (cartIndex === -1) return;
 
  const removedItem = cart[cartIndex].item;
  cartManager.decreaseQuantity(id);
  const cartItem = cart.find(
    (ci) => ci.item.id === id
  );

  if (!cartItem) return;

  const removedItem = cartItem.item;

  if (
    typeof cartManager.decreaseQuantity ===
    "function"
  ) {
    cartManager.decreaseQuantity(id);
  } else {
    cartManager.removeItem(id);
  }
  return true;
};

window.placeOrderFromCheckout = function (customerDetails, pricingInfo) {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return null;
  }

  // Award loyalty points on final total paid (10 points per ₹100 spent)
  let pointsEarned = 0;
  if (typeof loyalty !== 'undefined') {
    pointsEarned = loyalty.awardPoints(pricingInfo.grandTotal);
  }

  // Redeem loyalty points if applied
  let pointsRedeemed = pricingInfo.pointsRedeemed || 0;
  if (pointsRedeemed > 0 && typeof loyalty !== 'undefined') {
    loyalty.redeemPoints(pointsRedeemed);
  }

  const finalTotal = pricingInfo.grandTotal;
  const totalDiscount = pricingInfo.couponDiscount + pointsRedeemed;

  // Get selected coordinates from live-tracking.js if available
  const deliveryCoords = window.selectedDeliveryCoords || {
    latitude: window.RESTAURANT_LOCATION?.latitude || 28.6129,
    longitude: window.RESTAURANT_LOCATION?.longitude || 77.2295
  };
  const deliveryDistance = window.selectedDeliveryDistance || 0;

  const newOrder = {
    id: "CB-" + Math.floor(100000 + Math.random() * 900000),
    date: new Date().toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }),
    timestamp: Date.now(),
    items: JSON.parse(JSON.stringify(cart)),
    total: finalTotal,
    discount: totalDiscount,
    coupon: pricingInfo.couponCode || null,
    subtotal: pricingInfo.subtotal,
    pointsRedeemed: pointsRedeemed,
    pointsEarned: pointsEarned,
    status: "Pending",
    customerDetails: {
      name: customerDetails.name,
      phone: customerDetails.phone,
      address: customerDetails.address,
      paymentMethod: customerDetails.paymentMethod
    },
    deliveryAddress: {
      latitude: deliveryCoords.latitude,
      longitude: deliveryCoords.longitude,
      source: "map-selection"
    },
    deliveryDistance: deliveryDistance,
    restaurantLocation: window.RESTAURANT_LOCATION || { latitude: 28.6129, longitude: 77.2295 }
  };

  orders.unshift(newOrder);
  localStorage.setItem('chaatOrders', JSON.stringify(orders));

  // Reset points applied state
  loyaltyPointsApplied = false;

  cartManager.clear();
  updateCartCount();
  updateFavCount();
  renderCart();

  // Re-render orders lists if we are on the orders page
  if (typeof renderOrdersList === 'function') {
    renderOrdersList();
  }
  if (typeof updateOrderStatuses === 'function') {
    updateOrderStatuses();
  }

  return newOrder;
};


window.reorderOrder = function (orderId) {
  const pastOrder = orders.find(o => o.id === orderId);
  if (!pastOrder) return;

  pastOrder.items.forEach(orderItem => {
    cartManager.addItem(orderItem.item, orderItem.quantity);
  });

  updateCartCount();
  updateFavCount();
  renderCart();
  showToast(`🗑️ ${removedItem.name} removed from cart`);
}
 
// ===== Event Listeners =====
 
function setupFilterButtons() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      filterButtons.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      filterCategory(btn.dataset.filter);
    });
  });
}
 
function setupCartToggle() {
  const cartOpenBtn = document.getElementById("cart-open-btn");
  const cartCloseBtn = document.getElementById("cart-close");
  if (!cartOpenBtn || !cartCloseBtn || !cartSidebar) return;
 
  cartOpenBtn.addEventListener("click", (e) => {
    e.preventDefault();
    cartSidebar.setAttribute("aria-hidden", "false");
    cartSidebar.classList.add("open");
  });
 
  cartCloseBtn.addEventListener("click", () => {
    cartSidebar.setAttribute("aria-hidden", "true");
    cartSidebar.classList.remove("open");
  });
 
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cartSidebar.getAttribute("aria-hidden") === "false") {
      cartSidebar.setAttribute("aria-hidden", "true");
      cartSidebar.classList.remove("open");
    }
  });
}
 
function setupOrderNowScroll() {
  const orderNowBtn = document.getElementById("order-now-btn");
  const menuSection = document.getElementById("menu");
  if (!orderNowBtn || !menuSection) return;
 
  orderNowBtn.addEventListener("click", () => {
    menuSection.scrollIntoView({ behavior: "smooth" });
  });
}
 
// ===== Autocomplete & Search =====
 
function setupSearchSuggestions() {
  const searchInput        = document.getElementById("search-input");
  const suggestionsContainer = document.getElementById("search-suggestions");
  if (!searchInput || !suggestionsContainer) return;
 
  function showSuggestions() {
    const query = searchInput.value.trim().toLowerCase();
    suggestionsContainer.innerHTML = "";
 
    if (!query) {
      suggestionsContainer.style.display = "none";
      return;
    }
 
    const matches = menuItems.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.category && item.category.toLowerCase().includes(query))
    ).slice(0, 5);
 
    if (matches.length === 0) {
      const div = document.createElement("div");
      div.className = "suggestion-item no-matches";
      div.textContent = "No matches found";
      suggestionsContainer.appendChild(div);
      suggestionsContainer.style.display = "block";
      return;
    }
 
    matches.forEach(item => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.innerHTML = `
        <span class="suggestion-name">${highlightText(item.name, query)}</span>
        <span class="suggestion-category">${item.category}</span>
      `;
      div.addEventListener("click", () => {
        searchInput.value = item.name;
        suggestionsContainer.style.display = "none";
 
        // On menu.html scroll to top of menu section; on index.html scroll to #menu
        const menuSection = document.getElementById("menu") || document.querySelector(".menu-page");
        if (menuSection) menuSection.scrollIntoView({ behavior: "smooth" });
 
        applyAllFilters();
      });
      suggestionsContainer.appendChild(div);
    });
 
    suggestionsContainer.style.display = "block";
  }
 
  searchInput.addEventListener("input", showSuggestions);
  searchInput.addEventListener("focus", showSuggestions);
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
      suggestionsContainer.style.display = "none";
    }
  );
}
 
function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const searchBtn   = document.getElementById("search-btn");
  if (!searchInput || !searchBtn) return;
 
  function handleSearchClick() {
    const menuSection = document.getElementById("menu") || document.querySelector(".menu-page");
    if (menuSection) menuSection.scrollIntoView({ behavior: "smooth" });
    applyAllFilters();
  }
 
  searchBtn.addEventListener("click", handleSearchClick);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSearchClick();
      const suggestionsContainer = document.getElementById("search-suggestions");
      if (suggestionsContainer) suggestionsContainer.style.display = "none";
    }
  });
}
 
// ===== Advanced Filters Panel =====
 
function setupAdvancedFilters() {
  const toggleBtn  = document.getElementById("filter-toggle-btn");
  const filterPanel = document.getElementById("advanced-filters");
  if (!toggleBtn || !filterPanel) return;
 
  toggleBtn.addEventListener("click", () => {
    const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
    toggleBtn.setAttribute("aria-expanded", !isExpanded);
    filterPanel.style.display = isExpanded ? "none" : "block";
    toggleBtn.classList.toggle("active", !isExpanded);
  });
 
  const priceSlider    = document.getElementById("price-range-slider");
  const priceSliderVal = document.getElementById("price-slider-val");
  if (priceSlider && priceSliderVal) {
    priceSlider.addEventListener("input", () => {
      priceSliderVal.textContent = `₹${priceSlider.value}`;
      priceSlider.setAttribute("aria-valuenow", priceSlider.value);
      applyAllFilters();
    });
  }
 
  const spiceSelect = document.getElementById("spice-level-select");
  if (spiceSelect)  spiceSelect.addEventListener("change", applyAllFilters);
 
  const ratingSelect = document.getElementById("rating-select");
  if (ratingSelect)  ratingSelect.addEventListener("change", applyAllFilters);
 
  const veganCheck = document.getElementById("dietary-vegan");
  if (veganCheck)   veganCheck.addEventListener("change", applyAllFilters);
 
  const gfCheck = document.getElementById("dietary-gf");
  if (gfCheck)   gfCheck.addEventListener("change", applyAllFilters);
 
  const resetBtn = document.getElementById("reset-filters-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (priceSlider) {
        priceSlider.value = priceSlider.max;
        if (priceSliderVal) priceSliderVal.textContent = `₹${priceSlider.max}`;
        priceSlider.setAttribute("aria-valuenow", priceSlider.max);
      }
      if (spiceSelect)  spiceSelect.value  = "All";
      if (ratingSelect) ratingSelect.value = "All";
      if (veganCheck)   veganCheck.checked = false;
      if (gfCheck)      gfCheck.checked    = false;
 
      const searchInput = document.getElementById("search-input");
      if (searchInput) searchInput.value = "";
 
      currentCategory = "All";
 
      document.querySelectorAll(".filter-btn").forEach(btn => {
        const isAll = btn.dataset.filter === "All";
        btn.classList.toggle("active", isAll);
        btn.setAttribute("aria-pressed", isAll ? "true" : "false");
      });
 
      applyAllFilters();
    });
  }
}
 
// ===== Contact Form =====
 
function setupContactForm() {
  const form        = document.getElementById("contact-form");
  const formSuccess = document.getElementById("form-success");
  if (!form || !formSuccess) return;
 
  const nameInput    = form.querySelector("#name");
  const emailInput   = form.querySelector("#email");
  const messageInput = form.querySelector("#message");
  const errorName    = form.querySelector("#error-name");
  const errorEmail   = form.querySelector("#error-email");
  const errorMessage = form.querySelector("#error-message");
 
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorName.textContent    = "";
    errorEmail.textContent   = "";
    errorMessage.textContent = "";
    formSuccess.style.display = "none";
 
    const validation = validateAndSanitizeContactForm(nameInput.value, emailInput.value, messageInput.value);
 
    if (!validation.valid) {
      if (validation.errors.name)    errorName.textContent    = validation.errors.name;
      if (validation.errors.email)   errorEmail.textContent   = validation.errors.email;
      if (validation.errors.message) errorMessage.textContent = validation.errors.message;
      return;
    }
 
    formSuccess.style.display = "block";
    setTimeout(() => {
      form.reset();
      formSuccess.style.display = "none";
    }, 3000);
  });
}
 
function setupNewsletterForm() {
  const newsletterForm = document.getElementById("newsletter-form");
  if (!newsletterForm) return;
  const emailInput = newsletterForm.querySelector("#newsletter-email");
 
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const validation = validateAndSanitizeEmail(emailInput.value);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    alert("Thank you for subscribing!");
    newsletterForm.reset();
  });
}
 
function setupActiveNavbar() {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section");
 
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navLinks.forEach(nav => nav.classList.remove("active"));
      link.classList.add("active");
    });
  });
 
  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach((section) => {
      const sectionTop    = section.offsetTop - 120;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute("id");
      }
    });
 
    navLinks.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href");
      if (href === `#${current}` || (current === "specials" && href === "#menu")) {
        link.classList.add("active");
      }
    });
  });
}
 
function setupDropdownFilterLinks() {
  const dropdownFilters = document.querySelectorAll(".menu-filter");
  dropdownFilters.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Always close the dropdown immediately on click.
      // Use a temporary `force-hide` class to override CSS :hover so the menu actually hides.
      const parentDropdown = link.closest('.dropdown');
      if (parentDropdown) {
        parentDropdown.classList.add('force-hide');
        parentDropdown.classList.remove('open');
        const toggleEl = parentDropdown.querySelector('.dropdown-toggle');
        if (toggleEl) toggleEl.setAttribute('aria-expanded', 'false');

        // Move focus to the filter toolbar to remove :focus-within and keep the menu closed
        const toolbar = document.querySelector('.filter-buttons');
        if (toolbar && typeof toolbar.focus === 'function') toolbar.focus();

        // Remove the force-hide override after a short delay (allows click visual feedback)
        setTimeout(() => {
          parentDropdown.classList.remove('force-hide');
        }, 300);
      }

      const category = link.dataset.filter || (() => {
        try {
          const url = new URL(link.href, window.location.origin);
          return url.searchParams.get('filter') || url.hash.replace('#', '') || '';
        } catch (err) {
          return '';
        }
      })();

      // If we're already on menu page, apply filter in-page and scroll
      if (window.location.pathname.endsWith('menu.html') || window.location.pathname === '/menu.html') {
        if (category === 'Specials') {
          const specialsSection = document.getElementById('specials');
          if (specialsSection) specialsSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          renderMenu(category);
          document.querySelectorAll('.filter-btn').forEach(btn => {
            const isActive = btn.dataset.filter === category;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          });
          // Scroll to the filter-buttons toolbar (not the menu container)
          const toolbar = document.querySelector('.filter-buttons');
          if (toolbar) toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Close the dropdown menu after click
          const dropdown = link.closest('.dropdown');
          if (dropdown) {
            dropdown.classList.remove('open');
            const toggleEl = dropdown.querySelector('.dropdown-toggle');
            if (toggleEl) toggleEl.setAttribute('aria-expanded', 'false');
          }
        }
      } else {
        // Navigate to menu page with the chosen filter param and anchor to filters
        const target = `menu.html?filter=${encodeURIComponent(category)}#filters`;
        window.location.href = target;
      }
    });
  });
}
 
// FIX: only one saveCart declaration
function saveCart() {
  if (typeof cartManager !== 'undefined') {
    cartManager.saveToStorage();
  }
}
 
// ===== FIX: Read ?filter= URL param on menu.html load =====
function applyUrlFilterParam() {
  const params   = new URLSearchParams(window.location.search);
  const filter   = params.get("filter");
  if (!filter) return;
 
  currentCategory = filter;
 
  document.querySelectorAll(".filter-btn").forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
  // Ensure filtered items render according to URL param
  applyAllFilters();
  // If the URL included the '#filters' anchor (from navbar dropdown), scroll to the toolbar.
  if (window.location.hash === '#filters') {
    const toolbar = document.querySelector('.filter-buttons');
    if (toolbar) toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  // Otherwise scroll to the menu container so filtered results are visible
  const menuContainer = document.getElementById('menu-container');
  if (menuContainer) menuContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
 
// ===== Initialization =====
 
async function init() {
  setupCartManager();
 
  // Bind UI interactions immediately
  setupCartToggle();
  setupFilterButtons();
  setupCouponListeners();
  setupOrderNowScroll();
  setupSearchSuggestions();
  setupSearch();
  setupAdvancedFilters();
  setupContactForm();
  setupNewsletterForm();
  setupActiveNavbar();
  setupDropdownFilterLinks();
 
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const result = await window.checkout();
      if (result) {
        window.location.href = `orders.html?delivery=${result.deliveryAvailable}`;
      }
    });
    );

    recognition.onresult = (
      event
    ) => {
      const transcript =
        event.results[0][0].transcript;

      searchInput.value = transcript;

      applyAllFilters();

      voiceBtn.innerHTML = "🎤";

  // Bind interactive UI listeners immediately for instant input responsiveness (high INP)
  setupCartToggle();
  setupFilterButtons();
  setupCouponListeners();
  setupOrderNowScroll();
  setupSearchSuggestions();
  setupSearch();
  setupAdvancedFilters();
  setupContactForm();
  setupNewsletterForm();
  setupActiveNavbar();
  setupDropdownFilterLinks();

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
      }
      window.location.href = "orders.html";
    });
  }
      voiceBtn.classList.remove(
        "listening"
      );
    };

    recognition.onerror = () => {
      voiceBtn.innerHTML = "🎤";

      voiceBtn.classList.remove(
        "listening"
      );

      alert(
        "Voice recognition failed."
      );
    };

    recognition.onend = () => {
      voiceBtn.innerHTML = "🎤";

      voiceBtn.classList.remove(
        "listening"
      );
    };
  }
 
  // Load menu data, then render
  await loadMenuData();
 
  // FIX: apply ?filter= param AFTER data is loaded and filter buttons exist
  applyUrlFilterParam();
 
  renderSpecials();
  renderRecentlyViewed();
  renderFavorites();
  applyAllFilters();
  updateCartCount();
  updateFavCount();
  renderCart();
 
  renderOrdersList();
  updateOrderStatuses();
  setInterval(updateOrderStatuses, 3000);
}
 
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
 
// ===== Skeleton UI Helpers =====
 
function createSkeletonCard() {
  const el = document.createElement("div");

  el.className = "skeleton-card";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `
    <span class="skeleton sk-image"></span>
    <span class="skeleton sk-title"></span>
    <span class="skeleton sk-desc-line"></span>
    <span class="skeleton sk-price"></span>
    <span class="skeleton sk-btn"></span>
  `;
  return el;
}
 
function showSkeletonCards(container, count = 3) {
  if (!container) return;

  container.innerHTML = "";
  for (let i = 0; i < count; i++) container.appendChild(createSkeletonCard());
}
 
function createSkeletonCartItem() {
  const el = document.createElement("div");
  el.className = "skeleton-cart-item";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `
    <span class="skeleton sk-thumb"></span>

    <div class="sk-lines">
      <span class="skeleton sk-line-name"></span>
      <span class="skeleton sk-line-price"></span>
      <span class="skeleton sk-line-qty"></span>
    </div>
  `;
  return el;
}
 
function showSkeletonCartItems(count = 2) {
  if (!cartItemsContainer) return;

  cartItemsContainer.innerHTML = "";
  for (let i = 0; i < count; i++) cartItemsContainer.appendChild(createSkeletonCartItem());
}
 
// ===== Dark Mode =====
const toggleBtn = document.getElementById("theme-toggle");
 
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
});
 
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  });
}
 
