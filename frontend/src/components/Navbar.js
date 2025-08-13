import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaTruck, FaSignOutAlt, FaUser, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { currentUser, logout, updateUserPreferences } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <Link to="/dashboard" className="navbar-brand">
          <FaTruck className="brand-icon" />
          <span className="brand-text">RouteOptimizer</span>
        </Link>

        <div className="navbar-mobile-toggle" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>

        <div className={`navbar-menu ${isOpen ? 'open' : ''}`}>
          <div className="navbar-links">
            <Link 
              to="/dashboard" 
              className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Dashboard
            </Link>
            <Link 
              to="/vehicles" 
              className={`navbar-link ${location.pathname.startsWith('/vehicles') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Vehicles
            </Link>
            <Link 
              to="/locations" 
              className={`navbar-link ${location.pathname.startsWith('/locations') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Locations
            </Link>
            <Link 
              to="/optimizations" 
              className={`navbar-link ${location.pathname.startsWith('/optimizations') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Optimizations
            </Link>
            <Link 
              to="/settings" 
              className={`navbar-link ${location.pathname.startsWith('/settings') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Settings
            </Link>
          </div>

          <div className="navbar-user">
            <button className="btn btn-outline btn-sm" onClick={async () => {
              const newTheme = theme === 'light' ? 'dark' : 'light';
              toggleTheme();
              if (currentUser) {
                setSavingPrefs(true);
                try { await updateUserPreferences({ theme: newTheme }); } finally { setSavingPrefs(false); }
              }
            }} aria-label="Toggle theme">
              {savingPrefs ? 'Saving...' : theme === 'light' ? 'Dark' : 'Light'}
            </button>
            {currentUser && (
              <>
                <div className="user-info">
                  <FaUser className="user-icon" />
                  <span className="user-name">Hi, {currentUser.name?.split(' ')[0] || 'User'}</span>
                </div>
                <button className="logout-button" onClick={handleLogout}>
                  <FaSignOutAlt />
                  <span className="logout-text">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
