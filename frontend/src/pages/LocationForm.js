import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LocationService from '../services/location.service';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LocationSearch from '../components/LocationSearch';
import '../styles/Forms.css';

const LocationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

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

    // Initialize map
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([20, 0], 2);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      // Add click event to map
      mapInstanceRef.current.on('click', handleMapClick);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('click', handleMapClick);
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // Update marker when coordinates change
    if (mapInstanceRef.current && formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Remove existing marker
        if (markerRef.current) {
          markerRef.current.remove();
        }
        
        // Add new marker
        markerRef.current = L.marker([lat, lng])
          .addTo(mapInstanceRef.current)
          .bindPopup(formData.name || 'New Location');
        
        // Center map on marker
        mapInstanceRef.current.setView([lat, lng], 13);
      }
    }
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

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    
    // Update form data with clicked coordinates
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));

    // If no name is set, try to get address from coordinates
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

      {showSearch && (
        <div className="search-section">
          <LocationSearch 
            onLocationSelect={handleLocationSelect}
            map={mapInstanceRef.current}
          />
        </div>
      )}

      <div className="map-container" ref={mapRef}></div>
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