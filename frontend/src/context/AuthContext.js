import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../services/auth.service';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          const response = await AuthService.getCurrentUser();
          setCurrentUser(response.data);
          // Fetch preferences and sync theme
          const prefsRes = await AuthService.getPreferences();
          const prefs = prefsRes.data || {};
          if (prefs.theme && prefs.theme !== document.documentElement.getAttribute('data-theme')) {
            // set theme through DOM attribute; ThemeProvider will pick it up next mount
            document.documentElement.setAttribute('data-theme', prefs.theme);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        AuthService.logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const data = await AuthService.login(email, password);
      const userResponse = await AuthService.getCurrentUser();
      setCurrentUser(userResponse.data);
      // fetch preferences
      const prefsRes = await AuthService.getPreferences();
      const prefs = prefsRes.data || {};
      if (prefs.theme) {
        document.documentElement.setAttribute('data-theme', prefs.theme);
      }
      return data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      setError(null);
      const data = await AuthService.register(name, email, password);
      const userResponse = await AuthService.getCurrentUser();
      setCurrentUser(userResponse.data);
      return data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  const updateUserPreferences = async (prefs) => {
    const res = await AuthService.updatePreferences(prefs);
    setCurrentUser(res.data);
    if (prefs.theme) {
      document.documentElement.setAttribute('data-theme', prefs.theme);
    }
    return res.data;
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: AuthService.isAuthenticated,
    updateUserPreferences,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
