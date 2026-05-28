/**
 * ChaatBazaar Premium Live Map and Location Controller
 * Integrates Leaflet, OpenStreetMap Geolocation, Nominatim Search & Mobile Gestures
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("Premium live tracking initializing...");

  const mapContainer = document.getElementById("map");
  if (!mapContainer) {
    console.warn("Map container element not found. Skipping map initialization.");
    return;
  }

  // --- Global Map Variables ---
  window.liveMap = null;
  window.userMarker = null;
  window.restaurantMarker = null;
  window.routePolyline = null;

  // Curated fallback coordinate (India Gate, Delhi) from geolocation.js
  const FALLBACK_LAT = window.RESTAURANT_LOCATION?.latitude || 28.6129;
  const FALLBACK_LNG = window.RESTAURANT_LOCATION?.longitude || 77.2295;

  // --- Element Selectors ---
  const userLocationText = document.getElementById("user-location-text");
  const autoLocateBtn = document.getElementById("auto-locate-btn");
  const searchInput = document.getElementById("location-search-input");
  const suggestionsContainer = document.getElementById("location-search-suggestions");
  const errorBanner = document.getElementById("hud-error-banner");
  
  // Mobile drawer selectors
  const mobileDrawerBtn = document.getElementById("mobile-drawer-btn");
  const activeOrderSidebar = document.getElementById("active-order-sidebar");
  const drawerArrow = mobileDrawerBtn?.querySelector(".drawer-arrow");

  // --- Map Initialization ---
  function initMap(lat, lng) {
    if (window.liveMap) {
      window.liveMap.setView([lat, lng], 14);
      return;
    }

    // Load Leaflet map
    window.liveMap = L.map("map", {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([lat, lng], 14);

    // Load CartoDB Positron theme tiles (Minimalist, elegant light-theme tiles)
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

  // --- Dynamic Route and Pin Visualizer ---
  function updateMapRoute(userLat, userLng) {
    if (!window.liveMap) return;

    const restLat = window.RESTAURANT_LOCATION?.latitude || FALLBACK_LAT;
    const restLng = window.RESTAURANT_LOCATION?.longitude || FALLBACK_LNG;

    // 1. Plot Restaurant/Vendor Pin (Steaming Pot Icon)
    const restaurantIcon = L.divIcon({
      html: `<div style="font-size: 2.2rem; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.15));">🍴</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: 'leaflet-div-icon'
    });

    if (window.restaurantMarker) {
      window.restaurantMarker.setLatLng([restLat, restLng]);
    } else {
      window.restaurantMarker = L.marker([restLat, restLng], { icon: restaurantIcon })
        .addTo(window.liveMap)
        .bindPopup("<strong>ChaatBazaar Stall</strong><br>India Gate, Delhi");
    }

    // 2. Plot User Delivery Pin (Dynamic Home Icon)
    const userIcon = L.divIcon({
      html: `<div style="font-size: 2.2rem; filter: drop-shadow(0 4px 10px rgba(255,87,34,0.35)); animation: bounce-marker 2s infinite ease-in-out;">🏠</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
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
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(window.liveMap);
    }

    // 4. Fit route bounds within map frame smoothly
    const bounds = L.latLngBounds(routeCoordinates);
    window.liveMap.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 15
    });

    // 5. Calculate delivery distance and validate zone
    const distanceKm = calculateDistance(restLat, restLng, userLat, userLng);
    const inRange = isWithinDeliveryRadius(distanceKm);

    if (userLocationText) {
      userLocationText.innerHTML = `📍 Distance: <strong>${distanceKm.toFixed(2)} km</strong><br><span style="font-size: 0.8rem; color: var(--text-muted);">${userLat.toFixed(4)}, ${userLng.toFixed(4)}</span>`;
    }

    // Display localized HUD notification warning if drop-off coordinates are out of zone
    if (errorBanner) {
      if (!inRange) {
        errorBanner.style.display = "block";
        errorBanner.innerHTML = `⚠️ <strong>Out of Delivery Zone!</strong> User is ${distanceKm.toFixed(2)} km away. We deliver up to 5 km from India Gate. Please search closer!`;
      } else {
        errorBanner.style.display = "none";
      }
    }
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

  // --- Device GPS Locator Hook ---
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
        
        // Safe graceful default location load
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

  // --- Nominatim Geocoding Autocomplete (300ms debounced input) ---
  let debounceTimeout = null;

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimeout);
      const query = searchInput.value.trim();

      if (query.length < 3) {
        if (suggestionsContainer) suggestionsContainer.style.display = "none";
        return;
      }

      debounceTimeout = setTimeout(() => {
        fetchLocationSuggestions(query);
      }, 300);
    });

    searchInput.addEventListener("focus", () => {
      if (suggestionsContainer && suggestionsContainer.children.length > 0 && searchInput.value.trim().length >= 3) {
        suggestionsContainer.style.display = "block";
      }
    });

    document.addEventListener("click", (e) => {
      if (suggestionsContainer && !searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        suggestionsContainer.style.display = "none";
      }
    });
  }

  async function fetchLocationSuggestions(query) {
    if (!suggestionsContainer) return;

    try {
      // Prioritize locations within Delhi NCR bounding box (viewbox)
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}&viewbox=77.0,28.4,77.4,28.8&bounded=1&countrycodes=in`;
      
      const response = await fetch(url, {
        headers: { "Accept-Language": "en" }
      });

      if (!response.ok) throw new Error("Nominatim API connection error");
      const data = await response.json();

      suggestionsContainer.innerHTML = "";

      if (data.length === 0) {
        suggestionsContainer.innerHTML = `<div class="no-matches">No street matches in Delhi-NCR</div>`;
        suggestionsContainer.style.display = "block";
        return;
      }

      data.forEach(item => {
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

  // --- Mobile Drawer Controller & Tap Gestures ---
  if (mobileDrawerBtn && activeOrderSidebar) {
    mobileDrawerBtn.addEventListener("click", () => {
      const isOpen = activeOrderSidebar.classList.toggle("open");
      
      if (drawerArrow) {
        drawerArrow.textContent = isOpen ? "▼" : "▲";
      }

      // Smooth Leaflet size adjustments to prevent grey grids during bottom sheet sliding transitions
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

  // --- Default Initial Load ---
  // Performs quick GPS trace or loads standard fallbacks
  performGPSDetection();
});