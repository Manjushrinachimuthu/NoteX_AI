import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const response = await api.login(email, password)
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response))
    setUser(response)
    return response
  }

  const register = async (name, email, password) => {
    const response = await api.register(name, email, password)
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response))
    setUser(response)
    return response
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateProfile = async (data) => {
    const response = await api.updateProfile(data)
    localStorage.setItem('user', JSON.stringify(response))
    setUser(response)
    return response
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}