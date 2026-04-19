import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom colored marker icons
const createIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

export const blueIcon = createIcon("blue");
export const redIcon = createIcon("red");
export const greenIcon = createIcon("green");

/**
 * Reusable Leaflet Map Component
 * @param {Object} props
 * @param {Array} props.center - [lat, lng]
 * @param {number} props.zoom - zoom level (default: 13)
 * @param {Array} props.markers - [{ position: [lat, lng], popup: "text", icon: leafletIcon }]
 * @param {string} props.height - CSS height (default: "300px")
 * @param {string} props.className - additional CSS class
 */
const MapComponent = ({
  center = [20.5937, 78.9629], // India center
  zoom = 13,
  markers = [],
  height = "300px",
  className = "",
  style = {},
}) => {
  if (!center || (center[0] === 0 && center[1] === 0)) {
    return (
      <div
        className={`d-flex align-items-center justify-content-center bg-light rounded ${className}`}
        style={{ height, ...style }}
      >
        <div className="text-center text-muted">
          <i className="bi bi-geo-alt fs-1"></i>
          <p className="mb-0 mt-2">Location not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded overflow-hidden ${className}`} style={{ height, ...style }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={marker.position}
            icon={marker.icon || blueIcon}
          >
            {marker.popup && <Popup>{marker.popup}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
