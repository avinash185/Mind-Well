import { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: true,
  isAuthenticated: false,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      }
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      }
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }
    
    case 'SET_TOKEN':
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
      }
    
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token')
      const refreshToken = localStorage.getItem('refreshToken')
      
      console.log('🔐 Auth Debug - Initializing auth state')
      console.log('🔐 Auth Debug - Token exists:', !!token)
      console.log('🔐 Auth Debug - RefreshToken exists:', !!refreshToken)
      
      if (token && refreshToken) {
        try {
          console.log('🔐 Auth Debug - Verifying token with API...')
          // Verify token and get user data
          const response = await authAPI.getProfile()
          console.log('🔐 Auth Debug - Profile API response:', response.data)
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.data.user,
              token,
              refreshToken,
            },
          })
          console.log('🔐 Auth Debug - Authentication successful')
        } catch (error) {
          console.log('🔐 Auth Debug - Token verification failed:', error.response?.data || error.message)
          // Token is invalid, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          dispatch({ type: 'LOGOUT' })
        }
      } else {
        console.log('🔐 Auth Debug - No tokens found, user not authenticated')
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initializeAuth()
  }, [])

  // Update localStorage when tokens change
  useEffect(() => {
    if (state.token && state.refreshToken) {
      localStorage.setItem('token', state.token)
      localStorage.setItem('refreshToken', state.refreshToken)
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    }
  }, [state.token, state.refreshToken])

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await authAPI.login({ email, password })
      const { user, token, refreshToken } = response.data.data
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token, refreshToken },
      })
      
      toast.success(`Welcome back, ${user.name}!`)
      return { success: true }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const signup = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await authAPI.signup(userData)
      const { user, token, refreshToken } = response.data.data
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token, refreshToken },
      })
      
      toast.success(`Welcome to MindWell, ${user.name}!`)
      return { success: true }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      const message = error.response?.data?.message || 'Signup failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      if (state.refreshToken) {
        await authAPI.logout({ refreshToken: state.refreshToken })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      dispatch({ type: 'LOGOUT' })
      toast.success('Logged out successfully')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.data.user,
      })
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const refreshAuthToken = async () => {
    try {
      if (!state.refreshToken) {
        throw new Error('No refresh token available')
      }
      
      const response = await authAPI.refreshToken({
        refreshToken: state.refreshToken,
      })
      
      dispatch({
        type: 'SET_TOKEN',
        payload: {
          token: response.data.data.token,
          refreshToken: response.data.data.refreshToken,
        },
      })
      
      return response.data.data.token
    } catch (error) {
      // Refresh failed, logout user
      dispatch({ type: 'LOGOUT' })
      toast.error('Session expired. Please login again.')
      throw error
    }
  }

  const deleteAccount = async (password) => {
    try {
      await authAPI.deleteAccount(password)
      dispatch({ type: 'LOGOUT' })
      toast.success('Account deleted successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Account deletion failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    ...state,
    login,
    signup,
    logout,
    updateProfile,
    refreshAuthToken,
    deleteAccount,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }