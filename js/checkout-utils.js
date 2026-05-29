(function exposeCheckoutUtils(global) {
  function toMoneyNumber(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
  }

  function calculateCheckoutTotals({
    subtotal,
    couponDiscount = 0,
    loyaltyPointsApplied = false,
    loyaltyBalance = 0,
    deliveryFee = 0,
    platformFee = 0,
    gst = 0,
  }) {
    const normalizedSubtotal = toMoneyNumber(subtotal);
    const normalizedCouponDiscount = Math.min(
      toMoneyNumber(couponDiscount),
      normalizedSubtotal
    );
    const afterCouponTotal = Math.max(normalizedSubtotal - normalizedCouponDiscount, 0);
    const loyaltyDiscount = loyaltyPointsApplied
      ? Math.min(toMoneyNumber(loyaltyBalance), afterCouponTotal)
      : 0;
    const normalizedDeliveryFee = toMoneyNumber(deliveryFee);
    const normalizedPlatformFee = toMoneyNumber(platformFee);
    const normalizedGst = toMoneyNumber(gst);
    const total = Math.max(
      afterCouponTotal -
        loyaltyDiscount +
        normalizedDeliveryFee +
        normalizedPlatformFee +
        normalizedGst,
      0
    );

    return {
      subtotal: normalizedSubtotal,
      couponDiscount: normalizedCouponDiscount,
      afterCouponTotal,
      loyaltyDiscount,
      totalDiscount: normalizedCouponDiscount + loyaltyDiscount,
      deliveryFee: normalizedDeliveryFee,
      platformFee: normalizedPlatformFee,
      gst: normalizedGst,
      total,
    };
  }

  global.calculateCheckoutTotals = calculateCheckoutTotals;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calculateCheckoutTotals };
  }
})(typeof window !== "undefined" ? window : globalThis);
