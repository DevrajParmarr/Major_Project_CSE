import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaTruck, 
  FaMapMarkedAlt, 
  FaRoute, 
  FaChartLine, 
  FaRocket, 
  FaUsers, 
  FaGlobe,
  FaArrowRight,
  FaPlay,
  FaStar,
  FaBrain,
  FaShieldAlt,
  FaBolt,
  FaNetworkWired,
  FaMobile
} from 'react-icons/fa';

// Interactive Route Optimization Demo Component
const RouteOptimizationDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalDistance: 0,
    computationTime: 0,
    efficiency: 0,
    vehiclesUsed: 0
  });
  const [algorithmProgress, setAlgorithmProgress] = useState(0);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('clarke-wright');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [randomLocations, setRandomLocations] = useState([]);

  const algorithms = useMemo(() => ({
    'clarke-wright': {
      name: 'Clarke-Wright Savings',
      color: '#3b82f6',
      description: 'Classic savings-based algorithm'
    },
    'nearest-neighbor': {
      name: 'Nearest Neighbor',
      color: '#10b981',
      description: 'Greedy constructive heuristic'
    }
  }), []);

  const demoSteps = useMemo(() => [
    {
      name: 'Initial Setup',
      description: '8 delivery locations with varying demand scattered across the map',
      metrics: { totalDistance: 0, computationTime: 0, efficiency: 0, vehiclesUsed: 0 },
      algorithmSpecific: {
        'clarke-wright': 'Random initial routes connecting depot to each location',
        'tabu-search': 'Using Clarke-Wright as initial solution',
        'simulated-annealing': 'High-temperature random solution'
      }
    },
    {
      name: `${algorithms[selectedAlgorithm].name} Algorithm`,
      description: algorithms[selectedAlgorithm].description,
      metrics: {
        'clarke-wright': { totalDistance: 245.8, computationTime: 0.23, efficiency: 45, vehiclesUsed: 3 },
        'nearest-neighbor': { totalDistance: 287.4, computationTime: 0.15, efficiency: 32, vehiclesUsed: 3 }
      }[selectedAlgorithm],
      algorithmSpecific: {
        'clarke-wright': 'Computing savings matrix and merging routes with highest savings first',
        'nearest-neighbor': 'Constructing routes by always visiting the nearest unvisited location'
      }
    },
    {
      name: 'Local Search Refinement',
      description: 'Applying 2-opt and 3-opt moves to improve route efficiency',
      metrics: {
        'clarke-wright': { totalDistance: 198.4, computationTime: 0.45, efficiency: 68, vehiclesUsed: 2 },
        'nearest-neighbor': { totalDistance: 234.6, computationTime: 0.32, efficiency: 52, vehiclesUsed: 2 }
      }[selectedAlgorithm],
      algorithmSpecific: {
        'clarke-wright': '2-opt and 3-opt local search improvements',
        'nearest-neighbor': 'Route improvement through local neighborhood search'
      }
    },
    {
      name: 'Optimization Complete',
      description: `Final optimized routes with ${{
        'clarke-wright': '68%',
        'nearest-neighbor': '52%'
      }[selectedAlgorithm]} distance reduction and balanced workload`,
      metrics: {
        'clarke-wright': { totalDistance: 156.2, computationTime: 0.67, efficiency: 89, vehiclesUsed: 2 },
        'nearest-neighbor': { totalDistance: 187.3, computationTime: 0.48, efficiency: 71, vehiclesUsed: 2 }
      }[selectedAlgorithm],
      algorithmSpecific: {
        'clarke-wright': 'Clarke-Wright algorithm completed with local search',
        'nearest-neighbor': 'Nearest Neighbor algorithm completed with improvements'
      }
    }
  ], [selectedAlgorithm, algorithms]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          const nextStep = (prev + 1) % demoSteps.length;
          setPerformanceMetrics(demoSteps[nextStep].metrics);
          if (nextStep === 1) setAlgorithmProgress(25);
          else if (nextStep === 2) setAlgorithmProgress(65);
          else if (nextStep === 3) setAlgorithmProgress(100);
          return nextStep;
        });
      }, 3500 / animationSpeed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, demoSteps, animationSpeed]);

  const startDemo = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setPerformanceMetrics(demoSteps[0].metrics);
    setAlgorithmProgress(0);
  };

  const stopDemo = () => {
    setIsPlaying(false);
  };

  // Generate random locations for demo
  const generateRandomLocations = () => {
    const locations = [];

    for (let i = 0; i < 8; i++) {
      locations.push({
        x: `${50 + Math.random() * 40}%`,
        y: `${30 + Math.random() * 40}%`,
        name: String.fromCharCode(65 + i), // A, B, C, etc.
        demand: Math.floor(Math.random() * 50) + 10, // Random demand 10-60
        color: `bg-${['red', 'blue', 'green', 'purple', 'pink', 'indigo', 'teal', 'yellow'][i % 8]}-500`
      });
    }
    return locations;
  };

  // Initialize random locations on component mount
  useEffect(() => {
    setRandomLocations(generateRandomLocations());
  }, []);

  const resetDemo = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setPerformanceMetrics(demoSteps[0].metrics);
    setAlgorithmProgress(0);
  };

  const nextStep = () => {
    setCurrentStep(prev => {
      const next = (prev + 1) % demoSteps.length;
      setPerformanceMetrics(demoSteps[next].metrics);
      if (next === 1) setAlgorithmProgress(25);
      else if (next === 2) setAlgorithmProgress(65);
      else if (next === 3) setAlgorithmProgress(100);
      return next;
    });
  };

  const prevStep = () => {
    setCurrentStep(prev => {
      const next = prev === 0 ? demoSteps.length - 1 : prev - 1;
      setPerformanceMetrics(demoSteps[next].metrics);
      if (next === 0) setAlgorithmProgress(0);
      else if (next === 1) setAlgorithmProgress(25);
      else if (next === 2) setAlgorithmProgress(65);
      return next;
    });
  };

  return (
    <div className="route-demo-section bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            See Route Optimization in Action
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Watch our AI algorithm transform scattered locations into perfectly optimized delivery routes
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Demo Visualization */}
          <div className="demo-visualization">
            <div className="relative bg-slate-800 rounded-2xl p-8 border border-blue-500/30">
              <div className="demo-canvas bg-slate-900 rounded-xl h-96 relative overflow-hidden">
                {/* Algorithm Progress Bar */}
                <div className="absolute top-4 left-4 right-4 z-20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-blue-300 font-medium">Algorithm Progress</span>
                    <span className="text-xs text-blue-300">{algorithmProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${algorithmProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Performance Metrics Overlay */}
                <div className="absolute top-16 right-4 z-20 bg-slate-800/90 rounded-lg p-3 min-w-32">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Distance:</span>
                      <span className="text-xs text-green-400 font-mono">{performanceMetrics.totalDistance.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Time:</span>
                      <span className="text-xs text-blue-400 font-mono">{performanceMetrics.computationTime.toFixed(2)}s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Efficiency:</span>
                      <span className="text-xs text-purple-400 font-mono">{performanceMetrics.efficiency}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Vehicles:</span>
                      <span className="text-xs text-orange-400 font-mono">{performanceMetrics.vehiclesUsed}</span>
                    </div>
                  </div>
                </div>

                {/* Animated Route Demo */}
                <div className="absolute inset-0 flex items-center justify-center pt-20">
                  <div className="demo-map relative w-full h-full">
                    {/* Depot */}
                    <div className="absolute top-8 left-8 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-orange-300 animate-pulse">
                      🏭
                    </div>

                    {/* Random Locations with Enhanced Styling */}
                    {randomLocations.map((location, index) => (
                      <div
                        key={index}
                        className={`absolute w-5 h-5 ${location.color} rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-1000 shadow-lg border-2 border-white/50 ${
                          currentStep >= 1 ? 'animate-pulse scale-110' : ''
                        }`}
                        style={{ left: location.x, top: location.y }}
                      >
                        {location.name}
                      </div>
                    ))}

                    {/* Algorithm-Specific Route Visualization */}
                    {currentStep >= 2 && (
                      <>
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          <defs>
                            <marker id={`arrowhead-${selectedAlgorithm}`} markerWidth="10" markerHeight="7"
                             refX="9" refY="3.5" orient="auto">
                              <polygon points="0 0, 10 3.5, 0 7" fill={algorithms[selectedAlgorithm].color} />
                            </marker>
                          </defs>

                          {/* Dynamic Route Visualization Based on Algorithm */}
                          {selectedAlgorithm === 'clarke-wright' && (
                            <>
                              {/* Clarke-Wright: Savings-based merging */}
                              <line x1="48" y1="48" x2="15%" y2="25%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="15%" y1="25%" x2="45%" y2="35%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '0.3s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="45%" y1="35%" x2="70%" y2="15%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '0.6s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="70%" y1="15%" x2="85%" y2="45%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '0.9s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="85%" y1="45%" x2="48" y2="48" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '1.2s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />

                              <line x1="48" y1="48" x2="25%" y2="65%" stroke="#10b981" strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '1.5s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="25%" y1="65%" x2="35%" y2="85%" stroke="#10b981" strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '1.8s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="35%" y1="85%" x2="60%" y2="80%" stroke="#10b981" strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '2.1s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="60%" y1="80%" x2="80%" y2="70%" stroke="#10b981" strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '2.4s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="80%" y1="70%" x2="48" y2="48" stroke="#10b981" strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '2.7s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                            </>
                          )}

                          {selectedAlgorithm === 'tabu-search' && (
                            <>
                              {/* Tabu Search: More complex optimization path */}
                              <line x1="48" y1="48" x2="15%" y2="25%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="15%" y1="25%" x2="45%" y2="35%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '0.2s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="45%" y1="35%" x2="70%" y2="15%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '0.4s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="70%" y1="15%" x2="85%" y2="45%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '0.6s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="85%" y1="45%" x2="80%" y2="70%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '0.8s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="80%" y1="70%" x2="60%" y2="80%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '1.0s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="60%" y1="80%" x2="35%" y2="85%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '1.2s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="35%" y1="85%" x2="25%" y2="65%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '1.4s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="25%" y1="65%" x2="48" y2="48" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '1.6s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                            </>
                          )}

                          {selectedAlgorithm === 'simulated-annealing' && (
                            <>
                              {/* Simulated Annealing: Probabilistic optimization */}
                              <line x1="48" y1="48" x2="15%" y2="25%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="15%" y1="25%" x2="45%" y2="35%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '0.3s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="45%" y1="35%" x2="70%" y2="15%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '0.6s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="70%" y1="15%" x2="85%" y2="45%" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '0.9s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />
                              <line x1="85%" y1="45%" x2="48" y2="48" stroke={algorithms[selectedAlgorithm].color} strokeWidth="4" className="animate-draw-line" style={{ animationDelay: '1.2s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} />

                              {/* Additional connections for better optimization */}
                              <line x1="48" y1="48" x2="80%" y2="70%" stroke="#ef4444" strokeWidth="3" className="animate-draw-line" style={{ animationDelay: '1.5s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} opacity="0.7" />
                              <line x1="80%" y1="70%" x2="60%" y2="80%" stroke="#ef4444" strokeWidth="3" className="animate-draw-line" style={{ animationDelay: '1.8s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} opacity="0.7" />
                              <line x1="60%" y1="80%" x2="35%" y2="85%" stroke="#ef4444" strokeWidth="3" className="animate-draw-line" style={{ animationDelay: '2.1s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} opacity="0.7" />
                              <line x1="35%" y1="85%" x2="25%" y2="65%" stroke="#ef4444" strokeWidth="3" className="animate-draw-line" style={{ animationDelay: '2.4s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} opacity="0.7" />
                              <line x1="25%" y1="65%" x2="48" y2="48" stroke="#ef4444" strokeWidth="3" className="animate-draw-line" style={{ animationDelay: '2.7s' }} markerEnd={`url(#arrowhead-${selectedAlgorithm})`} opacity="0.7" />
                            </>
                          )}
                        </svg>
                      </>
                    )}

                    {/* Enhanced Vehicles with Better Animation */}
                    {currentStep >= 3 && (
                      <>
                        <div className="absolute top-8 left-8 w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-sm animate-bounce shadow-lg border-2 border-green-300">
                          🚛
                        </div>
                        <div className="absolute top-16 left-24 w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm animate-bounce shadow-lg border-2 border-purple-300" style={{ animationDelay: '0.5s' }}>
                          🚚
                        </div>
                      </>
                    )}

                    {/* Enhanced Optimization Status */}
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-800/95 backdrop-blur-sm rounded-lg p-4 border border-slate-600/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-blue-300">
                          {demoSteps[currentStep].name}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          currentStep === 0 ? 'bg-gray-600 text-gray-300' :
                          currentStep === 1 ? 'bg-blue-600 text-blue-100' :
                          currentStep === 2 ? 'bg-purple-600 text-purple-100' :
                          'bg-green-600 text-green-100'
                        }`}>
                          Step {currentStep + 1}/4
                        </div>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        {demoSteps[currentStep].description}
                      </div>
                    </div>
              </div>
            </div>
          </div>

              {/* Enhanced Interactive Demo Controls */}
              <div className="mt-8 space-y-6">
                {/* Algorithm Selection and Controls */}
                <div className="flex justify-center gap-4">
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-600/30">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3 text-center">Select Algorithm</h4>
                    <div className="flex gap-2">
                      {Object.entries(algorithms).map(([key, algo]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedAlgorithm(key)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                            selectedAlgorithm === key
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                          }`}
                          style={{
                            border: selectedAlgorithm === key ? `2px solid ${algo.color}` : 'none'
                          }}
                        >
                          {algo.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-600/30">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3 text-center">Demo Controls</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRandomLocations(generateRandomLocations())}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        🔄 New Points
                      </button>
                    </div>
                  </div>
                </div>

                {/* Control Panel */}
                <div className="flex justify-center">
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      {/* Previous Step */}
                      <button
                        onClick={prevStep}
                        disabled={isPlaying}
                        className="p-3 bg-slate-700/50 hover:bg-slate-600/50 disabled:bg-slate-800/50 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                      >
                        <FaPlay className="text-slate-300 rotate-180" />
                      </button>

                      {/* Play/Pause */}
                      <button
                        onClick={isPlaying ? stopDemo : startDemo}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        {isPlaying ? (
                          <><FaPlay className="inline mr-2 rotate-180" /> Pause</>
                        ) : (
                          <><FaPlay className="inline mr-2" /> {currentStep === 0 ? 'Start Demo' : 'Resume'}</>
                        )}
                      </button>

                      {/* Next Step */}
                      <button
                        onClick={nextStep}
                        disabled={isPlaying}
                        className="p-3 bg-slate-700/50 hover:bg-slate-600/50 disabled:bg-slate-800/50 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                      >
                        <FaPlay className="text-slate-300" />
                      </button>

                      {/* Reset */}
                      <button
                        onClick={resetDemo}
                        className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg font-medium transition-all duration-300"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Speed Control */}
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-sm text-slate-400">Speed:</span>
                      <div className="flex gap-2">
                        {[0.5, 1, 1.5, 2].map(speed => (
                          <button
                            key={speed}
                            onClick={() => setAnimationSpeed(speed)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-all duration-300 ${
                              animationSpeed === speed
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Advanced Metrics Toggle */}
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                        className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-sm font-medium transition-all duration-300"
                      >
                        {showAdvancedMetrics ? 'Hide' : 'Show'} Advanced Metrics
                      </button>
                    </div>
                  </div>
                </div>

                {/* Advanced Metrics Panel */}
                {showAdvancedMetrics && (
                  <div className="flex justify-center">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30 max-w-md">
                      <h4 className="text-sm font-semibold text-slate-300 mb-4 text-center">Advanced Performance Metrics</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-400">
                            {((demoSteps[currentStep].metrics?.efficiency || 0) / 100 * (demoSteps[currentStep].metrics?.totalDistance || 0)).toFixed(1)}%
                          </div>
                          <div className="text-slate-400">Route Efficiency</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-400">
                            {demoSteps[currentStep].metrics?.computationTime || 0}s
                          </div>
                          <div className="text-slate-400">Computation Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-400">
                            {demoSteps[currentStep].metrics?.vehiclesUsed || 0}
                          </div>
                          <div className="text-slate-400">Vehicles Used</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-400">
                            {currentStep === 0 ? 0 : Math.round((demoSteps[0].metrics?.totalDistance - demoSteps[currentStep].metrics?.totalDistance) / demoSteps[0].metrics?.totalDistance * 100)}%
                          </div>
                          <div className="text-slate-400">Improvement</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>

          {/* Demo Information */}
          <div className="demo-info">
            <div className="space-y-8">
              <div className="demo-feature">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <FaBrain className="text-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold">AI-Powered Optimization</h3>
                </div>
                <p className="text-blue-200 leading-relaxed">
                  Our advanced algorithms analyze multiple factors including distance, traffic, vehicle capacity, and delivery windows to create the most efficient routes.
                </p>
              </div>

              <div className="demo-feature">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                    <FaRoute className="text-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold">Real-Time Updates</h3>
                </div>
                <p className="text-blue-200 leading-relaxed">
                  Routes are continuously optimized based on real-time data, ensuring your deliveries are always on the most efficient path.
                </p>
              </div>

              <div className="demo-feature">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <FaTruck className="text-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold">Multi-Vehicle Support</h3>
                </div>
                <p className="text-blue-200 leading-relaxed">
                  Handle complex logistics with multiple vehicles, each with different capacities and constraints, all optimized simultaneously.
                </p>
              </div>
            </div>

            {/* Demo Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">25%</div>
                <div className="text-sm text-slate-400">Distance Saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">40%</div>
                <div className="text-sm text-slate-400">Time Reduced</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">30%</div>
                <div className="text-sm text-slate-400">Cost Reduction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
              </div>
  );
};

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <FaTruck className="text-4xl" />,
      title: "Fleet Management",
      description: "Easily manage your entire vehicle fleet with real-time tracking and optimization.",
      color: "from-blue-600 to-blue-700",
      details: "Track vehicle locations, monitor fuel consumption, and manage maintenance schedules all from one dashboard."
    },
    {
      icon: <FaMapMarkedAlt className="text-4xl" />,
      title: "Smart Location Tracking",
      description: "Advanced mapping with intelligent location clustering and demand analysis.",
      color: "from-slate-600 to-slate-700",
      details: "Automatically cluster nearby locations, analyze delivery patterns, and optimize pickup sequences."
    },
    {
      icon: <FaRoute className="text-4xl" />,
      title: "Comlex Route Optimization",
      description: "Machine learning algorithms that continuously improve route efficiency.",
      color: "from-green-600 to-green-700",
      details: "Our AI learns from historical data to predict traffic patterns and optimize routes in real-time."
    },
    {
      icon: <FaChartLine className="text-4xl" />,
      title: "Performance Analytics",
      description: "Comprehensive insights and reports to optimize your operations.",
      color: "from-orange-600 to-orange-700",
      details: "Detailed analytics on delivery times, fuel consumption, driver performance, and cost analysis."
    }
  ];

  const stats = [
    { label: "Distance Saved", value: "25%", suffix: "avg.", icon: "📉" },
    { label: "On-Time Deliveries", value: "98%", suffix: "", icon: "⏰" },
    { label: "Active Users", value: "10K+", suffix: "", icon: "👥" },
    { label: "Vehicles Optimized", value: "50K+", suffix: "", icon: "🚛" }
  ];

  const testimonials = [
    {
      quote: "This platform revolutionized our delivery operations. We're saving 30% on fuel costs and delivering 40% more packages on time.",
      author: "Sara Patel",
      role: "Operations Director",
      company: "Express Logistics Co.",
      rating: 5,
      avatar: "SJ"
    },
    {
      quote: "The AI optimization is incredibly accurate. We handle twice the volume without adding vehicles or drivers.",
      author: "Abhishek Singh",
      role: "Fleet Manager",
      company: "Urban Delivery Solutions",
      rating: 5,
      avatar: "MC"
    },
    {
      quote: "RouteOptimizer transformed our last-mile delivery. Customer satisfaction increased by 35% due to faster deliveries.",
      author: "Devraj Parmar ",
      role: "Customer Success Manager",
      company: "Dev Daily Logistics - Blue Dart",
      rating: 5,
      avatar: "ER"
    }
  ];

  const useCases = [
    {
      title: "Delhivery LTD",
      description: "Optimize last-mile deliveries for faster customer satisfaction",
      icon: "🛍️",
      gradient: "from-blue-600 to-blue-700",
      details: "Handle peak season demands, optimize delivery routes for more than 1000 locations, and reduce failed delivery attempts."
    },
    {
      title: "FedEx Services",
      description: "Plan technician routes to maximize daily appointments",
      icon: "🔧",
      gradient: "from-green-600 to-green-700",
      details: "Schedule our complex route with ease which eventually enhance our performance and save time and fuel."
    },
    {
      title: "Dev Logistics - BLue Dart",
      description: "Consolidate shipments with intelligent capacity planning",
      icon: "📦",
      gradient: "from-slate-600 to-slate-700",
      details: "Optimize warehouse operations, reduce transportation costs, and improve delivery reliability."
    }
  ];

  const technicalFeatures = [
    {
      icon: <FaNetworkWired />,
      title: "Real-Time Processing",
      description: "Handle thousands of location updates per second with sub-millisecond response times."
    },
    {
      icon: <FaShieldAlt />,
      title: "Enterprise Security",
      description: "Bank-level encryption, SOC 2 compliance, and role-based access control for your data."
    },
    {
                      icon: <FaBolt />,
      title: "High Performance",
      description: "Optimized algorithms that can process complex routing problems in under 100ms."
    },
    {
      icon: <FaMobile />,
      title: "Mobile First",
      description: "Responsive design that works perfectly on all devices, from phones to large displays."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className={`relative overflow-hidden pt-20 pb-32 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-slate-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{animationDelay: '-2s'}}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{animationDelay: '-4s'}}></div>
            </div>

        <div className="relative container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full px-6 py-3 mb-8 animate-fade-in-down border border-slate-200 dark:border-slate-600">
              <FaRocket className="text-blue-600" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                🚀 Now with AI-Powered Complex Route Optimization
              </span>
              </div>

            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-tight animate-fade-in-up">
              Optimize Your
              <span className="block text-blue-600 dark:text-blue-400">
                Delivery Routes
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Transform your logistics with intelligent route optimization. Save time, reduce costs, and deliver more with our AI-powered platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <Link 
                to="/register" 
                className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Start Free Trial
                <FaArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button className="group flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow border border-slate-200 dark:border-slate-600">
                  <FaPlay className="text-blue-600 ml-1" />
            </div>
                <span className="font-semibold">Watch Demo</span>
              </button>
              </div>

            {/* Trust Indicators */}
            <div className="mt-16 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Trusted by industry leaders</p>
              <div className="flex justify-center items-center gap-8 opacity-60">
                {['Blue Dart', 'FedEx', 'DHL','Delhivery LTD', 'Dev Daily Logistics','EcomExpress',].map((tech, index) => (
                  <div key={tech} className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {tech}
            </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <RouteOptimizationDemo />

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Built with cutting-edge technology to deliver exceptional results for your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="group animate-on-scroll"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="relative p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feature.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-100 dark:bg-slate-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="text-center animate-on-scroll"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-2">
                  {stat.value}
                  {stat.suffix && <span className="text-2xl opacity-80">{stat.suffix}</span>}
                  </div>
                <div className="text-slate-600 dark:text-slate-300 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Get started in minutes with our simple 4-step process
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Add Vehicles', description: 'Enter your vehicle details including capacity and type' },
              { step: 2, title: 'Add Locations', description: 'Add delivery locations with their demand using our interactive map' },
              { step: 3, title: 'Optimize Routes', description: 'Generate optimized routes with a single click' },
              { step: 4, title: 'Start Delivering', description: 'Follow the optimized routes and save time and fuel' }
            ].map((item, index) => (
              <div key={item.step} className="relative animate-on-scroll" style={{animationDelay: `${index * 0.4}s`}}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 relative z-20">
                    {item.step}
          </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>
        </div>
                
                {/* Connector Line - Properly positioned */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 transform -translate-y-1/2 z-10"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Built for Enterprise - 
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Enterprise-grade technology that scales with your business 
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {technicalFeatures.map((feature, index) => (
              <div 
                key={feature.title}
                className="text-center animate-on-scroll"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white mx-auto mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              What Our Customers Say
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Join thousands of satisfied customers who have transformed their operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-slate-700 p-8 rounded-2xl border border-slate-200 dark:border-slate-600 animate-on-scroll shadow-sm"
                style={{animationDelay: `${index * 0.2}s`}}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-lg text-slate-700 dark:text-slate-200 mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {testimonial.author}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Built For Your Use Case
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Tailored solutions for different industries and business needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div 
                key={useCase.title}
                className="group animate-on-scroll"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="bg-white dark:bg-slate-700 p-8 rounded-2xl border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                  <div className="text-4xl mb-4">{useCase.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    {useCase.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {useCase.description}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {useCase.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-700">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Optimize Your Routes?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses saving time and money with our route optimization platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Start Free Trial
              </Link>
              <Link 
                to="/login" 
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h3 className="text-2xl font-bold mb-4">RouteOptimizer</h3>
              <p className="text-slate-400 mb-6 max-w-md">
                Transform your logistics with AI-powered route optimization. Save time, reduce costs, and deliver more efficiently.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <FaGlobe />
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <FaUsers />
            </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/api" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} RouteOptimizer Team . All rights reserved.</p>
          </div>
        </div>
      </footer>
      {/* Developer Credits */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Developed with ❤️ by</h3>
            <div className="text-3xl font-bold text-blue-400 mb-6">Devraj Parmar</div>
            <p className="text-slate-300 mb-8">
              Full-stack developer passionate about creating innovative solutions for complex problems.
            </p>
            <div className="flex justify-center gap-6">
              <a 
                href="https://github.com/Devrajparmarr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
              <a 
                href="https://www.linkedin.com/in/devraj-parmar-459363187/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;