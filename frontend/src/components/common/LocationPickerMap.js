import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { Button, Spinner } from "react-bootstrap";
import L from "leaflet";

// Fix Leaflet default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Red marker for selected location
const selectedIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Internal component: handles map click events
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Internal component: re-centers map when position changes
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.flyTo(center, zoom || 15, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

/**
 * Interactive Location Picker Map
 * Allows user to click on map to select a location, or use browser geolocation.
 *
 * @param {Function} onLocationChange - Callback with { lat, lng } when location is selected
 * @param {Object} initialLocation - { lat, lng } initial marker position (optional)
 * @param {string} height - CSS height for the map (default: "300px")
 * @param {boolean} showAddress - Whether to show reverse-geocoded address text
 */
const LocationPickerMap = ({
  onLocationChange,
  initialLocation = null,
  height = "300px",
  label = "Clinic Location",
}) => {
  const initialLat = initialLocation?.lat;
  const initialLng = initialLocation?.lng;

  const [position, setPosition] = useState(
    initialLat && initialLng
      ? [initialLat, initialLng]
      : null
  );
  const [mapCenter, setMapCenter] = useState(
    initialLat && initialLng
      ? [initialLat, initialLng]
      : [20.5937, 78.9629] // India center
  );
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  // Update position if initialLocation changes externally
  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition([initialLat, initialLng]);
      setMapCenter([initialLat, initialLng]);
    }
  }, [initialLat, initialLng]);

  const handleLocationSelect = (lat, lng) => {
    setPosition([lat, lng]);
    setGeoError("");
    if (onLocationChange) {
      onLocationChange({ lat, lng });
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        setMapCenter([lat, lng]);
        setGeoLoading(false);
        if (onLocationChange) {
          onLocationChange({ lat, lng });
        }
      },
      (err) => {
        setGeoLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError(
              "Location permission denied. Please allow location access or click on the map."
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError(
              "Location unavailable. Please click on the map to select."
            );
            break;
          default:
            setGeoError("Could not detect location. Please click on the map.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">
        <i className="bi bi-geo-alt-fill me-1 text-danger"></i>
        {label}
      </label>

      <div className="d-flex align-items-center gap-2 mb-2">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={useCurrentLocation}
          disabled={geoLoading}
          className="rounded-pill"
        >
          {geoLoading ? (
            <>
              <Spinner size="sm" animation="border" className="me-1" />
              Detecting...
            </>
          ) : (
            <>
              <i className="bi bi-crosshair me-1"></i>
              Use My Current Location
            </>
          )}
        </Button>
        {position && (
          <small className="text-success">
            <i className="bi bi-check-circle me-1"></i>
            Location set ({position[0].toFixed(4)}, {position[1].toFixed(4)})
          </small>
        )}
      </div>

      {geoError && (
        <div className="text-danger small mb-2">
          <i className="bi bi-exclamation-triangle me-1"></i>
          {geoError}
        </div>
      )}

      <div
        className="rounded overflow-hidden border"
        style={{ height, position: "relative" }}
      >
        <MapContainer
          center={mapCenter}
          zoom={position ? 15 : 5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <RecenterMap center={position} />
          {position && (
            <Marker position={position} icon={selectedIcon}>
              <Popup>
                <strong>Your Clinic Location</strong>
                <br />
                {position[0].toFixed(5)}, {position[1].toFixed(5)}
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Overlay instruction when no position is set */}
        {!position && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              padding: "6px 16px",
              borderRadius: 20,
              fontSize: "0.85rem",
              pointerEvents: "none",
            }}
          >
            <i className="bi bi-hand-index me-1"></i>
            Click on the map to set your clinic location
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPickerMap;
