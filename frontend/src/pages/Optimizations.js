import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OptimizationService from '../services/optimization.service';
import '../styles/Optimizations.css';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../components/ToastProvider';

const Optimizations = () => {
  const [optimizations, setOptimizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { notify } = useToast();

  useEffect(() => {
    fetchOptimizations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOptimizations = async () => {
    try {
      setLoading(true);
      const response = await OptimizationService.getAll();
      setOptimizations(response);
      setError('');
    } catch (err) {
      setError('Failed to load optimizations');
      notify('Failed to load optimizations', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this optimization?')) {
      try {
        await OptimizationService.remove(id);
        setOptimizations(optimizations ? optimizations.filter(opt => opt._id !== id) : []);
        setError('');
        notify('Optimization deleted', 'success');
      } catch (err) {
        setError('Failed to delete optimization');
        notify('Failed to delete optimization', 'error');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="optimizations-container">
        <div className="optimizations-header">
          <h1>Optimizations</h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px,1fr))', gap: '1rem' }}>
          <LoadingSkeleton lines={4} />
          <LoadingSkeleton lines={4} />
          <LoadingSkeleton lines={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="optimizations-container">
      <div className="optimizations-header">
        <h1>Optimizations</h1>
        <Link to="/optimizations/new" className="btn btn-primary">
          <i className="fas fa-plus"></i> New Optimization
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {!optimizations || optimizations.length === 0 ? (
        <div className="no-data">
          <p>No optimizations found. Create your first optimization!</p>
        </div>
      ) : (
        <div className="optimizations-grid">
          {optimizations && optimizations.length > 0 && optimizations.map(optimization => (
            <div key={optimization._id} className="optimization-card">
              <h3>{optimization.name}</h3>
              <div className="optimization-details">
                <p>
                  <i className="fas fa-calendar"></i>{' '}
                  {new Date(optimization.date).toLocaleDateString()}
                </p>
                <p>
                  <i className="fas fa-route"></i> Routes: {optimization.routes ? optimization.routes.length : 0}
                </p>
                <p>
                  <i className="fas fa-road"></i> Total Distance: {Number(optimization?.totalDistance ?? 0).toFixed(2)} km
                </p>
              </div>
              <div className="optimization-actions">
                <Link to={`/optimizations/${optimization._id}`} className="btn btn-secondary">
                  View Details
                </Link>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(optimization._id)}
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Optimizations;