// frontend/src/services/api.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your backend URL
// NOTE: Use your computer's local IP, NOT localhost!
// We'll update this in next step
// const API_BASE_URL = 'http://127.0.0.1:8000';
const API_BASE_URL = 'http://192.168.1.17:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API CALLS
// ============================================

export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user info
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// ============================================
// STUDIO API CALLS
// ============================================

export const studioAPI = {
  getAllStudios: async () => {
    const response = await api.get('/studios/');
    return response.data;
  },

  getStudio: async (studioId) => {
    const response = await api.get(`/studios/${studioId}`);
    return response.data;
  },

  getMyStudios: async () => {
    const response = await api.get('/studios/my-studios');
    return response.data;
  },

  createStudio: async (studioData) => {
    const response = await api.post('/studios/', studioData);
    return response.data;
  },

  updateStudio: async (studioId, studioData) => {
    const response = await api.put(`/studios/${studioId}`, studioData);
    return response.data;
  },

  deleteStudio: async (studioId) => {
    const response = await api.delete(`/studios/${studioId}`);
    return response.data;
  },
};

// ============================================
// RESOURCE API CALLS
// ============================================

export const resourceAPI = {
  // Get resources for a studio
  getStudioResources: async (studioId) => {
    const response = await api.get(`/resources/${studioId}/resources`);
    return response.data;
  },

  // Get single resource
  getResource: async (resourceId) => {
    const response = await api.get(`/resources/resource/${resourceId}`);
    return response.data;
  },

  // Add resource to studio
  addResourceToStudio: async (studioId, resourceData) => {
    const response = await api.post(`/resources/${studioId}/resources`, resourceData);
    return response.data;
  },

  // Update resource
  updateResource: async (resourceId, resourceData) => {
    const response = await api.put(`/resources/resource/${resourceId}`, resourceData);
    return response.data;
  },

  // Delete resource
  deleteResource: async (resourceId) => {
    const response = await api.delete(`/resources/resource/${resourceId}`);
    return response.data;
  },
};

// ============================================
// BOOKING API CALLS
// ============================================

export const bookingAPI = {
  // Get available slots
  getAvailableSlots: async (resourceId, date) => {
    const response = await api.get(`/bookings/available-slots/${resourceId}`, {
      params: { booking_date: date },
    });
    return response.data;
  },

  // Create booking
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings/', bookingData);
    return response.data;
  },

  // Get my bookings (customer)
  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  // Get pending approvals (owner)
  getPendingApprovals: async () => {
    const response = await api.get('/bookings/pending-approvals');
    return response.data;
  },

  // Get all studio bookings (owner) - NEW!
  getMyStudioBookings: async () => {
    const response = await api.get('/bookings/my-studio-bookings');
    return response.data;
  },

  // Approve or reject booking (owner)
  approveBooking: async (bookingId, approvalData) => {
    const response = await api.put(`/bookings/${bookingId}/approve`, approvalData);
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId, cancelData) => {
    const response = await api.put(`/bookings/${bookingId}/cancel`, cancelData);
    return response.data;
  },
   // Get single booking details
  getBooking: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },
};

export default api;