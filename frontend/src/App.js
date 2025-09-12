import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleForm from './pages/VehicleForm';
import Locations from './pages/Locations';
import LocationForm from './pages/LocationForm';
import Optimizations from './pages/Optimizations';
import NewOptimization from './pages/NewOptimization';
import OptimizationDetail from './pages/OptimizationDetail';
import AlgorithmComparison from './pages/AlgorithmComparison';
import Settings from './pages/Settings';
import RouteSheet from './pages/RouteSheet';
import './App.css';
import { ToastProvider } from './components/ToastProvider';
import BottomNav from './components/BottomNav';

function App() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('reveal-visible');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <ToastProvider>
            <div className="app">
              <Navbar />
              <BottomNav />
              <div className="container">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  <Route path="/dashboard" element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/vehicles" element={
                    <PrivateRoute>
                      <Vehicles />
                    </PrivateRoute>
                  } />
                  <Route path="/vehicles/add" element={
                    <PrivateRoute>
                      <VehicleForm />
                    </PrivateRoute>
                  } />
                  <Route path="/vehicles/edit/:id" element={
                    <PrivateRoute>
                      <VehicleForm />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/locations" element={
                    <PrivateRoute>
                      <Locations />
                    </PrivateRoute>
                  } />
                  <Route path="/locations/add" element={
                    <PrivateRoute>
                      <LocationForm />
                    </PrivateRoute>
                  } />
                  <Route path="/locations/edit/:id" element={
                    <PrivateRoute>
                      <LocationForm />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/optimizations" element={
                    <PrivateRoute>
                      <Optimizations />
                    </PrivateRoute>
                  } />
                  <Route path="/optimizations/new" element={
                    <PrivateRoute>
                      <NewOptimization />
                    </PrivateRoute>
                  } />
                  <Route path="/optimizations/:id" element={
                    <PrivateRoute>
                      <OptimizationDetail />
                    </PrivateRoute>
                  } />
                  <Route path="/optimizations/:id/compare" element={
                    <PrivateRoute>
                      <AlgorithmComparison />
                    </PrivateRoute>
                  } />
                  <Route path="/optimizations/:id/print" element={
                    <PrivateRoute>
                      <RouteSheet />
                    </PrivateRoute>
                  } />
                  <Route path="/settings" element={
                    <PrivateRoute>
                      <Settings />
                    </PrivateRoute>
                  } />
                </Routes>
              </div>
            </div>
          </ToastProvider>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;