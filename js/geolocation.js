// Restaurant location: India Gate, New Delhi
const RESTAURANT_LOCATION = {
  latitude: 28.6129,
  longitude: 77.2295,
  name: "ChaatBazaar - India Gate, New Delhi"
};

// Delivery radius in km
const DELIVERY_RADIUS = 5;

// Calculate distance between two coordinates using Haversine formula
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

// Check if distance is within delivery radius
function isWithinDeliveryRadius(distance, radius = DELIVERY_RADIUS) {
  return distance <= radius;
}

// Format distance to 2 decimal places
function formatDistance(distance) {
  return distance.toFixed(2);
}

// Get current location using Geolocation API or manual entry
async function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      showManualLocationInput(resolve);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: "geolocation"
        });
      },
      () => {
        showManualLocationInput(resolve);
      }
    );
  });
}

// Show manual location input if geolocation fails or is denied
function showManualLocationInput(callback) {
  // Create overlay container
  const overlay = document.createElement("div");
  overlay.id = "manual-geo-modal";
  overlay.className = "delivery-modal-overlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.padding = "1.5rem";
  overlay.style.background = "rgba(18, 18, 18, 0.6)";
  overlay.style.backdropFilter = "blur(8px)";
  overlay.style.zIndex = "2000";

  // Create content card
  const content = document.createElement("div");
  content.className = "delivery-modal-content";
  content.style.position = "relative";
  content.style.width = "min(440px, 100%)";
  content.style.background = "linear-gradient(180deg, #fff8f0 0%, #fff1e6 100%)";
  content.style.border = "1px solid rgba(255, 138, 101, 0.25)";
  content.style.borderRadius = "28px";
  content.style.boxShadow = "0 35px 70px rgba(0, 0, 0, 0.18)";
  content.style.padding = "2rem";
  content.style.display = "flex";
  content.style.flexDirection = "column";
  content.style.gap = "1.2rem";

  content.innerHTML = `
    <h3 style="font-size: 1.5rem; color: #d84315; margin: 0; font-weight: 700;">📍 Enter Location Details</h3>
    <p style="font-size: 0.95rem; color: #5d4037; margin: 0; line-height: 1.5;">
      Geolocation access was denied. Please select a popular hub within Delhi or enter coordinates manually:
    </p>

    <!-- Quick Location Presets -->
    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
      <label for="preset-location" style="font-size: 0.9rem; font-weight: 600; color: #bf360c;">Predefined Delhi Hubs</label>
      <select id="preset-location" style="padding: 0.7rem; border-radius: 12px; border: 2px solid #ffcc99; font-size: 0.95rem; background: white; outline: none; cursor: pointer;">
        <option value="">-- Choose a Preset Hub --</option>
        <option value="28.6129,77.2295">India Gate (0.0 km) - Available</option>
        <option value="28.6304,77.2177">Connaught Place (2.2 km) - Available</option>
        <option value="28.6189,77.2023">Presidential Estate (Bhavan) (2.8 km) - Available</option>
        <option value="28.5847,77.2505">Humayun's Tomb (4.6 km) - Available</option>
        <option value="28.5244,77.1855">Qutub Minar (10.6 km) - Out of Radius</option>
        <option value="custom">-- Enter Custom Coordinates --</option>
      </select>
    </div>

    <!-- Custom Lat/Lon inputs -->
    <div id="custom-coords-inputs" style="display: none; gap: 0.8rem;">
      <div style="flex: 1; display: flex; flex-direction: column; gap: 0.4rem;">
        <label for="manual-lat" style="font-size: 0.85rem; font-weight: 600; color: #bf360c;">Latitude</label>
        <input type="number" step="any" id="manual-lat" value="28.6139" style="padding: 0.7rem; border-radius: 12px; border: 2px solid #ffcc99; font-size: 0.95rem; width: 100%; box-sizing: border-box;" />
      </div>
      <div style="flex: 1; display: flex; flex-direction: column; gap: 0.4rem;">
        <label for="manual-lon" style="font-size: 0.85rem; font-weight: 600; color: #bf360c;">Longitude</label>
        <input type="number" step="any" id="manual-lon" value="77.2090" style="padding: 0.7rem; border-radius: 12px; border: 2px solid #ffcc99; font-size: 0.95rem; width: 100%; box-sizing: border-box;" />
      </div>
    </div>

    <div style="display: flex; gap: 0.8rem; margin-top: 0.5rem;">
      <button id="cancel-geo-btn" style="flex: 1; padding: 0.8rem; border-radius: 50px; font-weight: 700; cursor: pointer; border: 2px solid #ff5722; background: transparent; color: #ff5722;">Cancel</button>
      <button id="submit-geo-btn" style="flex: 1; padding: 0.8rem; border-radius: 50px; font-weight: 700; cursor: pointer; background: #ff5722; color: white; border: none;">Verify Location</button>
    </div>
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const presetSelect = content.querySelector("#preset-location");
  const customInputs = content.querySelector("#custom-coords-inputs");
  const latInput = content.querySelector("#manual-lat");
  const lonInput = content.querySelector("#manual-lon");
  const cancelBtn = content.querySelector("#cancel-geo-btn");
  const submitBtn = content.querySelector("#submit-geo-btn");

  presetSelect.addEventListener("change", () => {
    if (presetSelect.value === "custom") {
      customInputs.style.display = "flex";
    } else if (presetSelect.value !== "") {
      customInputs.style.display = "none";
      const [lat, lon] = presetSelect.value.split(",");
      latInput.value = lat;
      lonInput.value = lon;
    } else {
      customInputs.style.display = "none";
    }
  });

  cancelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    document.body.removeChild(overlay);
    callback(null);
  });

  submitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    let latVal, lonVal;

    if (presetSelect.value && presetSelect.value !== "custom") {
      const [lat, lon] = presetSelect.value.split(",");
      latVal = parseFloat(lat);
      lonVal = parseFloat(lon);
    } else {
      latVal = parseFloat(latInput.value);
      lonVal = parseFloat(lonInput.value);
    }

    if (isNaN(latVal) || isNaN(lonVal)) {
      alert("❌ Invalid coordinates. Please enter valid numbers.");
      return;
    }

    if (latVal < -90 || latVal > 90 || lonVal < -180 || lonVal > 180) {
      alert("❌ Coordinates out of range.\nLatitude: -90 to 90\nLongitude: -180 to 180");
      return;
    }

    document.body.removeChild(overlay);
    callback({
      latitude: latVal,
      longitude: lonVal,
      source: "manual"
    });
  });
}

// Validate delivery and return result object
async function validateDeliveryLocation() {
  try {
    const userLocation = await getCurrentLocation();

    if (!userLocation) {
      return {
        valid: false,
        error: "Location access required for checkout.",
        distance: null,
        userLocation: null
      };
    }

    const distance = calculateDistance(
      RESTAURANT_LOCATION.latitude,
      RESTAURANT_LOCATION.longitude,
      userLocation.latitude,
      userLocation.longitude
    );

    const valid = isWithinDeliveryRadius(distance);

    return {
      valid,
      distance,
      formattedDistance: formatDistance(distance),
      userLocation,
      restaurantLocation: RESTAURANT_LOCATION,
      error: valid ? null : `🚚 Delivery not available at your location.\n\nDistance: ${formatDistance(distance)} km\nDelivery Radius: ${DELIVERY_RADIUS} km\n\nWe currently deliver within ${DELIVERY_RADIUS} km of ${RESTAURANT_LOCATION.name}`
    };
  } catch (error) {
    console.error("Delivery validation error:", error);
    return {
      valid: false,
      error: "Error validating delivery location. Please try again.",
      distance: null,
      userLocation: null
    };
  }
}

// Make functions available globally
window.validateDeliveryLocation = validateDeliveryLocation;
window.calculateDistance = calculateDistance;
window.isWithinDeliveryRadius = isWithinDeliveryRadius;
window.RESTAURANT_LOCATION = RESTAURANT_LOCATION;
window.DELIVERY_RADIUS = DELIVERY_RADIUS;
