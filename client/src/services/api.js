import axios from 'axios'

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: '/api', // This will use the Vite proxy to redirect to localhost:5000
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Create separate axios instance for Agent (Python backend)
const agentClient = axios.create({
  baseURL: '/agent',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Request interceptor for agent client (reuse auth if present; Python may ignore it)
agentClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Basic response passthrough for agent client
agentClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

// Auth API endpoints
export const authAPI = {
  signup: (userData) => apiClient.post('/auth/signup', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  logout: (data) => apiClient.post('/auth/logout', data),
  refreshToken: (data) => apiClient.post('/auth/refresh', data),
  getProfile: () => apiClient.get('/auth/me'),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
  updateProfile: (data) => apiClient.put('/user/profile', data),
  deleteAccount: (password) => apiClient.delete('/user/account', { data: { password } }),
}

// User API endpoints
export const userAPI = {
  getDashboard: () => apiClient.get('/user/dashboard'),
  getStats: () => apiClient.get('/user/dashboard'),
  getPreferences: () => apiClient.get('/user/preferences'),
  updatePreferences: (data) => apiClient.put('/user/preferences', data),
}

// Assessment API endpoints
export const assessmentAPI = {
  getHistory: () => apiClient.get('/assessments'),
  getQuestions: (assessmentType) => apiClient.get(`/assessments/${assessmentType}/questions`),
  submit: (data) => apiClient.post(`/assessments/${data.type}/submit`, data),
  getResults: (assessmentId) => apiClient.get(`/assessments/${assessmentId}`),
  getTypes: () => apiClient.get('/assessments/types'),
}

// Chat API endpoints
export const chatAPI = {
  startSession: (data = { type: 'chat' }) => apiClient.post('/chat/start', data),
  sendMessage: (data) => {
    const { sessionId, ...messageData } = data;
    return apiClient.post(`/chat/${sessionId}/message`, messageData);
  },
  endSession: (sessionId) => apiClient.put(`/chat/${sessionId}/end`),
  listSessions: (params = {}) => apiClient.get('/chat', { params }),
}

// Agent API endpoints (new agent backend)
export const agentAPI = {
  // Let startSession fall back to Node chat if Python agent doesn't support sessions
  startSession: () => agentClient.post('/chat/start'),
  // Send message to Python agent `/chat` and normalize the response shape
  sendMessage: async ({ sessionId, content }) => {
    const res = await agentClient.post('/chat', { message: content })
    const text = res?.data?.response || ''
    // Normalize to { data: { message: { content }, sessionId } } to match ChatBotPage expectations
    return {
      data: {
        success: true,
        data: {
          message: {
            role: 'assistant',
            content: text,
            timestamp: new Date(),
          },
          sessionId,
        },
      },
    }
  },
  endSession: (sessionId) => agentClient.put(`/chat/${sessionId}/end`),
  health: () => agentClient.get('/health'),
}

// Resources API endpoints
export const resourcesAPI = {
  getAll: () => apiClient.get('/resources'),
  getByCategory: (category) => apiClient.get(`/resources/category/${category}`),
  getBookmarks: () => apiClient.get('/resources/bookmarks'),
  addBookmark: (resourceId) => apiClient.post(`/resources/bookmark/${resourceId}`),
  removeBookmark: (resourceId) => apiClient.delete(`/resources/bookmark/${resourceId}`),
}

// Counselor API endpoints
export const counselorAPI = {
  list: (params = {}) => apiClient.get('/counselors', { params }),
}

// Booking API endpoints
export const bookingAPI = {
  create: (data) => apiClient.post('/bookings', data),
  list: () => apiClient.get('/bookings'),
}

// Session API endpoints
export const sessionAPI = {
  getHistory: () => apiClient.get('/sessions'),
  getSession: (sessionId) => apiClient.get(`/sessions/${sessionId}`),
  getAnalytics: () => apiClient.get('/sessions/analytics/overview'),
}

// Main API object that combines all endpoints
export const api = {
  auth: authAPI,
  user: userAPI,
  assessment: assessmentAPI,
  chat: chatAPI,
  agent: agentAPI,
  resources: resourcesAPI,
  counselor: counselorAPI,
  booking: bookingAPI,
  session: sessionAPI,
}

export default api