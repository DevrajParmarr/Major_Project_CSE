import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import VehicleService from '../services/vehicle.service';
import LocationService from '../services/location.service';
import OptimizationService from '../services/optimization.service';
import Map from '../components/Map';
import { useToast } from '../components/ToastProvider';
import '../styles/NewOptimization.css';
import { useAuth } from '../context/AuthContext';

const NewOptimization = () => {
  const navigate = useNavigate();
  const { currentUser, updateUserPreferences } = useAuth();
  const { notify } = useToast();
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
  const [runComparison, setRunComparison] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState(0);
  const [currentAlgorithm, setCurrentAlgorithm] = useState('');
  const [selectAllLocations, setSelectAllLocations] = useState(false);

  useEffect(() => {
    if (currentUser?.preferences?.defaultAlgorithm) {
      setAlgorithm(currentUser.preferences.defaultAlgorithm);
    }
  }, [currentUser]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [vehiclesRes, locationsRes] = await Promise.all([
        VehicleService.getAll(),
        LocationService.getAll()
      ]);

      setVehicles(vehiclesRes || []);
      setLocations(locationsRes || []);
      notify('Data loaded successfully', 'success', { autoClose: 2000 });
    } catch (err) {
      const errorMsg = 'Failed to load data';
      setError(errorMsg);
      notify(errorMsg, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // Update selectAllLocations when selectedLocations changes
  useEffect(() => {
    if (locations.length > 0) {
      setSelectAllLocations(selectedLocations.length === locations.length);
    }
  }, [selectedLocations, locations]);

  const handleSelectAllLocations = useCallback(() => {
    if (selectAllLocations) {
      setSelectedLocations([]);
      setSelectAllLocations(false);
    } else {
      setSelectedLocations(locations.map(loc => loc._id));
      setSelectAllLocations(true);
    }
  }, [selectAllLocations, locations]);

  const handleNextStep = useCallback(() => {
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
  }, [step, selectedVehicles.length, selectedLocations.length]);

  const handlePrevStep = useCallback(() => {
    setStep(s => s - 1);
  }, []);

  // Keyboard shortcuts for better interactivity
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+A to select all locations in step 2
      if (event.ctrlKey && event.key === 'a' && step === 2) {
        event.preventDefault();
        handleSelectAllLocations();
        notify(selectAllLocations ? 'All locations deselected' : 'All locations selected', 'info', { autoClose: 1500 });
      }

      // Enter to proceed to next step
      if (event.key === 'Enter' && step < 3) {
        event.preventDefault();
        handleNextStep();
      }

      // Escape to go back to previous step
      if (event.key === 'Escape' && step > 1) {
        event.preventDefault();
        handlePrevStep();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [step, selectAllLocations, locations, selectedLocations, selectedVehicles, notify, handleNextStep, handlePrevStep, handleSelectAllLocations]);

  const handleOptimize = async () => {
    // Enhanced validation with user feedback
    if (!name.trim()) {
      const errorMsg = 'Please enter a name for this optimization';
      setError(errorMsg);
      notify(errorMsg, 'error');
      return;
    }

    if (selectedVehicles.length === 0) {
      const errorMsg = 'Please select at least one vehicle';
      setError(errorMsg);
      notify(errorMsg, 'error');
      return;
    }

    if (selectedLocations.length === 0) {
      const errorMsg = 'Please select at least one location';
      setError(errorMsg);
      notify(errorMsg, 'error');
      return;
    }

    // Validate algorithm
    const validAlgorithms = ['clarke-wright', 'enhanced-clarke-wright', 'nearest-neighbor', 'genetic', 'tabu-search', 'simulated-annealing', 'ant-colony', 'or-tools'];
    if (!runComparison && !validAlgorithms.includes(algorithm)) {
      const errorMsg = 'Please select a valid algorithm';
      setError(errorMsg);
      notify(errorMsg, 'error');
      return;
    }

    // Additional validation: Check if there's at least one depot
    const hasDepot = locations.some(loc => selectedLocations.includes(loc._id) && loc.isDepot);
    if (!hasDepot) {
      const errorMsg = 'Please select at least one depot location';
      setError(errorMsg);
      notify(errorMsg, 'error');
      return;
    }

    try {
      setOptimizing(true);
      setError('');
      setComparisonProgress(0);
      setCurrentAlgorithm('');

      const optimizationData = {
        name: name.trim(),
        vehicleIds: selectedVehicles,
        locationIds: selectedLocations,
        algorithm,
        runComparison,
      };

      console.log('Sending optimization data:', optimizationData);

      // Show initial progress notification
      const progressMsg = runComparison
        ? 'Starting algorithm comparison...'
        : `Starting optimization with ${algorithm} algorithm...`;
      notify(progressMsg, 'info', { autoClose: 3000 });

      // Simulate progress for comparison mode
      let progressInterval;
      if (runComparison) {
        const algorithms = ['Clarke-Wright', 'Enhanced Clarke-Wright', 'Nearest Neighbor', 'Genetic Algorithm', 'Tabu Search', 'Simulated Annealing', 'Ant Colony'];
        let currentAlgoIndex = 0;

        progressInterval = setInterval(() => {
          if (currentAlgoIndex < algorithms.length) {
            setCurrentAlgorithm(algorithms[currentAlgoIndex]);
            setComparisonProgress(Math.round(((currentAlgoIndex + 1) / algorithms.length) * 100));
            currentAlgoIndex++;
          }
        }, 800); // Update every 800ms to simulate algorithm switching
      }

      const response = await OptimizationService.create(optimizationData);

      // Clear progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
        setComparisonProgress(100);
        setCurrentAlgorithm('Finalizing results...');
      }

      // persist default algorithm if different and not running comparison
      if (!runComparison) {
        try {
          if (currentUser && currentUser?.preferences?.defaultAlgorithm !== algorithm) {
            await updateUserPreferences({ defaultAlgorithm: algorithm });
          }
        } catch (prefErr) {
          console.warn('Failed to update user preferences:', prefErr);
        }
      }

      const successMessage = runComparison
        ? `Algorithm comparison completed! Best result selected from ${response.algorithmResults?.length || 0} algorithms.`
        : 'Route optimization completed successfully!';

      notify(successMessage, 'success', { autoClose: 5000 });
      navigate(`/optimizations/${response._id}`);
    } catch (err) {
      console.error('Optimization error:', err);

      let errorMsg = 'Optimization failed. Please try again.';
      let shouldRetry = false;

      if (err.response) {
        // Server responded with error
        const status = err.response.status;
        const serverMsg = err.response.data?.msg;

        switch (status) {
          case 400:
            errorMsg = serverMsg || 'Invalid input data. Please check your selections and try again.';
            break;
          case 401:
            errorMsg = 'Authentication required. Please log in again.';
            // Redirect to login after a delay
            setTimeout(() => navigate('/login'), 2000);
            break;
          case 403:
            errorMsg = 'Access denied. You may not have permission to perform this action.';
            break;
          case 404:
            errorMsg = 'Service not found. Please check your connection.';
            shouldRetry = true;
            break;
          case 429:
            errorMsg = 'Too many requests. Please wait a moment and try again.';
            shouldRetry = true;
            break;
          case 500:
            errorMsg = 'Server error occurred. Our team has been notified.';
            shouldRetry = true;
            break;
          case 502:
          case 503:
          case 504:
            errorMsg = 'Service temporarily unavailable. Please try again in a few moments.';
            shouldRetry = true;
            break;
          default:
            errorMsg = serverMsg || `Request failed with status ${status}`;
        }
      } else if (err.request) {
        // Network error
        errorMsg = 'Network error. Please check your internet connection and try again.';
        shouldRetry = true;
      } else {
        // Other error
        errorMsg = err.message || 'An unexpected error occurred.';
      }

      setError(errorMsg);
      notify(errorMsg, 'error', { autoClose: shouldRetry ? 10000 : 8000 });

      // If it's a retryable error, suggest retrying
      if (shouldRetry) {
        setTimeout(() => {
          notify('You can try again now.', 'info', { autoClose: 5000 });
        }, 3000);
      }
    } finally {
      setOptimizing(false);
      setComparisonProgress(0);
      setCurrentAlgorithm('');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="new-optimization-container container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1>New Optimization</h1>
        <div className="help-tooltip">
          <button
            className="help-button"
            onClick={() => notify(
              'Keyboard shortcuts:\n• Ctrl+A: Select/Deselect all locations\n• Enter: Next step\n• Escape: Previous step',
              'info',
              { autoClose: 8000 }
            )}
            title="Show keyboard shortcuts"
          >
            ❓
          </button>
        </div>
      </div>
      
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
                  className="btn btn-primary rounded-lg px-4 py-2"
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
            <div className="flex justify-between items-center mb-4">
              <h2>Select Locations</h2>
              <div className="location-stats">
                <span className="text-sm text-gray-600">
                  {selectedLocations.length} of {locations.length} selected
                </span>
              </div>
            </div>
            {locations.length === 0 ? (
              <div className="no-data">
                <p>No locations found. Please add locations first.</p>
                <button
                  className="btn btn-primary rounded-lg px-4 py-2"
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
                        <th>
                          <input
                            type="checkbox"
                            checked={selectAllLocations}
                            onChange={handleSelectAllLocations}
                          />
                        </th>
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
                <label>
                  <input
                    type="checkbox"
                    checked={runComparison}
                    onChange={(e) => setRunComparison(e.target.checked)}
                  />
                  Run Algorithm Comparison (Compare all algorithms)
                </label>
                <p className="help-text">
                  {runComparison
                    ? "All algorithms will be compared and the best result will be selected automatically."
                    : "Select a specific algorithm to use for optimization."
                  }
                </p>
              </div>

              {!runComparison && (
                <div className="form-group">
                  <label htmlFor="algorithm">Algorithm</label>
                  <select id="algorithm" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
                    <option value="clarke-wright">Clarke-Wright (Savings)</option>
                    <option value="enhanced-clarke-wright">Enhanced Clarke-Wright</option>
                    <option value="nearest-neighbor">Nearest Neighbor</option>
                    <option value="genetic">Genetic Algorithm</option>
                    <option value="tabu-search">Tabu Search</option>
                    <option value="simulated-annealing">Simulated Annealing</option>
                    <option value="ant-colony">Ant Colony Optimization</option>
                    <option value="or-tools">Google OR-Tools (Advanced)</option>
                  </select>
                </div>
              )}
              
              <div className="summary-section">
                <h3>Selected Vehicles ({selectedVehicles.length})</h3>
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Vehicle Capacity:</span>
                    <span className="stat-value">
                      {vehicles && vehicles
                        .filter(v => selectedVehicles.includes(v._id))
                        .reduce((total, v) => total + ((v.capacity || 0) * (v.count || 1)), 0)} units
                    </span>
                  </div>
                </div>
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
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Location Demand:</span>
                    <span className="stat-value">
                      {locations && locations
                        .filter(l => selectedLocations.includes(l._id))
                        .reduce((total, l) => total + (l.demand || 0), 0)} units
                    </span>
                  </div>
                </div>
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
          <button className="btn btn-secondary rounded-lg px-4 py-2" onClick={handlePrevStep}>
            Previous
          </button>
        )}
        
        {step < 3 ? (
          <button className="btn btn-primary rounded-lg px-4 py-2" onClick={handleNextStep}>
            Next
          </button>
        ) : (
          <div className="optimization-controls">
            {optimizing && runComparison && (
              <div className="comparison-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${comparisonProgress}%` }}
                  ></div>
                </div>
                <p className="progress-text">
                  {currentAlgorithm ? `Running ${currentAlgorithm}...` : 'Initializing comparison...'}
                  ({comparisonProgress}%)
                </p>
              </div>
            )}
            <button
              className="btn btn-success rounded-lg px-4 py-2"
              onClick={handleOptimize}
              disabled={optimizing}
            >
              {optimizing
                ? (runComparison ? 'Comparing Algorithms...' : 'Optimizing...')
                : (runComparison ? 'Run Algorithm Comparison' : 'Run Optimization')
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewOptimization;