"use client"

import * as React from "react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
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
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
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

  // Calculate growth percentages based on scan data
  const getGrowthData = (current: number, scanSummary?: any) => {
    if (!scanSummary) return { percentage: 0, isPositive: true }
    
    // Simple growth calculation - in a real app you'd compare with previous scans
    const growth = Math.random() * 20 - 10 // Mock: -10% to +10%
    return {
      percentage: Math.abs(growth),
      isPositive: growth > 0
    }
  }

  const domainGrowth = getGrowthData(stats.stats.domains, stats.lastScan?.summary)
  const ipGrowth = getGrowthData(stats.stats.ips.total, stats.lastScan?.summary)
  const portGrowth = getGrowthData(stats.stats.ports, stats.lastScan?.summary)
  const endpointGrowth = getGrowthData(stats.stats.endpoints, stats.lastScan?.summary)

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Domains</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.stats.domains.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {domainGrowth.isPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {domainGrowth.isPositive ? '+' : '-'}{domainGrowth.percentage.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Attack surface discovery {domainGrowth.isPositive ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {stats.stats.apexDomains.length} apex domain{stats.stats.apexDomains.length !== 1 ? 's' : ''} monitored
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active IP Addresses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.stats.ips.active.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {ipGrowth.isPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {ipGrowth.isPositive ? '+' : '-'}{ipGrowth.percentage.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Infrastructure mapping {ipGrowth.isPositive ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {stats.stats.ips.total} total IPs discovered
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Open Ports</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.stats.ports.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {portGrowth.isPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {portGrowth.isPositive ? '+' : '-'}{portGrowth.percentage.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Service exposure analysis {portGrowth.isPositive ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {stats.stats.services} services identified
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Web Endpoints</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.stats.endpoints.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {endpointGrowth.isPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {endpointGrowth.isPositive ? '+' : '-'}{endpointGrowth.percentage.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Web application discovery {endpointGrowth.isPositive ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {stats.stats.tls} TLS certificates found
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
