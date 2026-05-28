// ===== Loyalty Points Module =====

const LOYALTY_STORAGE_KEY = 'chaatLoyaltyPoints';

const loyalty = {
  // Get current points balance
  getBalance() {
    try {
      const stored = localStorage.getItem(LOYALTY_STORAGE_KEY);
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch (error) {
      console.error('Error loading loyalty points from storage:', error);
      return 0;
    }
  },

  // Award points based on money spent (10 points per ₹100 spent, rounded down)
  awardPoints(amountSpent) {
    if (amountSpent <= 0) return 0;
    const pointsToEarn = Math.floor(amountSpent / 100) * 10;
    
    if (pointsToEarn > 0) {
      const currentBalance = this.getBalance();
      const newBalance = currentBalance + pointsToEarn;
      try {
        localStorage.setItem(LOYALTY_STORAGE_KEY, newBalance.toString());
      } catch (error) {
        console.error('Error saving loyalty points to storage:', error);
      }
    }
    return pointsToEarn;
  },

  // Redeem loyalty points (1 point = ₹1 discount)
  redeemPoints(pointsToRedeem) {
    if (pointsToRedeem <= 0) return this.getBalance();
    const currentBalance = this.getBalance();
    const newBalance = Math.max(0, currentBalance - pointsToRedeem);
    try {
      localStorage.setItem(LOYALTY_STORAGE_KEY, newBalance.toString());
    } catch (error) {
      console.error('Error saving loyalty points to storage after redemption:', error);
    }
    return newBalance;
  }
};

// Expose loyalty globally
window.loyalty = loyalty;
