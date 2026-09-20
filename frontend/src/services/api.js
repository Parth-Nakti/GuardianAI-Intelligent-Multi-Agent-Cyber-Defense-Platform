import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 minutes for analysis
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');

// Analysis
export const analyzePcap = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/analyze/pcap', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
};

export const analyzeEmail = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/analyze/email', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
};

export const analyzeLogs = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/analyze/logs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
};

// Incidents
export const getIncidents = (params) => api.get('/incidents', { params });
export const getIncident = (id) => api.get(`/incidents/${id}`);
export const updateIncidentStatus = (id, status) => api.patch(`/incidents/${id}/status`, null, { params: { status } });

// Agents
export const getAgents = () => api.get('/agents');
export const getAgent = (id) => api.get(`/agents/${id}`);

// Reports
export const getReports = () => api.get('/reports');
export const getReport = (id) => api.get(`/reports/${id}`);

export default api;
