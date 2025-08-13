
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-polylinedecorator';

import LocationSearch from './LocationSearch';
import '../styles/Map.css';

const createCustomIcon = (color, type) => {
  const fa = type === 'depot' ? 'fa-warehouse' : 'fa-map-marker-alt';
  return L.divIcon({
    className: `custom-marker ${type}`,
    html: `<div style="background-color: ${color}"><i class="fa ${fa}"></i><span style="display:none">${type === 'depot' ? '🏭' : '📍'}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

// Map controller component to access the map instance
const MapController = ({ onMapReady }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  
  return null;
};

const Map = ({ 
  locations = [], 
  routes = [], 
  vehicles = [],
  onLocationSelect, 
  onMapClick,
  center = [22.7196, 75.8577],
  zoom = 13,
  height = "500px",
  useRoadNetwork = false,
  routedPolylines = {},
}) => {
  const [mapInstance, setMapInstance] = useState(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [routeVisibility, setRouteVisibility] = useState({});
  const routeColors = [
    '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8', 
    '#33FFF6', '#FFB533', '#BD33FF', '#FF3333', '#33FF33'
  ];

  // Get vehicle by ID
  const getVehicleById = (vehicleId) => {
    return vehicles.find(v => v._id === vehicleId) || { name: 'Unknown Vehicle' };
  };

  // Format distance
  const formatDistance = (distance) => {
    const n = Number(distance ?? 0);
    if (!isFinite(n) || n <= 0) return 'N/A';
    return `${n.toFixed(2)} km`;
  };

  // Format duration
  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    return hours > 0 
      ? `${hours} hr ${minutes} min` 
      : `${minutes} min`;
  };

  // Handle map click
  const handleMapClick = (e) => {
    if (onMapClick) {
      const { lat, lng } = e.latlng;
      onMapClick({ latitude: lat, longitude: lng });
    }
  };

  useEffect(() => {
    // initialize visibility when routes change
    const vis = {};
    routes.forEach((_, idx) => { vis[idx] = true; });
    setRouteVisibility(vis);
  }, [routes]);

  return (
    <div className="map-wrapper" style={{ height }}>
      {onLocationSelect && (
        <div className="map-search-container">
          <LocationSearch 
            onLocationSelect={onLocationSelect} 
            map={mapInstance} 
          />
        </div>
      )}

      <div className="map-toolbar" style={{ position: 'absolute', zIndex: 1000, right: 12, top: 12, display: 'flex', gap: 8, flexDirection: 'column', alignItems: 'flex-end' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setShowRoutes((v) => !v)}>
          {showRoutes ? 'Hide Routes' : 'Show Routes'}
        </button>
        {showRoutes && routes && routes.length > 0 && (
          <div className="card card-hover" style={{ padding: 8, maxHeight: 260, overflow: 'auto' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Routes</div>
            {routes.map((route, idx) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: routeColors[idx % routeColors.length] }} />
                <input type="checkbox" checked={!!routeVisibility[idx]} onChange={() => setRouteVisibility(prev => ({ ...prev, [idx]: !prev[idx] }))} />
                <span style={{ fontSize: 12 }}>{(vehicles.find(v => v._id === route.vehicle)?.name) || route.vehicleName || `Route ${idx+1}`}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className="map-container" 
        style={{ height: '100%' }}
        whenCreated={setMapInstance}
        onClick={handleMapClick}
      >
        <MapController onMapReady={setMapInstance} />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Render locations as markers */}
        {locations && locations.map((location) => (
          <Marker 
            key={location._id || `temp-${location.latitude}-${location.longitude}`}
            position={[location.latitude, location.longitude]}
            icon={createCustomIcon(
              location.isDepot ? '#FF5733' : '#3357FF', 
              location.isDepot ? 'depot' : 'location'
            )}
          >
            <Popup>
              <div className="location-popup">
                <h3>{location.name}</h3>
                <p>{location.address}</p>
                <p className="coordinates">
                  <strong>Coordinates:</strong> {Number(location?.latitude ?? 0).toFixed(6)}, {Number(location?.longitude ?? 0).toFixed(6)}
                </p>
                {location.isDepot && <p className="depot-label">Depot</p>}
                {location.demand > 0 && (
                  <p><strong>Demand:</strong> {location.demand}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Render routes as polylines with arrow decorators */}
        {showRoutes && routes && routes.map((route, index) => {
          if (!routeVisibility[index]) return null;
          if (!route.stops || route.stops.length < 2) return null;
          const color = routeColors[index % routeColors.length];
          
          let coordinates = [];
          const routed = useRoadNetwork && routedPolylines && routedPolylines[index];
          if (routed && routed.coordinates) {
            // GeoJSON coordinates are [lng, lat]
            coordinates = routed.coordinates.map(([lng, lat]) => [lat, lng]);
          } else {
            coordinates = route.stops.map(stop => {
              const locationId = stop.locationId || (typeof stop.location === 'object' ? stop.location._id : stop.location);
              const location = locations.find(loc => loc._id === locationId) || { latitude: stop.latitude, longitude: stop.longitude };
              return location ? [location.latitude, location.longitude] : null;
            }).filter(Boolean);
          }

          // TODO: If useRoadNetwork is true, fetch a routed polyline from OSRM/Google Directions here
          return (
            <React.Fragment key={`route-${index}`}>
              <Polyline 
                positions={coordinates}
                color={color}
                weight={5}
                opacity={0.8}
              />

            </React.Fragment>
          );
        })}

        {/* Add vehicle markers at the start of each route */}
        {showRoutes && routes && routes.map((route, index) => {
          if (!routeVisibility[index]) return null;
          if (!route.stops || route.stops.length < 2) return null;

          const firstStop = route.stops[0];
          const locationId = firstStop.locationId || (typeof firstStop.location === 'object' ? firstStop.location._id : firstStop.location);
          const location = locations.find(loc => loc._id === locationId) || { latitude: firstStop.latitude, longitude: firstStop.longitude };
          if (!location) return null;

          const vehicle = getVehicleById(route.vehicle);
          const color = routeColors[index % routeColors.length];

          return (
            <Marker
              key={`vehicle-${index}`}
              position={[location.latitude, location.longitude]}
              icon={L.divIcon({
                className: 'vehicle-marker',
                html: `<div style="background-color: ${color}; padding: 4px 6px; border-radius: 6px; color: white; display: flex; align-items: center; gap: 4px;">
                         <i class="fa fa-truck"></i>
                         <span class="vehicle-name">${vehicle.name}</span>
                       </div>`,
                iconSize: [80, 40],
                iconAnchor: [40, 20]
              })}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Map;
