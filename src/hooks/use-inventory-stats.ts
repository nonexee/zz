// src/hooks/use-inventory-stats.ts - Shared hook to prevent duplicate API calls
import * as React from "react"
import { apiClient, InventoryStats } from "@/lib/api"

interface UseInventoryStatsReturn {
  stats: InventoryStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Global state to share across components
let globalStats: InventoryStats | null = null
let globalLoading = false
let globalError: string | null = null
let globalPromise: Promise<InventoryStats> | null = null

// Subscribers for state changes
const subscribers = new Set<() => void>()

const notifySubscribers = () => {
  subscribers.forEach(callback => callback())
}

const fetchStats = async (): Promise<InventoryStats> => {
  // If already fetching, return the existing promise
  if (globalPromise) {
    return globalPromise
  }

  globalLoading = true
  globalError = null
  notifySubscribers()

  globalPromise = apiClient.getInventoryStats()
    .then(data => {
      globalStats = data
      globalLoading = false
      globalError = null
      notifySubscribers()
      return data
    })
    .catch(error => {
      globalLoading = false
      globalError = error instanceof Error ? error.message : "Failed to load inventory stats"
      globalStats = null
      notifySubscribers()
      throw error
    })
    .finally(() => {
      globalPromise = null
    })

  return globalPromise
}

export function useInventoryStats(): UseInventoryStatsReturn {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)

  React.useEffect(() => {
    // Subscribe to state changes
    subscribers.add(forceUpdate)

    // Fetch data if not already loaded or loading
    if (!globalStats && !globalLoading && !globalPromise) {
      fetchStats().catch(() => {
        // Error already handled in fetchStats
      })
    }

    return () => {
      subscribers.delete(forceUpdate)
    }
  }, [])

  const refetch = React.useCallback(async () => {
    // Clear existing data and fetch fresh
    globalStats = null
    globalPromise = null
    await fetchStats()
  }, [])

  return {
    stats: globalStats,
    loading: globalLoading,
    error: globalError,
    refetch
  }
}
