"use client"

import * as React from "react"
import { apiClient, InventoryStats } from "@/lib/api"

type StatsContextType = {
  stats: InventoryStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const StatsContext = React.createContext<StatsContextType | null>(null)

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = React.useState<InventoryStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchStats = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getInventoryStats()
      setStats(data)
    } catch (err) {
      console.error("Failed to fetch inventory stats:", err)
      setError(err instanceof Error ? err.message : "Failed to load stats")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const refetch = React.useCallback(async () => {
    await fetchStats()
  }, [fetchStats])

  return (
    <StatsContext.Provider value={{ stats, loading, error, refetch }}>
      {children}
    </StatsContext.Provider>
  )
}

export function useStats() {
  const context = React.useContext(StatsContext)
  if (!context) {
    throw new Error("useStats must be used within a StatsProvider")
  }
  return context
}
