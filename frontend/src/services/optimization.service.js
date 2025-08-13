import api from './api';

const getAll = async () => {
  try {
    const response = await api.get('/optimization');
    return response.data;
  } catch (error) {
    console.error('Error fetching optimizations:', error);
    throw error;
  }
};

const get = async (id) => {
  const response = await api.get(`/optimization/${id}`);
  return response.data;
};

const create = async (data) => {
  const response = await api.post('/optimization', data);
  return response.data;
};

const remove = async (id) => {
  const response = await api.delete(`/optimization/${id}`);
  return response.data;
};

const getRoutedPolyline = async (id, routeIndex) => {
  const response = await api.get(`/optimization/${id}/route/${routeIndex}/polyline`);
  return response.data;
};

const OptimizationService = {
  getAll,
  get,
  create,
  remove,
  getRoutedPolyline,
};

export default OptimizationService;