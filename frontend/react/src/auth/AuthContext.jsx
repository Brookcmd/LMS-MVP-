import React from 'react'
import { login as loginRequest } from '../api/apiClient'

const AuthContext = React.createContext(null)
const USER_STORAGE_KEY = 'rollcall_user'
const TOKEN_STORAGE_KEY = 'rollcall_token'

export function AuthProvider({ children }){
  const [user, setUser] = React.useState(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  async function login(credentials) {
    const result = await loginRequest(credentials)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user))
    localStorage.setItem(TOKEN_STORAGE_KEY, result.token)
    setUser(result.user)
    return result.user
  }

  function logout(){
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(){ return React.useContext(AuthContext) }
