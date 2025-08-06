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

export default function InventoryAssetsPage() {
  const [assets, setAssets] = React.useState<Asset[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch a larger dataset for the data table
        const response = await apiClient.getAssetsList({
          limit: 100, // Get more assets for better table experience
          status: 'all' // Include both active and inactive
        })
        
        setAssets(response.assets)
      } catch (err) {
        console.error("Failed to fetch assets:", err)
        setError(err instanceof Error ? err.message : "Failed to load assets")
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [])

  if (loading) {
    return (
      <RouteGuard>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
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

  if (error) {
    return (
      <RouteGuard>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
            <SiteHeader />
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center justify-center h-64 bg-destructive/10 rounded-lg border border-destructive/20 mx-4">
                <div className="text-center">
                  <p className="text-destructive mb-2">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="text-sm text-primary hover:underline"
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

  return (
    <RouteGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <SiteHeader />
          {/* Fixed height container for the table - uses calc to account for header */}
          <div className="flex-1 p-4 lg:p-6 min-h-0">
            <div className="h-full">
              <DataTable data={assets} columns={columns} />
            </div>
          </div>
        </main>
      </SidebarProvider>
    </RouteGuard>
  )
}
