import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

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
}

export default api
