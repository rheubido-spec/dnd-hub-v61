import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, buildApiUrl } from '../api/client'

type AuthUser = {
  id: number
  username?: string
  email?: string
  is_superuser?: boolean
  [key: string]: unknown
}

type LoginResult = {
  access_token: string
  user?: AuthUser
  [key: string]: unknown
}

type AuthContextValue = {
  user: AuthUser | null
  ready: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshUser: () => Promise<AuthUser | null>
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = 'dndhub_token'
const USER_KEY = 'dndhub_user'

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

function writeStoredUser(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem(USER_KEY)
    return
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function readStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function writeStoredToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY)
    return
  }
  localStorage.setItem(TOKEN_KEY, token)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  async function refreshUser(): Promise<AuthUser | null> {
    const token = readStoredToken()
    if (!token) {
      setUser(null)
      writeStoredUser(null)
      return null
    }

    try {
      const me = await apiFetch<AuthUser>('/auth/me', { method: 'GET' })
      setUser(me)
      writeStoredUser(me)
      return me
    } catch {
      writeStoredToken(null)
      writeStoredUser(null)
      setUser(null)
      return null
    }
  }

  useEffect(() => {
    const storedUser = readStoredUser()
    if (storedUser) {
      setUser(storedUser)
    }

    void (async () => {
      await refreshUser()
      setReady(true)
    })()
  }, [])

  async function login(username: string, password: string): Promise<AuthUser> {
    const response = await fetch(buildApiUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    let data: LoginResult | { detail?: string } = {}
    try {
      data = (await response.json()) as LoginResult | { detail?: string }
    } catch {
      // keep empty fallback
    }

    if (!response.ok) {
      const detail =
        typeof data === 'object' && data && 'detail' in data && typeof data.detail === 'string'
          ? data.detail
          : 'Login failed'
      throw new Error(detail)
    }

    const token =
      typeof data === 'object' && data && 'access_token' in data && typeof data.access_token === 'string'
        ? data.access_token
        : null

    if (!token) {
      throw new Error('Login succeeded but no access token was returned.')
    }

    writeStoredToken(token)

    let nextUser: AuthUser | null = null

    try {
      nextUser = await apiFetch<AuthUser>('/auth/me', { method: 'GET' })
    } catch {
      if (typeof data === 'object' && data && 'user' in data && data.user && typeof data.user === 'object') {
        nextUser = data.user as AuthUser
      }
    }

    if (!nextUser) {
      throw new Error('Login succeeded but user details could not be loaded.')
    }

    setUser(nextUser)
    writeStoredUser(nextUser)
    return nextUser
  }

  async function logout(): Promise<void> {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {
      // still clear local auth state even if the request fails
    }

    writeStoredToken(null)
    writeStoredUser(null)
    setUser(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      isAuthenticated: !!user && !!readStoredToken(),
      login,
      logout,
      refreshUser,
      setUser,
    }),
    [user, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
