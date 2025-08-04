"use client"

import * as React from "react"
import { apiClient } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

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
  }
  serviceStats?: {
    totalServices: number
  }
  endpointStats?: {
    totalEndpoints: number
  }
  firstDiscovered?: string
  lastSeen?: string
}

// Cache for assets to prevent duplicate API calls
const assetsCache = new Map<string, { data: Asset[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function DataTableSimple() {
  const [assets, setAssets] = React.useState<Asset[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("active")

  const fetchAssets = React.useCallback(async (type?: string, status?: string) => {
    const cacheKey = `${type || 'all'}-${status || 'active'}`
    const cached = assetsCache.get(cacheKey)
    
    // Use cache if available and not expired
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setAssets(cached.data)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.getAssetsList({
        type: type === "all" ? undefined : type as "domain" | "ip",
        status: status as "active" | "inactive" | "all",
        limit: 50
      })
      
      // Cache the result
      assetsCache.set(cacheKey, {
        data: response.assets,
        timestamp: Date.now()
      })
      
      setAssets(response.assets)
    } catch (err) {
      console.error("Failed to fetch assets:", err)
      setError(err instanceof Error ? err.message : "Failed to load assets")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAssets(activeTab, statusFilter)
  }, [activeTab, statusFilter, fetchAssets])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const getStatusBadge = (asset: Asset) => {
    if (asset.isActive) {
      return <Badge variant="default" className="text-xs">Active</Badge>
    } else {
      return <Badge variant="secondary" className="text-xs">Inactive</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
          <CardDescription>Loading assets...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded-md" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
          <CardDescription>Failed to load assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted rounded-md">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex items-center justify-between px-4 lg:px-6 mb-4">
        <TabsList>
          <TabsTrigger value="all">All Assets</TabsTrigger>
          <TabsTrigger value="domain">Domains</TabsTrigger>
          <TabsTrigger value="ip">IP Addresses</TabsTrigger>
        </TabsList>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TabsContent value={activeTab} className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "all" ? "All Assets" : 
               activeTab === "domain" ? "Domains" : "IP Addresses"}
            </CardTitle>
            <CardDescription>
              {assets.length} {activeTab === "all" ? "assets" : activeTab === "domain" ? "domains" : "IP addresses"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ports</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Endpoints</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No assets found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {asset.identifier}
                            {asset.isApex && (
                              <Badge variant="outline" className="text-xs">
                                Apex
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">
                            {asset.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(asset)}</TableCell>
                        <TableCell>
                          {asset.portStats?.uniquePortCount || 0}
                        </TableCell>
                        <TableCell>
                          {asset.serviceStats?.totalServices || 0}
                        </TableCell>
                        <TableCell>
                          {asset.endpointStats?.totalEndpoints || 0}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(asset.lastSeen)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
