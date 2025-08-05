"use client"

import * as React from "react"
import { 
  IconTrendingUp
} from "@tabler/icons-react"
import { useOverview } from "@/components/overview-context"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  const { stats, loading, error } = useOverview()

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card animate-pulse">
            <CardHeader>
              <CardDescription>Loading...</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                --
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="px-4 lg:px-6">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-md text-sm">
          {error || "Failed to load stats"}
        </div>
      </div>
    )
  }

  // Calculate growth data from scan summary
  const getNewCount = (scanSummary: any, field: string): number => {
    if (!scanSummary) return 0
    return scanSummary[field] || 0
  }

  const newDomains = getNewCount(stats.lastScan?.summary, 'newDomains')
  const newIps = getNewCount(stats.lastScan?.summary, 'newIps')
  const newPorts = getNewCount(stats.lastScan?.summary, 'newOpenPorts')
  const newEndpoints = getNewCount(stats.lastScan?.summary, 'newEndpoints')

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Domains Card */}
      <Card className="@container/card border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Domains
            </CardDescription>
            {newDomains > 0 && (
              <Badge variant="outline" className="text-xs">
                <IconTrendingUp className="h-3 w-3" />
                +{newDomains}
              </Badge>
            )}
          </div>
          <CardTitle className="text-3xl font-bold tabular-nums">
            {formatNumber(stats.stats.domains)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="pt-2 border-t border-border/50">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{stats.stats.apexDomains.length}</span> apex domain{stats.stats.apexDomains.length !== 1 ? 's' : ''}
          </div>
        </CardFooter>
      </Card>

      {/* IP Addresses Card */}
      <Card className="@container/card border-l-4 border-l-emerald-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              IP Addresses
            </CardDescription>
            {newIps > 0 && (
              <Badge variant="outline" className="text-xs">
                <IconTrendingUp className="h-3 w-3" />
                +{newIps}
              </Badge>
            )}
          </div>
          <CardTitle className="text-3xl font-bold tabular-nums">
            {formatNumber(stats.stats.ips.active)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="pt-2 border-t border-border/50">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{Math.round((stats.stats.ips.active / stats.stats.ips.total) * 100)}%</span> active ({stats.stats.ips.total} total)
          </div>
        </CardFooter>
      </Card>

      {/* Open Ports Card */}
      <Card className="@container/card border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Open Ports
            </CardDescription>
            {newPorts > 0 && (
              <Badge variant="outline" className="text-xs">
                <IconTrendingUp className="h-3 w-3" />
                +{newPorts}
              </Badge>
            )}
          </div>
          <CardTitle className="text-3xl font-bold tabular-nums">
            {formatNumber(stats.stats.ports)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="pt-2 border-t border-border/50">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{formatNumber(stats.stats.services)}</span> services running
          </div>
        </CardFooter>
      </Card>

      {/* Web Endpoints Card */}
      <Card className="@container/card border-l-4 border-l-purple-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Web Endpoints
            </CardDescription>
            {newEndpoints > 0 && (
              <Badge variant="outline" className="text-xs">
                <IconTrendingUp className="h-3 w-3" />
                +{newEndpoints}
              </Badge>
            )}
          </div>
          <CardTitle className="text-3xl font-bold tabular-nums">
            {formatNumber(stats.stats.endpoints)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="pt-2 border-t border-border/50">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{stats.stats.endpoints > 0 ? Math.round((stats.stats.tls / stats.stats.endpoints) * 100) : 0}%</span> HTTPS secured
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
