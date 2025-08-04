"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { apiClient, User, Organization } from "@/lib/api"

type AuthContextType = {
  isAuthenticated: boolean
  user: User | null
  organization: Organization | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [user, setUser] = React.useState<User | null>(null)
  const [organization, setOrganization] = React.useState<Organization | null>(null)
  const [loading, setLoading] = React.useState(true)
  const router = useRouter()

  // Verify existing token on mount
  React.useEffect(() => {
    const verifyExistingAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        if (!token) {
          setLoading(false)
          return
        }

        const response = await apiClient.verifyToken()
        setUser(response.user)
        setOrganization(response.organization)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Token verification failed:", error)
        // Clear invalid tokens
        apiClient.logout()
        setIsAuthenticated(false)
        setUser(null)
        setOrganization(null)
      } finally {
        setLoading(false)
      }
    }

    verifyExistingAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      
      setUser(response.user)
      setOrganization(response.organization)
      setIsAuthenticated(true)
      
      // Store additional user info for legacy compatibility
      localStorage.setItem("userEmail", response.user.email)
      localStorage.setItem("isAuthenticated", "true")
      
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const logout = () => {
    apiClient.logout()
    setIsAuthenticated(false)
    setUser(null)
    setOrganization(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      organization,
      login, 
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
