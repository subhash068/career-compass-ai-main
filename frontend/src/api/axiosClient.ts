import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling and retry
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as any;
    if (config && !config._retry && !error.response && error.code !== 'ECONNABORTED') {
      config._retry = true;
      // Retry once for network errors
      return axiosClient.request(config);
    }

    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';

    } else if (error.response?.status === 403) {
      // Forbidden, show error
      console.error('Access forbidden');
    } else if (error.response?.status === 404) {
      // Not found - let the API layer handle it
      // The skills.api.ts already catches 404 and returns null
    }
    return Promise.reject(error);


  }
);

export default axiosClient;
