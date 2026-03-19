import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handler
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

// ---- Items ----
export const itemsAPI = {
  getAll: (params) => API.get('/items', { params }),
  getById: (id) => API.get(`/items/${id}`),
  getCategories: () => API.get('/items/categories'),
  create: (data) => API.post('/items', data),
  update: (id, data) => API.put(`/items/${id}`, data),
  delete: (id) => API.delete(`/items/${id}`),
};

// ---- Borrows ----
export const borrowsAPI = {
  getAll: (params) => API.get('/borrows', { params }),
  getById: (id) => API.get(`/borrows/${id}`),
  getStats: () => API.get('/borrows/stats'),
  borrow: (data) => API.post('/borrows', data),
  return: (id, data) => API.put(`/borrows/${id}/return`, data),
  update: (id, data) => API.put(`/borrows/${id}`, data),
  delete: (id) => API.delete(`/borrows/${id}`),
};

// ---- Export ----
export const exportAPI = {
  pdf: (params) =>
    API.get('/export/pdf', {
      params,
      responseType: 'blob',
    }),
};

// ---- Users (Admin) ----
export const usersAPI = {
  getAll: (params) => API.get('/users', { params }),
  delete: (id) => API.delete(`/users/${id}`),
};

export default API;
