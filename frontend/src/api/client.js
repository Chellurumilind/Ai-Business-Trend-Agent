/**
 * api/client.js
 * -------------
 * Axios client configured to call the FastAPI backend.
 * All API calls go through this client for consistency.
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Transaction API ───────────────────────────────────────────────────────────

export const transactionAPI = {
  // Get all transactions with optional filters
  getAll: (params = {}) =>
    apiClient.get('/transactions', { params }),

  // Get single transaction by ID
  getById: (id) =>
    apiClient.get(`/transactions/${id}`),

  // Create new transaction
  create: (data) =>
    apiClient.post('/transactions', data),

  // Delete transaction
  delete: (id) =>
    apiClient.delete(`/transactions/${id}`),

  // Get summary (totals + ROI)
  getSummary: () =>
    apiClient.get('/transactions/summary'),
};

// ── Analytics API ─────────────────────────────────────────────────────────────

export const analyticsAPI = {
  // Full analytics summary
  getSummary: () =>
    apiClient.get('/analytics/summary'),

  // Monthly trends
  getMonthly: () =>
    apiClient.get('/analytics/monthly'),

  // Growth rates
  getGrowth: () =>
    apiClient.get('/analytics/growth'),

  // Category breakdown
  getCategories: () =>
    apiClient.get('/analytics/categories'),

  // Health scores
  getHealth: () =>
    apiClient.get('/analytics/health'),
};

// ── Insights API ──────────────────────────────────────────────────────────────

export const insightsAPI = {
  // Generate AI insights
  generate: () =>
    apiClient.get('/insights'),

  ask: (question) =>
    apiClient.post('/insights/chat', { question }),
};

export default apiClient;
