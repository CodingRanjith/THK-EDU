import axios from 'axios'
import { API_URLS } from '../config/api.js'

function parseApiUrls(urls) {
  return [...new Set((urls || []).map((url) => url.trim()).filter(Boolean))]
}

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function isLocalApiUrl(url) {
  try {
    return isLocalHost(new URL(url).hostname)
  } catch {
    return url.includes('localhost') || url.includes('127.0.0.1')
  }
}

function resolveApiUrl() {
  const urls = parseApiUrls(API_URLS)

  if (urls.length === 1) {
    return urls[0]
  }

  const localUrl = urls.find(isLocalApiUrl)
  const prodUrl = urls.find((url) => !isLocalApiUrl(url))
  const onLocalHost = typeof window !== 'undefined' && isLocalHost(window.location.hostname)

  return onLocalHost ? localUrl || urls[0] : prodUrl || urls[urls.length - 1]
}

const API_URL = resolveApiUrl()

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('techackode_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('techackode_token')
      localStorage.removeItem('techackode_user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  toggleUserStatus: (id, is_active) =>
    api.patch(`/admin/users/${id}/status`, { is_active }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
}

export const documentsApi = {
  list: (params) => api.get('/documents', { params }),
  get: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  createBulk: (data) => api.post('/documents/bulk', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  remove: (id) => api.delete(`/documents/${id}`),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  preview: (data) => api.post('/documents/preview', data),
  getTypes: () => api.get('/documents/types'),
}

export const itApi = {
  listClients: (params) => api.get('/it/clients', { params }),
  getClientStats: () => api.get('/it/clients/stats'),
  listClientsBrief: () => api.get('/it/clients/brief'),
  getClient: (id) => api.get(`/it/clients/${id}`),
  createClient: (data) => api.post('/it/clients', data),
  updateClient: (id, data) => api.put(`/it/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/it/clients/${id}`),

  listProposals: (params) => api.get('/it/proposals', { params }),
  getProposalStats: () => api.get('/it/proposals/stats'),
  getProposal: (id) => api.get(`/it/proposals/${id}`),
  createProposal: (data) => api.post('/it/proposals', data),
  updateProposal: (id, data) => api.put(`/it/proposals/${id}`, data),
  deleteProposal: (id) => api.delete(`/it/proposals/${id}`),

  listProjects: (params) => api.get('/it/projects', { params }),
  getProjectStats: () => api.get('/it/projects/stats'),
  getProject: (id) => api.get(`/it/projects/${id}`),
  createProject: (data) => api.post('/it/projects', data),
  updateProject: (id, data) => api.put(`/it/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/it/projects/${id}`),

  listTeamProjects: (params) => api.get('/it/team/projects', { params }),
  listTeamMembers: (params) => api.get('/it/team/members', { params }),
  createTeamMember: (data) => api.post('/it/team/members', data),
  updateTeamMember: (id, data) => api.put(`/it/team/members/${id}`, data),
  deleteTeamMember: (id) => api.delete(`/it/team/members/${id}`),
  getProjectTeam: (projectId, params) => api.get(`/it/team/projects/${projectId}`, { params }),
  createAllocation: (projectId, data) => api.post(`/it/team/projects/${projectId}/allocations`, data),
  updateAllocation: (id, data) => api.put(`/it/team/allocations/${id}`, data),
  deleteAllocation: (id) => api.delete(`/it/team/allocations/${id}`),
}

export const hrApi = {
  listEmployees: (params) => api.get('/hr/employees', { params }),
  getEmployeeStats: () => api.get('/hr/employees/stats'),
  getEmployee: (id) => api.get(`/hr/employees/${id}`),
  createEmployee: (data) => api.post('/hr/employees', data),
  updateEmployee: (id, data) => api.put(`/hr/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/hr/employees/${id}`),

  getMonthlyAttendance: (params) => api.get('/hr/attendance', { params }),
  setAttendance: (data) => api.post('/hr/attendance', data),
  bulkSetAttendance: (data) => api.post('/hr/attendance/bulk', data),
}

export const assetsApi = {
  listHardware: (params) => api.get('/assets/hardware', { params }),
  getHardwareStats: () => api.get('/assets/hardware/stats'),
  getHardware: (id) => api.get(`/assets/hardware/${id}`),
  createHardware: (data) => api.post('/assets/hardware', data),
  updateHardware: (id, data) => api.put(`/assets/hardware/${id}`, data),
  deleteHardware: (id) => api.delete(`/assets/hardware/${id}`),

  listSoftware: (params) => api.get('/assets/software', { params }),
  getSoftwareStats: () => api.get('/assets/software/stats'),
  getSoftware: (id) => api.get(`/assets/software/${id}`),
  createSoftware: (data) => api.post('/assets/software', data),
  updateSoftware: (id, data) => api.put(`/assets/software/${id}`, data),
  deleteSoftware: (id) => api.delete(`/assets/software/${id}`),
}

export const financeApi = {
  listReceivables: (params) => api.get('/finance/receivables', { params }),
  getReceivableStats: (params) => api.get('/finance/receivables/stats', { params }),
  getReceivable: (id) => api.get(`/finance/receivables/${id}`),
  createReceivable: (data) => api.post('/finance/receivables', data),
  updateReceivable: (id, data) => api.put(`/finance/receivables/${id}`, data),
  deleteReceivable: (id) => api.delete(`/finance/receivables/${id}`),

  listPayables: (params) => api.get('/finance/payables', { params }),
  getPayableStats: (params) => api.get('/finance/payables/stats', { params }),
  getPayable: (id) => api.get(`/finance/payables/${id}`),
  createPayable: (data) => api.post('/finance/payables', data),
  updatePayable: (id, data) => api.put(`/finance/payables/${id}`, data),
  deletePayable: (id) => api.delete(`/finance/payables/${id}`),

  getReport: (params) => api.get('/finance/reports', { params }),
}

export default api
