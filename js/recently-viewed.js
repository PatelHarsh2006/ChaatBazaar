const RecentlyViewed = {
  storageKey: 'chaatRecentlyViewed',
  maxItems: 10,

  getItems() {
    try {
      const items = localStorage.getItem(this.storageKey);
      return items ? JSON.parse(items) : [];
    } catch {
      return [];
    }
  },

  addItem(item) {
    let items = this.getItems();
    items = items.filter(i => i.id !== item.id);
    items.unshift({ ...item, viewedAt: Date.now() });
    items = items.slice(0, this.maxItems);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  },

  clear() {
    localStorage.removeItem(this.storageKey);
  },

  hasItems() {
    return this.getItems().length > 0;
  }
};
