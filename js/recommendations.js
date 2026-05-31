/// ===== SMART RECOMMENDATION ENGINE =====

// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem("chaatCart")) || [];

// ===== FOOD PAIRINGS =====

const foodPairings = {

  "Samosa": [
    { name: "Masala Chai", price: 40, emoji: "☕" },
    { name: "Green Chutney", price: 20, emoji: "🥣" }
  ],

  "Pani Puri": [
    { name: "Sweet Lassi", price: 60, emoji: "🥛" },
    { name: "Papdi Chaat", price: 80, emoji: "🥗" }
  ],

  "Papdi Chaat": [
    { name: "Cold Coffee", price: 90, emoji: "🧋" },
    { name: "Dahi Puri", price: 85, emoji: "🥣" }
  ],

  "Bhel Puri": [
    { name: "Masala Soda", price: 50, emoji: "🥤" },
    { name: "Sev Puri", price: 75, emoji: "🍜" }
  ],

  "Dahi Puri": [
    { name: "Mango Lassi", price: 70, emoji: "🥭" },
    { name: "Pav Bhaji", price: 120, emoji: "🍛" }
  ],

  "Pav Bhaji": [
    { name: "Fresh Lime Soda", price: 45, emoji: "🍋" },
    { name: "Extra Butter Pav", price: 35, emoji: "🧈" }
  ],

  "Vada Pav": [
    { name: "Cutting Chai", price: 30, emoji: "☕" },
    { name: "French Fries", price: 90, emoji: "🍟" }
  ],

  "Burger": [
    { name: "French Fries", price: 90, emoji: "🍟" },
    { name: "Coke", price: 50, emoji: "🥤" }
  ],

  "Pizza": [
    { name: "Garlic Bread", price: 110, emoji: "🍞" },
    { name: "Coke", price: 50, emoji: "🥤" }
  ],

  "Biryani": [
    { name: "Raita", price: 50, emoji: "🥣" },
    { name: "Kebab", price: 120, emoji: "🍢" }
  ],

  "Coffee": [
    { name: "Brownie", price: 90, emoji: "🍫" },
    { name: "Cookies", price: 70, emoji: "🍪" }
  ],

  "Cold Coffee": [
    { name: "Chocolate Brownie", price: 110, emoji: "🍫" },
    { name: "Garlic Bread", price: 90, emoji: "🍞" }
  ],

  "Masala Chai": [
    { name: "Samosa", price: 40, emoji: "🥟" },
    { name: "Pakoda", price: 60, emoji: "🍘" }
  ],

  "Sweet Lassi": [
    { name: "Pani Puri", price: 80, emoji: "🥙" },
    { name: "Aloo Tikki", price: 70, emoji: "🥔" }
  ],

  "Momos": [
    { name: "Hot Garlic Sauce", price: 30, emoji: "🌶️" },
    { name: "Lemon Soda", price: 40, emoji: "🍋" }
  ],

  "French Fries": [
    { name: "Burger", price: 130, emoji: "🍔" },
    { name: "Cold Drink", price: 45, emoji: "🥤" }
  ],

  "Noodles": [
    { name: "Manchurian", price: 120, emoji: "🍜" },
    { name: "Cold Coffee", price: 90, emoji: "🧋" }
  ],

  "Manchurian": [
    { name: "Hakka Noodles", price: 140, emoji: "🍜" },
    { name: "Sprite", price: 45, emoji: "🥤" }
  ],

  "Ice Cream": [
    { name: "Brownie", price: 90, emoji: "🍫" },
    { name: "Cold Coffee", price: 80, emoji: "🧋" }
  ]
};

// ===== ADD TO CART FUNCTION =====

function addToCart(itemName, itemPrice) {

  const existingItem = cart.find(
    cartItem => cartItem.item.name === itemName
  );

  if (existingItem) {

    existingItem.quantity += 1;

  } else {

    cart.push({
      item: {
        name: itemName,
        price: itemPrice
      },
      quantity: 1
    });
  }

  // Save cart
  localStorage.setItem("chaatCart", JSON.stringify(cart));

  // Update cart count
  updateCartCount();

  // Toast
  showToast(`${itemName} added to cart 🛒`);
}

// ===== UPDATE CART COUNT =====

function updateCartCount() {

  const cartCount = document.getElementById("cart-count");

  if (!cartCount) return;

  let totalItems = 0;

  cart.forEach(item => {
    totalItems += item.quantity;
  });

  cartCount.textContent = totalItems;
}

// ===== TOAST MESSAGE =====

function showToast(message) {

  let toast = document.getElementById("toast-notification");

  if (!toast) {

    toast = document.createElement("div");

    toast.id = "toast-notification";

    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "#222";
    toast.style.color = "#fff";
    toast.style.padding = "12px 18px";
    toast.style.borderRadius = "10px";
    toast.style.zIndex = "9999";
    toast.style.fontWeight = "600";

    document.body.appendChild(toast);
  }

  toast.textContent = message;

  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 2500);
}

// ===== RENDER SMART COMBOS PAGE =====

function renderComboPage() {

  const comboGrid = document.getElementById("combo-grid");

  if (!comboGrid) return;

  comboGrid.innerHTML = "";

  Object.entries(foodPairings).forEach(([food, pairings]) => {

    const card = document.createElement("div");

    card.className = "combo-card";

    let pairingHTML = "";

    pairings.forEach(item => {

      pairingHTML += `
        <div class="combo-item">

          <div class="combo-item-left">
            <span class="combo-emoji">
              ${item.emoji || "🍴"}
            </span>

            <span class="combo-name">
              ${item.name}
            </span>
          </div>

          <div class="combo-item-right">

            <span class="combo-price">
              ₹${item.price}
            </span>

            <button
              class="combo-add-btn"
              onclick="addToCart('${item.name}', ${item.price})"
            >
              Add
            </button>

          </div>

        </div>
      `;
    });

    card.innerHTML = `
      <div class="combo-header">

        <h2>
          ${food}
        </h2>

        <p>
          Best enjoyed with these delicious pairings 🍽️
        </p>

      </div>

      <div class="combo-items">
        ${pairingHTML}
      </div>
    `;

    comboGrid.appendChild(card);
  });
}

// ===== RENDER MENU PAGE RECOMMENDATIONS =====

function renderRecommendations() {

  const recommendationContainer =
    document.getElementById("recommendation-container");

  if (!recommendationContainer) return;

  recommendationContainer.innerHTML = "";

  if (cart.length === 0) {

    recommendationContainer.innerHTML = `
      <p class="recommend-placeholder">
        Add items to cart to see smart combo suggestions.
      </p>
    `;

    return;
  }

  let recommendations = [];

  cart.forEach(cartItem => {

    const itemName = cartItem.item.name;

    if (foodPairings[itemName]) {

      recommendations.push(...foodPairings[itemName]);
    }
  });

  // Remove duplicates
  const uniqueRecommendations = recommendations.filter(
    (item, index, self) =>
      index === self.findIndex(t => t.name === item.name)
  );

  if (uniqueRecommendations.length === 0) {

    recommendationContainer.innerHTML = `
      <p class="recommend-placeholder">
        No recommendations available.
      </p>
    `;

    return;
  }

  uniqueRecommendations.forEach(item => {

    const card = document.createElement("div");

    card.className = "recommend-card";

    card.innerHTML = `
      <div class="recommend-top">

        <span class="recommend-emoji">
          ${item.emoji || "🍴"}
        </span>

        <h3>
          ${item.name}
        </h3>

      </div>

      <p>
        Perfect combo for your meal 🍽️
      </p>

      <div class="recommend-bottom">

        <span>
          ₹${item.price}
        </span>

        <button
          class="recommend-add-btn"
          onclick="addToCart('${item.name}', ${item.price})"
        >
          Add
        </button>

      </div>
    `;

    recommendationContainer.appendChild(card);
  });
}

// ===== INITIALIZE =====

document.addEventListener("DOMContentLoaded", () => {

  updateCartCount();

  renderRecommendations();

  renderComboPage();
});
