// ===== Unified Cart State Management =====

const CART_STORAGE_KEY = 'chaatCart';
const CART_SYNC_EVENT = 'cartStateChanged';

class CartManager {
  constructor() {
    this.items = this.loadFromStorage();
    this.listeners = [];
    this.setupStorageSync();
  }

  // Load cart from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      return [];
    }
  }

  // Save cart to localStorage and notify listeners
  saveToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
      this.notifyListeners();
      // Dispatch custom event for cross-tab/cross-component sync
      window.dispatchEvent(new CustomEvent(CART_SYNC_EVENT, { detail: this.items }));
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.error('Storage quota exceeded:', error);
        this.handleStorageQuotaExceeded();
      } else {
        console.error('Error saving cart to storage:', error);
      }
    }
  }

  // Handle storage quota exceeded
  handleStorageQuotaExceeded() {
    const message = 'Storage limit exceeded. Your cart may not be saved. Please clear browser cache and try again.';
    console.warn(message);
    // Dispatch event for UI to show notification
    window.dispatchEvent(new CustomEvent('storageQuotaExceeded', { detail: message }));
  }

  // Setup storage event listener for cross-tab sync
  setupStorageSync() {
    window.addEventListener('storage', (event) => {
      if (event.key === CART_STORAGE_KEY && event.newValue) {
        try {
          this.items = JSON.parse(event.newValue);
          this.notifyListeners();
        } catch (error) {
          console.error('Error syncing cart from storage event:', error);
        }
      }
    });

    // Listen for custom cart events
    window.addEventListener(CART_SYNC_EVENT, (event) => {
      this.notifyListeners();
    });
  }

  // Subscribe to cart changes
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of cart changes
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.items);
      } catch (error) {
        console.error('Error in cart listener:', error);
      }
    });
  }

  // Get current cart items
  getItems() {
    return [...this.items];
  }

  // Get cart item by ID
  getItem(itemId) {
    return this.items.find(cartItem => cartItem.item.id === itemId);
  }

  // Get total number of items
  getTotalCount() {
    return this.items.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
  }

  // Get total price
  getTotalPrice() {
    return this.items.reduce((sum, cartItem) => sum + (cartItem.item.price * cartItem.quantity), 0);
  }

  // Add item to cart
  addItem(item, quantity = 1) {
    if (!item || !item.id) {
      console.error('Invalid item:', item);
      return false;
    }

    const existingItem = this.getItem(item.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        item: { ...item },
        quantity
      });
    }

    this.saveToStorage();
    return true;
  }

  // Remove item from cart
  removeItem(itemId) {
    const index = this.items.findIndex(cartItem => cartItem.item.id === itemId);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Update item quantity
  updateQuantity(itemId, quantity) {
    const cartItem = this.getItem(itemId);
    if (!cartItem) return false;

    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    cartItem.quantity = quantity;
    this.saveToStorage();
    return true;
  }

  // Increase item quantity
  increaseQuantity(itemId) {
    const cartItem = this.getItem(itemId);
    if (cartItem) {
      cartItem.quantity++;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Decrease item quantity
  decreaseQuantity(itemId) {
    const cartItem = this.getItem(itemId);
    if (!cartItem) return false;

    if (cartItem.quantity > 1) {
      cartItem.quantity--;
    } else {
      return this.removeItem(itemId);
    }

    this.saveToStorage();
    return true;
  }

  // Clear entire cart
  clear() {
    this.items = [];
    this.saveToStorage();
    return true;
  }

  // Check if cart is empty
  isEmpty() {
    return this.items.length === 0;
  }

  // Get cart size (number of unique items)
  getSize() {
    return this.items.length;
  }

  // Validate cart integrity
  validate() {
    if (!Array.isArray(this.items)) {
      console.warn('Cart items is not an array, resetting');
      this.items = [];
      return false;
    }

    const validItems = this.items.filter(cartItem => {
      return cartItem &&
             cartItem.item &&
             cartItem.item.id &&
             typeof cartItem.quantity === 'number' &&
             cartItem.quantity > 0;
    });

    if (validItems.length !== this.items.length) {
      console.warn(`Cart integrity check failed: removed ${this.items.length - validItems.length} invalid items`);
      this.items = validItems;
      this.saveToStorage();
      return false;
    }

    return true;
  }

  // Export cart for backup/export
  export() {
    return {
      items: this.getItems(),
      totalCount: this.getTotalCount(),
      totalPrice: this.getTotalPrice(),
      exportDate: new Date().toISOString()
    };
  }

  // Import cart from backup
  import(cartData) {
    if (!cartData || !Array.isArray(cartData.items)) {
      console.error('Invalid cart data for import');
      return false;
    }

    this.items = cartData.items;
    this.validate();
    this.saveToStorage();
    return true;
  }
}

// Global cart manager instance
const cartManager = new CartManager();

// Expose cart manager globally for compatibility
window.cartManager = cartManager;

// Backward compatibility - sync cartManager with old global cart variable
if (typeof cart !== 'undefined') {
  // Sync initial cart variable with cartManager
  cart = cartManager.getItems();

  // Setup listener to keep cart variable in sync
  cartManager.subscribe((items) => {
    // Only update if cart variable exists (for compatibility)
    if (typeof cart !== 'undefined') {
      cart = [...items];
    }
  });
}

// Helper functions for use in templates and event handlers
function getCartCount() {
  return cartManager.getTotalCount();
}

function getCartTotal() {
  return cartManager.getTotalPrice();
}

function addToCartManager(item) {
  return cartManager.addItem(item, 1);
}

function removeFromCartManager(itemId) {
  return cartManager.removeItem(itemId);
}

function updateCartQuantity(itemId, quantity) {
  return cartManager.updateQuantity(itemId, quantity);
}

function increaseCartQuantity(itemId) {
  return cartManager.increaseQuantity(itemId);
}

function decreaseCartQuantity(itemId) {
  return cartManager.decreaseQuantity(itemId);
}

function clearCart() {
  return cartManager.clear();
}

function getCartItems() {
  return cartManager.getItems();
}

// Expose helper functions globally
window.getCartCount = getCartCount;
window.getCartTotal = getCartTotal;
window.addToCartManager = addToCartManager;
window.removeFromCartManager = removeFromCartManager;
window.updateCartQuantity = updateCartQuantity;
window.increaseCartQuantity = increaseCartQuantity;
window.decreaseCartQuantity = decreaseCartQuantity;
window.clearCart = clearCart;
window.getCartItems = getCartItems;
