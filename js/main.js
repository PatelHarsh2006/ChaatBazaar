let menuItems = [];
let currentCategory = "All";

// ===== Fetch Menu Data =====
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

let cart = JSON.parse(localStorage.getItem('chaatCart')) || [];

function saveCart() {
  localStorage.setItem('chaatCart', JSON.stringify(cart));
}

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
    </div>
    <div class="card-footer">
      <span class="price">${formatPrice(item.price)}</span>
      <button class="add-btn" aria-label="Add ${item.name} to cart">Add</button>
    </div>
  `;

  const addBtn = card.querySelector(".add-btn");
  addBtn.addEventListener("click", () => addToCart(item.id));

  return card;
}

function renderSpecials() {
  if (!specialsContainer) return;
  // Pick top 3 items as specials
  const specials = menuItems.slice(0, 3);

  // 1. Show skeletons immediately
  showSkeletonCards(specialsContainer, specials.length);

  // 2. Simulate async load
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

// ===== Unified Interactive Filter Engine =====

function applyAllFilters() {
  if (!menuContainer) return;

  // 1. Show skeleton cards while computing
  showSkeletonCards(menuContainer, 4);

  // 2. Render cards after dynamic timing delay
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

    // Unified sequential filtering
    let filtered = menuItems;

    // Filter 1: Category
    if (currentCategory !== "All") {
      filtered = filtered.filter(item => item.category === currentCategory);
    }

    // Filter 2: Fuzzy keyword search
    if (query) {
      filtered = filtered.filter(item =>
        fuzzyMatch(item.name, query) ||
        (item.description && fuzzyMatch(item.description, query)) ||
        (item.category && fuzzyMatch(item.category, query))
      );
    }

    // Filter 3: Price range slider
    filtered = filtered.filter(item => item.price <= maxPrice);

    // Filter 4: Spice level
    if (selectedSpice !== "All") {
      filtered = filtered.filter(item => item.spice === selectedSpice);
    }

    // Filter 5: Ratings
    if (minRating !== "All") {
      const ratingVal = parseFloat(minRating);
      filtered = filtered.filter(item => (item.rating || 5) >= ratingVal);
    }

    // Filter 6: Dietary tags
    if (veganCheck && veganCheck.checked) {
      filtered = filtered.filter(item => item.dietary && item.dietary.includes("vegan"));
    }
    if (gfCheck && gfCheck.checked) {
      filtered = filtered.filter(item => item.dietary && item.dietary.includes("gluten-free"));
    }

    // Render result
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
  }, 800); // responsive delayed loading animation
}

function renderCart() {
  if (!cartItemsContainer) return;

  // 1. Show skeletons briefly when cart first opens
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

      // Decrease quantity
      const decreaseBtn = cartItem.querySelector(".qty-decrease");
      if (decreaseBtn) {
        decreaseBtn.addEventListener("click", () => removeFromCart(item.id));
      }

      // Increase quantity
      const increaseBtn = cartItem.querySelector(".qty-increase");
      if (increaseBtn) {
        increaseBtn.addEventListener("click", () => addToCart(item.id));
      }

      // Remove entirely
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

  }, 600); // short delay — cart data is already local
}

function updateCartCount() {
  if (cartCount) {
    const totalCount = cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
    cartCount.textContent = totalCount;
  }
}

// ===== Global Window Handlers for Multi-page support =====

window.filterCategory = function(category) {
  currentCategory = category;
  applyAllFilters();

  // Update active button states
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

window.checkout = function() {
  alert("Thank you for your order! Your delicious chaat is on the way.");
  cart = [];
  updateCartCount();
  renderCart();
  saveCart();
};

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
    cartSidebar.style.transform = "translateX(0)";
  });

  cartCloseBtn.addEventListener("click", () => {
    cartSidebar.setAttribute("aria-hidden", "true");
    cartSidebar.style.transform = "translateX(100%)";
  });

  // Close cart on Escape key when open
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cartSidebar.getAttribute("aria-hidden") === "false") {
      cartSidebar.setAttribute("aria-hidden", "true");
      cartSidebar.style.transform = "translateX(100%)";
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

    // Filter matching suggestions
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

        // Scroll to menu section smoothly
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

  // Close suggestions when clicking outside
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

  // Price Slider Bindings
  const priceSlider = document.getElementById("price-range-slider");
  const priceSliderVal = document.getElementById("price-slider-val");
  if (priceSlider && priceSliderVal) {
    priceSlider.addEventListener("input", () => {
      priceSliderVal.textContent = `₹${priceSlider.value}`;
      priceSlider.setAttribute("aria-valuenow", priceSlider.value);
      applyAllFilters();
    });
  }

  // Spice level Dropdown Bindings
  const spiceSelect = document.getElementById("spice-level-select");
  if (spiceSelect) {
    spiceSelect.addEventListener("change", applyAllFilters);
  }

  // Minimum Rating selector
  const ratingSelect = document.getElementById("rating-select");
  if (ratingSelect) {
    ratingSelect.addEventListener("change", applyAllFilters);
  }

  // Dietary Checkboxes
  const veganCheck = document.getElementById("dietary-vegan");
  if (veganCheck) {
    veganCheck.addEventListener("change", applyAllFilters);
  }

  const gfCheck = document.getElementById("dietary-gf");
  if (gfCheck) {
    gfCheck.addEventListener("change", applyAllFilters);
  }

  // Reset Filters Button
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

      // Reset category button highlights
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

  const nameInput = form.querySelector("#name");
  const emailInput = form.querySelector("#email");
  const messageInput = form.querySelector("#message");

  const errorName = form.querySelector("#error-name");
  const errorEmail = form.querySelector("#error-email");
  const errorMessage = form.querySelector("#error-message");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Clear previous errors and hide any success banner
    errorName.textContent = "";
    errorEmail.textContent = "";
    errorMessage.textContent = "";
    formSuccess.style.display = "none";

    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const messageVal = messageInput.value.trim();

    let valid = true;

    // Validate Name
    if (nameVal === "") {
      errorName.textContent = "Name is required.";
      valid = false;
    } else if (nameVal.length < 2) {
      errorName.textContent = "Name must be at least 2 characters.";
      valid = false;
    }

    // Validate Email
    if (emailVal === "") {
      errorEmail.textContent = "Email is required.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      errorEmail.textContent = "Please enter a valid email address.";
      valid = false;
    }

    // Validate Message
    if (messageVal === "") {
      errorMessage.textContent = "Message is required.";
      valid = false;
    } else if (messageVal.length < 10) {
      errorMessage.textContent = "Message must be at least 10 characters.";
      valid = false;
    }

    if (!valid) return;

    // Show success banner and reset form after 3 s
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

    const emailVal = emailInput.value.trim();
    if (!emailVal || !/\S+@\S+\.\S+/.test(emailVal)) {
      alert("Please enter a valid email address.");
      return;
    }

    alert("Thank you for subscribing!");
    newsletterForm.reset();
  });
}

function setupCheckout() {
  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) return;

    const session = localStorage.getItem("cb_session");
    if (!session) {
      window.location.href = "auth.html?redirect=index.html";
      return;
    }

    const ordersKey = `cb_orders_${session}`;
    const orders = JSON.parse(localStorage.getItem(ordersKey) || "[]");

    const total = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
    const order = {
      id: Date.now(),
      date: new Date().toISOString(),
      items: cart.map(ci => ({
        name: ci.item.name,
        price: ci.item.price,
        quantity: ci.quantity
      })),
      total
    };

    orders.push(order);
    localStorage.setItem(ordersKey, JSON.stringify(orders));

    cart = [];
    updateCartCount();
    renderCart();

    alert(`✅ Order placed! Total: ₹${total}\nView it in your Order History.`);
  });
}

// ===== Initialization =====

async function init() {
  await loadMenuData();

  renderSpecials();
  applyAllFilters(); // Initial unified dynamic card rendering
  updateCartCount();
  renderCart();

  setupFilterButtons();
  setupCartToggle();
  setupOrderNowScroll();
  setupSearchSuggestions();
  setupSearch();
  setupAdvancedFilters();
  setupContactForm();
  setupNewsletterForm();

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      alert("Thank you for your order! Your delicious chaat is on the way.");
      cart = [];
      updateCartCount();
      renderCart();
      saveCart();
    });
  }
}

document.addEventListener("DOMContentLoaded", init);

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