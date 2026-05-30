let menuItems = [];
let currentCategory = "All";
let orders = JSON.parse(localStorage.getItem('chaatOrders')) || [];
let cart = JSON.parse(localStorage.getItem('chaatCart')) || [];
let currentSearchQuery = "";

const FALLBACK_MENU = [
  { id: 1, name: "Golgappa / Pani Puri", category: "Chaat", price: 50, spice: "High", spiceLevel: 3, rating: 4.9, dietary: ["vegan"], isVeg: true, badge: "Teekha 🔥", description: "Crispy hollow puris stuffed with spicy potatoes, served with tangy mint and sweet tamarind water.", image: "img/2.avif" },
  { id: 2, name: "Dahi Papdi Chaat", category: "Chaat", price: 60, spice: "Medium", spiceLevel: 2, rating: 4.7, dietary: ["vegetarian"], isVeg: true, badge: "Dilli Special", description: "Crispy wafers topped with boiled potatoes, chickpeas, yogurt, chutneys, and fine sev.", image: "img/2.avif" },
  { id: 3, name: "Bhel Puri", category: "Chaat", price: 45, spice: "High", spiceLevel: 3, rating: 4.8, dietary: ["vegan", "gluten-free"], isVeg: true, badge: "", description: "Crunchy puffed rice mixed with tangy tamarind chutney, peanuts, and fresh herbs.", image: "img/1.avif" },
  { id: 4, name: "Samosa Pav", category: "Snacks", price: 40, spice: "Medium", spiceLevel: 2, rating: 4.8, dietary: ["vegan"], isVeg: true, badge: "Mumbai Style", description: "The ultimate Mumbai street snack. Golden fried samosa sandwiched in a fresh pav with garlic chutney.", image: "img/8.avif" },
  { id: 5, name: "Aloo Tikki Burger", category: "Snacks", price: 55, spice: "Medium", spiceLevel: 2, rating: 4.6, dietary: ["vegetarian"], isVeg: true, badge: "Street Style", description: "Crispy spiced potato patty served with street-style mint mayo, onions, and tomatoes.", image: "img/9.avif" },
  { id: 6, name: "Samosa", category: "Snacks", price: 30, spice: "Medium", spiceLevel: 2, rating: 4.8, dietary: ["vegan"], isVeg: true, badge: "Best Seller", description: "Crispy golden triangle stuffed with spiced potatoes and green peas.", image: "img/8.avif" },
  { id: 7, name: "Kachori", category: "Snacks", price: 35, spice: "Medium", spiceLevel: 2, rating: 4.6, dietary: ["vegan"], isVeg: true, badge: "Dilli Special", description: "Deep-fried pastry filled with spicy lentil mixture, served with tangy chutney.", image: "img/9.avif" },
  { id: 8, name: "Masala Chai (Kulhad Style)", category: "Beverages", price: 25, spice: "Low", spiceLevel: 1, rating: 4.7, dietary: ["gluten-free"], isVeg: true, badge: "Kulhad Special", description: "Brewed with fresh ginger, cardamom, and loose tea leaves, served with love in a clay kulhad.", image: "img/7.avif" },
  { id: 9, name: "Mango Lassi", category: "Beverages", price: 50, spice: "Low", spiceLevel: 1, rating: 4.9, dietary: ["vegetarian"], isVeg: true, badge: "Refreshing", description: "Thick, creamy yogurt drink blended with sweet Alphonso mango pulp and a hint of cardamom.", image: "img/7.avif" }
];

// ===== Load Menu Data (synchronous fallback + async overwrite) =====
function loadMenuData() {
  menuItems = FALLBACK_MENU;
  fetch("data/menu.json")
    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(data => {
      if (data && data.length > 0) {
        menuItems = data;
        renderAllSections();
        renderCart();
        updateCartCount();
      }
    })
    .catch(() => {});
}

// ===== DOM References =====
const specialsContainer = document.getElementById("specials-cards");
const menuContainer = document.getElementById("menu-cards") || document.getElementById("menu-container");
const cartCount = document.getElementById("cart-count");
const cartSidebar = document.getElementById("cart-sidebar");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total") || document.getElementById("total-price");
const checkoutBtn = document.getElementById("checkout-btn");

// ===== Utilities =====
function saveCart() {
  localStorage.setItem('chaatCart', JSON.stringify(cart));
}

function formatPrice(price) {
  return `\u20B9${price}`;
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
      if (qIdx === q.length) return true;
    }
  }
  return false;
}

function highlightText(text, query) {
  if (!text) return "";
  if (!query) return text;
  const escaped = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.replace(regex, "<mark class='highlight'>$1</mark>");
}

// ===== Distinct per-item image generator (SVG data-URI) =====
function generateItemImage(item) {
  const palette = {
    Chaat:  { bg: ['#FF6B35','#FF9933','#E85D2C'], dot: '#FFFFFF' },
    Snacks: { bg: ['#F7C948','#F5A623','#E8981E'], dot: '#FFFFFF' },
    Beverages: { bg: ['#4ECDC4','#44B09E','#2E86AB'], dot: '#FFFFFF' }
  };
  const p = palette[item.category] || palette.Chaat;
  const emojiMap = {
    'Golgappa / Pani Puri': '\uD83E\uDD5F',
    'Dahi Papdi Chaat': '\uD83E\uDD5F',
    'Bhel Puri': '\uD83C\uDF7F',
    'Samosa Pav': '\uD83E\uDD6A',
    'Aloo Tikki Burger': '\uD83C\uDF54',
    'Samosa': '\uD83E\uDD5F',
    'Kachori': '\uD83E\uDD6E',
    'Masala Chai (Kulhad Style)': '\uD83E\uDDCB',
    'Mango Lassi': '\uD83E\uDDCB'
  };
  const emoji = emojiMap[item.name] || '\uD83C\uDF7D\uFE0F';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
    '<defs>' +
    '<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">' +
    '<stop offset="0%" stop-color="' + p.bg[0] + '"/>' +
    '<stop offset="100%" stop-color="' + p.bg[2] + '"/>' +
    '</linearGradient>' +
    '<pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse" opacity="0.07">' +
    '<circle cx="15" cy="15" r="1.5" fill="' + p.dot + '"/>' +
    '</pattern>' +
    '</defs>' +
    '<rect width="400" height="300" fill="url(#g)" rx="16"/>' +
    '<rect width="400" height="300" fill="url(#dots)" rx="16"/>' +
    '<circle cx="200" cy="135" r="55" fill="rgba(255,255,255,0.12)"/>' +
    '<text x="200" y="150" text-anchor="middle" dominant-baseline="middle" font-size="64">' + emoji + '</text>' +
    '<text x="200" y="250" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="rgba(255,255,255,0.85)">' + item.name + '</text>' +
    '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// ===== Card Creation (New Enhanced Design) =====
function createCard(item, highlightQuery = "") {
  const card = document.createElement("article");
  card.className = "food-card";
  card.tabIndex = 0;
  card.setAttribute("aria-label", `${item.name} - ${item.description}. Price: ${formatPrice(item.price)}.`);

  const inCart = cart.find(ci => ci.item.id === item.id);
  const qty = inCart ? inCart.quantity : 0;

  const highlightedName = highlightText(item.name, highlightQuery);
  const highlightedDesc = highlightText(item.description, highlightQuery);

  const vegClass = item.isVeg ? "veg" : "non-veg";
  const badgeHtml = item.badge
    ? `<span class="card-tag">${item.badge}</span>`
    : `<span class="card-tag empty"></span>`;

  const level = item.spiceLevel || 1;
  const spiceClass = level <= 1 ? "mild" : level === 2 ? "medium" : "hot";
  let chilliHtml = "";
  for (let i = 1; i <= 3; i++) {
    chilliHtml += `<span class="chilli${i <= level ? ' active' : ''}">\uD83C\uDF36\uFE0F</span>`;
  }

  const imgSrc = generateItemImage(item);

  let footerHtml;
  if (qty > 0) {
    footerHtml = `
      <div class="qty-inline">
        <button class="qty-dec" data-id="${item.id}">\u2212</button>
        <span class="qty-val">${qty}</span>
        <button class="qty-inc" data-id="${item.id}">+</button>
      </div>`;
  } else {
    footerHtml = `<button class="btn-add" data-id="${item.id}">Add</button>`;
  }

  card.innerHTML = `
    <div class="card-image">
      <img src="${imgSrc}" alt="${item.name}" loading="lazy" />
      <span class="veg-badge ${vegClass}">${item.isVeg ? 'V' : 'NV'}</span>
      ${badgeHtml}
    </div>
    <div class="card-body">
      <h3>${highlightedName}</h3>
      <p class="card-desc">${highlightedDesc}</p>
      <div class="spice-meter">
        <div class="chilli-row">
          ${chilliHtml}
        </div>
        <span class="spice-label ${spiceClass}">${item.spice}</span>
      </div>
    </div>
    <div class="card-footer">
      <span class="price">${formatPrice(item.price)}</span>
      ${footerHtml}
    </div>
  `;

  const addBtn = card.querySelector(".btn-add");
  if (addBtn) addBtn.addEventListener("click", () => addToCart(item.id));

  const decBtn = card.querySelector(".qty-dec");
  const incBtn = card.querySelector(".qty-inc");
  if (decBtn) decBtn.addEventListener("click", () => removeFromCart(item.id));
  if (incBtn) incBtn.addEventListener("click", () => addToCart(item.id));

  return card;
}

// ===== Section Rendering (Index Page) =====
function renderAllSections() {
  const query = currentSearchQuery;

  function matchesSearch(item) {
    if (!query) return true;
    return fuzzyMatch(item.name, query) ||
           fuzzyMatch(item.description, query) ||
           fuzzyMatch(item.category, query);
  }

  const chaatContainer = document.getElementById("chaat-cards");
  if (chaatContainer) {
    chaatContainer.innerHTML = "";
    menuItems.filter(i => i.category === "Chaat" && matchesSearch(i))
      .forEach(item => chaatContainer.appendChild(createCard(item, query)));
    if (chaatContainer.children.length === 0) {
      chaatContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:2rem;">No chaat items found.</p>`;
    }
  }

  const snacksContainer = document.getElementById("snacks-cards");
  if (snacksContainer) {
    snacksContainer.innerHTML = "";
    menuItems.filter(i => i.category === "Snacks" && matchesSearch(i))
      .forEach(item => snacksContainer.appendChild(createCard(item, query)));
    if (snacksContainer.children.length === 0) {
      snacksContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:2rem;">No snacks found.</p>`;
    }
  }

  const bevContainer = document.getElementById("beverages-cards");
  if (bevContainer) {
    bevContainer.innerHTML = "";
    menuItems.filter(i => i.category === "Beverages" && matchesSearch(i))
      .forEach(item => bevContainer.appendChild(createCard(item, query)));
    if (bevContainer.children.length === 0) {
      bevContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:2rem;">No beverages found.</p>`;
    }
  }
}

// ===== Menu Page Rendering (menu.html) =====
function renderMenu(filter) {
  currentCategory = filter || "All";
  applyAllFilters();
}

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
      menuContainer.innerHTML = `<p style="text-align:center;color:var(--text-muted);font-weight:600;width:100%;margin-top:2rem;">No items found matching your filters.</p>`;
      return;
    }

    filtered.forEach(item => {
      menuContainer.appendChild(createCard(item, query));
    });
  }, 800);
}

// ===== Theme Toggle =====
function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle-btn");
  const icon = document.getElementById("theme-icon");
  if (!btn) return;

  function updateIcon() {
    const theme = document.documentElement.getAttribute("data-theme");
    icon.textContent = theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19";
  }

  updateIcon();

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("chaatTheme", next);
    updateIcon();
  });
}

// ===== Cart Operations =====
function addToCart(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;

  const cartItem = cart.find(ci => ci.item.id === id);
  if (cartItem) {
    cartItem.quantity++;
  } else {
    cart.push({ item, quantity: 1 });
  }
  updateCartCount();
  renderCart();
  saveCart();
  renderAllSections();

  if (cartSidebar) {
    cartSidebar.classList.add("open");
    cartSidebar.setAttribute("aria-hidden", "false");
  }
}

function removeFromCart(id) {
  const cartIndex = cart.findIndex(ci => ci.item.id === id);
  if (cartIndex === -1) return;

  if (cart[cartIndex].quantity > 1) {
    cart[cartIndex].quantity--;
  } else {
    cart.splice(cartIndex, 1);
  }
  updateCartCount();
  renderCart();
  saveCart();
  renderAllSections();
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
        `<p style="text-align:center;color:var(--text-muted);margin-top:2rem;">Your cart is empty.</p>`;
      if (checkoutBtn) checkoutBtn.disabled = true;
      if (cartTotal) cartTotal.textContent = "Total: \u20B90";
      return;
    }

    cart.forEach(({ item, quantity }) => {
      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";
      cartItem.tabIndex = 0;
      cartItem.setAttribute("aria-label", `${item.name}, quantity ${quantity}, price ${formatPrice(item.price * quantity)}`);

      cartItem.innerHTML = `
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>${formatPrice(item.price)} each</p>
          <div class="qty-controls">
            <button aria-label="Decrease ${item.name}" class="qty-decrease">\u2212</button>
            <span>${quantity}</span>
            <button aria-label="Increase ${item.name}" class="qty-increase">+</button>
          </div>
        </div>
        <div style="text-align:right;">
          <p style="font-weight:700;color:var(--accent-primary);">${formatPrice(item.price * quantity)}</p>
          <button class="cart-item-remove">Remove</button>
        </div>
      `;

      const decreaseBtn = cartItem.querySelector(".qty-decrease");
      if (decreaseBtn) decreaseBtn.addEventListener("click", () => removeFromCart(item.id));

      const increaseBtn = cartItem.querySelector(".qty-increase");
      if (increaseBtn) increaseBtn.addEventListener("click", () => addToCart(item.id));

      const removeBtn = cartItem.querySelector(".cart-item-remove");
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          cart = cart.filter(ci => ci.item.id !== item.id);
          updateCartCount();
          renderCart();
          saveCart();
          renderAllSections();
        });
      }

      cartItemsContainer.appendChild(cartItem);
    });

    const total = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
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

// ===== Checkout & Orders =====
window.checkout = function() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
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
    status: "Pending"
  };

  orders.unshift(newOrder);
  localStorage.setItem('chaatOrders', JSON.stringify(orders));

  cart = [];
  updateCartCount();
  renderCart();
  saveCart();
  renderAllSections();

  alert("Thank you for your order! Your hot street food is on the way. Redirecting to your Orders dashboard...");
  window.location.href = "orders.html";
};

window.reorderOrder = function(orderId) {
  const pastOrder = orders.find(o => o.id === orderId);
  if (!pastOrder) return;

  pastOrder.items.forEach(orderItem => {
    const existingCartItem = cart.find(ci => ci.item.id === orderItem.item.id);
    if (existingCartItem) {
      existingCartItem.quantity += orderItem.quantity;
    } else {
      cart.push({ item: orderItem.item, quantity: orderItem.quantity });
    }
  });

  updateCartCount();
  renderCart();
  saveCart();
  renderAllSections();

  alert("Items added back to your cart successfully!");

  if (cartSidebar) {
    cartSidebar.classList.add("open");
    cartSidebar.setAttribute("aria-hidden", "false");
  }
};

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

// ===== Order Tracking =====
function updateOrderStatuses() {
  let changed = false;
  const now = Date.now();

  orders.forEach(order => {
    if (order.status === "Delivered") return;
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
      </div>`;
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
          <span>${ci.item.name} \u00D7 ${ci.quantity}</span>
          <span>${formatPrice(ci.item.price * ci.quantity)}</span>
        </div>`;
    });

    card.innerHTML = `
      <div class="order-card-header">
        <div class="order-meta-info">
          <span class="order-id">Order ID: <strong>${order.id}</strong></span>
          <span class="order-date">${order.date}</span>
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
        <div class="order-total-price">
          <span>Total Paid:</span>
          <strong>${formatPrice(order.total)}</strong>
        </div>
        <button class="btn-reorder" onclick="reorderOrder('${order.id}')">Reorder Items</button>
      </div>`;

    container.appendChild(card);
  });
}

// ===== Event Setups =====
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
    cartSidebar.classList.add("open");
    cartSidebar.setAttribute("aria-hidden", "false");
  });

  cartCloseBtn.addEventListener("click", () => {
    cartSidebar.classList.remove("open");
    cartSidebar.setAttribute("aria-hidden", "true");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cartSidebar.classList.contains("open")) {
      cartSidebar.classList.remove("open");
      cartSidebar.setAttribute("aria-hidden", "true");
    }
  });
}

function setupOrderNowScroll() {
  const orderNowBtn = document.getElementById("order-now-btn");
  const chaatSection = document.getElementById("chaat-corner");
  if (!orderNowBtn || !chaatSection) return;
  orderNowBtn.addEventListener("click", () => {
    chaatSection.scrollIntoView({ behavior: "smooth" });
  });
}

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
        <span class="suggestion-category">${item.category}</span>`;
      div.addEventListener("click", () => {
        searchInput.value = item.name;
        suggestionsContainer.style.display = "none";
        currentSearchQuery = item.name;
        renderAllSections();
        const firstSection = document.getElementById("chaat-corner");
        if (firstSection) firstSection.scrollIntoView({ behavior: "smooth" });
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
  if (!searchInput) return;

  function handleSearch() {
    currentSearchQuery = searchInput.value.trim();
    renderAllSections();
    applyAllFilters();
  }

  if (searchBtn) searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSearch();
      const suggestionsContainer = document.getElementById("search-suggestions");
      if (suggestionsContainer) suggestionsContainer.style.display = "none";
    }
  });
}

function setupAdvancedFilters() {
  const toggleBtn = document.getElementById("filter-toggle-btn");
  const filterPanel = document.getElementById("advanced-filters");
  if (!toggleBtn || !filterPanel) return;

  toggleBtn.addEventListener("click", () => {
    const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
    toggleBtn.setAttribute("aria-expanded", !isExpanded);
    filterPanel.style.display = isExpanded ? "none" : "block";
    toggleBtn.classList.toggle("active", !isExpanded);
  });

  const priceSlider = document.getElementById("price-range-slider");
  const priceSliderVal = document.getElementById("price-slider-val");
  if (priceSlider && priceSliderVal) {
    priceSlider.addEventListener("input", () => {
      priceSliderVal.textContent = `\u20B9${priceSlider.value}`;
      priceSlider.setAttribute("aria-valuenow", priceSlider.value);
      applyAllFilters();
    });
  }

  const spiceSelect = document.getElementById("spice-level-select");
  if (spiceSelect) spiceSelect.addEventListener("change", applyAllFilters);

  const ratingSelect = document.getElementById("rating-select");
  if (ratingSelect) ratingSelect.addEventListener("change", applyAllFilters);

  const veganCheck = document.getElementById("dietary-vegan");
  if (veganCheck) veganCheck.addEventListener("change", applyAllFilters);

  const gfCheck = document.getElementById("dietary-gf");
  if (gfCheck) gfCheck.addEventListener("change", applyAllFilters);

  const resetBtn = document.getElementById("reset-filters-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (priceSlider) {
        priceSlider.value = 100;
        priceSliderVal.textContent = "\u20B9100";
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

function setupContactForm() {
  const form = document.getElementById("contact-form");
  const formSuccess = document.getElementById("form-success");
  if (!form || !formSuccess) return;

  const nameInput = form.querySelector("#name");
  const emailInput = form.querySelector("#email");
  const messageInput = form.querySelector("#message");
  const errorName = form.querySelector("#error-name");
  const errorEmail = form.querySelector("#error-email");
  const errorMessage = form.querySelector("#error-message");
  const submitBtn = form.querySelector(".btn-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    errorName.textContent = "";
    errorEmail.textContent = "";
    errorMessage.textContent = "";
    formSuccess.style.display = "none";

    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const messageVal = messageInput.value.trim();
    let valid = true;

    if (nameVal === "") {
      errorName.textContent = "Name is required.";
      valid = false;
    } else if (nameVal.length < 2) {
      errorName.textContent = "Name must be at least 2 characters.";
      valid = false;
    }

    if (emailVal === "") {
      errorEmail.textContent = "Email is required.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      errorEmail.textContent = "Please enter a valid email address.";
      valid = false;
    }

    if (messageVal === "") {
      errorMessage.textContent = "Message is required.";
      valid = false;
    } else if (messageVal.length < 10) {
      errorMessage.textContent = "Message must be at least 10 characters.";
      valid = false;
    }

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    const payload = { name: nameVal, email: emailVal, message: messageVal };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server returned ${response.status}`);
      }

      formSuccess.style.display = "block";
      form.reset();
    } catch (err) {
      errorMessage.textContent = err.message || "Failed to send. Please try again.";
      formSuccess.style.display = "none";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }

    setTimeout(() => {
      formSuccess.style.display = "none";
    }, 5000);
  });
}

function setupNewsletterForm() {
  const newsletterForm = document.getElementById("newsletter-form");
  if (!newsletterForm) return;
  const emailInput = newsletterForm.querySelector("#newsletter-email");

  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const emailVal = emailInput.value.trim();
    if (!emailVal || !/\S+@\S+\.\S+/.test(emailVal)) {
      alert("Please enter a valid email address.");
      return;
    }
    alert("Thank you for subscribing!");
    newsletterForm.reset();
  });
}

// ===== Initialization =====
function init() {
  setupThemeToggle();
  setupCartToggle();
  setupFilterButtons();
  setupOrderNowScroll();
  setupSearchSuggestions();
  setupSearch();
  setupAdvancedFilters();
  setupContactForm();
  setupNewsletterForm();

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => window.checkout());
  }

  loadMenuData();

  renderAllSections();
  renderOrdersList();
  updateCartCount();
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
    <span class="skeleton sk-desc-line"></span>
    <span class="skeleton sk-price"></span>
    <span class="skeleton sk-btn"></span>`;
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
    </div>`;
  return el;
}

function showSkeletonCartItems(count = 2) {
  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = "";
  for (let i = 0; i < count; i++) {
    cartItemsContainer.appendChild(createSkeletonCartItem());
  }
}
