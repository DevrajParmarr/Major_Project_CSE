
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import '../styles/Map.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Map = ({
  locations = [],
  routes = [],
  vehicles = [],
  onLocationSelect,
  onMapClick,
  center = [22.7196, 75.8577], // Indore, India coordinates
  zoom = 13,
  height = "500px",
  useRoadNetwork = false,
  routedPolylines = {},
  onRouteSelect,
  optimizationId,
  onRoutedPolylinesUpdate,
  isLoadingRoutes = false,
}) => {
  const routeColors = [
    '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8',
    '#33FFF6', '#FFB533', '#BD33FF', '#FF3333', '#33FF33'
  ];

  // State for selected route
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [visibleRoutes, setVisibleRoutes] = useState(new Set(routes.map((_, index) => index)));

  // Get vehicle by ID
  const getVehicleById = (vehicleId) => {
    return vehicles.find(v => v._id === vehicleId) || { name: 'Unknown Vehicle' };
  };

  // Handle route click with real road routing
  const handleRouteClick = async (route, routeIndex) => {
    setSelectedRoute(selectedRoute === routeIndex ? null : routeIndex);
    if (onRouteSelect) {
      onRouteSelect(route, routeIndex);
    }

    // If useRoadNetwork is enabled, fetch real road route
    if (useRoadNetwork && route.stops && route.stops.length > 0) {
      try {
        console.log('Fetching road route for route', routeIndex);
        // Fetch real road route from backend
        const response = await fetch(`/api/optimizations/${optimizationId}/routes/${routeIndex}/polyline`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const roadRoute = await response.json();
          console.log('Road route fetched:', roadRoute);

          // Update the route with real road geometry
          if (onRoutedPolylinesUpdate && roadRoute.geometry && roadRoute.geometry.coordinates) {
            const coordinates = roadRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            onRoutedPolylinesUpdate(routeIndex, coordinates);

            // Show notification about route type
            if (roadRoute.fallback) {
              console.log('Using fallback straight-line route');
            } else {
              console.log('Using real road network route');
            }
          }
        } else {
          console.error('Failed to fetch road route:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch road route:', error);
        // Fallback will be handled by backend
      }
    }
  };

  // Handle route hover
  const handleRouteHover = (routeIndex) => {
    setHoveredRoute(routeIndex);
  };

  const handleRouteLeave = () => {
    setHoveredRoute(null);
  };

  // Handle route visibility toggle
  const toggleRouteVisibility = (routeIndex) => {
    const newVisibleRoutes = new Set(visibleRoutes);
    if (newVisibleRoutes.has(routeIndex)) {
      newVisibleRoutes.delete(routeIndex);
    } else {
      newVisibleRoutes.add(routeIndex);
    }
    setVisibleRoutes(newVisibleRoutes);
  };

  // Toggle all routes visibility
  const toggleAllRoutesVisibility = () => {
    if (visibleRoutes.size === routes.length) {
      setVisibleRoutes(new Set());
    } else {
      setVisibleRoutes(new Set(routes.map((_, index) => index)));
    }
  };

  // Create custom icons with better visibility
  const createCustomIcon = (type, number = null) => {
    let className = 'custom-marker';
    let html = '';
    let iconSize = [48, 48];
    let iconAnchor = [24, 48];

    switch (type) {
      case 'depot':
        className += ' depot';
        html = `
          <div style="
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #FF6B47, #FF5733);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: markerPulse 2s infinite;
          ">🏭</div>
        `;
        break;
      case 'location':
        className += ' location';
        html = `
          <div style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #4A6FFF, #3357FF);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: markerPulse 2s infinite 0.5s;
          ">📍</div>
        `;
        iconSize = [40, 40];
        iconAnchor = [20, 40];
        break;
      case 'vehicle':
        className += ' vehicle';
        html = `
          <div style="
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #4AFF6B, #33FF57);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 22px;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: markerPulse 2s infinite 1s;
          ">🚛</div>
        `;
        iconSize = [44, 44];
        iconAnchor = [22, 44];
        break;
      case 'stop':
        className += ' numbered-stop';
        html = `
          <div style="
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #374151, #111827);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">${number || '•'}</div>
        `;
        iconSize = [36, 36];
        iconAnchor = [18, 36];
        break;
      default:
        html = `
          <div style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #6B7280, #4B5563);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          ">📍</div>
        `;
        iconSize = [40, 40];
        iconAnchor = [20, 40];
    }

    return L.divIcon({
      className,
      html,
      iconSize,
      iconAnchor,
      popupAnchor: [0, -iconAnchor[1]]
    });
  };

  // Convert route to polyline coordinates with better error handling
  const getRouteCoordinates = (route, routeIndex) => {
    if (!route.stops || route.stops.length === 0) return [];

    if (useRoadNetwork && routedPolylines[routeIndex]) {
      // Use actual road network polyline if available
      const polyline = routedPolylines[routeIndex];
      if (Array.isArray(polyline) && polyline.length > 0) {
        return polyline;
      }
    }

    // Use straight lines between stops with validation
    const coordinates = [];
    for (const stop of route.stops) {
      const location = locations.find(loc => {
        // Handle both string and object IDs
        const stopId = typeof stop.locationId === 'object' ? stop.locationId.toString() : stop.locationId;
        const locId = typeof loc._id === 'object' ? loc._id.toString() : loc._id;
        return stopId === locId;
      });

      if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
        coordinates.push([location.latitude, location.longitude]);
      }
    }

    return coordinates;
  };

  // Check if route has real road network data
  const hasRealRoadData = (routeIndex) => {
    return useRoadNetwork && routedPolylines[routeIndex] && Array.isArray(routedPolylines[routeIndex]) && routedPolylines[routeIndex].length > 0;
  };

  return (
    <div className="map-wrapper" style={{ height, position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render locations */}
        {locations.map((location) => (
          <Marker
            key={location._id}
            position={[location.latitude, location.longitude]}
            icon={createCustomIcon(location.isDepot ? 'depot' : 'location')}
            eventHandlers={{
              click: () => onLocationSelect && onLocationSelect(location),
            }}
          >
            <Popup>
              <div className="location-popup">
                <h3>{location.name}</h3>
                <p><strong>Type:</strong> {location.isDepot ? 'Depot' : 'Delivery Location'}</p>
                <p><strong>Address:</strong> {location.address}</p>
                {location.demand && <p><strong>Demand:</strong> {location.demand}</p>}
                <p><strong>Coordinates:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render routes */}
        {routes.map((route, routeIndex) => {
          const coordinates = getRouteCoordinates(route, routeIndex);
          const color = routeColors[routeIndex % routeColors.length];
          const vehicle = getVehicleById(route.vehicle);

          if (coordinates.length < 2 || !visibleRoutes.has(routeIndex)) return null;

          return (
            <React.Fragment key={`route-${routeIndex}`}>
              {/* Main route polyline with enhanced visibility */}
              <Polyline
                positions={coordinates}
                color={selectedRoute === routeIndex ? '#FFD700' : hoveredRoute === routeIndex ? '#FFA500' : color}
                weight={selectedRoute === routeIndex ? 10 : hoveredRoute === routeIndex ? 8 : hasRealRoadData(routeIndex) ? 5 : 4}
                opacity={selectedRoute === routeIndex ? 1 : hoveredRoute === routeIndex ? 0.95 : hasRealRoadData(routeIndex) ? 0.95 : 0.8}
                dashArray={hasRealRoadData(routeIndex) ? null : '5, 5'}
                className={selectedRoute === routeIndex ? 'route-highlight' : hasRealRoadData(routeIndex) ? 'road-route' : 'straight-route'}
                eventHandlers={{
                  click: () => handleRouteClick(route, routeIndex),
                  mouseover: (e) => {
                    handleRouteHover(routeIndex);
                    e.target.setStyle({
                      weight: selectedRoute === routeIndex ? 12 : hasRealRoadData(routeIndex) ? 8 : 7,
                      opacity: 1
                    });
                  },
                  mouseout: (e) => {
                    handleRouteLeave();
                    e.target.setStyle({
                      weight: selectedRoute === routeIndex ? 10 : hasRealRoadData(routeIndex) ? 5 : 4,
                      opacity: selectedRoute === routeIndex ? 1 : hasRealRoadData(routeIndex) ? 0.95 : 0.8,
                      color: selectedRoute === routeIndex ? '#FFD700' : color
                    });
                  }
                }}
              />

              {/* Route direction arrows */}
              {coordinates.length > 2 && (
                <Polyline
                  positions={coordinates}
                  color={color}
                  weight={2}
                  opacity={0.6}
                  dashArray="1, 10"
                />
              )}

              {/* Route stop markers with improved visibility */}
              {route.stops && route.stops.map((stop, stopIndex) => {
                const location = locations.find(loc => {
                  const stopId = typeof stop.locationId === 'object' ? stop.locationId.toString() : stop.locationId;
                  const locId = typeof loc._id === 'object' ? loc._id.toString() : loc._id;
                  return stopId === locId;
                });
                if (!location) return null;

                return (
                  <Marker
                    key={`stop-${routeIndex}-${stopIndex}`}
                    position={[location.latitude, location.longitude]}
                    icon={createCustomIcon('stop', stopIndex + 1)}
                    eventHandlers={{
                      click: () => {
                        console.log('Stop clicked:', stopIndex + 1, location.name);
                      }
                    }}
                  >
                    <Popup>
                      <div className="stop-popup">
                        <h3>Stop {stopIndex + 1}</h3>
                        <p><strong>Location:</strong> {location.name}</p>
                        <p><strong>Route:</strong> {vehicle.name}</p>
                        <p><strong>Sequence:</strong> {stopIndex + 1} of {route.stops.length}</p>
                        {stop.demand && <p><strong>Demand:</strong> {stop.demand}</p>}
                        <p><strong>Coordinates:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Route Summary Overlay */}
      {routes && routes.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px',
            maxWidth: '280px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600' }}>
              Route Summary
            </h4>
            <button
              onClick={toggleAllRoutesVisibility}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {visibleRoutes.size === routes.length ? 'Hide All' : 'Show All'}
            </button>
          </div>
          <div style={{ maxHeight: '250px', overflow: 'auto' }}>
            {routes.map((route, index) => {
              const vehicle = getVehicleById(route.vehicle);
              const color = routeColors[index % routeColors.length];
              const isVisible = visibleRoutes.has(index);

              return (
                <div
                  key={`route-summary-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    padding: '6px',
                    borderRadius: '4px',
                    background: isVisible ? '#f9fafb' : '#f3f4f6',
                    opacity: isVisible ? 1 : 0.6
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => toggleRouteVisibility(index)}
                    style={{
                      width: '14px',
                      height: '14px',
                      margin: '0',
                      flexShrink: 0
                    }}
                  />
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '2px',
                      background: color,
                      flexShrink: 0
                    }}
                  />
                  <div style={{ fontSize: '12px', flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{vehicle.name}</div>
                    <div style={{ color: '#6b7280' }}>
                      {route.stops?.length || 0} stops • {Number(route.distance || 0).toFixed(1)} km
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {isLoadingRoutes && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: '#fef3c7',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#92400e',
              textAlign: 'center'
            }}>
              🔄 Calculating real routes...
            </div>
          )}
        </div>
      )}

      {/* Route Details Panel */}
      {selectedRoute !== null && routes[selectedRoute] && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            maxWidth: '300px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 1000,
            animation: 'slideInLeft 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: routeColors[selectedRoute % routeColors.length],
                marginRight: '8px'
              }}
            />
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              Route {selectedRoute + 1} Details
            </h4>
          </div>

          <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Vehicle:</strong> {getVehicleById(routes[selectedRoute].vehicle).name}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Distance:</strong> {Number(routes[selectedRoute].distance || 0).toFixed(2)} km
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Duration:</strong> {routes[selectedRoute].duration ? `${Math.floor(routes[selectedRoute].duration / 60)} min` : 'N/A'}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Stops:</strong> {routes[selectedRoute].stops?.length || 0}
            </div>
            <div>
              <strong>Capacity Used:</strong> {routes[selectedRoute].totalCapacity || 0}
            </div>
          </div>

          <button
            onClick={() => setSelectedRoute(null)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Location Summary */}
      {locations && locations.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            maxWidth: '280px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 1000
          }}
        >
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
            📍 Locations ({locations.length})
          </h4>
          <div style={{ fontSize: '14px', color: '#4b5563' }}>
            <div style={{ marginBottom: '4px' }}>
              🏭 {locations.filter(loc => loc.isDepot).length} depots
            </div>
            <div>
              📦 {locations.filter(loc => !loc.isDepot).length} delivery stops
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
