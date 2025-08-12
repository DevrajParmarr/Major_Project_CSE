import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaTruck, FaMapMarkerAlt, FaRoute, FaPlus, 
  FaCalendarAlt, FaClock, FaRoad 
} from 'react-icons/fa';
import VehicleService from '../services/vehicle.service';
import LocationService from '../services/location.service';
import OptimizationService from '../services/optimization.service';
import Map from '../components/Map';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [vehicles, setVehicles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [optimizations, setOptimizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalLocations: 0,
    totalOptimizations: 0,
    totalDistance: 0
  });
  const [selectedOptimization, setSelectedOptimization] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch vehicles
        const vehiclesData = await VehicleService.getAll();
        setVehicles(vehiclesData);
        
        // Fetch locations
        const locationsData = await LocationService.getAll();
        setLocations(locationsData);
        
        // Fetch optimizations
        const optimizationsData = await OptimizationService.getAll();
        setOptimizations(optimizationsData);
        
        // Calculate stats
        const totalDistance = optimizationsData.reduce(
          (sum, opt) => sum + (opt.totalDistance || 0), 
          0
        );
        
        setStats({
          totalVehicles: vehiclesData.length,
          totalLocations: locationsData.length,
          totalOptimizations: optimizationsData.length,
          totalDistance
        });
        
        // Set the most recent optimization as selected
        if (optimizationsData.length > 0) {
          const mostRecent = [...optimizationsData].sort(
            (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
          )[0];
          setSelectedOptimization(mostRecent);
        }
        
        setError('');
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format distance
  const formatDistance = (distance) => {
    const n = Number(distance ?? 0);
    if (!isFinite(n) || n <= 0) return '0 km';
    return `${n.toFixed(2)} km`;
  };

  // Get optimization locations
  const getOptimizationLocations = () => {
    if (!selectedOptimization) return [];
    
    if (selectedOptimization.locations && Array.isArray(selectedOptimization.locations)) {
      return selectedOptimization.locations.map(loc => {
        // Handle both string IDs and object references
        const id = typeof loc === 'object' ? loc._id : loc;
        return locations.find(location => location._id === id);
      }).filter(Boolean);
    }
    
    return [];
  };

  // Get optimization vehicles
  const getOptimizationVehicles = () => {
    if (!selectedOptimization) return [];
    
    if (selectedOptimization.vehicles && Array.isArray(selectedOptimization.vehicles)) {
      return selectedOptimization.vehicles.map(veh => {
        // Handle both string IDs and object references
        const id = typeof veh === 'object' ? veh._id : veh;
        return vehicles.find(vehicle => vehicle._id === id);
      }).filter(Boolean);
    }
    
    return [];
  };

  return (
    <div className="dashboard">
      <div className="container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner-large"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">!</div>
            <p>{error}</p>
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="dashboard-header" data-aos="fade-up">
              <div className="dashboard-title">
                <h1>Dashboard</h1>
                <p>Welcome back{selectedOptimization ? '' : ','}! Here's an overview of your route optimization data.</p>
              </div>
              <div className="dashboard-actions">
                <Link to="/optimizations/new" className="btn btn-primary">
                  <FaPlus /> New Optimization
                </Link>
              </div>
            </div>
            
            <div className="dashboard-stats" data-aos="fade-up">
              <div className="stat-card" data-aos="fade-up">
                <div className="stat-icon">
                  <FaTruck />
                </div>
                <div className="stat-content">
                  <h3>Vehicles</h3>
                  <p className="stat-number">{stats.totalVehicles}</p>
                  <Link to="/vehicles" className="stat-link">View all</Link>
                </div>
              </div>
              
              <div className="stat-card" data-aos="fade-up" data-aos-delay="100">
                <div className="stat-icon">
                  <FaMapMarkerAlt />
                </div>
                <div className="stat-content">
                  <h3>Locations</h3>
                  <p className="stat-number">{stats.totalLocations}</p>
                  <Link to="/locations" className="stat-link">View all</Link>
                </div>
              </div>
              
              <div className="stat-card" data-aos="fade-up" data-aos-delay="200">
                <div className="stat-icon">
                  <FaRoute />
                </div>
                <div className="stat-content">
                  <h3>Optimizations</h3>
                  <p className="stat-number">{stats.totalOptimizations}</p>
                  <Link to="/optimizations" className="stat-link">View all</Link>
                </div>
              </div>
              
              <div className="stat-card" data-aos="fade-up" data-aos-delay="300">
                <div className="stat-icon">
                  <FaRoad />
                </div>
                <div className="stat-content">
                  <h3>Total Distance</h3>
                  <p className="stat-number">{formatDistance(stats.totalDistance)}</p>
                </div>
              </div>
            </div>
            
            {selectedOptimization ? (
              <div className="dashboard-recent" data-aos="fade-up">
                <div className="recent-header">
                  <h2>Latest Optimization</h2>
                  <Link to={`/optimizations/${selectedOptimization._id}`} className="btn btn-outline">
                    View Details
                  </Link>
                </div>
                
                <div className="recent-content">
                  <div className="recent-info">
                    <div className="recent-info-item">
                      <FaCalendarAlt />
                      <span>Created: {formatDate(selectedOptimization.createdAt || selectedOptimization.date)}</span>
                    </div>
                    <div className="recent-info-item">
                      <FaRoad />
                      <span>Total Distance: {formatDistance(selectedOptimization.totalDistance)}</span>
                    </div>
                    <div className="recent-info-item">
                      <FaClock />
                      <span>Duration: {selectedOptimization.totalDuration ? `${Math.floor(selectedOptimization.totalDuration / 60)} min` : 'N/A'}</span>
                    </div>
                    <div className="recent-info-item">
                      <FaTruck />
                      <span>Vehicles: {selectedOptimization.vehicles ? selectedOptimization.vehicles.length : 0}</span>
                    </div>
                    <div className="recent-info-item">
                      <FaMapMarkerAlt />
                      <span>Locations: {selectedOptimization.locations ? selectedOptimization.locations.length : 0}</span>
                    </div>
                  </div>
                  
                  <div className="recent-map">
                    <Map 
                      locations={getOptimizationLocations()}
                      routes={selectedOptimization.routes || []}
                      vehicles={getOptimizationVehicles()}
                      height="400px"
                    />
                  </div>
                  
                  <div className="recent-routes">
                    <h3>Route Summary</h3>
                    <div className="routes-grid">
                      {selectedOptimization.routes && selectedOptimization.routes.map((route, index) => {
                        const vehicle = vehicles.find(v => v._id === route.vehicle) || { name: 'Unknown Vehicle' };
                        
                        return (
                          <div className="route-card" key={index}>
                            <div className="route-header">
                              <div className="route-color" style={{ backgroundColor: ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8'][index % 5] }}></div>
                              <h4>{vehicle.name}</h4>
                            </div>
                            <div className="route-details">
                              <div className="route-detail">
                                <span>Stops:</span>
                                <strong>{route.stops ? route.stops.length : 0}</strong>
                              </div>
                              <div className="route-detail">
                                <span>Distance:</span>
                                <strong>{formatDistance(route.distance)}</strong>
                              </div>
                              <div className="route-detail">
                                <span>Duration:</span>
                                <strong>{route.duration ? `${Math.floor(route.duration / 60)} min` : 'N/A'}</strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) :  (
              <div className="no-optimizations" data-aos="fade-up">
                <div className="no-data-icon">
                  <FaRoute />
                </div>
                <h2>No Optimizations Yet</h2>
                <p>Create your first route optimization to see results here.</p>
                <Link to="/optimizations/new" className="btn btn-primary">
                  Create Optimization
                </Link>
              </div>
            )}
            
            <div className="dashboard-sections">
              <div className="dashboard-section" data-aos="fade-up">
                <div className="section-header">
                  <h2>Recent Vehicles</h2>
                  <Link to="/vehicles" className="btn btn-text">View All</Link>
                </div>
                
                <div className="section-content">
                  {vehicles.length === 0 ? (
                    <div className="no-data">
                      <p>No vehicles added yet</p>
                      <Link to="/vehicles/add" className="btn btn-outline-sm">
                        Add Vehicle
                      </Link>
                    </div>
                  ) : (
                    <div className="vehicles-grid">
                      {vehicles && vehicles.slice(0, 3).map(vehicle => (
                        <div className="vehicle-card" key={vehicle._id}>
                          <div className="vehicle-icon">
                            <FaTruck />
                          </div>
                          <div className="vehicle-details">
                            <h3>{vehicle.name}</h3>
                            <p>Capacity: {vehicle.capacity}</p>
                            <p>Max Distance: {formatDistance(vehicle.maxDistance)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="dashboard-section" data-aos="fade-up" data-aos-delay="100">
                <div className="section-header">
                  <h2>Recent Locations</h2>
                  <Link to="/locations" className="btn btn-text">View All</Link>
                </div>
                
                <div className="section-content">
                  {locations.length === 0 ? (
                    <div className="no-data">
                      <p>No locations added yet</p>
                      <Link to="/locations/add" className="btn btn-outline-sm">
                        Add Location
                      </Link>
                    </div>
                  ) : (
                    <div className="locations-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {locations && locations.slice(0, 5).map(location => (
                            <tr key={location._id}>
                              <td>{location.name}</td>
                              <td>{location.address || 'N/A'}</td>
                              <td>
                                <span className={`location-type ${location.isDepot ? 'depot' : 'destination'}`}>
                                  {location.isDepot ? 'Depot' : 'Destination'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;