import React from 'react';
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
import Settings from './pages/Settings';
import './App.css';
import { ToastProvider } from './components/ToastProvider';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <ToastProvider>
            <div className="app">
              <Navbar />
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