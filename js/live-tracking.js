/**
 * Map and Location Controller
 * Handles map rendering, geolocation, and location search.
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("Live tracking initializing...");

  const mapContainer = document.getElementById("map");
  if (!mapContainer) {
    console.warn("Map container element not found. Skipping map initialization.");
    return;
  }

  // Global Map Variables 
  window.liveMap = null;
  window.userMarker = null;
  window.restaurantMarker = null;
  window.routePolyline = null;
  window.deliveryRadiusCircle = null;

  // Fallback coordinate from geolocation.js
  const FALLBACK_LAT = window.RESTAURANT_LOCATION?.latitude || 28.6129;
  const FALLBACK_LNG = window.RESTAURANT_LOCATION?.longitude || 77.2295;

  // Element Selectors 
  const userLocationText = document.getElementById("user-location-text");
  const autoLocateBtn = document.getElementById("floating-gps-btn");
  const searchInput = document.getElementById("location-search-input");
  const suggestionsContainer = document.getElementById("location-search-suggestions");
  const errorBanner = document.getElementById("hud-error-banner");
  
  // Mobile drawer selectors
  const mobileDrawerBtn = document.getElementById("mobile-drawer-btn");
  const activeOrderSidebar = document.getElementById("active-order-sidebar");
  const drawerArrow = mobileDrawerBtn?.querySelector(".drawer-arrow");

  // Map Initialization 
  function initMap(lat, lng) {
    if (window.liveMap) {
      window.liveMap.setView([lat, lng], 14);
      updateMapRoute(lat, lng);
      return;
    }

    // Load Leaflet map
    window.liveMap = L.map("map", {
      zoomControl: false,
      scrollWheelZoom: true
    }).setView([lat, lng], 14);

    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(window.liveMap);

    // Load map tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(window.liveMap);

    // Initial route setup
    updateMapRoute(lat, lng);
    
    // Invalidate size shortly to prevent rendering glitches
    setTimeout(() => {
      window.liveMap.invalidateSize();
    }, 400);
  }

  // Route and Marker Updates
  function updateMapRoute(userLat, userLng) {
    if (!window.liveMap) return;

    const restLat = window.RESTAURANT_LOCATION?.latitude || FALLBACK_LAT;
    const restLng = window.RESTAURANT_LOCATION?.longitude || FALLBACK_LNG;

    // 1. Add Restaurant Marker
    const restaurantIcon = L.divIcon({
      html: `<div style="font-size: 1.8rem; background: #fff; width: 44px; height: 44px; border-radius: 50%; box-shadow: 0 6px 16px rgba(255, 87, 34, 0.2); display: flex; align-items: center; justify-content: center; border: 2px solid #ff5722;">🏪</div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      className: 'leaflet-div-icon'
    });

    if (window.restaurantMarker) {
      window.restaurantMarker.setLatLng([restLat, restLng]);
    } else {
      window.restaurantMarker = L.marker([restLat, restLng], { icon: restaurantIcon })
        .addTo(window.liveMap)
        .bindPopup("<strong>ChaatBazaar Stall</strong><br>India Gate, Delhi");
    }

    // Delivery radius circle (5km)

if (window.deliveryRadiusCircle) {
  window.deliveryRadiusCircle.setLatLng([restLat, restLng]);
} else {

  window.deliveryRadiusCircle = L.circle([restLat, restLng], {
    radius: 5000, // 5km in meters

    color: '#ff5722',
    fillColor: '#ff5722',

    fillOpacity: 0.12,

    weight: 2,

    dashArray: '6, 6'
  })
    .addTo(window.liveMap)
    .bindPopup("Delivery available within 5km radius");
}

    // 2. Plot User Delivery Pin (Dynamic pulsing dot)
    const userIcon = L.divIcon({
      html: `<div style="width: 20px; height: 20px; background: #ff5722; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 0 4px rgba(255, 87, 34, 0.25); animation: pulse-ring-orange 2s infinite ease-in-out;"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      className: 'leaflet-div-icon'
    });

    if (window.userMarker) {
      window.userMarker.setLatLng([userLat, userLng]);
    } else {
      window.userMarker = L.marker([userLat, userLng], { icon: userIcon })
        .addTo(window.liveMap)
        .bindPopup("<strong>Your Selected Delivery Point</strong>");
    }

    // 3. Draw Splendid Dotted Path Polyline (Vibrant orange route indicator)
    const routeCoordinates = [
      [restLat, restLng],
      [userLat, userLng]
    ];

    if (window.routePolyline) {
      window.routePolyline.setLatLngs(routeCoordinates);
    } else {
      window.routePolyline = L.polyline(routeCoordinates, {
        color: '#ff5722',
        weight: 3,
        opacity: 0.9,
        dashArray: '5, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(window.liveMap);
    }

    // 4. Fit route bounds within map frame smoothly
    const bounds = L.latLngBounds(routeCoordinates);
    window.liveMap.flyToBounds(bounds, {
      padding: [60, 60],
      maxZoom: 15,
      duration: 1.5
    });

    // 5. Calculate delivery distance and validate zone
    const distanceKm = calculateDistance(restLat, restLng, userLat, userLng);
    const inRange = isWithinDeliveryRadius(distanceKm);

    if (userLocationText) {
      userLocationText.innerHTML = `📍 Distance: <strong>${distanceKm.toFixed(2)} km</strong><br><span style="font-size: 0.8rem; color: var(--text-muted);">${userLat.toFixed(4)}, ${userLng.toFixed(4)}</span>`;
    }

    // Show error if location is out of zone
    const confirmBtnContainer = document.getElementById("confirm-location-btn-container");
    if (errorBanner) {
      if (!inRange) {
        errorBanner.style.display = "block";
        errorBanner.innerHTML = `ℹ️ <strong>Coverage Info:</strong> Selected location is ${distanceKm.toFixed(2)} km away. Delivery is available within 5km. Please explore closer locations.`;
        if (confirmBtnContainer) confirmBtnContainer.style.display = "none";
      } else {
        errorBanner.style.display = "none";
        if (confirmBtnContainer) confirmBtnContainer.style.display = "flex";
      }
    } else if (inRange && confirmBtnContainer) {
      confirmBtnContainer.style.display = "flex";
    }

    // Hide initial coverage prompt if any
    const coverageBox = document.getElementById("delivery-coverage-box");
    if (coverageBox) coverageBox.style.display = "none";
  }

  // --- Calculate distance helper from geolocation.js ---
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function isWithinDeliveryRadius(distance) {
    const radius = window.DELIVERY_RADIUS || 5;
    return distance <= radius;
  }

  // --- GPS Locator ---
  function performGPSDetection() {
    if (!navigator.geolocation) {
      displayHUDError("GPS is not supported by your browser.");
      return;
    }

    autoLocateBtn?.classList.add("pulsing-gps");
    if (userLocationText) userLocationText.textContent = "Locating your live coordinates...";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        autoLocateBtn?.classList.remove("pulsing-gps");
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log("GPS Lock acquired:", lat, lng);
        
        // Render Map
        initMap(lat, lng);
        
        // Highlight input field
        if (searchInput) searchInput.value = "Device Live GPS Location";
      },
      (error) => {
        autoLocateBtn?.classList.remove("pulsing-gps");
        console.error("GPS lock failed:", error);
        
        // Fallback to default location
        displayHUDError("GPS permission denied. Loaded India Gate center point.");
        initMap(FALLBACK_LAT, FALLBACK_LNG);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }

  function displayHUDError(msg) {
    if (errorBanner) {
      errorBanner.style.display = "block";
      errorBanner.textContent = msg;
      setTimeout(() => {
        errorBanner.style.display = "none";
      }, 5000);
    }
  }

  // Bind GPS Locate button click listener
  if (autoLocateBtn) {
    autoLocateBtn.addEventListener("click", performGPSDetection);
  }

  // --- Autocomplete Search ---
  let debounceTimeout = null;

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimeout);
      const query = searchInput.value.trim();

      if (query.length < 1) {
        if (suggestionsContainer) suggestionsContainer.style.display = "none";
        return;
      }

      debounceTimeout = setTimeout(() => {
        fetchLocationSuggestions(query);
      }, 300);
    });

    searchInput.addEventListener("focus", () => {
      if (searchInput.value === "Device Live GPS Location") {
        searchInput.value = "";
      }
      if (suggestionsContainer && suggestionsContainer.children.length > 0 && searchInput.value.trim().length >= 1) {
        suggestionsContainer.style.display = "block";
      }
    });

    document.addEventListener("click", (e) => {
      if (suggestionsContainer && !searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        suggestionsContainer.style.display = "none";
      }
    });
  }

  const popularLocations = [
    { name: "Connaught Place", lat: 28.6304, lon: 77.2177, subtitle: "New Delhi, Delhi" },
    { name: "Khan Market", lat: 28.6003, lon: 77.2274, subtitle: "New Delhi, Delhi" },
    { name: "Parliament House", lat: 28.6172, lon: 77.2081, subtitle: "Sansad Marg, New Delhi" },
    { name: "Pragati Maidan", lat: 28.6143, lon: 77.2396, subtitle: "New Delhi, Delhi" },
    { name: "Jantar Mantar", lat: 28.6271, lon: 77.2166, subtitle: "New Delhi, Delhi" },
    { name: "Supreme Court of India", lat: 28.6221, lon: 77.2395, subtitle: "New Delhi, Delhi" },
    { name: "India Gate", lat: 28.6129, lon: 77.2295, subtitle: "New Delhi, Delhi" }
  ];

  async function fetchLocationSuggestions(query) {
    if (!suggestionsContainer) return;

    try {
      suggestionsContainer.innerHTML = "";
      const lowerQuery = query.toLowerCase();
      
      // 1. Check local predefined locations
      let validLocations = popularLocations.filter(loc => 
        loc.name.toLowerCase().includes(lowerQuery) || loc.subtitle.toLowerCase().includes(lowerQuery)
      ).map(loc => ({
        display_name: `${loc.name}, ${loc.subtitle}`,
        lat: loc.lat,
        lon: loc.lon
      }));

      // 2. Fallback to API
      if (query.length >= 3) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=10&q=${encodeURIComponent(query)}&viewbox=77.0,28.4,77.4,28.8&bounded=1&countrycodes=in`;
        const response = await fetch(url, { headers: { "Accept-Language": "en" } });
        
        if (response.ok) {
          const data = await response.json();
          const apiLocations = data.filter(item => {
            const itemLat = parseFloat(item.lat);
            const itemLng = parseFloat(item.lon);
            const distance = calculateDistance(FALLBACK_LAT, FALLBACK_LNG, itemLat, itemLng);
            return isWithinDeliveryRadius(distance);
          });

          // Merge without duplicates
          apiLocations.forEach(apiLoc => {
            const cleanTitle = apiLoc.display_name.split(',')[0].toLowerCase();
            if (!validLocations.some(v => v.display_name.toLowerCase().includes(cleanTitle))) {
              validLocations.push(apiLoc);
            }
          });
        }
      }

      validLocations = validLocations.slice(0, 5);

      if (validLocations.length === 0) {
        suggestionsContainer.innerHTML = `<div class="no-matches">No locations found within 5km radius</div>`;
        suggestionsContainer.style.display = "block";
        return;
      }

      validLocations.forEach(item => {
        const itemRow = document.createElement("div");
        itemRow.className = "suggestion-item";
        
        // Clean descriptive names
        const addressParts = item.display_name.split(",");
        const title = addressParts[0] || "Street Location";
        const subtitle = addressParts.slice(1, 4).join(",").trim();

        itemRow.innerHTML = `
          <div class="suggestion-title">📍 ${title}</div>
          <div class="suggestion-subtitle">${subtitle}</div>
        `;

        itemRow.addEventListener("click", () => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          
          searchInput.value = title;
          suggestionsContainer.style.display = "none";

          console.log("User selected autocomplete drop point:", lat, lng);
          
          // Re-render route maps
          updateMapRoute(lat, lng);
        });

        suggestionsContainer.appendChild(itemRow);
      });

      suggestionsContainer.style.display = "block";

    } catch (err) {
      console.error("Geocoding fetch failed:", err);
      suggestionsContainer.innerHTML = `<div class="no-matches">Failed to fetch recommendations</div>`;
      suggestionsContainer.style.display = "block";
    }
  }

  // Mobile Drawer Controller
  if (mobileDrawerBtn && activeOrderSidebar) {
    mobileDrawerBtn.addEventListener("click", () => {
      const isOpen = activeOrderSidebar.classList.toggle("open");
      
      if (drawerArrow) {
        drawerArrow.textContent = isOpen ? "▼" : "▲";
      }

      // Resize map after sliding to prevent glitches
      setTimeout(() => {
        if (window.liveMap) {
          window.liveMap.invalidateSize({ animate: true });
        }
      }, 350);
    });
  }

  // Global triggers
  window.updateMapTrackerLocation = (lat, lng) => {
    initMap(lat, lng);
  };

  // Initial Load (GPS or fallback)
  performGPSDetection();

  // Confirm Location Button Flow
  const confirmLocBtn = document.getElementById("confirm-location-btn");
  if (confirmLocBtn) {
    confirmLocBtn.addEventListener("click", () => {
      document.getElementById("confirm-location-btn-container").style.display = "none";
      const wrapper = document.getElementById("tracking-wrapper");
      if (wrapper) {
        wrapper.classList.remove("sidebar-hidden");
        // Allow CSS transition to begin before invalidating map size
        setTimeout(() => {
          if (window.liveMap) {
            window.liveMap.invalidateSize();
            // Optionally, pan to bounds again
            if (window.routeCoordinates) {
              window.liveMap.flyToBounds(L.latLngBounds(window.routeCoordinates), {
                padding: [60, 60],
                maxZoom: 15,
                duration: 1.0
              });
            }
          }
        }, 400);
      }
      if (typeof window.triggerDeliverySimulation === "function") {
        window.triggerDeliverySimulation();
      }
    });
  }
});