"use client"

import * as React from "react"
import { apiClient, InventoryStats } from "@/lib/api"

interface OverviewContextType {
  stats: InventoryStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const OverviewContext = React.createContext<OverviewContextType | null>(null)

export function OverviewProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = React.useState<InventoryStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchStats = React.useCallback(async () => {
    try {
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

  const value = React.useMemo(() => ({
    stats,
    loading,
    error,
    refetch: fetchStats
  }), [stats, loading, error, fetchStats])

  return (
    <OverviewContext.Provider value={value}>
      {children}
    </OverviewContext.Provider>
  )
}

export function useOverview() {
  const context = React.useContext(OverviewContext)
  if (!context) {
    throw new Error("useOverview must be used within an OverviewProvider")
  }
  return context
}
