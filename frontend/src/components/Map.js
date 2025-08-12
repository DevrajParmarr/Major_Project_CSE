
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import LocationSearch from './LocationSearch';
import '../styles/Map.css';

const createCustomIcon = (color, type) => {
  return L.divIcon({
    className: `custom-marker ${type}`,
    html: `<div style="background-color: ${color}"><i class="fas fa-${type === 'depot' ? 'warehouse' : 'map-marker-alt'}"></i></div>`,
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
  center = [51.505, -0.09],
  zoom = 13,
  height = "500px"
}) => {
  const [mapInstance, setMapInstance] = useState(null);
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
        
        {/* Render routes as polylines */}
        {routes && routes.map((route, index) => {
          // Skip routes without stops
          if (!route.stops || route.stops.length < 2) return null;
          
          // Get coordinates for the route
          const coordinates = route.stops.map(stop => {
            // Handle both locationId and location references
            const locationId = stop.locationId || (typeof stop.location === 'object' ? stop.location._id : stop.location);
            const location = locations.find(loc => loc._id === locationId);
            return location ? [location.latitude, location.longitude] : null;
          }).filter(Boolean);
          
          // Get the vehicle for this route
          const vehicle = getVehicleById(route.vehicle);
          
          return (
            <React.Fragment key={`route-${index}`}>
              <Polyline 
                positions={coordinates}
                color={routeColors[index % routeColors.length]}
                weight={4}
                opacity={0.7}
              >
                <Popup>
                  <div className="route-popup">
                    <h3>Route for {vehicle.name}</h3>
                    <p><strong>Distance:</strong> {formatDistance(route.distance)}</p>
                    <p><strong>Duration:</strong> {formatDuration(route.duration)}</p>
                    <p><strong>Stops:</strong> {route.stops.length}</p>
                  </div>
                </Popup>
              </Polyline>
              
              {/* Add route markers with stop numbers */}
              {route.stops.map((stop, stopIndex) => {
                if (stopIndex === 0 || stopIndex === route.stops.length - 1) return null;
                
                const locationId = stop.locationId || (typeof stop.location === 'object' ? stop.location._id : stop.location);
                const location = locations.find(loc => loc._id === locationId);
                
                if (!location) return null;
                
                return (
                  <Marker
                    key={`route-${index}-stop-${stopIndex}`}
                    position={[location.latitude, location.longitude]}
                    icon={L.divIcon({
                      className: 'route-stop-marker',
                      html: `<div style="background-color: ${routeColors[index % routeColors.length]}">${stopIndex}</div>`,
                      iconSize: [24, 24],
                      iconAnchor: [12, 12]
                    })}
                  >
                    <Popup>
                      <div className="stop-popup">
                        <h3>Stop #{stopIndex}</h3>
                        <p><strong>Location:</strong> {location.name}</p>
                        {stop.arrivalTime && (
                          <p><strong>Arrival Time:</strong> {stop.arrivalTime}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Add vehicle markers at the start of each route */}
        {routes && routes.map((route, index) => {
          if (!route.stops || route.stops.length < 2) return null;

          const firstStop = route.stops[0];
          const locationId = firstStop.locationId || (typeof firstStop.location === 'object' ? firstStop.location._id : firstStop.location);
          const location = locations.find(loc => loc._id === locationId);

          if (!location) return null;

          const vehicle = getVehicleById(route.vehicle);

          return (
            <Marker
              key={`vehicle-${index}`}
              position={[location.latitude, location.longitude]}
              icon={L.divIcon({
                className: 'vehicle-marker',
                html: `<div style="background-color: ${routeColors[index % routeColors.length]}; padding: 4px 6px; border-radius: 6px; color: white; display: flex; align-items: center; gap: 4px;">
                         <i class="fas fa-truck"></i>
                         <span class="vehicle-name">${vehicle.name}</span>
                       </div>`,
                iconSize: [80, 40],
                iconAnchor: [40, 20]
              })}
            >
              <Popup>
                <div className="vehicle-popup">
                  <h3>{vehicle.name}</h3>
                  <p><strong>Starting from:</strong> {location.name}</p>
                  <p><strong>Route Distance:</strong> {formatDistance(route.distance)}</p>
                  <p><strong>Route Duration:</strong> {formatDuration(route.duration)}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Map;
