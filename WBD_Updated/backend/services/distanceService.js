/**
 * Distance Calculation Service
 * Primary: Haversine formula (pure JS, always works)
 * Enhanced: OSRM for driving distances (free, no API key)
 */

const http = require("http");

/**
 * Haversine formula - calculates straight-line distance between two points
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in kilometers
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * OSRM fetch helper - fetches driving distances
 * Falls back gracefully if OSRM is unavailable
 */
const fetchOSRM = (url) => {
  return new Promise((resolve, reject) => {
    const req = http.get(
      url,
      {
        headers: { "User-Agent": "TailWaggersPetPlatform/1.0" },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse OSRM response"));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("OSRM request timed out"));
    });
  });
};

/**
 * Calculate distances from customer location to multiple vets using OSRM table API
 * OSRM coordinates format: longitude,latitude (reversed!)
 * Falls back to Haversine if OSRM fails
 *
 * @param {Object} customerLocation - { lat, lng }
 * @param {Array} vets - Array of vet objects with vetInfo.coordinates.coordinates = [lng, lat]
 * @returns {Array} vets with _distance (km) and _duration (minutes) added
 */
const calculateDistances = async (customerLocation, vets) => {
  if (!vets.length) return [];

  // Always compute Haversine distances first (reliable fallback)
  const vetsWithDistance = vets.map((vet) => {
    const vetCoords = vet.vetInfo?.coordinates?.coordinates || [0, 0];
    const [vetLng, vetLat] = vetCoords;
    const dist = haversineDistance(
      customerLocation.lat,
      customerLocation.lng,
      vetLat,
      vetLng
    );
    return {
      ...vet,
      _distance: Math.round(dist * 10) / 10, // 1 decimal place
      _duration: null, // No driving time from Haversine
      _distanceType: "straight-line",
    };
  });

  // Try OSRM for driving distances
  try {
    // Build OSRM coordinates string: customer first, then all vets
    // OSRM format: lng,lat;lng,lat;...
    const coords = [
      `${customerLocation.lng},${customerLocation.lat}`,
      ...vetsWithDistance.map((vet) => {
        const c = vet.vetInfo?.coordinates?.coordinates || [0, 0];
        return `${c[0]},${c[1]}`;
      }),
    ].join(";");

    // Use table API - calculates distances from source (index 0) to all destinations
    const url = `http://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=distance,duration`;

    const result = await fetchOSRM(url);

    if (result.code === "Ok" && result.distances && result.durations) {
      const distances = result.distances[0]; // First row = from customer
      const durations = result.durations[0];

      for (let i = 0; i < vetsWithDistance.length; i++) {
        if (distances[i + 1] !== null && distances[i + 1] !== undefined) {
          vetsWithDistance[i]._distance =
            Math.round((distances[i + 1] / 1000) * 10) / 10; // meters to km
          vetsWithDistance[i]._duration = Math.round(durations[i + 1] / 60); // seconds to minutes
          vetsWithDistance[i]._distanceType = "driving";
        }
      }
    }
  } catch (error) {
    console.log(
      "OSRM unavailable, using Haversine distances:",
      error.message
    );
    // Haversine distances already computed, no action needed
  }

  return vetsWithDistance;
};

module.exports = {
  haversineDistance,
  calculateDistances,
};
