import api from './api';

const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('token');
};

const getCurrentUser = async () => {
  return api.get('/auth');
};

const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

const getPreferences = async () => api.get('/auth/preferences');
const updatePreferences = async (prefs) => api.put('/auth/preferences', prefs);

const AuthService = {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  getPreferences,
  updatePreferences,
};

export default AuthService;