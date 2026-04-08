// Centralized API service for the SHMS frontend
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
})

// Request interceptor — attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shms_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('shms_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

const api = {
  // ─── Authentication ───
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  register: (data) => axiosInstance.post('/auth/register', data),
  getProfile: () => axiosInstance.get('/auth/me'),
  logout: () => axiosInstance.post('/auth/logout'),
  forgotPassword: (email) => axiosInstance.post('/auth/forgot-password', { email }),
  resetPassword: (data) => axiosInstance.post('/auth/reset-password', data),

  // ─── Dashboard ───
  getDashboardStats: () => axiosInstance.get('/dashboard/stats'),
  getRecentActivities: (limit = 10) => axiosInstance.get(`/dashboard/recent-activities?limit=${limit}`),
  getDashboardNotifications: () => axiosInstance.get('/dashboard/notifications'),

  // ─── Users ───
  getAllUsers: (params) => axiosInstance.get('/users', { params }),
  getUserById: (id) => axiosInstance.get(`/users/${id}`),
  updateUser: (id, data) => axiosInstance.put(`/users/${id}`, data),
  deleteUser: (id) => axiosInstance.delete(`/users/${id}`),

  // ─── Rooms ───
  getAllRooms: (params) => axiosInstance.get('/rooms', { params }),
  getRoomById: (id) => axiosInstance.get(`/rooms/${id}`),
  createRoom: (data) => axiosInstance.post('/rooms', data),
  updateRoom: (id, data) => axiosInstance.put(`/rooms/${id}`, data),
  deleteRoom: (id) => axiosInstance.delete(`/rooms/${id}`),
  allocateRoom: (id, data) => axiosInstance.post(`/rooms/${id}/allocate`, data),
  deallocateRoom: (id, data) => axiosInstance.post(`/rooms/${id}/deallocate`, data),
  getRoomStats: () => axiosInstance.get('/rooms/stats/occupancy'),

  // ─── Payments ───
  getAllPayments: (params) => axiosInstance.get('/payments', { params }),
  getPaymentById: (id) => axiosInstance.get(`/payments/${id}`),
  createPaymentOrder: (data) => axiosInstance.post('/payments/create-order', data),
  verifyPayment: (data) => axiosInstance.post('/payments/verify', data),
  createManualPayment: (data) => axiosInstance.post('/payments/manual', data),
  processRefund: (id, data) => axiosInstance.post(`/payments/${id}/refund`, data),
  getPaymentStats: () => axiosInstance.get('/payments/stats/summary'),
  getOverduePayments: () => axiosInstance.get('/payments/overdue'),

  // ─── Complaints ───
  getAllComplaints: (params) => axiosInstance.get('/complaints', { params }),
  getComplaintById: (id) => axiosInstance.get(`/complaints/${id}`),
  createComplaint: (data) => axiosInstance.post('/complaints', data),
  updateComplaint: (id, data) => axiosInstance.put(`/complaints/${id}`, data),
  addComment: (id, data) => axiosInstance.post(`/complaints/${id}/comments`, data),
  resolveComplaint: (id, data) => axiosInstance.post(`/complaints/${id}/resolve`, data),
  getComplaintStats: () => axiosInstance.get('/complaints/stats/summary'),

  // ─── Visitors ───
  getAllVisitors: (params) => axiosInstance.get('/visitors', { params }),
  getVisitorById: (id) => axiosInstance.get(`/visitors/${id}`),
  registerVisitor: (data) => axiosInstance.post('/visitors', data),
  approveVisitor: (id) => axiosInstance.put(`/visitors/${id}/approve`),
  rejectVisitor: (id, data) => axiosInstance.put(`/visitors/${id}/reject`, data),
  checkinVisitor: (id) => axiosInstance.post(`/visitors/${id}/checkin`),
  checkoutVisitor: (id) => axiosInstance.put(`/visitors/${id}/checkout`),
  getVisitorStats: () => axiosInstance.get('/visitors/stats/summary'),

  // ─── Reports ───
  getOccupancyReport: (params) => axiosInstance.get('/reports/occupancy', { params }),
  getFinancialReport: (params) => axiosInstance.get('/reports/financial', { params }),
  getComplaintReport: (params) => axiosInstance.get('/reports/complaints', { params }),

  // ─── Vacation / Leave ───
  getVacationRequests: (params) => axiosInstance.get('/vacation-requests', { params }),
  createVacationRequest: (data) => axiosInstance.post('/vacation-requests', data),
  approveVacationRequestAsWarden: (id, data) => axiosInstance.post(`/vacation-requests/${id}/approve-warden`, data),
  approveVacationRequestAsAdmin: (id, data) => axiosInstance.post(`/vacation-requests/${id}/approve-admin`, data),
  rejectVacationRequest: (id, data) => axiosInstance.post(`/vacation-requests/${id}/reject`, data),

  // ─── Gates / Entry-Exit ───
  getEntryExitLogs: (params) => axiosInstance.get('/gates/entry-exit-logs', { params }),
  getGateStats: () => axiosInstance.get('/gates/stats'),

  // ─── Fee Config ───
  getFeeConfig: (year) => axiosInstance.get('/fee-config', { params: year ? { year } : {} }),

  // ─── Announcements ───
  getAnnouncements: (params) => axiosInstance.get('/announcements', { params }),
  createAnnouncement: (data) => axiosInstance.post('/announcements', data),
  deleteAnnouncement: (id) => axiosInstance.delete(`/announcements/${id}`),

  // ─── Documents ───
  getDocuments: () => axiosInstance.get('/documents'),
  uploadDocument: (formData) => axiosInstance.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateDocument: (id, data) => axiosInstance.put(`/documents/${id}`, data),
  deleteDocument: (id) => axiosInstance.delete(`/documents/${id}`),
  downloadDocument: (id) => axiosInstance.get(`/documents/${id}/download`, { responseType: 'blob' }),

  // ─── Settings ───
  getSettings: () => axiosInstance.get('/settings'),
  saveSettings: (data) => axiosInstance.put('/settings', data),

  // ─── Visitors (extra) ───
  cancelExpiredVisitors: () => axiosInstance.put('/visitors/cancel-expired'),


  // ─── Generic ───
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config),
}

export default api
