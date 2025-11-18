import axios from 'axios';
import type { SalesFilterParams } from '../types';

// Use relative URL for Vercel deployment, or env variable, or localhost fallback
const API_BASE_URL = import.meta.env.VITE_API_URL 
  || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') 
      ? '/api' 
      : 'http://localhost:3001/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased to 60 seconds for complex queries
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Sales API
export const salesApi = {
  getOverview: (days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/sales/overview', { params }).then(res => res.data);
  },
  
  getTrends: (days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/sales/trends', { params }).then(res => res.data);
  },
  
  getTopProducts: (limit: number = 10, days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { limit, ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/sales/top-products', { params }).then(res => res.data);
  },
  
  getCategories: (days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/sales/categories', { params }).then(res => res.data);
  },
  
  getHourly: (date: string = 'today') => 
    api.get('/sales/hourly', { params: { date } }).then(res => res.data),
  
  getFilters: () => 
    api.get('/sales/filters').then(res => res.data),
};

// Products API
export const productsApi = {
  getPerformance: (limit: number = 20, days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { limit, ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/products/performance', { params }).then(res => res.data);
  },
  
  getMetrics: (days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/products/metrics', { params }).then(res => res.data);
  },
  
  getViews: (limit: number = 20, days?: number) => {
    const params: Record<string, any> = { limit };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/products/views', { params }).then(res => res.data);
  },
  
  getSearchAnalytics: (limit: number = 20, days?: number) => {
    const params: Record<string, any> = { limit };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/products/search-analytics', { params }).then(res => res.data);
  },

  getTopUnpurchased: (limit: number = 5, days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { limit, ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/products/top-unpurchased', { params }).then(res => res.data);
  },
};

// Customers API
export const customersApi = {
  getOverview: (days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/customers/overview', { params }).then(res => res.data);
  },
  
  getSegments: () => 
    api.get('/customers/segments').then(res => res.data),
  
  getGrowth: (days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/customers/growth', { params }).then(res => res.data);
  },
  
  getTop: (limit: number = 10, days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { limit, ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/customers/top', { params }).then(res => res.data);
  },
};

// Customizations API
export const customizationsApi = {
  getMetrics: (days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/customizations/metrics', { params }).then(res => res.data);
  },
  
  getPopular: (limit: number = 10, days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { limit, ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/customizations/popular', { params }).then(res => res.data);
  },
  
  getTrends: (days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/customizations/trends', { params }).then(res => res.data);
  },
  
  getByCategory: (days?: number, filters: SalesFilterParams = {}) => {
    const params: Record<string, any> = { ...filters };
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/customizations/by-category', { params }).then(res => res.data);
  },
};

// Dashboard API
export const dashboardApi = {
  getActivity: (limit: number = 10) => 
    api.get('/dashboard/activity', { params: { limit } }).then(res => res.data),
  
  getMetrics: () => 
    api.get('/dashboard/metrics').then(res => res.data),
  
  getStats: (days?: number) => {
    const params: Record<string, any> = {};
    if (days !== undefined) {
      params.days = days;
    }
    return api.get('/dashboard/stats', { params }).then(res => res.data);
  },

  getFilters: () => 
    api.get('/dashboard/filters').then(res => res.data),
};

// Chatbot API
export const chatbotApi = {
  query: (query: string) => 
    api.post('/chatbot/query', { query }).then(res => res.data),
};

// Intelligence API
export const intelligenceApi = {
  getPipelineForecast: () =>
    api.get('/intelligence/pipeline-forecast').then(res => res.data),
};

export default api;

