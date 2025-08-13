import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VehicleService from '../services/vehicle.service';
import LocationService from '../services/location.service';
import OptimizationService from '../services/optimization.service';
import Map from '../components/Map';
import '../styles/NewOptimization.css';
import { useAuth } from '../context/AuthContext';

const NewOptimization = () => {
  const navigate = useNavigate();
  const { currentUser, updateUserPreferences } = useAuth();
  const [name, setName] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [algorithm, setAlgorithm] = useState('clarke-wright');

  useEffect(() => {
    if (currentUser?.preferences?.defaultAlgorithm) {
      setAlgorithm(currentUser.preferences.defaultAlgorithm);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, locationsRes] = await Promise.all([
        VehicleService.getAll(),
        LocationService.getAll()
      ]);

      setVehicles(vehiclesRes || []);
      setLocations(locationsRes || []);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (vehicleId) => {
    if (selectedVehicles.includes(vehicleId)) {
      setSelectedVehicles(selectedVehicles.filter(id => id !== vehicleId));
    } else {
      setSelectedVehicles([...selectedVehicles, vehicleId]);
    }
  };

  const handleLocationSelect = (locationId) => {
    if (selectedLocations.includes(locationId)) {
      setSelectedLocations(selectedLocations.filter(id => id !== locationId));
    } else {
      setSelectedLocations([...selectedLocations, locationId]);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && selectedVehicles.length === 0) {
      setError('Please select at least one vehicle');
      return;
    }
    
    if (step === 2 && selectedLocations.length === 0) {
      setError('Please select at least one location');
      return;
    }
    
    setError('');
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleOptimize = async () => {
    if (!name.trim()) {
      setError('Please enter a name for this optimization');
      return;
    }

    try {
      setOptimizing(true);
      setError('');
      
      const optimizationData = {
        name,
        vehicleIds: selectedVehicles,
        locationIds: selectedLocations,
        algorithm,
      };
      
      const response = await OptimizationService.create(optimizationData);
      // persist default algorithm if different
      try { if (currentUser && currentUser?.preferences?.defaultAlgorithm !== algorithm) { await updateUserPreferences({ defaultAlgorithm: algorithm }); } } catch {}
      navigate(`/optimizations/${response._id}`);
    } catch (err) {
      setError('Optimization failed. Please try again.');
      console.error(err);
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="new-optimization-container">
      <h1>New Optimization</h1>
      
      <div className="stepper">
        <div className={`step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Select Vehicles</div>
        </div>
        <div className={`step ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Select Locations</div>
        </div>
        <div className={`step ${step === 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Optimize</div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="step-content">
        {step === 1 && (
          <div className="step-vehicles">
            <h2>Select Vehicles</h2>
            {vehicles.length === 0 ? (
              <div className="no-data">
                <p>No vehicles found. Please add vehicles first.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/vehicles/add')}
                >
                  Add Vehicle
                </button>
              </div>
            ) : (
              <div className="vehicles-grid">
                {vehicles && vehicles.map(vehicle => (
                  <div
                    key={vehicle._id}
                    className={`vehicle-card ${selectedVehicles.includes(vehicle._id) ? 'selected' : ''}`}
                    onClick={() => handleVehicleSelect(vehicle._id)}
                  >
                    <div className="vehicle-icon">
                      <i className="fas fa-truck"></i>
                    </div>
                    <div className="vehicle-details">
                      <h3>{vehicle.name}</h3>
                      <p>
                        <strong>Capacity:</strong> {vehicle.capacity}
                      </p>
                      <p>
                        <strong>Count:</strong> {vehicle.count}
                      </p>
                    </div>
                    <div className="vehicle-select">
                      <input
                        type="checkbox"
                        checked={selectedVehicles.includes(vehicle._id)}
                        onChange={() => {}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="step-locations">
            <h2>Select Locations</h2>
            {locations.length === 0 ? (
              <div className="no-data">
                <p>No locations found. Please add locations first.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/locations/add')}
                >
                  Add Location
                </button>
              </div>
            ) : (
              <>
                <div className="map-wrapper">
                  <Map
                    locations={locations.filter(loc => selectedLocations.includes(loc._id))}
                  />
                </div>
                <div className="locations-list">
                  <table className="locations-table">
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Name</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Demand</th>
                        <th>Depot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations && locations.map(location => (
                        <tr
                          key={location._id}
                          className={selectedLocations.includes(location._id) ? 'selected' : ''}
                          onClick={() => handleLocationSelect(location._id)}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedLocations.includes(location._id)}
                              onChange={() => {}}
                            />
                          </td>
                          <td>{location.name}</td>
                          <td>{Number(location?.latitude ?? 0).toFixed(6)}</td>
                          <td>{Number(location?.longitude ?? 0).toFixed(6)}</td>
                          <td>{location.demand || 0}</td>
                          <td>{location.isDepot ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="step-optimize">
            <h2>Optimize Routes</h2>
            <div className="optimization-summary">
              <div className="form-group">
                <label htmlFor="name">Optimization Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., Weekly Delivery Route"
                />
              </div>

              <div className="form-group">
                <label htmlFor="algorithm">Algorithm</label>
                <select id="algorithm" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
                  <option value="clarke-wright">Clarke-Wright (Savings)</option>
                  <option value="nearest-neighbor">Nearest Neighbor</option>
                </select>
              </div>
              
              <div className="summary-section">
                <h3>Selected Vehicles ({selectedVehicles.length})</h3>
                <ul>
                  {vehicles && vehicles
                    .filter(v => selectedVehicles.includes(v._id))
                    .map(vehicle => (
                      <li key={vehicle._id}>
                        {vehicle.name} - Capacity: {vehicle.capacity}, Count: {vehicle.count}
                      </li>
                    ))}
                </ul>
              </div>
              
              <div className="summary-section">
                <h3>Selected Locations ({selectedLocations.length})</h3>
                <ul>
                  {locations && locations
                    .filter(l => selectedLocations.includes(l._id))
                    .map(location => (
                      <li key={location._id}>
                        {location.name} - Demand: {location.demand || 0}
                        {location.isDepot && ' (Depot)'}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="step-actions">
        {step > 1 && (
          <button className="btn btn-secondary" onClick={handlePrevStep}>
            Previous
          </button>
        )}
        
        {step < 3 ? (
          <button className="btn btn-primary" onClick={handleNextStep}>
            Next
          </button>
        ) : (
          <button
            className="btn btn-success"
            onClick={handleOptimize}
            disabled={optimizing}
          >
            {optimizing ? 'Optimizing...' : 'Run Optimization'}
          </button>
        )}
      </div>
    </div>
  );
};

export default NewOptimization;