/**
 * Geocoding Service using Nominatim (OpenStreetMap)
 * FREE - No API key required
 * Rate limit: 1 request per second
 * User-Agent header required
 */

const https = require("https");
const http = require("http");

const USER_AGENT = "TailWaggersPetPlatform/1.0 (contact@tailwaggers.com)";
let lastRequestTime = 0;

// Enforce 1 request/second rate limit
const rateLimitDelay = () => {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  const waitTime = Math.max(0, 1100 - elapsed); // 1.1s to be safe
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

// Generic fetch helper using native Node.js http/https
const fetchJSON = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse geocoding response"));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Geocoding request timed out"));
    });
  });
};

/**
 * Geocode an address string to lat/lng coordinates
 * @param {Object} address - { line1, line2, city, state, pincode, country }
 * @returns {Object} - { lat, lng, displayName } or null
 */
const geocodeAddress = async (address) => {
  try {
    await rateLimitDelay();
    lastRequestTime = Date.now();

    // Build address string for geocoding
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.pincode,
      address.country || "India",
    ].filter(Boolean);

    const query = encodeURIComponent(parts.join(", "));
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`;

    const results = await fetchJSON(url);

    if (results && results.length > 0) {
      const result = results[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
      };
    }

    // Fallback: Try with just city + state + pincode
    if (address.city || address.pincode) {
      const fallbackParts = [
        address.city,
        address.state,
        address.pincode,
        address.country || "India",
      ].filter(Boolean);
      const fallbackQuery = encodeURIComponent(fallbackParts.join(", "));
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${fallbackQuery}&format=json&limit=1`;

      await rateLimitDelay();
      lastRequestTime = Date.now();
      const fallbackResults = await fetchJSON(fallbackUrl);

      if (fallbackResults && fallbackResults.length > 0) {
        return {
          lat: parseFloat(fallbackResults[0].lat),
          lng: parseFloat(fallbackResults[0].lon),
          displayName: fallbackResults[0].display_name,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error.message);
    return null;
  }
};

/**
 * Reverse geocode coordinates to get city/area name
 * @param {number} lat
 * @param {number} lng
 * @returns {Object} - { city, state, displayName } or null
 */
const reverseGeocode = async (lat, lng) => {
  try {
    await rateLimitDelay();
    lastRequestTime = Date.now();

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const result = await fetchJSON(url);

    if (result && result.address) {
      return {
        city:
          result.address.city ||
          result.address.town ||
          result.address.village ||
          result.address.county ||
          "",
        state: result.address.state || "",
        pincode: result.address.postcode || "",
        displayName: result.display_name,
      };
    }

    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error.message);
    return null;
  }
};

/**
 * Build full address display string from structured address
 */
const buildFullAddress = (address) => {
  if (!address) return "";
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pincode,
    address.country,
  ].filter(Boolean);
  return parts.join(", ");
};

module.exports = {
  geocodeAddress,
  reverseGeocode,
  buildFullAddress,
};
