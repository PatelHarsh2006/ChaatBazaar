// ===============================
// CHAATBAZAR CART MANAGER (FIXED)
// ===============================

const CART_STORAGE_KEY = "chaatCart";
const CART_SYNC_EVENT = "cartStateChanged";

class CartManager {
  constructor() {
    this.items = this.loadFromStorage();
    this.listeners = [];
    this.setupSync();
  }

  // =====================
  // LOAD
  // =====================
  loadFromStorage() {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error("Cart load error:", err);
      return [];
    }
  }

  // =====================
  // SAVE
  // =====================
  saveToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
    this.notify();
    window.dispatchEvent(new CustomEvent(CART_SYNC_EVENT));
  }

  // =====================
  // SYNC ACROSS TABS
  // =====================
  setupSync() {
    window.addEventListener("storage", (e) => {
      if (e.key === CART_STORAGE_KEY) {
        this.items = e.newValue ? JSON.parse(e.newValue) : [];
        this.notify();
      }
    });

    window.addEventListener(CART_SYNC_EVENT, () => {
      this.notify();
    });
  }

  // =====================
  // LISTENERS
  // =====================
  subscribe(cb) {
    this.listeners.push(cb);
    return () =>
      (this.listeners = this.listeners.filter((fn) => fn !== cb));
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.items));
  }

  // =====================
  // NORMALIZE ITEM (CRITICAL FIX)
  // =====================
normalize(item) {
  return {
    id: item.id || item.name + "-" + item.price,
    name: item.name,
    price: Number(item.price),

    // ✅ SAFE IMAGE FIX (does NOT affect menu)
    image:
      item.image ||
      item.img ||
      item.thumbnail ||
      (item.items && item.items[0]?.image) ||
      null,

    parentFood: item.parentFood || null
  };
}
  // =====================
  // ADD ITEM (FIXED)
  // =====================
  addItem(item, qty = 1) {
    if (!item) return false;

    const newItem = this.normalize(item);

    const existing = this.items.find(
      (i) => i.item.id === newItem.id
    );

    if (existing) {
      existing.quantity += qty;
    } else {
      this.items.push({
        item: newItem,
        quantity: qty
      });
    }

    this.saveToStorage();
    return true;
  }

  // =====================
  // GET ITEM (SAFE)
  // =====================
  getItem(id) {
    return this.items.find((i) => i.item.id === id);
  }

  // =====================
  // REMOVE (FIXED)
  // =====================
  removeItem(id) {
    this.items = this.items.filter((i) => i.item.id !== id);
    this.saveToStorage();
  }

  // =====================
  // QUANTITY
  // =====================
  increaseQuantity(id) {
    const item = this.getItem(id);
    if (item) item.quantity++;
    this.saveToStorage();
  }

  decreaseQuantity(id) {
    const item = this.getItem(id);
    if (!item) return;

    item.quantity--;

    if (item.quantity <= 0) {
      this.removeItem(id);
    } else {
      this.saveToStorage();
    }
  }

  // =====================
  // GETTERS
  // =====================
  getItems() {
    return this.items;
  }

  getTotalPrice() {
    return this.items.reduce(
      (sum, i) => sum + i.item.price * i.quantity,
      0
    );
  }

  getTotalCount() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  clear() {
    this.items = [];
    this.saveToStorage();
  }
}

// ===============================
// GLOBAL INSTANCE
// ===============================
window.cartManager = new CartManager();

// ===============================
// GLOBAL HELPERS
// ===============================
window.addToCartManager = (item) =>
  window.cartManager.addItem(item, 1);

window.getCartItems = () => window.cartManager.getItems();
window.getCartTotal = () => window.cartManager.getTotalPrice();
window.clearCart = () => window.cartManager.clear();
