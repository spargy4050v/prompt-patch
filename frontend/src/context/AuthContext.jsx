import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('pp_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (teamName, password) => {
    const data = await api.post('/auth/login', { teamName, password })
    if (data.success) {
      localStorage.setItem('pp_token', data.token)
      localStorage.setItem('pp_user', JSON.stringify(data.user))
      setUser(data.user)
    }
    return data
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('pp_token')
    localStorage.removeItem('pp_user')
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin'
  const isStaff = user?.role === 'admin' || user?.role === 'volunteer'
  const isTeam = user?.role === 'team'

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isStaff, isTeam }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
