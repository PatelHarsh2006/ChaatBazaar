let menuItems = [];
let currentCategory = "All";
let orders = JSON.parse(localStorage.getItem('chaatOrders')) || [];

// Initialize cart from cart manager (will be set after DOM loads)
let cart = [];

// Will be initialized in setupCartManager() after document loads
function setupCartManager() {
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
    console.error("Failed to load menu data:", error);
    menuItems = [];
  }
}

// ===== Globals =====
const specialsContainer = document.getElementById("specials-cards");
const menuContainer = document.getElementById("menu-cards") || document.getElementById("menu-container");
const cartCount = document.getElementById("cart-count");
const cartSidebar = document.getElementById("cart-sidebar");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total") || document.getElementById("total-price");
const checkoutBtn = document.getElementById("checkout-btn");

// Cart is managed by CartManager - initialized in main startup

function formatPrice(price) {
  return `₹${price}`;
}

// ===== Fuzzy Match & Highlighter Utilities =====

function fuzzyMatch(target, query) {
  if (!target || !query) return false;
  const t = target.toLowerCase();
  const q = query.toLowerCase();

  // 1. Direct Substring Match
  if (t.includes(q)) return true;

  // 2. Fuzzy sequencing character lookup (character-by-character in order)
  let qIdx = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === q[qIdx]) {
      qIdx++;
      if (qIdx === q.length) return true;
    }
  }
  return false;
}

function highlightText(text, query) {
  if (!text) return "";
  if (!query) return text;
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  return text.replace(regex, "<mark class='highlight'>$1</mark>");
}

// ===== Render Functions =====

function createCard(item, highlightQuery = "") {
  const card = document.createElement("article");
  card.className = "card";
  card.tabIndex = 0;
  card.setAttribute("aria-label", `${item.name} - ${item.description}. Price: ${formatPrice(item.price)}.`);

  const ratingStars = "⭐".repeat(Math.round(item.rating || 5));
  const dietaryTags = item.dietary ? item.dietary.map(d => `<span class="tag tag-${d}">${d}</span>`).join(" ") : "";
  const spiceIcon = item.spice === "High" ? "🌶️🌶️🌶️" : item.spice === "Medium" ? "🌶️🌶️" : "🌶️";

  const highlightedName = highlightText(item.name, highlightQuery);
  const highlightedDesc = highlightText(item.description, highlightQuery);

  //Check if item is available (default to true if field doesn't exist)
  const isAvailable = item.available !== undefined ? item.available : true;

  //Creates out of stock badge (ONLY if unavailable)
  const outOfStockBadge = !isAvailable ? '<span class="out-of-stock-badge">Out of Stock ❌</span>' : '';

  //Disables button and change color if out of stock
  const buttonDisabled = !isAvailable ? 'disabled' : '';
  const buttonColor = isAvailable ? '#28a745' : '#cccccc';

  card.innerHTML = `
    <img src="${item.image}" alt="${item.name}" loading="lazy" />
    <div class="card-content">
      <div class="card-meta">
        <span class="rating" title="Rating: ${item.rating || 5.0}">${ratingStars} ${item.rating || '5.0'}</span>
        <span class="spice" title="Spice level: ${item.spice}">${spiceIcon}</span>
      </div>
      <h3>${highlightedName}</h3>
      <p>${highlightedDesc}</p>
      <div class="card-tags">${dietaryTags}</div>
      ${outOfStockBadge}  <!-- ✅ NEW: Badge added here -->
    </div>
    <div class="card-footer">
      <span class="price">${formatPrice(item.price)}</span>
      <button class="add-btn" 
        aria-label="Add ${item.name} to cart" 
        ${buttonDisabled}
        style="background-color: ${buttonColor};">
        Add
      </button>
    </div>
  `;

  const addBtn = card.querySelector(".add-btn");
  //Only add event listener if item is available
  if (isAvailable) {
    addBtn.addEventListener("click", () => addToCart(item.id));
  } else {
    // Optional: Add click handler to show alert
    addBtn.addEventListener("click", () => {
      alert(`${item.name} is currently out of stock!`);
    });
  }


  card.addEventListener("click", () => {
    RecentlyViewed.addItem(item);
    renderRecentlyViewed();
  });

  return card;
}

function renderSpecials() {
  if (!specialsContainer) return;
  const specials = menuItems.slice(0, 3);

  showSkeletonCards(specialsContainer, specials.length);

  setTimeout(() => {
    specialsContainer.innerHTML = "";
    specials.forEach(item => {
      specialsContainer.appendChild(createCard(item));
    });
  }, 1500);
}

function renderMenu(filter = "All") {
  currentCategory = filter;
  applyAllFilters();
}

function renderRecentlyViewed() {
  const recentlyViewedContainer = document.getElementById("recently-viewed-cards");
  const recentlyViewedSection = document.getElementById("recently-viewed");
  if (!recentlyViewedContainer || !recentlyViewedSection) return;

  const recentItems = RecentlyViewed.getItems();
  recentlyViewedContainer.innerHTML = "";

  if (recentItems.length === 0) {
    recentlyViewedSection.style.display = "none";
    return;
  }

  recentlyViewedSection.style.display = "block";
  recentItems.forEach(item => {
    recentlyViewedContainer.appendChild(createCard(item));
  });
}

// ===== Unified Interactive Filter Engine =====

function applyAllFilters() {
  if (!menuContainer) return;

  showSkeletonCards(menuContainer, 4);

  setTimeout(() => {
    menuContainer.innerHTML = "";

    const searchInput = document.getElementById("search-input");
    const query = searchInput ? searchInput.value.trim() : "";

    const priceSlider = document.getElementById("price-range-slider");
    const maxPrice = priceSlider ? parseFloat(priceSlider.value) : 100;

    const spiceSelect = document.getElementById("spice-level-select");
    const selectedSpice = spiceSelect ? spiceSelect.value : "All";

    const ratingSelect = document.getElementById("rating-select");
    const minRating = ratingSelect ? ratingSelect.value : "All";

    const veganCheck = document.getElementById("dietary-vegan");
    const gfCheck = document.getElementById("dietary-gf");

    let filtered = menuItems;

    if (currentCategory !== "All") {
      filtered = filtered.filter(item => item.category === currentCategory);
    }

    if (query) {
      filtered = filtered.filter(item =>
        fuzzyMatch(item.name, query) ||
        (item.description && fuzzyMatch(item.description, query)) ||
        (item.category && fuzzyMatch(item.category, query))
      );
    }

    filtered = filtered.filter(item => item.price <= maxPrice);

    if (selectedSpice !== "All") {
      filtered = filtered.filter(item => item.spice === selectedSpice);
    }

    if (minRating !== "All") {
      const ratingVal = parseFloat(minRating);
      filtered = filtered.filter(item => (item.rating || 5) >= ratingVal);
    }

    if (veganCheck && veganCheck.checked) {
      filtered = filtered.filter(item => item.dietary && item.dietary.includes("vegan"));
    }
    if (gfCheck && gfCheck.checked) {
      filtered = filtered.filter(item => item.dietary && item.dietary.includes("gluten-free"));
    }

    if (filtered.length === 0) {
      menuContainer.innerHTML = `
        <p style="text-align:center;color:#bf360c;font-weight:600;width:100%;margin-top:2rem;">
          No items found matching your filters.
        </p>`;
      return;
    }

    filtered.forEach(item => {
      menuContainer.appendChild(createCard(item, query));
    });
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
      if (cartTotal) cartTotal.textContent = "Total: ₹0";
      return;
    }

    cart.forEach(({ item, quantity }) => {
      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";
      cartItem.tabIndex = 0;
      cartItem.setAttribute(
        "aria-label",
        `${item.name}, quantity ${quantity},
         price ${formatPrice(item.price * quantity)}`
      );

      cartItem.innerHTML = `
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>${formatPrice(item.price)} each</p>
          <div class="qty-controls">
            <button aria-label="Decrease ${item.name}" class="qty-decrease">−</button>
            <span>${quantity}</span>
            <button aria-label="Increase ${item.name}" class="qty-increase">+</button>
          </div>
        </div>
        <div style="text-align:right;">
          <p style="font-weight:700;color:#bf360c;">
            ${formatPrice(item.price * quantity)}
          </p>
          <button class="cart-item-remove">Remove</button>
        </div>
      `;

      const decreaseBtn = cartItem.querySelector(".qty-decrease");
      if (decreaseBtn) {
        decreaseBtn.addEventListener("click", () => removeFromCart(item.id));
      }

      const increaseBtn = cartItem.querySelector(".qty-increase");
      if (increaseBtn) {
        increaseBtn.addEventListener("click", () => addToCart(item.id));
      }

      const removeBtn = cartItem.querySelector(".cart-item-remove");
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          cart = cart.filter(ci => ci.item.id !== item.id);
          updateCartCount();
          renderCart();
          saveCart();
        });
      }

      cartItemsContainer.appendChild(cartItem);
    });

    const total = cart.reduce(
      (sum, ci) => sum + ci.item.price * ci.quantity,
      0
    );
    if (cartTotal) cartTotal.textContent = `Total: ${formatPrice(total)}`;
    if (checkoutBtn) checkoutBtn.disabled = false;

  }, 600);
}

function updateCartCount() {
  if (cartCount) {
    const totalCount = cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
    cartCount.textContent = totalCount;
  }
}

// ===== My Orders Dashboard & Real-Time Tracking Engine =====

function updateOrderStatuses() {
  let changed = false;
  const now = Date.now();

  orders.forEach(order => {
    if (order.status === "Delivered") return;

    // Time elapsed in seconds since order checkout
    const elapsedSeconds = (now - order.timestamp) / 1000;
    let targetStatus = "Pending";

    if (elapsedSeconds >= 45) {
      targetStatus = "Delivered";
    } else if (elapsedSeconds >= 25) {
      targetStatus = "On the Way";
    } else if (elapsedSeconds >= 10) {
      targetStatus = "Preparing";
    }

    if (order.status !== targetStatus) {
      order.status = targetStatus;
      changed = true;
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
    
    const isPreparing = order.status === "Preparing" || order.status === "On the Way" || order.status === "Delivered" ? "active" : "";
    const isOnWay = order.status === "On the Way" || order.status === "Delivered" ? "active" : "";
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

      <div class="order-items-list">
        ${itemsHtml}
      </div>

      <div class="order-card-footer">
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

// ===== Global Window Handlers for Multi-page support =====

window.filterCategory = function(category) {
  currentCategory = category;
  applyAllFilters();

  const buttons = document.querySelectorAll(".filter-btn, .filter button");
  buttons.forEach(btn => {
    const filterAttr = btn.dataset.filter || (btn.getAttribute("onclick") ? btn.getAttribute("onclick").match(/'([^']+)'/)[1] : "");
    if (filterAttr === category || btn.textContent.trim() === category) {
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
    } else {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    }
  });
};

window.checkout = async function() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const validationResult = await validateDeliveryLocation();

  if (!validationResult.valid) {
    alert(validationResult.error);
    return;
  }

  const newOrder = {
    id: "CB-" + Math.floor(100000 + Math.random() * 900000),
    date: new Date().toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }),
    timestamp: Date.now(),
    items: JSON.parse(JSON.stringify(cart)),
    total: cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0),
    status: "Pending",
    deliveryAddress: {
      latitude: validationResult.userLocation.latitude,
      longitude: validationResult.userLocation.longitude,
      source: validationResult.userLocation.source
    },
    deliveryDistance: validationResult.distance,
    restaurantLocation: validationResult.restaurantLocation
  };

  orders.unshift(newOrder);
  localStorage.setItem('chaatOrders', JSON.stringify(orders));

  cartManager.clear();
  updateCartCount();
  renderCart();

  alert("Thank you for your order! Your hot street food is on the way. Redirecting to your Orders dashboard...");
  window.location.href = "orders.html";
};

window.reorderOrder = function(orderId) {
  const pastOrder = orders.find(o => o.id === orderId);
  if (!pastOrder) return;

  pastOrder.items.forEach(orderItem => {
    cartManager.addItem(orderItem.item, orderItem.quantity);
  });

  updateCartCount();
  renderCart();

  alert("Items added back to your cart successfully!");

  const sidebar = document.getElementById("cart-sidebar");
  if (sidebar) {
    sidebar.setAttribute("aria-hidden", "false");
    sidebar.classList.add("open");
  }
};

// ===== Cart Operations =====

function addToCart(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;

   //Check if item is available
  const isAvailable = item.available !== undefined ? item.available : true;
  if (!isAvailable) {
    alert(`${item.name} is currently out of stock!`);
    return;
  }

  cartManager.addItem(item, 1);
  updateCartCount();
  renderCart();

  if (cartSidebar) {
    cartSidebar.setAttribute("aria-hidden", "false");
    cartSidebar.classList.add("open");
  }
}

function removeFromCart(id) {
  const cartItem = cartManager.getItem(id);
  if (!cartItem) return;

  if (cartItem.quantity > 1) {
    cartManager.decreaseQuantity(id);
  } else {
    cartManager.removeItem(id);
  }
  updateCartCount();
  renderCart();
}

// ===== Event Listeners =====

function setupFilterButtons() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      renderMenu(btn.dataset.filter);
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

// ===== Autocomplete & Search Panel =====

function setupSearchSuggestions() {
  const searchInput = document.getElementById("search-input");
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

        const menuSection = document.getElementById("menu");
        if (menuSection) {
          menuSection.scrollIntoView({ behavior: "smooth" });
        }

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
  });
}

function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  if (!searchInput || !searchBtn) return;

  function handleSearchClick() {
    const menuSection = document.getElementById("menu");
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: "smooth" });
    }
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

// ===== Advanced Expandable Filters Panel =====

function setupAdvancedFilters() {
  const toggleBtn = document.getElementById("filter-toggle-btn");
  const filterPanel = document.getElementById("advanced-filters");
  if (!toggleBtn || !filterPanel) return;

  toggleBtn.addEventListener("click", () => {
    const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
    toggleBtn.setAttribute("aria-expanded", !isExpanded);
    if (isExpanded) {
      filterPanel.style.display = "none";
      toggleBtn.classList.remove("active");
    } else {
      filterPanel.style.display = "block";
      toggleBtn.classList.add("active");
    }
  });

  const priceSlider = document.getElementById("price-range-slider");
  const priceSliderVal = document.getElementById("price-slider-val");
  if (priceSlider && priceSliderVal) {
    priceSlider.addEventListener("input", () => {
      priceSliderVal.textContent = `₹${priceSlider.value}`;
      priceSlider.setAttribute("aria-valuenow", priceSlider.value);
      applyAllFilters();
    });
  }

  const spiceSelect = document.getElementById("spice-level-select");
  if (spiceSelect) {
    spiceSelect.addEventListener("change", applyAllFilters);
  }

  const ratingSelect = document.getElementById("rating-select");
  if (ratingSelect) {
    ratingSelect.addEventListener("change", applyAllFilters);
  }

  const veganCheck = document.getElementById("dietary-vegan");
  if (veganCheck) {
    veganCheck.addEventListener("change", applyAllFilters);
  }

  const gfCheck = document.getElementById("dietary-gf");
  if (gfCheck) {
    gfCheck.addEventListener("change", applyAllFilters);
  }

  const resetBtn = document.getElementById("reset-filters-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (priceSlider) {
        priceSlider.value = 100;
        priceSliderVal.textContent = "₹100";
        priceSlider.setAttribute("aria-valuenow", 100);
      }
      if (spiceSelect) spiceSelect.value = "All";
      if (ratingSelect) ratingSelect.value = "All";
      if (veganCheck) veganCheck.checked = false;
      if (gfCheck) gfCheck.checked = false;

      const searchInput = document.getElementById("search-input");
      if (searchInput) searchInput.value = "";

      currentCategory = "All";

      const buttons = document.querySelectorAll(".filter-btn, .filter button");
      buttons.forEach(btn => {
        const filterAttr = btn.dataset.filter || (btn.getAttribute("onclick") ? btn.getAttribute("onclick").match(/'([^']+)'/)[1] : "");
        if (filterAttr === "All" || btn.textContent.trim() === "All") {
          btn.classList.add("active");
          btn.setAttribute("aria-pressed", "true");
        } else {
          btn.classList.remove("active");
          btn.setAttribute("aria-pressed", "false");
        }
      });

      applyAllFilters();
    });
  }
}

// ===== Contact Form =====

function setupContactForm() {
  const form = document.getElementById("contact-form");
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
      if (validation.errors.name) errorName.textContent = validation.errors.name;
      if (validation.errors.email) errorEmail.textContent = validation.errors.email;
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

  // Click active state
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navLinks.forEach(nav => nav.classList.remove("active"));
      link.classList.add("active");
    });
  });

  // Scroll active state
  window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.clientHeight;

      if (
        window.scrollY >= sectionTop &&
        window.scrollY < sectionTop + sectionHeight
      ) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");

      const href = link.getAttribute("href");

      if (
        href === `#${current}` ||
        (current === "specials" && href === "#menu")
      ) {
        link.classList.add("active");
      }
    });
  });
}

// ===== Initialization =====

async function init() {
  // Initialize cart manager first to sync cart state
  setupCartManager();

  // Bind interactive UI listeners immediately for instant input responsiveness (high INP)
  setupCartToggle();
  setupFilterButtons();
  setupOrderNowScroll();
  setupSearchSuggestions();
  setupSearch();
  setupAdvancedFilters();
  setupContactForm();
  setupNewsletterForm();
  setupActiveNavbar();

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      window.checkout();
    });
  }

  // Load database items asynchronously without blocking UI interactions
  await loadMenuData();

  renderSpecials();
  renderRecentlyViewed();
  applyAllFilters();
  updateCartCount();
  renderCart();

  // Run dynamic order rendering and simulated status progress updates
  renderOrdersList();
  updateOrderStatuses();
  setInterval(updateOrderStatuses, 3000); // Check status progress every 3s
}

// Prevent race condition if DOMContentLoaded has already fired on direct reload
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
    <span class="skeleton sk-desc-line"></span>
    <span class="skeleton sk-price"></span>
    <span class="skeleton sk-btn"></span>
  `;

  return el;
}

function showSkeletonCards(container, count = 3) {
  if (!container) return;
  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    container.appendChild(createSkeletonCard());
  }
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

  for (let i = 0; i < count; i++) {
    cartItemsContainer.appendChild(createSkeletonCartItem());
  }
}