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
  const lat = prompt(
    "📍 Location access denied.\n\nPlease enter your latitude:\n(Example: 28.6139 for Delhi)",
    "28.6139"
  );

  if (lat === null) {
    callback(null);
    return;
  }

  const lon = prompt(
    "📍 Now enter your longitude:\n(Example: 77.2090 for Delhi)",
    "77.2090"
  );

  if (lon === null) {
    callback(null);
    return;
  }

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);

  if (isNaN(parsedLat) || isNaN(parsedLon)) {
    alert("❌ Invalid coordinates. Please enter valid numbers.");
    showManualLocationInput(callback);
    return;
  }

  if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
    alert("❌ Coordinates out of range.\nLatitude: -90 to 90\nLongitude: -180 to 180");
    showManualLocationInput(callback);
    return;
  }

  callback({
    latitude: parsedLat,
    longitude: parsedLon,
    source: "manual"
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
