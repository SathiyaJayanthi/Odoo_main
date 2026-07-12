import { createContext, useContext, useState, useEffect } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = () => {
      const storedUser = localStorage.getItem('user')
      const token = localStorage.getItem('access_token')
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (e) {
          localStorage.removeItem('user')
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const response = await client.post('/auth/login/', { email, password })
      const { access, refresh, role, user: userData } = response.data
      
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('role', role)
      localStorage.setItem('user', JSON.stringify(userData))
      
      setUser(userData)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Invalid email or password'
      }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (payload) => {
    try {
      const response = await client.post('/auth/signup/', payload)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Signup error:', error)
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to create account'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    setUser(null)
  }

  const hasRole = (roles) => {
    if (!user) return false
    const currentRole = localStorage.getItem('role')
    return roles.includes(currentRole)
  }

  const getRole = () => {
    return localStorage.getItem('role')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAuthenticated: !!user, hasRole, getRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
