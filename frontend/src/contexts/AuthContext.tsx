import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client'
import type { User } from '../types'

type AuthContextType = {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('dndhub_token'))
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }
    apiFetch<User>('/auth/me')
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('dndhub_token')
        setToken(null)
        setUser(null)
      })
  }, [token])

  async function login(username: string, password: string) {
    const data = await apiFetch<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    localStorage.setItem('dndhub_token', data.access_token)
    setToken(data.access_token)
  }

  async function register(email: string, username: string, password: string) {
    await apiFetch<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    })
    await login(username, password)
  }

  function logout() {
    localStorage.removeItem('dndhub_token')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(() => ({ user, token, login, register, logout }), [token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
