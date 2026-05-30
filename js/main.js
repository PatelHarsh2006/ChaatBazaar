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

// ===== Helpers =====
function formatPrice(price) {
  return `₹${price}`;
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

    updateCartSummary();
    // Render Loyalty Points Widget at the end of the cart list
    const points = typeof loyalty !== 'undefined' ? loyalty.getBalance() : 0;
    const loyaltyDiv = document.createElement("div");
    loyaltyDiv.className = "cart-loyalty-widget";

    const total = cart.reduce(
      (sum, ci) =>
        sum +
        ci.item.price * ci.quantity,
      0
    );

    if (cartTotal) {
      cartTotal.textContent = `Total: ${formatPrice(
        total
      )}`;
    }

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
