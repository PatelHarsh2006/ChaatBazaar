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

  const runTrackingSimulation = async (startStage = 0) => {
    queryTrackerElements();
    clearTimers();

    console.log("Beginning order tracking simulation at stage " + startStage + "...");

    for (let i = startStage; i < stageDefinitions.length; i++) {
      // Apply updates to sidebar
      updateSidebarTimeline(i);

      if (i === stageDefinitions.length - 1) {
        break;
      }

      // Determine target elapsed time for the stage to end
      let targetElapsed = 0;
      if (i === 0) {
        targetElapsed = 10;
      } else if (i === 1) {
        targetElapsed = 25;
      } else if (i === 2) {
        targetElapsed = 45;
      }

      // Compute remaining delay based on order timestamp to stay perfectly in sync
      const localOrders = JSON.parse(localStorage.getItem('chaatOrders')) || [];
      const latestOrder = localOrders[0];
      let delayMs = 5000;
      if (latestOrder && latestOrder.timestamp) {
        const currentElapsed = (Date.now() - latestOrder.timestamp) / 1000;
        delayMs = Math.max((targetElapsed - currentElapsed) * 1000, 0);
      } else {
        // Fallback static delays if order timestamp is missing
        delayMs = i === 0 ? 10000 : i === 1 ? 15000 : 20000;
      }

      console.log(`Stage ${i} (${stageDefinitions[i].key}) active. Delaying for ${delayMs}ms...`);
      await delay(delayMs);
    }

    console.log("Order simulation complete. Closing sidebar...");
    const wrapper = document.getElementById("tracking-wrapper");
    if (wrapper) {
      wrapper.classList.add("sidebar-hidden");
    }

    setTimeout(() => {
      if (window.liveMap) {
        window.liveMap.invalidateSize();
      }
    }, 400);

    try {
      const localOrders = JSON.parse(localStorage.getItem('chaatOrders')) || [];
      if (localOrders.length > 0) {
        const activeOrder = localOrders.find(o => o.status !== "Delivered");
        if (activeOrder) {
          activeOrder.status = "Delivered";
          localStorage.setItem('chaatOrders', JSON.stringify(localOrders));
        } else if (localOrders[0].status !== "Delivered") {
          localOrders[0].status = "Delivered";
          localStorage.setItem('chaatOrders', JSON.stringify(localOrders));
        }
      }
    } catch (e) {
      console.error("Error updating local storage order status on delivery:", e);
    }

    if (typeof window.renderOrdersList === "function") {
      window.renderOrdersList();
    }

    if (typeof window.showToast === "function") {
      window.showToast("🎉 Order delivered! Enjoy your warm street feast!");
    } else {
      console.log("Order delivered!");
    }
  };

  const initialize = () => {
    queryTrackerElements();
    window.triggerDeliverySimulation = (startStage = 0) => runTrackingSimulation(startStage);

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
