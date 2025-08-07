"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { RouteGuard } from "@/components/route-guard"
import { DataTable } from "@/components/assets-data-table/data-table"
import { columns } from "@/components/assets-data-table/columns"
import {
  SidebarProvider,
} from "@/components/ui/sidebar"

import * as React from "react"
import { apiClient } from "@/lib/api"

// Types
interface Asset {
  id: string
  type: 'domain' | 'ip'
  identifier: string
  status: string
  isActive: boolean
  isApex?: boolean
  portStats?: {
    totalOpenPorts: number
    uniquePortCount: number
    uniqueOpenPorts: number[]
  }
  serviceStats?: {
    totalServices: number
    uniqueServiceCount: number
  }
  endpointStats?: {
    totalEndpoints: number
    schemes: { http: number; https: number }
  }
  certificateStats?: {
    totalCertificates: number
    validCertificates: number
    expiringSoon: number
  }
  firstDiscovered?: string
  lastSeen?: string
  relatedIps?: string[]
  openPorts?: number[]
  classification?: any
  relatedDomains?: Array<{
    id: string
    domain: string
    isApex: boolean
  }>
}

interface PaginationState {
  pageIndex: number
  pageSize: number
}

interface FiltersState {
  type?: 'domain' | 'ip'
  status: 'active' | 'inactive' | 'all'
  search?: string
}

interface SortingState {
  id: string
  desc: boolean
}[]

// API Response type
interface AssetsResponse {
  assets: Asset[]
  totals: {
    domains: number
    ips: number
    combined: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function InventoryAssetsPage() {
  // Core state
  const [assets, setAssets] = React.useState<Asset[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  
  // Table state - this drives the API calls
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })
  
  const [filters, setFilters] = React.useState<FiltersState>({
    status: 'all'
  })
  
  const [sorting, setSorting] = React.useState<SortingState>([])
  
  // Loading states for different operations
  const [isInitialLoading, setIsInitialLoading] = React.useState(true)
  const [isPaginationLoading, setIsPaginationLoading] = React.useState(false)

  // Fetch assets function
  const fetchAssets = React.useCallback(async (
    paginationState: PaginationState,
    filtersState: FiltersState,
    sortingState: SortingState,
    isInitial = false
  ) => {
    try {
      // Set appropriate loading state
      if (isInitial) {
        setIsInitialLoading(true)
      } else {
        setIsPaginationLoading(true)
      }
      
      setError(null)
      
      // Map frontend state to backend parameters
      const apiParams = {
        // Backend uses 1-based pagination, frontend uses 0-based
        page: paginationState.pageIndex + 1,
        limit: paginationState.pageSize,
        type: filtersState.type, // undefined is fine, backend handles it
        status: filtersState.status
      }
      
      console.log('Fetching assets with params:', apiParams)
      
      const response: AssetsResponse = await apiClient.getAssetsList(apiParams)
      
      console.log('Assets response:', response)
      
      // Update state with response
      setAssets(response.assets)
      setTotalCount(response.pagination.total)
      
      // Verify pagination state matches response
      if (response.pagination.page !== paginationState.pageIndex + 1) {
        console.warn('Pagination mismatch, adjusting...')
        setPagination(prev => ({
          ...prev,
          pageIndex: response.pagination.page - 1
        }))
      }
      
    } catch (err) {
      console.error("Failed to fetch assets:", err)
      setError(err instanceof Error ? err.message : "Failed to load assets")
      
      // On error, don't clear existing data unless it's initial load
      if (isInitial) {
        setAssets([])
        setTotalCount(0)
      }
    } finally {
      setIsInitialLoading(false)
      setIsPaginationLoading(false)
      setLoading(false)
    }
  }, [])

  // Initial load
  React.useEffect(() => {
    fetchAssets(pagination, filters, sorting, true)
  }, []) // Only run on mount

  // Handle pagination changes
  const handlePaginationChange = React.useCallback((newPagination: PaginationState) => {
    console.log('Pagination changed:', newPagination)
    setPagination(newPagination)
    fetchAssets(newPagination, filters, sorting, false)
  }, [filters, sorting, fetchAssets])

  // Handle filter changes
  const handleFiltersChange = React.useCallback((newFilters: FiltersState) => {
    console.log('Filters changed:', newFilters)
    setFilters(newFilters)
    
    // Reset to first page when filters change
    const resetPagination = { ...pagination, pageIndex: 0 }
    setPagination(resetPagination)
    
    fetchAssets(resetPagination, newFilters, sorting, false)
  }, [pagination, sorting, fetchAssets])

  // Handle sorting changes
  const handleSortingChange = React.useCallback((newSorting: SortingState) => {
    console.log('Sorting changed:', newSorting)
    setSorting(newSorting)
    fetchAssets(pagination, filters, newSorting, false)
  }, [pagination, filters, fetchAssets])

  // Retry function
  const handleRetry = React.useCallback(() => {
    fetchAssets(pagination, filters, sorting, true)
  }, [pagination, filters, sorting, fetchAssets])

  // Initial loading state
  if (isInitialLoading) {
    return (
      <RouteGuard>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <SiteHeader />
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading assets...</p>
              </div>
            </div>
          </main>
        </SidebarProvider>
      </RouteGuard>
    )
  }

  // Error state
  if (error && assets.length === 0) {
    return (
      <RouteGuard>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <SiteHeader />
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center justify-center h-64 bg-destructive/10 rounded-lg border border-destructive/20 mx-4 max-w-md">
                <div className="text-center p-6">
                  <p className="text-destructive mb-4 font-medium">Failed to load assets</p>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <button 
                    onClick={handleRetry}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </main>
        </SidebarProvider>
      </RouteGuard>
    )
  }

  // Main content
  return (
    <RouteGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <SiteHeader />
          <div className="flex-1 p-4 lg:p-6 min-h-0">
            <div className="h-full">
              <DataTable 
                data={assets} 
                columns={columns}
                // Pagination props
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                totalCount={totalCount}
                // Filter props
                filters={filters}
                onFiltersChange={handleFiltersChange}
                // Sorting props  
                sorting={sorting}
                onSortingChange={handleSortingChange}
                // Loading state
                isLoading={isPaginationLoading}
                // Error state (for non-fatal errors during pagination)
                error={error}
                onRetry={handleRetry}
              />
            </div>
          </div>
        </main>
      </SidebarProvider>
    </RouteGuard>
  )
}
