import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaTrophy, FaClock, FaRoute, FaChartBar, FaCalculator, FaBullseye } from 'react-icons/fa';
import OptimizationService from '../services/optimization.service';
import { useToast } from '../components/ToastProvider';
import '../styles/AlgorithmComparison.css';


const AlgorithmComparison = () => {
  const { id } = useParams();
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(0);
  const { notify } = useToast();

  useEffect(() => {
    const fetchOptimization = async () => {
      try {
        setLoading(true);
        const data = await OptimizationService.get(id);
        setOptimization(data);
        setError('');
      } catch (err) {
        console.error('Fetch optimization error:', err);
        const errorMsg = 'Failed to load optimization data';
        setError(errorMsg);
        notify(errorMsg, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOptimization();
    }
  }, [id, notify]);

  const formatDistance = (distance) => {
    const n = Number(distance ?? 0);
    if (!isFinite(n) || n <= 0) return '0 km';
    return `${n.toFixed(2)} km`;
  };

  const formatDuration = (duration) => {
    const mins = Math.floor(duration ?? 0);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatExecutionTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getBestAlgorithm = () => {
    if (!optimization?.algorithmResults) return null;

    const validResults = optimization.algorithmResults.filter(r => !r.error);

    if (validResults.length === 0) return null;

    // First, find the maximum coverage achieved
    const maxCoverage = Math.max(...validResults.map(r => r.coveragePercentage || 0));

    // Get all algorithms that achieve maximum coverage
    const maxCoverageResults = validResults.filter(r => (r.coveragePercentage || 0) === maxCoverage);

    if (maxCoverageResults.length === 0) return null;

    // Among those with maximum coverage, choose the one with minimum distance
    return maxCoverageResults.reduce((best, current) => {
      if ((current.totalDistance || Infinity) < (best.totalDistance || Infinity)) {
        return current;
      }
      return best;
    });
  };




  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-20 md:pb-8">
        <div className="container mx-auto px-6 py-8">
          <div className="loading-container">
            <div className="spinner-large"></div>
            <p>Loading algorithm comparison...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !optimization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-20 md:pb-8">
        <div className="container mx-auto px-6 py-8">
          <div className="error-container">
            <div className="error-icon">!</div>
            <p>{error || 'Optimization not found'}</p>
            <Link to="/optimizations" className="btn btn-primary">
              Back to Optimizations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const bestAlgorithm = getBestAlgorithm();
  const algorithmResults = optimization.algorithmResults || [];

  // If no algorithm results, show message
  if (algorithmResults.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-20 md:pb-8">
        <div className="container mx-auto px-6 py-8">
          <div className="comparison-header" data-aos="fade-up">
            <Link to={`/optimizations/${id}`} className="back-link">
              <FaArrowLeft /> Back to Optimization
            </Link>
            <div className="header-content">
              <h1>Algorithm Comparison</h1>
              <p className="optimization-name">{optimization.name}</p>
            </div>
          </div>

          <div className="no-comparison" data-aos="fade-up">
            <div className="no-data-icon">
              <FaChartBar />
            </div>
            <h2>No Algorithm Comparison Available</h2>
            <p>This optimization was created before algorithm comparison was implemented.</p>
            <p>Create a new optimization to see algorithm comparisons.</p>
            <Link to="/optimizations/new" className="btn btn-primary">
              Create New Optimization
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-20 md:pb-8">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="comparison-header" data-aos="fade-up">
          <Link to={`/optimizations/${id}`} className="back-link">
            <FaArrowLeft /> Back to Optimization
          </Link>
          <div className="header-content">
            <h1>Algorithm Comparison</h1>
            <p className="optimization-name">{optimization.name}</p>
            <div className="header-stats">
              <span>{optimization.vehicles?.length || 0} Vehicles</span>
              <span>{optimization.locations?.length || 0} Locations</span>
              <span>{algorithmResults.length} Algorithms Compared</span>
            </div>
          </div>
        </div>


        {/* Best Algorithm Banner */}
        {bestAlgorithm && (
          <div className="best-algorithm-banner" data-aos="fade-up">
            <div className="trophy-icon">
              <FaTrophy />
            </div>
            <div className="banner-content">
              <h3>Best Performing Algorithm</h3>
              <p className="algorithm-name">{bestAlgorithm.algorithm}</p>
              <div className="banner-metrics">
                <span>Coverage: {bestAlgorithm.coveragePercentage?.toFixed(1) || 0}%</span>
                <span>Distance: {formatDistance(bestAlgorithm.totalDistance)}</span>
                <span>Duration: {formatDuration(bestAlgorithm.totalDuration)}</span>
                <span>Time: {formatExecutionTime(bestAlgorithm.executionTime)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Comparison Table */}
        <div className="comparison-table-section" data-aos="fade-up">
          <h2>Algorithm Comparison</h2>
          <div className="comparison-table">
            <div className="table-header">
              <span>Algorithm</span>
              <span>Coverage</span>
              <span>Efficiency</span>
              <span>Distance</span>
              <span>Time</span>
              <span>Routes</span>
              <span>Utilization</span>
            </div>
            {algorithmResults.map((result, index) => (
              <div
                key={index}
                className={`table-row ${index === selectedAlgorithm ? 'selected' : ''} ${bestAlgorithm && result.algorithm === bestAlgorithm.algorithm ? 'best' : ''}`}
                onClick={() => setSelectedAlgorithm(index)}
              >
                <span className="algorithm-name">
                  {result.algorithm}
                  {bestAlgorithm && result.algorithm === bestAlgorithm.algorithm && (
                    <FaTrophy className="best-badge" />
                  )}
                </span>
                <span className="coverage">{result.coveragePercentage?.toFixed(1) || 0}%</span>
                <span className="efficiency">{result.totalLocationsServed || 0}/{result.totalLocations || 1}</span>
                <span className="distance">{formatDistance(result.totalDistance)}</span>
                <span className="time">{formatExecutionTime(result.executionTime)}</span>
                <span className="routes">{result.routes?.length || 0}</span>
                <span className="utilization">{result.vehicleUtilization?.toFixed(1) || 0}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Algorithm Details */}
        {algorithmResults[selectedAlgorithm] && (
          <div className="selected-algorithm-details" data-aos="fade-up">
            <h2>Route Details: {algorithmResults[selectedAlgorithm].algorithm}</h2>

            <div className="details-grid">
              {/* Routes Summary */}
              <div className="routes-summary">
                <h3>Routes Summary</h3>
                <div className="routes-list">
                  {algorithmResults[selectedAlgorithm].routes?.map((route, index) => (
                    <div key={index} className="route-item">
                      <div className="route-header">
                        <span className="vehicle-name">{route.vehicleName || `Vehicle ${index + 1}`}</span>
                        <span className="route-stats">
                          {route.stops?.length || 0} stops • {formatDistance(route.distance)} • {route.totalCapacity || 0} units
                        </span>
                      </div>
                      <div className="route-stops">
                        {route.stops?.map((stop, stopIndex) => (
                          <span key={stopIndex} className="stop-name">
                            {stop.locationName}
                            {stopIndex < (route.stops.length - 1) && ' → '}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="key-metrics">
                <h3>Key Metrics</h3>
                <div className="metrics-cards">
                  <div className="metric-card">
                    <FaBullseye />
                    <div className="metric-content">
                      <span className="metric-value">{algorithmResults[selectedAlgorithm].coveragePercentage?.toFixed(1) || 0}%</span>
                      <span className="metric-label">Coverage</span>
                    </div>
                  </div>
                  <div className="metric-card">
                    <FaRoute />
                    <div className="metric-content">
                      <span className="metric-value">{formatDistance(algorithmResults[selectedAlgorithm].totalDistance)}</span>
                      <span className="metric-label">Total Distance</span>
                    </div>
                  </div>
                  <div className="metric-card">
                    <FaClock />
                    <div className="metric-content">
                      <span className="metric-value">{formatExecutionTime(algorithmResults[selectedAlgorithm].executionTime)}</span>
                      <span className="metric-label">Execution Time</span>
                    </div>
                  </div>
                  <div className="metric-card">
                    <FaCalculator />
                    <div className="metric-content">
                      <span className="metric-value">{algorithmResults[selectedAlgorithm].vehicleUtilization?.toFixed(1) || 0}%</span>
                      <span className="metric-label">Utilization</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AlgorithmComparison;