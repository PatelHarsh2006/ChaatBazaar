/**
 * ChaatBazaar Interactive Delivery Tracker Simulation
 * Connects the active order state to the Leaflet map markers, sidebar progress bars, and ETA timers
 */

const deliveryTracker = (() => {
  const stageDefinitions = [
    {
      key: 'preparing',
      label: 'Preparing Order 🍳',
      message: 'Vendor is roasting hot spices for your Chaat... 🍳',
      progress: '12.5%',
      cartLeft: '12.5%',
      eta: '20'
    },
    {
      key: 'packed',
      label: 'Packed 📦',
      message: 'Packaged freshly in clay pots & ready to ride! 📦',
      progress: '37.5%',
      cartLeft: '37.5%',
      eta: '14'
    },
    {
      key: 'out-for-delivery',
      label: 'Out for Delivery 🚲',
      message: 'Raju is pedaling hot street eats straight to you! 🚲',
      progress: '65%',
      cartLeft: '62.5%',
      eta: '6'
    },
    {
      key: 'delivered',
      label: 'Delivered ✅',
      message: 'Order arrived — dig into your hot street feast! ✅',
      progress: '100%',
      cartLeft: '90%',
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
      cartEl.style.left = stage.cartLeft;
      // Change icon depending on active stage
      cartEl.textContent = stageIndex === 3 ? '✅' : stageIndex === 2 ? '🚲' : '🍳';
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
  // Interpolates delivery rider position along the route polyline based on active stage
  function updateMapRiderPosition(stageIndex) {
    if (!window.liveMap) return;

    const restLat = window.RESTAURANT_LOCATION?.latitude || 28.6129;
    const restLng = window.RESTAURANT_LOCATION?.longitude || 77.2295;

    // Get selected user drop-off coordinates, fallback to original if none set
    let userLat = restLat + 0.015;
    let userLng = restLng + 0.015;

    if (window.userMarker) {
      const uLatLng = window.userMarker.getLatLng();
      userLat = uLatLng.lat;
      userLng = uLatLng.lng;
    }

    // Interpolation ratios per stage
    // 0: Preparing -> Rider at Restaurant (0% progress)
    // 1: Packed -> Rider leaving Restaurant (15% progress)
    // 2: Out for Delivery -> Rider halfway (60% progress)
    // 3: Delivered -> Rider at user home (100% progress)
    let ratio = 0;
    if (stageIndex === 1) ratio = 0.15;
    if (stageIndex === 2) ratio = 0.60;
    if (stageIndex === 3) ratio = 1.0;

    const riderLat = restLat + (userLat - restLat) * ratio;
    const riderLng = restLng + (userLng - restLng) * ratio;

    // Custom Diver avatar (glowing rider pin)
    const riderIcon = L.divIcon({
      html: `<div style="font-size: 2.2rem; filter: drop-shadow(0 4px 12px rgba(255,87,34,0.45)); transform: scale(${stageIndex === 3 ? 0.9 : 1.15});">🛵</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: 'leaflet-div-icon'
    });

    if (window.driverMarker) {
      // Reposition rider marker smoothly
      window.driverMarker.setLatLng([riderLat, riderLng]);
    } else {
      window.driverMarker = L.marker([riderLat, riderLng], { icon: riderIcon })
        .addTo(window.liveMap)
        .bindPopup("<strong>Rider Raju (🛵)</strong><br>Speeding street food to you!");
    }

    // Pan map to follow rider slightly during Out for Delivery stage
    if (stageIndex === 2) {
      window.liveMap.panTo([riderLat, riderLng]);
    }
  }

  const runTrackingSimulation = async () => {
    queryTrackerElements();
    clearTimers();

    console.log("Beginning order tracking simulation...");

    for (let i = 0; i < stageDefinitions.length; i++) {
      // Apply updates to sidebar
      updateSidebarTimeline(i);
      
      // Update dynamic rider marker position on Leaflet
      updateMapRiderPosition(i);

      if (i === stageDefinitions.length - 1) {
        break;
      }

      // Timing delays between mock delivery events (fast tracking simulation)
      await delay(i === 0 ? 5000 : i === 1 ? 6000 : 7000);
    }
  };

  const initialize = () => {
    queryTrackerElements();
    window.triggerDeliverySimulation = runTrackingSimulation;

    // Hook to auto-trigger tracking simulator if a fresh order has just been placed (e.g. within last 60 seconds)
    const orders = JSON.parse(localStorage.getItem('chaatOrders')) || [];
    if (orders.length > 0) {
      const latestOrder = orders[0];
      const timeSincePlacement = Date.now() - latestOrder.timestamp;
      
      // If order was placed within last 60 seconds, auto-launch active simulation!
      if (timeSincePlacement < 60000 && latestOrder.status !== 'Delivered') {
        setTimeout(() => {
          runTrackingSimulation();
        }, 1200); // Small buffer to let map load completely
      } else {
        // Safe default: set layout to complete/delivered state
        updateSidebarTimeline(3);
      }
    } else {
      // No orders placed: set tracker state to default/idle
      updateSidebarTimeline(0);
    }
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
