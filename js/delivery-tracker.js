/**
 * Delivery Tracker
 * Connects order state to the map markers, sidebar progress, and ETA.
 */

const deliveryTracker = (() => {
  const stageDefinitions = [
    {
      key: 'preparing',
      label: 'Preparing Order 🍳',
      message: 'Vendor is roasting hot spices for your Chaat... 🍳',
      progress: '12.5%',
      cartTop: '-5%',
      eta: '20'
    },
    {
      key: 'packed',
      label: 'Packed 📦',
      message: 'Packaged freshly in clay pots & ready to ride! 📦',
      progress: '37.5%',
      cartTop: '26%',
      eta: '14'
    },
    {
      key: 'out-for-delivery',
      label: 'Out for Delivery 🛍️',
      message: 'Your hot street eats are on the way! 🛍️',
      progress: '65%',
      cartTop: '58%',
      eta: '6'
    },
    {
      key: 'delivered',
      label: 'Delivered ✅',
      message: 'Order arrived — dig into your hot street feast! ✅',
      progress: '100%',
      cartTop: '90%',
      eta: '0'
    }
  ];

  // Dom element references
  let progressBar = null;
  let cartEl = null;
  let statusTextEl = null;
  let etaMinsEl = null;
  let steps = [];
  let stageTimeouts = [];

  const queryTrackerElements = () => {
    progressBar = document.getElementById('active-progress-bar');
    cartEl = document.getElementById('vendor-cart');
    statusTextEl = document.getElementById('live-status-text');
    etaMinsEl = document.getElementById('eta-mins-val');
    steps = Array.from(document.querySelectorAll('.stepper-steps-wrapper .stepper-step'));
  };

  const delay = (ms) => new Promise((resolve) => {
    const id = setTimeout(resolve, ms);
    stageTimeouts.push(id);
  });

  const clearTimers = () => {
    stageTimeouts.forEach(id => clearTimeout(id));
    stageTimeouts = [];
  };

  const updateSidebarTimeline = (stageIndex) => {
    const stage = stageDefinitions[stageIndex];
    if (!stage) return;

    // 1. Update progress bar filled width
    if (progressBar) {
      progressBar.style.width = stage.progress;
    }

    // 2. Move cart icon on rail
    if (cartEl) {
      cartEl.style.top = stage.cartTop;
      // Change icon depending on active stage
      cartEl.textContent = stageIndex === 3 ? '✅' : stageIndex === 2 ? '🛍️' : '🍳';
    }

    // 3. Update active message and ETA timers
    if (statusTextEl) {
      statusTextEl.textContent = stage.message;
    }
    if (etaMinsEl) {
      etaMinsEl.textContent = stage.eta;
    }

    // 4. Highlight timeline steps
    steps.forEach((step, idx) => {
      step.classList.toggle('completed', idx < stageIndex);
      step.classList.toggle('active', idx <= stageIndex);
      step.classList.toggle('current', idx === stageIndex);
    });
  };

  // --- Map Animation Pin Interpolator ---
  // (Removed per request to maintain human-made non-mechanical aesthetic)

  const runTrackingSimulation = async () => {
    queryTrackerElements();
    clearTimers();

    console.log("Beginning order tracking simulation...");

    for (let i = 0; i < stageDefinitions.length; i++) {
      // Apply updates to sidebar
      updateSidebarTimeline(i);

      if (i === stageDefinitions.length - 1) {
        break;
      }

      // Delay between stages
      await delay(i === 0 ? 5000 : i === 1 ? 6000 : 7000);
    }
  };

  const initialize = () => {
    queryTrackerElements();
    window.triggerDeliverySimulation = runTrackingSimulation;

    // Default to idle state until user confirms location
    updateSidebarTimeline(0);
  };

  return {
    init: initialize
  };
})();

// Self startup listener
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', deliveryTracker.init);
} else {
  // Let Leaflet load first if executed dynamically
  setTimeout(deliveryTracker.init, 500);
}
