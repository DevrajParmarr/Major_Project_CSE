import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LocationService from '../services/location.service';
import Map from '../components/Map';
import '../styles/Locations.css';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../components/ToastProvider';

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { notify } = useToast();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await LocationService.getAll();
      setLocations(response || []);
      setError('');
    } catch (err) {
      setError('Failed to load locations');
      notify('Failed to load locations', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await LocationService.remove(id);
        setLocations(locations.filter(location => location._id !== id));
        setError('');
      } catch (err) {
        setError('Failed to delete location');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="locations-container">
        <div className="locations-header">
          <h1>Locations</h1>
          <Link to="/locations/add" className="btn btn-primary">
            <i className="fas fa-plus"></i> Add Location
          </Link>
        </div>
        <LoadingSkeleton lines={5} />
      </div>
    );
  }

  return (
    <div className="locations-container">
      <div className="locations-header">
        <h1>Locations</h1>
        <Link to="/locations/add" className="btn btn-primary">
          <i className="fas fa-plus"></i> Add Location
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {locations.length > 0 && (
        <div className="map-wrapper">
          <Map locations={locations} />
        </div>
      )}

      {locations.length === 0 ? (
        <div className="no-data">
          <p>No locations found. Add your first location!</p>
        </div>
      ) : (
        <div className="locations-list">
          <table className="locations-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Demand</th>
                <th>Depot</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations && locations.map(location => (
                <tr key={location._id}>
                  <td>{location.name}</td>
                  <td>{location.address || 'N/A'}</td>
                  <td>{Number(location?.latitude ?? 0).toFixed(6)}</td>
                  <td>{Number(location?.longitude ?? 0).toFixed(6)}</td>
                  <td>{location.demand || 0}</td>
                  <td>{location.isDepot ? 'Yes' : 'No'}</td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/locations/edit/${location._id}`} className="btn btn-secondary btn-sm">
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(location._id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Locations;