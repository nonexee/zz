"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { apiClient } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Comprehensive asset discovery trends over time"

const chartConfig = {
  // Primary Assets (matches your card colors)
  cumulativeDomains: {
    label: "Domains",
    color: "var(--chart-1)", // Blue - matches domains card
  },
  cumulativeIps: {
    label: "IP Addresses", 
    color: "var(--chart-2)", // Blue variant - matches IPs card
  },
  cumulativeEndpoints: {
    label: "Web Endpoints",
    color: "var(--chart-4)", // Different color - matches endpoints card
  },
  // Infrastructure Assets
  cumulativePorts: {
    label: "Open Ports",
    color: "var(--chart-3)", // Orange/yellow - matches ports card
  },
  cumulativeServices: {
    label: "Services",
    color: "var(--chart-5)", // Purple - matches services
  },
  cumulativeCertificates: {
    label: "TLS Certificates",
    color: "var(--chart-1)", // Matches certificates/security theme
  },
  // Daily variants
  domains: {
    label: "Domains",
    color: "var(--chart-1)",
  },
  ips: {
    label: "IP Addresses",
    color: "var(--chart-2)",
  },
  endpoints: {
    label: "Web Endpoints",
    color: "var(--chart-4)",
  },
  ports: {
    label: "Open Ports",
    color: "var(--chart-3)",
  },
  services: {
    label: "Services",
    color: "var(--chart-5)",
  },
  certificates: {
    label: "TLS Certificates",
    color: "var(--chart-1)",
  }
} satisfies ChartConfig

type ChartData = {
  date: string;
  cumulativeDomains: number;
  cumulativeIps: number;
  cumulativeEndpoints: number;
  cumulativePorts: number;
  cumulativeServices: number;
  cumulativeCertificates: number;
  domains: number;
  ips: number;
  endpoints: number;
  ports: number;
  services: number;
  certificates: number;
}

export function ChartUnifiedAssetDiscovery() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [viewMode, setViewMode] = React.useState<"cumulative" | "new">("cumulative")

  const [chartData, setChartData] = React.useState<ChartData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const granularity = timeRange === "7d" ? "daily" : "daily"
      const response = await apiClient.getAssetDiscoveryTrends({
        period: timeRange as "7d" | "30d" | "90d",
        granularity
      })
      
      // Filter and clean the data
      const now = new Date()
      const cleanedData = response.data
        .filter(item => {
          const itemDate = new Date(item.date)
          return itemDate <= now && !isNaN(itemDate.getTime())
        })
        .map(item => ({
          ...item,
          // Ensure no negative values or NaN
          cumulativeDomains: Math.max(0, item.cumulativeDomains || 0),
          cumulativeIps: Math.max(0, item.cumulativeIps || 0),
          cumulativeEndpoints: Math.max(0, item.cumulativeEndpoints || 0),
          cumulativePorts: Math.max(0, item.cumulativePorts || 0),
          cumulativeServices: Math.max(0, item.cumulativeServices || 0),
          cumulativeCertificates: Math.max(0, item.cumulativeCertificates || 0),
          domains: Math.max(0, item.domains || 0),
          ips: Math.max(0, item.ips || 0),
          endpoints: Math.max(0, item.endpoints || 0),
          ports: Math.max(0, item.ports || 0),
          services: Math.max(0, item.services || 0),
          certificates: Math.max(0, item.certificates || 0)
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      // Ensure cumulative data is truly cumulative (monotonically increasing)
      let maxDomains = 0
      let maxIps = 0
      let maxEndpoints = 0
      let maxPorts = 0
      let maxServices = 0
      let maxCertificates = 0
      
      const monotonicData = cleanedData.map(item => {
        maxDomains = Math.max(maxDomains, item.cumulativeDomains)
        maxIps = Math.max(maxIps, item.cumulativeIps)
        maxEndpoints = Math.max(maxEndpoints, item.cumulativeEndpoints)
        maxPorts = Math.max(maxPorts, item.cumulativePorts)
        maxServices = Math.max(maxServices, item.cumulativeServices)
        maxCertificates = Math.max(maxCertificates, item.cumulativeCertificates)
        
        return {
          ...item,
          cumulativeDomains: maxDomains,
          cumulativeIps: maxIps,
          cumulativeEndpoints: maxEndpoints,
          cumulativePorts: maxPorts,
          cumulativeServices: maxServices,
          cumulativeCertificates: maxCertificates
        }
      })
      
      setChartData(monotonicData)
    } catch (err) {
      console.error("Failed to fetch asset trends:", err)
      setError(err instanceof Error ? err.message : "Failed to load chart data")
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredData = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return []
    
    const now = new Date()
    let daysToSubtract = 30
    
    if (timeRange === "90d") {
      daysToSubtract = 90
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    
    const maxDataPoints = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    
    return chartData
      .filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate >= startDate && itemDate <= now
      })
      .slice(-maxDataPoints)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [chartData, timeRange])

  const getDataKeys = () => {
    const prefix = viewMode === "cumulative" ? "cumulative" : ""
    const suffix = viewMode === "cumulative" ? "" : ""
    
    // Show all assets
    return [
      `${prefix}${prefix ? "D" : "d"}omains${suffix}`,
      `${prefix}${prefix ? "I" : "i"}ps${suffix}`,
      `${prefix}${prefix ? "E" : "e"}ndpoints${suffix}`,
      `${prefix}${prefix ? "P" : "p"}orts${suffix}`,
      `${prefix}${prefix ? "S" : "s"}ervices${suffix}`,
      `${prefix}${prefix ? "C" : "c"}ertificates${suffix}`
    ]
  }

  const getChartTitle = () => {
    const modeText = viewMode === "cumulative" ? "Total Assets Discovered" : "New Assets by Day"
    return modeText
  }

  const getChartDescription = () => {
    const period = timeRange === "7d" ? "week" : timeRange === "30d" ? "month" : "3 months"
    const view = viewMode === "cumulative" ? "cumulative totals" : "daily discoveries"
    return `Asset discovery ${view} for the last ${period}`
  }

  if (loading) {
    return (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Asset Discovery Trends</CardTitle>
            <CardDescription>Loading chart data...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="h-[350px] animate-pulse bg-muted rounded-md" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Asset Discovery Trends</CardTitle>
            <CardDescription>Failed to load chart data</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="h-[350px] flex items-center justify-center bg-muted rounded-md">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">{error}</p>
              <button 
                onClick={fetchData}
                className="text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>{getChartTitle()}</CardTitle>
          <CardDescription>
            {getChartDescription()}
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* View Mode Toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as "cumulative" | "new")}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-3 sm:flex"
          >
            <ToggleGroupItem value="cumulative">Cumulative</ToggleGroupItem>
            <ToggleGroupItem value="new">Daily New</ToggleGroupItem>
          </ToggleGroup>

          {/* Time Range Selector */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px] rounded-lg"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <AreaChart 
            data={filteredData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="fillDomains" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cumulativeDomains)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-cumulativeDomains)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillIps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cumulativeIps)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-cumulativeIps)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillEndpoints" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cumulativeEndpoints)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-cumulativeEndpoints)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillPorts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cumulativePorts)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-cumulativePorts)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillServices" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cumulativeServices)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-cumulativeServices)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillCertificates" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cumulativeCertificates)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-cumulativeCertificates)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              type="category"
              scale="point"
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            {getDataKeys().map((key, index) => {
              const fillUrls = [
                "url(#fillDomains)", "url(#fillIps)", "url(#fillEndpoints)", 
                "url(#fillPorts)", "url(#fillServices)", "url(#fillCertificates)"
              ]
              const strokeColors = [
                "var(--color-cumulativeDomains)", "var(--color-cumulativeIps)", "var(--color-cumulativeEndpoints)",
                "var(--color-cumulativePorts)", "var(--color-cumulativeServices)", "var(--color-cumulativeCertificates)"
              ]
              
              return (
                <Area
                  key={key}
                  dataKey={key}
                  type="monotone"
                  fill={fillUrls[index % fillUrls.length]}
                  stroke={strokeColors[index % strokeColors.length]}
                  strokeWidth={2}
                  stackId={viewMode === "cumulative" ? "a" : undefined}
                  connectNulls={false}
                />
              )
            })}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
