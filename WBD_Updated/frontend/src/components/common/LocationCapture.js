import React, { useState, useEffect, useCallback } from "react";
import { Button, Form, InputGroup, Spinner, Alert } from "react-bootstrap";
import axios from "../../api/axios";

/**
 * LocationCapture Component
 * Detects user's browser location, reverse geocodes to get city name
 * Falls back to manual pincode/city input if permission denied
 *
 * @param {Function} onLocationChange - callback({ lat, lng, city, state })
 * @param {Object} initialLocation - { lat, lng, city }
 */
const LocationCapture = ({ onLocationChange, initialLocation = null }) => {
  const [location, setLocation] = useState(initialLocation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const [manualPincode, setManualPincode] = useState("");

  const reverseGeocode = useCallback(
    async (lat, lng) => {
      try {
        const response = await axios.get("/api/appointments/reverse-geocode", {
          params: { lat, lng },
        });
        if (response.data?.success && response.data?.data) {
          const data = response.data.data;
          const loc = {
            lat,
            lng,
            city: data.city || "Unknown",
            state: data.state || "",
          };
          setLocation(loc);
          onLocationChange(loc);
          return loc;
        }
      } catch (err) {
        console.error("Reverse geocode error:", err);
      }
      // Fallback
      const loc = { lat, lng, city: "Your Location", state: "" };
      setLocation(loc);
      onLocationChange(loc);
      return loc;
    },
    [onLocationChange]
  );

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setManualMode(true);
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await reverseGeocode(latitude, longitude);
        setLoading(false);
        setManualMode(false);
      },
      (err) => {
        console.log("Geolocation error:", err.message);
        setError(
          "Location access denied. Please enter your city or pincode manually."
        );
        setManualMode(true);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [reverseGeocode]);

  // Auto-detect on mount if no initial location
  useEffect(() => {
    if (!initialLocation) {
      detectLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSearch = async () => {
    const searchQuery = manualPincode || manualCity;
    if (!searchQuery) return;

    setLoading(true);
    setError("");

    try {
      // Use Nominatim directly from backend through our reverse-geocode or
      // simply send the city name and let the vet search use city filter
      // For a simple approach, geocode the city/pincode to get coordinates
      const query = manualPincode
        ? `${manualPincode}, India`
        : `${manualCity}, India`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=1`,
        {
          headers: {
            "User-Agent": "TailWaggersPetPlatform/1.0",
          },
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const loc = {
          lat,
          lng,
          city: manualCity || data[0].display_name?.split(",")[0] || "Unknown",
          state: "",
        };
        setLocation(loc);
        onLocationChange(loc);
        setManualMode(false);
      } else {
        setError("Location not found. Please try a different city or pincode.");
      }
    } catch (err) {
      setError("Failed to find location. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="location-capture mb-3">
      {loading && (
        <div className="d-flex align-items-center text-primary mb-2">
          <Spinner animation="border" size="sm" className="me-2" />
          <small>Detecting your location...</small>
        </div>
      )}

      {error && !location && (
        <Alert variant="warning" className="py-2 small mb-2">
          <i className="bi bi-exclamation-triangle me-1"></i>
          {error}
        </Alert>
      )}

      {location && !manualMode && (
        <div className="d-flex align-items-center justify-content-between bg-light rounded-pill px-3 py-2 mb-2">
          <div className="d-flex align-items-center">
            <i className="bi bi-geo-alt-fill text-primary me-2"></i>
            <span className="fw-semibold">
              Showing vets near {location.city}
              {location.state ? `, ${location.state}` : ""}
            </span>
          </div>
          <Button
            variant="link"
            size="sm"
            className="text-decoration-none p-0"
            onClick={() => setManualMode(true)}
          >
            Change
          </Button>
        </div>
      )}

      {manualMode && (
        <div className="bg-light rounded p-3 mb-2">
          <p className="small text-muted mb-2">
            <i className="bi bi-search me-1"></i>
            Enter your city or pincode to find nearby vets
          </p>
          <div className="d-flex gap-2">
            <InputGroup size="sm">
              <Form.Control
                type="text"
                placeholder="City name"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
              />
            </InputGroup>
            <InputGroup size="sm">
              <Form.Control
                type="text"
                placeholder="Pincode"
                value={manualPincode}
                onChange={(e) => setManualPincode(e.target.value)}
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
              />
            </InputGroup>
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualSearch}
              disabled={loading || (!manualCity && !manualPincode)}
            >
              {loading ? <Spinner animation="border" size="sm" /> : "Go"}
            </Button>
            {location && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setManualMode(false)}
              >
                Cancel
              </Button>
            )}
          </div>
          <Button
            variant="link"
            size="sm"
            className="text-decoration-none p-0 mt-2"
            onClick={detectLocation}
            disabled={loading}
          >
            <i className="bi bi-crosshair me-1"></i>Use my current location
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocationCapture;
