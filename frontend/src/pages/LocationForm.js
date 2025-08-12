import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LocationService from '../services/location.service';
import Map from '../components/Map';
import '../styles/Forms.css';

const LocationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  // Map interactions are handled inside Map component; no ref needed

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    demand: '0',
    isDepot: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchLocation();
    }
  }, [id]);

  useEffect(() => {
    // no-op: Map component manages rendering.
  }, [formData.latitude, formData.longitude, formData.name]);

  const fetchLocation = async () => {
    try {
      setLoading(true);
      const response = await LocationService.get(id);
      const { name, address, latitude, longitude, demand, isDepot } = response;
      setFormData({
        name: name || '',
        address: address || '',
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        demand: (demand || 0).toString(),
        isDepot: isDepot || false
      });
    } catch (err) {
      setError('Failed to load location data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = ({ latitude, longitude }) => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
    if (!formData.name) {
      reverseGeocode(lat, lng);
    }
  };

  const reverseGeocode = async (lat, lng) => {
    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name;
        const name = address.split(',')[0];
        
        setFormData(prev => ({
          ...prev,
          name: name,
          address: address
        }));
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      // Don't show error to user as this is just a convenience feature
    } finally {
      setGeocoding(false);
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      name: location.name || prev.name,
      address: location.address || location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString()
    }));
    
    setShowSearch(false);
  };

  const onChange = e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const locationData = {
        name: formData.name,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        demand: parseInt(formData.demand),
        isDepot: formData.isDepot
      };

      if (isEditMode) {
        await LocationService.update(id, locationData);
      } else {
        await LocationService.create(locationData);
      }

      navigate('/locations');
    } catch (err) {
      setError('Failed to save location');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="form-container">
      <h1>{isEditMode ? 'Edit Location' : 'Add Location'}</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="location-options">
        <button
          type="button"
          className={`btn ${showSearch ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowSearch(!showSearch)}
        >
          <i className="fas fa-search"></i> Search Location
        </button>
        <span className="option-divider">or</span>
        <span className="option-text">Click on the map below</span>
      </div>

      <div className="map-container">
        <Map 
          onLocationSelect={showSearch ? handleLocationSelect : undefined}
          onMapClick={handleMapClick}
          center={formData.latitude && formData.longitude ? [Number(formData.latitude), Number(formData.longitude)] : [20, 0]}
          zoom={formData.latitude && formData.longitude ? 13 : 2}
          locations={formData.latitude && formData.longitude ? [{
            _id: 'current',
            name: formData.name || 'Selected Location',
            address: formData.address,
            latitude: Number(formData.latitude),
            longitude: Number(formData.longitude),
          }] : []}
        />
      </div>
      <p className="map-help">
        <i className="fas fa-info-circle"></i>
        Click on the map to set location coordinates. The location name and address will be automatically filled if available.
        {geocoding && <span className="geocoding-indicator"> <i className="fas fa-spinner fa-spin"></i> Getting address...</span>}
      </p>

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="name">Location Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={onChange}
            required
            placeholder="e.g., Warehouse A, Office Building, etc."
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={onChange}
            placeholder="Full address of the location"
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="latitude">Latitude *</label>
            <input
              type="text"
              id="latitude"
              name="latitude"
              value={formData.latitude}
              onChange={onChange}
              required
              placeholder="e.g., 40.7128"
              readOnly={showSearch}
            />
          </div>
          <div className="form-group">
            <label htmlFor="longitude">Longitude *</label>
            <input
              type="text"
              id="longitude"
              name="longitude"
              value={formData.longitude}
              onChange={onChange}
              required
              placeholder="e.g., -74.0060"
              readOnly={showSearch}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="demand">Demand</label>
          <input
            type="number"
            id="demand"
            name="demand"
            value={formData.demand}
            onChange={onChange}
            min="0"
            placeholder="e.g., 100"
          />
          <small className="form-help">Amount of goods to be delivered/picked up at this location</small>
        </div>
        
        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="isDepot"
            name="isDepot"
            checked={formData.isDepot}
            onChange={onChange}
          />
          <label htmlFor="isDepot">This is a depot (starting/ending point for vehicles)</label>
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/locations')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Location'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocationForm;