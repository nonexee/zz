"use client"

import * as React from "react"
import { 
  IconTrendingUp,
  IconTrendingDown,
  IconMinus
} from "@tabler/icons-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { useOverview } from "@/components/overview-context"
import { apiClient } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Mini trend chart data type
type TrendData = {
  date: string;
  value: number;
}

export function SectionCards() {
  const { stats, loading, error } = useOverview()
  const [trendData, setTrendData] = React.useState<{
    domains: TrendData[];
    ips: TrendData[];
    ports: TrendData[];
    endpoints: TrendData[];
  } | null>(null)

  // Fetch trend data for mini charts
  React.useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const response = await apiClient.getAssetDiscoveryTrends({
          period: '7d',
          granularity: 'daily'
        })
        
        // Extract data for each asset type
        const domains = response.data.map(d => ({ date: d.date, value: d.cumulativeDomains }))
        const ips = response.data.map(d => ({ date: d.date, value: d.cumulativeIps }))
        const ports = response.data.map(d => ({ date: d.date, value: d.cumulativePorts }))
        const endpoints = response.data.map(d => ({ date: d.date, value: d.cumulativeEndpoints }))
        
        setTrendData({ domains, ips, ports, endpoints })
      } catch (err) {
        console.error("Failed to fetch trend data for cards:", err)
      }
    }

    if (!loading && stats) {
      fetchTrendData()
    }
  }, [loading, stats])

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

  // Calculate trend direction and percentage
  const calculateTrend = (data: TrendData[] | undefined) => {
    if (!data || data.length < 2) return { direction: 'stable', percentage: 0, icon: IconMinus }
    
    const current = data[data.length - 1].value
    const previous = data[data.length - 2].value
    
    if (current > previous) {
      const percentage = previous === 0 ? 100 : ((current - previous) / previous) * 100
      return { direction: 'up', percentage, icon: IconTrendingUp }
    } else if (current < previous) {
      const percentage = ((previous - current) / previous) * 100
      return { direction: 'down', percentage, icon: IconTrendingDown }
    }
    
    return { direction: 'stable', percentage: 0, icon: IconMinus }
  }

  // Mini trend chart component with gradient fill matching main chart style
  const MiniTrendChart = ({ data, color, gradientId }: { data: TrendData[] | undefined, color: string, gradientId: string }) => {
    if (!data || data.length < 2) return null
    
    return (
      <div className="absolute inset-0 opacity-15">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Trend badge component
  const TrendBadge = ({ data, newCount }: { data: TrendData[] | undefined, newCount: number }) => {
    const trend = calculateTrend(data)
    const TrendIcon = trend.icon
    
    // If we have new assets from the last scan, show that instead of trend
    if (newCount > 0) {
      return (
        <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400">
          <IconTrendingUp className="h-3 w-3" />
          +{newCount}
        </Badge>
      )
    }
    
    // Show trend based on data
    if (trend.direction === 'stable') return null
    
    const badgeClass = trend.direction === 'up' 
      ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400"
      : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400"
    
    return (
      <Badge variant="outline" className={`text-xs ${badgeClass}`}>
        <TrendIcon className="h-3 w-3" />
        {trend.percentage > 0 && trend.percentage < 1 ? '<1' : Math.round(trend.percentage)}%
      </Badge>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Domains Card */}
      <Card className="@container/card border-l-4 border-l-blue-500 relative overflow-hidden bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent">
        <MiniTrendChart data={trendData?.domains} color="#3b82f6" gradientId="miniDomains" />
        <CardHeader className="pb-2 relative z-10">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Domains
            </CardDescription>
            <TrendBadge data={trendData?.domains} newCount={newDomains} />
          </div>
          <CardTitle className="text-3xl font-bold tabular-nums">
            {formatNumber(stats.stats.domains)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="pt-2 border-t border-border/50 relative z-10">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{stats.stats.apexDomains.length}</span> apex domain{stats.stats.apexDomains.length !== 1 ? 's' : ''}
          </div>
        </CardFooter>
      </Card>

      {/* IP Addresses Card */}
      <Card className="@container/card border-l-4 border-l-emerald-500 relative overflow-hidden bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent">
        <MiniTrendChart data={trendData?.ips} color="#10b981" gradientId="miniIps" />
        <CardHeader className="pb-2 relative z-10">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              IP Addresses
            </CardDescription>
            <TrendBadge data={trendData?.ips} newCount={newIps} />
          </div>
          <CardTitle className="text-3xl font-bold tabular-nums">
            {formatNumber(stats.stats.ips.active)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="pt-2 border-t border-border/50 relative z-10">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{Math.round((stats.stats.ips.active / stats.stats.ips.total) * 100)}%</span> active ({stats.stats.ips.total} total)
          </div>
        </CardFooter>
      </Card>

      {/* Open Ports Card */}
      <Card className="@container/card border-l-4 border-l-orange-500 relative overflow-hidden bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20 dark:to-transparent">
        <MiniTrendChart data={trendData?.ports} color="#f97316" gradientId="miniPorts" />
        <CardHeader className="pb-2 relative z-10">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Open Ports
            </CardDescription>
            <TrendBadge data={trendData?.ports} newCount={newPorts} />
          </div>
          <CardTitle className="text-3xl font-bold tabular-nums">
            {formatNumber(stats.stats.ports)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="pt-2 border-t border-border/50 relative z-10">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{formatNumber(stats.stats.services)}</span> services running
          </div>
        </CardFooter>
      </Card>

      {/* Web Endpoints Card */}
      <Card className="@container/card border-l-4 border-l-purple-500 relative overflow-hidden bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent">
        <MiniTrendChart data={trendData?.endpoints} color="#a855f7" gradientId="miniEndpoints" />
        <CardHeader className="pb-2 relative z-10">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Web Endpoints
            </CardDescription>
            <TrendBadge data={trendData?.endpoints} newCount={newEndpoints} />
          </div>
          <CardTitle className="text-3xl font-bold tabular-nums">
            {formatNumber(stats.stats.endpoints)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="pt-2 border-t border-border/50 relative z-10">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{stats.stats.endpoints > 0 ? Math.round((stats.stats.tls / stats.stats.endpoints) * 100) : 0}%</span> HTTPS secured
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
