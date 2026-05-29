// ===== Global State =====
let menuItems = [];
let currentCategory = "All";
let orders = JSON.parse(localStorage.getItem("chaatOrders")) || [];
let cart = [];
let loyaltyPointsApplied = false;

// ===== Cart Manager Setup =====
function setupCartManager() {
  if (!window.cartManager) {
    console.error("cartManager is not defined");
    return;
  }

  cart = cartManager.getItems();

 cartManager.subscribe((items) => {
  cart = [...items];
  updateCartCount(); // keeps navbar/cart synced
});

}

// ===== Load Menu Data =====
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

// ===== DOM Elements =====
const specialsContainer = document.getElementById("specials-cards");
const menuContainer =
  document.getElementById("menu-cards") ||
  document.getElementById("menu-container");

const cartCount = document.getElementById("cart-count");
const cartSidebar = document.getElementById("cart-sidebar");
const cartItemsContainer = document.getElementById("cart-items");

const cartTotal =
  document.getElementById("cart-total") ||
  document.getElementById("total-price");

const checkoutBtn = document.getElementById("checkout-btn");

const couponCodeInput = document.getElementById("coupon-code-input");
const applyCouponBtn = document.getElementById("apply-coupon-btn");
const removeCouponBtn = document.getElementById("remove-coupon-btn");
const couponMessage = document.getElementById("coupon-message");
const couponSubtotalEl = document.getElementById("coupon-subtotal");
const couponDiscountEl = document.getElementById("coupon-discount");
const couponDiscountRow = document.getElementById("coupon-discount-row");
const couponGrandTotalEl = document.getElementById("coupon-grand-total");
const appliedCouponLabel = document.getElementById("applied-coupon-label");

const COUPON_STORAGE_KEY = "chaatCoupon";
const coupons = {
  WELCOME10: { type: "percent", value: 10 },
  SAVE50: { type: "flat", value: 50 },
};
let activeCoupon = null;

// ===== Helpers =====
function formatPrice(price) {
  return `₹${price}`;
}

function getCartSubtotal() {
  return cart.reduce(
    (sum, cartItem) => sum + cartItem.item.price * cartItem.quantity,
    0
  );
}

function loadCouponFromStorage() {
  const stored = localStorage.getItem(COUPON_STORAGE_KEY);
  if (!stored) return null;

  try {
    const data = JSON.parse(stored);
    if (!data || !data.code) return null;

    const code = String(data.code).trim().toUpperCase();
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
    localStorage.setItem(
      COUPON_STORAGE_KEY,
      JSON.stringify({ code: activeCoupon.code, appliedAt: Date.now() })
    );
  } else {
    localStorage.removeItem(COUPON_STORAGE_KEY);
  }
}

function validateCouponCode(input) {
  const code = String(input || "").trim().toUpperCase();

  if (!code) {
    return { valid: false, message: "Enter a coupon code." };
  }

  const coupon = coupons[code];
  if (!coupon) {
    return { valid: false, message: "Invalid or expired coupon." };
  }

  return { valid: true, code, coupon };
}

function calculateCouponDiscount(subtotal) {
  if (!activeCoupon) return 0;

  if (activeCoupon.type === "percent") {
    return Math.min(Math.round((subtotal * activeCoupon.value) / 100), subtotal);
  }

  if (activeCoupon.type === "flat") {
    return Math.min(activeCoupon.value, subtotal);
  }

  return 0;
}

function getCheckoutTotalsForCart() {
  const subtotal = getCartSubtotal();
  const couponDiscount = calculateCouponDiscount(subtotal);
  const loyaltyBalance =
    typeof loyalty !== "undefined" ? loyalty.getBalance() : 0;

  return calculateCheckoutTotals({
    subtotal,
    couponDiscount,
    loyaltyPointsApplied,
    loyaltyBalance,
  });
}

function renderCartTotalBreakdown(checkoutTotals) {
  if (!cartTotal) return;

  const hasDiscount =
    checkoutTotals.couponDiscount > 0 || checkoutTotals.loyaltyDiscount > 0;

  if (!hasDiscount) {
    cartTotal.textContent = `Total: ${formatPrice(checkoutTotals.total)}`;
    return;
  }

  const discountRows = [];
  if (checkoutTotals.couponDiscount > 0) {
    discountRows.push(
      `<div class="breakdown-row discount"><span>Coupon Discount:</span> <span>-${formatPrice(checkoutTotals.couponDiscount)}</span></div>`
    );
  }
  if (checkoutTotals.loyaltyDiscount > 0) {
    discountRows.push(
      `<div class="breakdown-row discount"><span>Loyalty Discount:</span> <span>-${formatPrice(checkoutTotals.loyaltyDiscount)}</span></div>`
    );
  }

  cartTotal.innerHTML = `
    <div class="cart-total-breakdown">
      <div class="breakdown-row"><span>Subtotal:</span> <span>${formatPrice(checkoutTotals.subtotal)}</span></div>
      ${discountRows.join("")}
      <div class="breakdown-row final"><span>Total:</span> <span>${formatPrice(checkoutTotals.total)}</span></div>
    </div>
  `;
}

function updateCartSummary() {
  const checkoutTotals = getCheckoutTotalsForCart();

  if (couponSubtotalEl) couponSubtotalEl.textContent = formatPrice(checkoutTotals.subtotal);
  if (couponDiscountEl) {
    couponDiscountEl.textContent = `- ${formatPrice(checkoutTotals.couponDiscount)}`;
  }
  if (couponDiscountRow) {
    couponDiscountRow.style.display =
      checkoutTotals.couponDiscount > 0 ? "flex" : "none";
  }
  if (couponGrandTotalEl) {
    couponGrandTotalEl.textContent = formatPrice(checkoutTotals.total);
  }
  if (appliedCouponLabel) {
    appliedCouponLabel.textContent = activeCoupon
      ? `Coupon applied: ${activeCoupon.code}`
      : "";
  }

  renderCartTotalBreakdown(checkoutTotals);

  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
}

function showCouponMessage(message, type = "success") {
  if (couponMessage) {
    couponMessage.textContent = message;
    couponMessage.classList.toggle("success", type === "success");
    couponMessage.classList.toggle("error", type === "error");
  }

  showToast(type === "success" ? `✅ ${message}` : `⚠️ ${message}`);
}

function applyCouponCode() {
  const result = validateCouponCode(couponCodeInput ? couponCodeInput.value : "");

  if (!result.valid) {
    activeCoupon = null;
    saveCouponToStorage();
    showCouponMessage(result.message, "error");
    updateCartSummary();
    return false;
  }

  activeCoupon = { code: result.code, ...result.coupon };
  saveCouponToStorage();
  showCouponMessage(`${result.code} applied!`, "success");
  if (removeCouponBtn) removeCouponBtn.style.display = "inline-flex";
  updateCartSummary();
  return true;
}

function removeCoupon() {
  activeCoupon = null;
  saveCouponToStorage();

  if (couponCodeInput) couponCodeInput.value = "";
  if (removeCouponBtn) removeCouponBtn.style.display = "none";
  showCouponMessage("Coupon removed.", "success");
  updateCartSummary();
}

function setupCouponListeners() {
  if (applyCouponBtn) {
    applyCouponBtn.addEventListener("click", applyCouponCode);
  }

  if (couponCodeInput) {
    couponCodeInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyCouponCode();
      }
    });
  }

  if (removeCouponBtn) {
    removeCouponBtn.addEventListener("click", removeCoupon);
  }

  if (loadCouponFromStorage() && couponCodeInput) {
    couponCodeInput.value = activeCoupon.code;
  }

  if (activeCoupon && removeCouponBtn) {
    removeCouponBtn.style.display = "inline-flex";
  }
}

function fuzzyMatch(target, query) {
  if (!target || !query) return false;

  const t = target.toLowerCase();
  const q = query.toLowerCase();

  if (t.includes(q)) return true;

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
  if (!text) return "";
  if (!query) return text;

  const escapedQuery = query.replace(
    /[-\/\\^$*+?.()|[\]{}]/g,
    "\\$&"
  );

  const regex = new RegExp(`(${escapedQuery})`, "gi");

  return text.replace(
    regex,
    "<mark class='highlight'>$1</mark>"
  );
}

// ===== Card Creation =====
function createCard(item, highlightQuery = "") {
  const card = document.createElement("article");

  card.className = "card";
  card.tabIndex = 0;

  card.setAttribute(
    "aria-label",
    `${item.name} - ${item.description}. Price: ${formatPrice(
      item.price
    )}`
  );

  const ratingStars = "⭐".repeat(
    Math.round(item.rating || 5)
  );

  const dietaryTags = item.dietary
    ? item.dietary
        .map(
          (d) => `<span class="tag tag-${d}">${d}</span>`
        )
        .join(" ")
    : "";

  const spiceIcon =
    item.spice === "High"
      ? "🌶️🌶️🌶️"
      : item.spice === "Medium"
      ? "🌶️🌶️"
      : "🌶️";

  const highlightedName = highlightText(
    item.name,
    highlightQuery
  );

  const highlightedDesc = highlightText(
    item.description,
    highlightQuery
  );

  const isAvailable =
    item.available !== undefined
      ? item.available
      : true;

  const outOfStockBadge = !isAvailable
    ? `<span class="out-of-stock-badge">
         Out of Stock ❌
       </span>`
    : "";

  const buttonDisabled = !isAvailable
    ? "disabled"
    : "";

  const buttonColor = isAvailable
    ? "#28a745"
    : "#cccccc";

  card.innerHTML = `
    <img src="${item.image}" 
         alt="${item.name}" 
         loading="lazy" />

    <div class="card-content">

      <div class="card-meta">
        <span class="rating">
          ${ratingStars} ${item.rating || "5.0"}
        </span>

        <span class="spice">
          ${spiceIcon}
        </span>
      </div>

      <h3>${highlightedName}</h3>

      <p>${highlightedDesc}</p>

      <div class="card-tags">
        ${dietaryTags}
      </div>

      ${outOfStockBadge}

    </div>

    <div class="card-footer">

      <span class="price">
        ${formatPrice(item.price)}
      </span>

      <button
        class="add-btn"
        ${buttonDisabled}
        style="background-color:${buttonColor}"
      >
        Add
      </button>

    </div>
  `;

  const addBtn = card.querySelector(".add-btn");

  if (isAvailable) {
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      addToCart(item.id);
    });
  } else {
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      alert(`${item.name} is currently out of stock!`);
    });
  }

  // Recently Viewed
  card.addEventListener("click", () => {
    if (window.RecentlyViewed) {
      RecentlyViewed.addItem(item);
      renderRecentlyViewed();
    }
  });

  return card;
}

// ===== Specials =====
function renderSpecials() {
  if (!specialsContainer) return;

  const specials = menuItems.slice(0, 3);

  showSkeletonCards(
    specialsContainer,
    specials.length
  );

  setTimeout(() => {
    specialsContainer.innerHTML = "";

    specials.forEach((item) => {
      specialsContainer.appendChild(
        createCard(item)
      );
    });
  }, 1000);
}

// ===== Menu Rendering =====
function renderMenu(filter = "All") {
  currentCategory = filter;
  applyAllFilters();
}

// ===== Recently Viewed =====
function renderRecentlyViewed() {
  const recentlyViewedContainer =
    document.getElementById(
      "recently-viewed-cards"
    );

  const recentlyViewedSection =
    document.getElementById(
      "recently-viewed"
    );

  if (
    !recentlyViewedContainer ||
    !recentlyViewedSection
  ) {
    return;
  }

  const recentItems =
    RecentlyViewed.getItems();

  recentlyViewedContainer.innerHTML = "";

  if (recentItems.length === 0) {
    recentlyViewedSection.style.display =
      "none";

    return;
  }

  recentlyViewedSection.style.display =
    "block";

  recentItems.forEach((item) => {
    recentlyViewedContainer.appendChild(
      createCard(item)
    );
  });
}

// ===== Filter Engine =====
function applyAllFilters() {
  if (!menuContainer) return;

  showSkeletonCards(menuContainer, 4);

  setTimeout(() => {
    menuContainer.innerHTML = "";

    const searchInput =
      document.getElementById(
        "search-input"
      );

    const query = searchInput
      ? searchInput.value.trim()
      : "";

    const priceSlider =
      document.getElementById(
        "price-range-slider"
      );

    const maxPrice = priceSlider
      ? parseFloat(priceSlider.value)
      : 100;

    const spiceSelect =
      document.getElementById(
        "spice-level-select"
      );

    const selectedSpice = spiceSelect
      ? spiceSelect.value
      : "All";

    const ratingSelect =
      document.getElementById(
        "rating-select"
      );

    const minRating = ratingSelect
      ? ratingSelect.value
      : "All";

    const veganCheck =
      document.getElementById(
        "dietary-vegan"
      );

    const gfCheck =
      document.getElementById(
        "dietary-gf"
      );

    let filtered = menuItems;

    // Category
    if (currentCategory !== "All") {
      filtered = filtered.filter(
        (item) =>
          item.category === currentCategory
      );
    }

    // Search
    if (query) {
      filtered = filtered.filter(
        (item) =>
          fuzzyMatch(item.name, query) ||
          fuzzyMatch(
            item.description,
            query
          ) ||
          fuzzyMatch(
            item.category,
            query
          )
      );
    }

    // Price
    filtered = filtered.filter(
      (item) => item.price <= maxPrice
    );

    // Spice
    if (selectedSpice !== "All") {
      filtered = filtered.filter(
        (item) =>
          item.spice === selectedSpice
      );
    }

    // Rating
    if (minRating !== "All") {
      filtered = filtered.filter(
        (item) =>
          (item.rating || 5) >=
          parseFloat(minRating)
      );
    }

    // Vegan
    if (
      veganCheck &&
      veganCheck.checked
    ) {
      filtered = filtered.filter(
        (item) =>
          item.dietary &&
          item.dietary.includes("vegan")
      );
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

    // No Results
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

    filtered.forEach((item) => {
      menuContainer.appendChild(
        createCard(item, query)
      );
    });
  }, 600);
}

// ===== Cart Rendering =====
function renderCart() {
  if (!cartItemsContainer) return;

  if (cart.length > 0) {
    showSkeletonCartItems(cart.length);
  }

  setTimeout(() => {
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <p style="
          text-align:center;
          margin-top:2rem;
        ">
          Your cart is empty.
        </p>
      `;

      if (checkoutBtn) {
        checkoutBtn.disabled = true;
      }

      if (cartTotal) {
        cartTotal.textContent =
          "Total: ₹0";
      }

      updateCartSummary();
      return;
    }

    cart.forEach(({ item, quantity }) => {
      const cartItem =
        document.createElement("div");

      cartItem.className = "cart-item";

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

        <div>

          <p style="
            font-weight:700;
            color:#bf360c;
          ">
            ${formatPrice(
              item.price * quantity
            )}
          </p>

          <button class="cart-item-remove">
            Remove
          </button>

        </div>
      `;

      // Decrease
      cartItem
        .querySelector(".qty-decrease")
        .addEventListener(
          "click",
          () => removeFromCart(item.id)
        );

      // Increase
      cartItem
        .querySelector(".qty-increase")
        .addEventListener(
          "click",
          () => addToCart(item.id)
        );

      // Remove Entire Item
      cartItem
        .querySelector(
          ".cart-item-remove"
        )
        .addEventListener(
          "click",
          () => {
            cartManager.removeItem(
              item.id
            );

            updateCartCount();
            renderCart();
            saveCart();
          }
        );

      cartItemsContainer.appendChild(
        cartItem
      );
    });

    // Render Loyalty Points Widget at the end of the cart list
    const points = typeof loyalty !== 'undefined' ? loyalty.getBalance() : 0;
    const loyaltyDiv = document.createElement("div");
    loyaltyDiv.className = "cart-loyalty-widget";

    const checkoutTotals = getCheckoutTotalsForCart();
    const availableLoyaltyDiscount = Math.min(
      points,
      checkoutTotals.afterCouponTotal
    );

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
          <input type="checkbox" id="apply-loyalty-checkbox" ${loyaltyPointsApplied ? "checked" : ""} />
          <span class="toggle-slider"></span>
          <span class="toggle-label">Apply ₹${availableLoyaltyDiscount} Discount</span>
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
      checkbox.addEventListener("change", (event) => {
        loyaltyPointsApplied = event.target.checked;
        updateCartSummary();
      });
    }

    updateCartSummary();

    if (checkoutBtn) {
      checkoutBtn.disabled = false;
    }
  }, 400);
}

// ===== Cart Count =====
function updateCartCount() {
  if (!cartCount) return;

  const totalCount = cart.reduce(
    (sum, cartItem) =>
      sum + cartItem.quantity,
    0
  );

  cartCount.textContent = totalCount;
}

// ===== Save Cart =====
function saveCart() {
  if (window.cartManager) {
    cartManager.saveToStorage();
  }
}

// ===== Toast =====
function showToast(message) {
  const toast = document.getElementById(
    "toast-notification"
  );

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toast.hideTimeout);

  toast.hideTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ===== Add To Cart =====
function addToCart(id) {
  const item = menuItems.find(
    (i) => i.id === id
  );

  if (!item) return;

  const isAvailable =
    item.available !== undefined
      ? item.available
      : true;

  if (!isAvailable) {
    alert(
      `${item.name} is currently out of stock!`
    );

    return;
  }

  cartManager.addItem(item, 1);

  updateCartCount();

  renderCart();

  saveCart();

  showToast(
    `🛒 ${item.name} added to cart`
  );

  if (cartCount) {
    cartCount.classList.add(
      "cart-bounce"
    );

    setTimeout(() => {
      cartCount.classList.remove(
        "cart-bounce"
      );
    }, 400);
  }

  if (cartSidebar) {
    cartSidebar.classList.add("open");

    cartSidebar.setAttribute(
      "aria-hidden",
      "false"
    );
  }
}

// ===== Remove From Cart =====
function removeFromCart(id) {
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

window.placeOrderFromCheckout = function (customerDetails, pricingInfo = {}) {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return null;
  }

  const subtotal = pricingInfo.subtotal ?? getCartSubtotal();
  const requestedPointsRedeemed = pricingInfo.pointsRedeemed ?? 0;
  const checkoutTotals = calculateCheckoutTotals({
    subtotal,
    couponDiscount: pricingInfo.couponDiscount ?? 0,
    loyaltyPointsApplied: requestedPointsRedeemed > 0,
    loyaltyBalance: requestedPointsRedeemed,
    deliveryFee: pricingInfo.deliveryFee ?? 0,
    platformFee: pricingInfo.platformFee ?? 0,
    gst: pricingInfo.gst ?? 0,
  });

  const pointsRedeemed = checkoutTotals.loyaltyDiscount;

  // Award loyalty points on final total paid (10 points per ₹100 spent)
  let pointsEarned = 0;
  if (typeof loyalty !== 'undefined') {
    pointsEarned = loyalty.awardPoints(checkoutTotals.total);
  }

  // Redeem loyalty points if applied
  if (pointsRedeemed > 0 && typeof loyalty !== 'undefined') {
    loyalty.redeemPoints(pointsRedeemed);
  }

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
    total: checkoutTotals.total,
    // Keep aggregate fields for existing persisted orders and invoice code.
    discount: checkoutTotals.totalDiscount,
    couponDiscount: checkoutTotals.couponDiscount,
    loyaltyDiscount: checkoutTotals.loyaltyDiscount,
    deliveryFee: checkoutTotals.deliveryFee,
    platformFee: checkoutTotals.platformFee,
    gst: checkoutTotals.gst,
    coupon: pricingInfo.couponCode || null,
    subtotal: checkoutTotals.subtotal,
    pointsRedeemed,
    pointsEarned,
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

  renderCart();

  saveCart();

  showToast(
    `🗑️ ${removedItem.name} removed from cart`
  );
}

// ===== Cart Sidebar =====
function setupCartToggle() {
  const cartOpenBtn =
    document.getElementById(
      "cart-open-btn"
    );

  const cartCloseBtn =
    document.getElementById(
      "cart-close"
    );

  if (
    !cartOpenBtn ||
    !cartCloseBtn ||
    !cartSidebar
  ) {
    return;
  }

  cartOpenBtn.addEventListener(
    "click",
    (e) => {
      e.preventDefault();

      cartSidebar.classList.add("open");

      cartSidebar.setAttribute(
        "aria-hidden",
        "false"
      );
    }
  );

  cartCloseBtn.addEventListener(
    "click",
    () => {
      cartSidebar.classList.remove(
        "open"
      );

      cartSidebar.setAttribute(
        "aria-hidden",
        "true"
      );
    }
  );

  document.addEventListener(
    "keydown",
    (e) => {
      if (
        e.key === "Escape" &&
        cartSidebar.classList.contains(
          "open"
        )
      ) {
        cartSidebar.classList.remove(
          "open"
        );

        cartSidebar.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    }
  );
}

// ===== Voice Search =====
function setupSearch() {
  const searchInput =
    document.getElementById(
      "search-input"
    );

  const searchBtn =
    document.getElementById(
      "search-btn"
    );

  const voiceBtn =
    document.getElementById(
      "voice-search-btn"
    );

  if (!searchInput || !searchBtn)
    return;

  function handleSearchClick() {
    const menuSection =
      document.getElementById("menu");

    if (menuSection) {
      menuSection.scrollIntoView({
        behavior: "smooth",
      });
    }

    applyAllFilters();
  }

  searchBtn.addEventListener(
    "click",
    handleSearchClick
  );

  searchInput.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter") {
        handleSearchClick();
      }
    }
  );

  // Voice Search
  if (
    !(
      "webkitSpeechRecognition" in
        window ||
      "SpeechRecognition" in window
    )
  ) {
    if (voiceBtn) {
      voiceBtn.style.display = "none";
    }

    return;
  }

  if (voiceBtn) {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;

    voiceBtn.addEventListener(
      "click",
      () => {
        recognition.start();

        voiceBtn.innerHTML = "🎙️";

        voiceBtn.classList.add(
          "listening"
        );
      }
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
}

// ===== Skeleton Helpers =====
function createSkeletonCard() {
  const el = document.createElement("div");

  el.className = "skeleton-card";

  el.innerHTML = `
    <span class="skeleton sk-image"></span>
    <span class="skeleton sk-title"></span>
    <span class="skeleton sk-desc-line"></span>
    <span class="skeleton sk-price"></span>
    <span class="skeleton sk-btn"></span>
  `;

  return el;
}

function showSkeletonCards(
  container,
  count = 3
) {
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    container.appendChild(
      createSkeletonCard()
    );
  }
}

function createSkeletonCartItem() {
  const el = document.createElement("div");

  el.className =
    "skeleton-cart-item";

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

function showSkeletonCartItems(
  count = 2
) {
  if (!cartItemsContainer) return;

  cartItemsContainer.innerHTML = "";

  for (let i = 0; i < count; i++) {
    cartItemsContainer.appendChild(
      createSkeletonCartItem()
    );
  }
}

// ===== Dark Mode =====
const themeToggle =
  document.getElementById(
    "theme-toggle"
  );

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const savedTheme =
      localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.body.classList.add(
        "dark"
      );

      if (themeToggle) {
        themeToggle.textContent = "☀️";
      }
    } else {
      if (themeToggle) {
        themeToggle.textContent = "🌙";
      }
    }
  }
);

if (themeToggle) {
  themeToggle.addEventListener(
    "click",
    () => {
      document.body.classList.toggle(
        "dark"
      );

      if (
        document.body.classList.contains(
          "dark"
        )
      ) {
        themeToggle.textContent = "☀️";

        localStorage.setItem(
          "theme",
          "dark"
        );
      } else {
        themeToggle.textContent = "🌙";

        localStorage.setItem(
          "theme",
          "light"
        );
      }
    }
  );
}

// ===== Order Status Optimization =====
function updateOrderStatuses() {
  let changed = false;

  const now = Date.now();

  orders.forEach((order) => {
    if (order.status === "Delivered")
      return;

    const elapsedSeconds =
      (now - order.timestamp) / 1000;

    let targetStatus = "Pending";

    if (elapsedSeconds >= 45) {
      targetStatus = "Delivered";
    } else if (elapsedSeconds >= 25) {
      targetStatus = "On the Way";
    } else if (elapsedSeconds >= 10) {
      targetStatus = "Preparing";
    }

    if (
      order.status !== targetStatus
    ) {
      order.status = targetStatus;

      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem(
      "chaatOrders",
      JSON.stringify(orders)
    );
  }
}

let orderInterval;

// ===== Init =====
async function init() {
  setupCartManager();

  setupCartToggle();

  setupCouponListeners();

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", (event) => {
      event.preventDefault();
      if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
      }
      window.location.href = "orders.html";
    });
  }

  setupSearch();

  await loadMenuData();

  renderSpecials();

  applyAllFilters();

  updateCartCount();

  renderCart();

  updateOrderStatuses();

  orderInterval = setInterval(
    updateOrderStatuses,
    3000
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        clearInterval(orderInterval);
      } else {
        orderInterval =
          setInterval(
            updateOrderStatuses,
            3000
          );
      }
    }
  );
}

// ===== Start App =====
if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    init
  );
} else {
  init();
}
