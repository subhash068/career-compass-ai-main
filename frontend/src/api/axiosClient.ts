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
    const user = localStorage.getItem('user');

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Request:', config.method?.toUpperCase(), config.url);
      console.log('Token exists:', !!token);
      console.log('User exists:', !!user);
    }

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
      localStorage.removeItem('user');
      window.location.href = '/login';

    } else if (error.response?.status === 403) {
      // Forbidden - check if user is actually admin
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.error('Access forbidden. User role:', user.role);
          if (user.role !== 'admin') {
            console.error('User is not admin. Redirecting to dashboard.');
            window.location.href = '/dashboard';
          }
        } catch (e) {
          console.error('Failed to parse user data');
        }
      }

    } else if (error.response?.status === 404) {
      // Not found - let the API layer handle it
      // The skills.api.ts already catches 404 and returns null
    }
    return Promise.reject(error);


  }
);

export default axiosClient;
