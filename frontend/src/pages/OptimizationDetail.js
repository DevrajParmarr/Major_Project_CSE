import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import OptimizationService from '../services/optimization.service';
import Map from '../components/Map';
import '../styles/OptimizationDetail.css';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../context/AuthContext';

const OptimizationDetail = () => {
  const { id } = useParams();
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('routes');
  const { notify } = useToast();
  const { currentUser } = useAuth();
  const [useRoadNetwork, setUseRoadNetwork] = useState(false);
  const [routedPolylines, setRoutedPolylines] = useState({});

  useEffect(() => {
    fetchOptimization();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (useRoadNetwork && optimization?.routes) {
      // fetch polylines per route
      (async () => {
        const map = {};
        for (let i = 0; i < optimization.routes.length; i++) {
          try {
            const data = await OptimizationService.getRoutedPolyline(id, i);
            map[i] = data.geometry;
          } catch (e) {
            notify('Failed to fetch routed polyline', 'error');
          }
        }
        setRoutedPolylines(map);
      })();
    }
  }, [useRoadNetwork, optimization, id, notify]);

  useEffect(() => {
    if (currentUser?.preferences?.preferRoadNetwork) {
      setUseRoadNetwork(true);
    }
  }, [currentUser]);

  const fetchOptimization = async () => {
    try {
      setLoading(true);
      const response = await OptimizationService.get(id);
      setOptimization(response);
      setError('');
    } catch (err) {
      setError('Failed to load optimization details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!optimization) return;
    
    try {
      const dataStr = JSON.stringify(optimization, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `optimization-${optimization.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      notify('Optimization exported', 'success');
    } catch (e) {
      notify('Export failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="optimization-detail-container">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (!optimization) {
    return (
      <div className="optimization-detail-container">
        <div className="alert alert-danger">
          {error || 'Optimization not found'}
        </div>
        <Link to="/optimizations" className="btn btn-primary">
          Back to Optimizations
        </Link>
      </div>
    );
  }


return (
  <div className="optimization-detail-container">
    <div className="optimization-header">
      <div>
        <h1>{optimization.name}</h1>
        <p className="optimization-date">
          <i className="fas fa-calendar"></i>{' '}
          {new Date(optimization.date).toLocaleDateString()}
        </p>
      </div>
      <div className="optimization-actions">
        <button className="btn btn-secondary" onClick={handleExport}>
          <i className="fas fa-download"></i> Export JSON
        </button>
        <Link to="/optimizations" className="btn btn-primary">
          Back to List
        </Link>
      </div>
    </div>

    <div className="optimization-summary">
      <div className="summary-card" data-aos="fade-up">
        <div className="summary-icon">
          <i className="fas fa-route"></i>
        </div>
        <div className="summary-content">
          <h3>Routes</h3>
          <p className="summary-value">{optimization.routes.length}</p>
        </div>
      </div>
      <div className="summary-card" data-aos="fade-up" data-aos-delay="100">
        <div className="summary-icon">
          <i className="fas fa-road"></i>
        </div>
        <div className="summary-content">
          <h3>Total Distance</h3>
          <p className="summary-value">
            {useRoadNetwork && routedPolylines && Object.keys(routedPolylines).length > 0
              ? `${optimization.routes.reduce((sum, _, idx) => sum + (((routedPolylines[idx]?.distanceKm) || 0)), 0).toFixed(2)} km`
              : `${Number(optimization?.totalDistance ?? 0).toFixed(2)} km`}
          </p>
        </div>
      </div>
    </div>

    <div className="map-wrapper" data-aos="fade-up">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={useRoadNetwork} onChange={() => setUseRoadNetwork(v => !v)} />
          <span>Use road network (beta)</span>
        </label>
      </div>
      <Map
        locations={optimization.routes.flatMap(route => 
          route.stops.map(stop => ({
            _id: stop.locationId,
            name: stop.locationName,
            latitude: stop.latitude,
            longitude: stop.longitude,
            demand: stop.demand,
            isDepot: stop.order === 0 || stop.order === (route.stops.length - 1)
          }))
        )}
        routes={optimization.routes}
        vehicles={optimization.vehicles || []}
        useRoadNetwork={useRoadNetwork}
        routedPolylines={routedPolylines}
      />
    </div>

    <div className="optimization-tabs" data-aos="fade-up">
      <div className="tabs-header">
        <button
          className={`tab-button ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          Routes
        </button>
        <button
          className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
      </div>
      
      <div className="tabs-content">
        {activeTab === 'routes' && (
          <div className="routes-tab">
            {optimization.routes && optimization.routes.map((route, index) => (
              <div key={index} className="route-card">
                <h3>Route {index + 1} - {route.vehicleName}</h3>
                <div className="chips">
                  <span className="chip"><i className="fa fa-road"></i>{Number((route.distance ?? route.totalDistance) ?? 0).toFixed(2)} km</span>
                  <span className="chip"><i className="fa fa-clock"></i>{route.duration ? `${Math.floor(route.duration / 60)} min` : 'N/A'}</span>
                </div>
                <p>
                  <strong>Total Distance:</strong> {Number((route.distance ?? route.totalDistance) ?? 0).toFixed(2)} km
                </p>
                <p>
                  <strong>Total Capacity:</strong> {route.totalCapacity}
                </p>
                <div className="route-stops">
                  <h4>Stops</h4>
                  <ol className="stops-list">
                    {route.stops.map((stop, stopIndex) => (
                      <li key={stopIndex}>
                        <span>{stop.locationName}</span>
                        <span>
                          {stop.demand > 0 && <span className="chip stop-chip">Demand: {stop.demand}</span>}
                          {stopIndex === 0 || stopIndex === route.stops.length - 1 ? (
                            <span className="badge stop-chip">Depot</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'details' && (
          <div className="details-tab">
            <div className="details-section">
              <h3>Optimization Details</h3>
              <table className="details-table">
                <tbody>
                  <tr>
                    <td>Name</td>
                    <td>{optimization.name}</td>
                  </tr>
                  <tr>
                    <td>Date</td>
                    <td>{new Date(optimization.date).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Total Routes</td>
                    <td>{optimization.routes.length}</td>
                  </tr>
                  <tr>
                    <td>Total Distance</td>
                    <td>{Number(optimization?.totalDistance ?? 0).toFixed(2)} km</td>
                  </tr>
                  <tr>
                    <td>Total Stops</td>
                    <td>
                      {optimization.routes.reduce(
                        (total, route) => total + route.stops.length,
                        0
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default OptimizationDetail;