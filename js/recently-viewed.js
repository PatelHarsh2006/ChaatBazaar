const RecentlyViewed = {
  storageKey: 'chaatRecentlyViewed',
  maxItems: 10,

  getItems() {
    try {
      const items = localStorage.getItem(this.storageKey);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error('RecentlyViewed data corrupted, clearing:', error);
      try {
        localStorage.removeItem(this.storageKey);
      } catch (e) {
        console.error('Error clearing corrupted recently viewed data:', e);
      }
      return [];
    }
  },

  addItem(item) {
    try {
      let items = this.getItems();
      items = items.filter(i => i.id !== item.id);
      items.unshift({ ...item, viewedAt: Date.now() });
      items = items.slice(0, this.maxItems);
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn('Storage quota exceeded for recently viewed items');
        window.dispatchEvent(new CustomEvent('storageQuotaExceeded', {
          detail: 'Cannot save recently viewed items - storage limit exceeded'
        }));
      } else {
        console.error('Error adding to recently viewed:', error);
      }
    }
  },

  clear() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
    }
  },

  hasItems() {
    return this.getItems().length > 0;
  }
};
