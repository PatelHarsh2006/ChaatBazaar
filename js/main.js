const menuItems = [
  {
    id: 1,
    name: "Samosa",
    category: "Snacks",
    price: 30,
    description: "Crispy golden triangle stuffed with spiced potatoes.",
    image: "img/8.avif"
  },
  {
    id: 2,
    name: "Pani Puri",
    category: "Chaat",
    price: 50,
    description: "Hollow crispy puris filled with spicy, tangy water and chickpeas.",
    image: "img/2.avif"
  },
  {
    id: 3,
    name: "Masala Chai",
    category: "Beverages",
    price: 20,
    description: "Aromatic tea brewed with spices and milk.",
    image: "img/7.avif"
  },
  {
    id: 4,
    name: "Kachori",
    category: "Snacks",
    price: 35,
    description: "Deep-fried pastry filled with spicy lentils.",
    image: "img/9.avif"
  },
  {
    id: 5,
    name: "Bhel Puri",
    category: "Chaat",
    price: 45,
    description: "Crunchy puffed rice mixed with tangy tamarind chutney.",
    image: "img/1.avif"
  },
];

// ===== Globals =====
const specialsContainer = document.getElementById("specials-cards");
const menuContainer = document.getElementById("menu-cards");
const cartCount = document.getElementById("cart-count");
const cartSidebar = document.getElementById("cart-sidebar");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");

let cart = JSON.parse(localStorage.getItem('chaatCart')) || [];

function saveCart() {
  localStorage.setItem('chaatCart', JSON.stringify(cart));
}


function formatPrice(price) {
  return `₹${price}`;
}

// ===== Render Functions =====

function createCard(item) {
  const card = document.createElement("article");
  card.className = "card";
  card.tabIndex = 0;
  card.setAttribute("aria-label", `${item.name} - ${item.description}. Price: ${formatPrice(item.price)}.`);

  card.innerHTML = `
    <img src="${item.image}" alt="${item.name}" loading="lazy" />
    <div class="card-content">
      <h3>${item.name}</h3>
      <p>${item.description}</p>
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
  const specials = menuItems.slice(0, 3);

  // 1. Show skeletons immediately
  showSkeletonCards(specialsContainer, specials.length);

  // 2. Simulate async load (e.g., a real fetch would replace this timeout)
  setTimeout(() => {
    specialsContainer.innerHTML = "";
    specials.forEach(item => {
      specialsContainer.appendChild(createCard(item));
    });
  }, 1500); // remove/reduce when using a real API
}

function renderMenu(filter = "All") {
  // 1. Show skeletons immediately
  showSkeletonCards(menuContainer, 4);

  // 2. Apply filter then render real cards after delay
  setTimeout(() => {
    menuContainer.innerHTML = "";

    const filteredItems =
      filter === "All"
        ? menuItems
        : menuItems.filter(item => item.category === filter);

    if (filteredItems.length === 0) {
      menuContainer.innerHTML =
        `<p style="text-align:center;color:#bf360c;font-weight:600;">
           No items found for "<em>${filter}</em>".
         </p>`;
      return;
    }

    filteredItems.forEach(item => {
      menuContainer.appendChild(createCard(item));
    });
  }, 1200); // remove/reduce when using a real API
}

function renderCart() {
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
      checkoutBtn.disabled = true;
      cartTotal.textContent = "Total: ₹0";
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
      cartItem
        .querySelector(".qty-decrease")
        .addEventListener("click", () => removeFromCart(item.id));

      // Increase quantity
      cartItem
        .querySelector(".qty-increase")
        .addEventListener("click", () => addToCart(item.id));

      // Remove entirely
      cartItem
        .querySelector(".cart-item-remove")
        .addEventListener("click", () => {
          cart = cart.filter(ci => ci.item.id !== item.id);
          updateCartCount();
          renderCart();
        });

      cartItemsContainer.appendChild(cartItem);
    });

    const total = cart.reduce(
      (sum, ci) => sum + ci.item.price * ci.quantity,
      0
    );
    cartTotal.textContent = `Total: ${formatPrice(total)}`;
    checkoutBtn.disabled = false;

  }, 600); // short delay — cart data is already local
}

function updateCartCount() {
  const totalCount = cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
  cartCount.textContent = totalCount;
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

  orderNowBtn.addEventListener("click", () => {
    menuSection.scrollIntoView({ behavior: "smooth" });
  });
}

//Functional Search bar
function setupSearch() {

  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");

  if (!searchInput || !searchBtn || !menuContainer) {
    return;
  }

  function searchMenu() {

    const query = searchInput.value.trim().toLowerCase();
     document.getElementById("menu").scrollIntoView({
  behavior: "smooth"
});

    if (query === "") {
      renderMenu("All");
      return;
    }

    // Filter matching items
    const filtered = menuItems.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );

    menuContainer.innerHTML = "";

    // Show matching items
    if (filtered.length > 0) {

      filtered.forEach(item => {
        menuContainer.appendChild(createCard(item));
      });

    } else {

      menuContainer.innerHTML = `
        <p style="text-align:center; width:100%;">
          No items found
        </p>
      `;

    }
  }

  searchInput.addEventListener("keyup", searchMenu);
  searchBtn.addEventListener("click", searchMenu);

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      searchMenu();
    }
  });

}

function setupContactForm() {
  const form = document.getElementById("contact-form");
  const formSuccess = document.getElementById("form-success");

  const nameInput    = form.querySelector("#name");
  const emailInput   = form.querySelector("#email");
  const messageInput = form.querySelector("#message");

  const errorName    = form.querySelector("#error-name");
  const errorEmail   = form.querySelector("#error-email");
  const errorMessage = form.querySelector("#error-message");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Clear previous errors and hide any success banner
    errorName.textContent    = "";
    errorEmail.textContent   = "";
    errorMessage.textContent = "";
    formSuccess.style.display = "none";

    const nameVal    = nameInput.value.trim();
    const emailVal   = emailInput.value.trim();
    const messageVal = messageInput.value.trim();

    let valid = true;

    // Validate Name — empty check first, then length
    if (nameVal === "") {
      errorName.textContent = "Name is required.";
      valid = false;
    } else if (nameVal.length < 2) {
      errorName.textContent = "Name must be at least 2 characters.";
      valid = false;
    }

    // Validate Email — empty check first, then format
    if (emailVal === "") {
      errorEmail.textContent = "Email is required.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      errorEmail.textContent = "Please enter a valid email address.";
      valid = false;
    }

    // Validate Message — empty check first, then length
    if (messageVal === "") {
      errorMessage.textContent = "Message is required.";
      valid = false;
    } else if (messageVal.length < 10) {
      errorMessage.textContent = "Message must be at least 10 characters.";
      valid = false;
    }

    if (!valid) return;

    // Show inline success banner and reset form after 3 s
    formSuccess.style.display = "block";
    setTimeout(() => {
      form.reset();
      formSuccess.style.display = "none";
    }, 3000);
  });
}

function setupNewsletterForm() {
  const newsletterForm = document.getElementById("newsletter-form");
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
  renderSpecials();
  renderMenu("All");
  updateCartCount();
  renderCart();

  setupFilterButtons();
  setupCartToggle();
  setupOrderNowScroll();
  setupSearch();
  setupContactForm();
  setupNewsletterForm();
}

document.addEventListener("DOMContentLoaded", init);

// ===== Skeleton UI Helpers =====

/**
 * Creates one skeleton card element that matches .card dimensions.
 */
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

/**
 * Injects `count` skeleton cards into a container.
 * @param {HTMLElement} container
 * @param {number} count
 */
function showSkeletonCards(container, count = 3) {
  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    container.appendChild(createSkeletonCard());
  }
}

/**
 * Creates one skeleton cart-item element that matches .cart-item dimensions.
 */
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

/**
 * Injects `count` skeleton cart items into the cart panel.
 * @param {number} count
 */
function showSkeletonCartItems(count = 2) {
  cartItemsContainer.innerHTML = "";

  for (let i = 0; i < count; i++) {
    cartItemsContainer.appendChild(createSkeletonCartItem());
  }
}