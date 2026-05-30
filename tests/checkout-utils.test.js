const assert = require("node:assert/strict");

const { calculateCheckoutTotals } = require("../js/checkout-utils");

assert.deepEqual(
  calculateCheckoutTotals({
    subtotal: 500,
    couponDiscount: 50,
    loyaltyPointsApplied: true,
    loyaltyBalance: 100,
  }),
  {
    subtotal: 500,
    couponDiscount: 50,
    afterCouponTotal: 450,
    loyaltyDiscount: 100,
    totalDiscount: 150,
    deliveryFee: 0,
    platformFee: 0,
    gst: 0,
    total: 350,
  }
);

assert.deepEqual(
  calculateCheckoutTotals({
    subtotal: 80,
    couponDiscount: 150,
    loyaltyPointsApplied: true,
    loyaltyBalance: 25,
  }),
  {
    subtotal: 80,
    couponDiscount: 80,
    afterCouponTotal: 0,
    loyaltyDiscount: 0,
    totalDiscount: 80,
    deliveryFee: 0,
    platformFee: 0,
    gst: 0,
    total: 0,
  }
);

assert.deepEqual(
  calculateCheckoutTotals({
    subtotal: 100,
    couponDiscount: 150,
    loyaltyPointsApplied: true,
    loyaltyBalance: 25,
  }),
  {
    subtotal: 100,
    couponDiscount: 100,
    afterCouponTotal: 0,
    loyaltyDiscount: 0,
    totalDiscount: 100,
    deliveryFee: 0,
    platformFee: 0,
    gst: 0,
    total: 0,
  }
);

assert.deepEqual(
  calculateCheckoutTotals({
    subtotal: 300,
    couponDiscount: 0,
    loyaltyPointsApplied: false,
    loyaltyBalance: 200,
  }),
  {
    subtotal: 300,
    couponDiscount: 0,
    afterCouponTotal: 300,
    loyaltyDiscount: 0,
    totalDiscount: 0,
    deliveryFee: 0,
    platformFee: 0,
    gst: 0,
    total: 300,
  }
);

assert.deepEqual(
  calculateCheckoutTotals({
    subtotal: undefined,
    couponDiscount: "50",
    loyaltyPointsApplied: true,
    loyaltyBalance: Number.NaN,
  }),
  {
    subtotal: 0,
    couponDiscount: 0,
    afterCouponTotal: 0,
    loyaltyDiscount: 0,
    totalDiscount: 0,
    deliveryFee: 0,
    platformFee: 0,
    gst: 0,
    total: 0,
  }
);

assert.deepEqual(
  calculateCheckoutTotals({
    subtotal: -20,
    couponDiscount: -5,
    loyaltyPointsApplied: true,
    loyaltyBalance: "15",
  }),
  {
    subtotal: 0,
    couponDiscount: 0,
    afterCouponTotal: 0,
    loyaltyDiscount: 0,
    totalDiscount: 0,
    deliveryFee: 0,
    platformFee: 0,
    gst: 0,
    total: 0,
  }
);

assert.deepEqual(
  calculateCheckoutTotals({
    subtotal: "250",
    couponDiscount: "30",
    loyaltyPointsApplied: true,
    loyaltyBalance: "50",
    deliveryFee: "40",
    platformFee: 10,
    gst: 13,
  }),
  {
    subtotal: 250,
    couponDiscount: 30,
    afterCouponTotal: 220,
    loyaltyDiscount: 50,
    totalDiscount: 80,
    deliveryFee: 40,
    platformFee: 10,
    gst: 13,
    total: 233,
  }
);

console.log("checkout-utils tests passed");
