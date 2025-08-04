"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { apiClient } from "@/lib/api"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
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

export const description = "Asset discovery trends over time"

const chartConfig = {
  cumulativeDomains: {
    label: "Domains",
    color: "var(--primary)",
  },
  cumulativeIps: {
    label: "IP Addresses", 
    color: "var(--primary)",
  },
  domains: {
    label: "Domains",
    color: "var(--primary)",
  },
  ips: {
    label: "IP Addresses",
    color: "var(--primary)",
  }
} satisfies ChartConfig

type ChartData = {
  date: string;
  cumulativeDomains: number;
  cumulativeIps: number;
  cumulativeEndpoints: number;
  cumulativePorts: number;
  domains: number;
  ips: number;
  endpoints: number;
  ports: number;
}

export function ChartAreaAssetDiscovery() {
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
          domains: Math.max(0, item.domains || 0),
          ips: Math.max(0, item.ips || 0)
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      setChartData(cleanedData)
    } catch (err) {
      console.error("Failed to fetch asset trends:", err)
      setError(err instanceof Error ? err.message : "Failed to load chart data")
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  React.useEffect(() => {
    fetchData()
  }, [timeRange])

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
    
    // Take only the last N data points to ensure we don't exceed bounds
    const maxDataPoints = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    
    return chartData
      .filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate >= startDate && itemDate <= now
      })
      .slice(-maxDataPoints) // Take only the last N points
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [chartData, timeRange])

  const getDataKeys = () => {
    if (viewMode === "cumulative") {
      return ["cumulativeDomains", "cumulativeIps"]
    } else {
      return ["domains", "ips"]
    }
  }

  const getChartTitle = () => {
    if (viewMode === "cumulative") {
      return "Total Assets Discovered"
    } else {
      return "New Assets by Day"
    }
  }

  const getChartDescription = () => {
    const period = timeRange === "7d" ? "week" : timeRange === "30d" ? "month" : "3 months"
    const view = viewMode === "cumulative" ? "cumulative totals" : "daily discoveries"
    return `Asset discovery ${view} for the last ${period}`
  }

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Asset Discovery Trends</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="h-[250px] animate-pulse bg-muted rounded-md" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Asset Discovery Trends</CardTitle>
          <CardDescription>Failed to load chart data</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="h-[250px] flex items-center justify-center bg-muted rounded-md">
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
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {getChartDescription()}
          </span>
          <span className="@[540px]/card:hidden">
            {viewMode === "cumulative" ? "Total" : "New"} assets over time
          </span>
        </CardDescription>
        <CardAction>
          <div className="flex flex-col gap-2 @[767px]/card:flex-row @[767px]/card:items-center">
            {/* View Mode Toggle */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as "cumulative" | "new")}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-3 @[500px]/card:flex"
            >
              <ToggleGroupItem value="cumulative">Cumulative</ToggleGroupItem>
              <ToggleGroupItem value="new">Daily New</ToggleGroupItem>
            </ToggleGroup>

            {/* Time Range Controls */}
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            >
              <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
              <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
              <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
            </ToggleGroup>

            {/* Mobile Select */}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
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
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart 
            data={filteredData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="fillDomains" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--primary)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--primary)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillIps" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--primary)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--primary)"
                  stopOpacity={0.1}
                />
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
              defaultIndex={isMobile ? -1 : Math.floor(filteredData.length / 2)}
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
            {getDataKeys().map((key, index) => (
              <Area
                key={key}
                dataKey={key}
                type="monotone"
                fill={index === 0 ? "url(#fillDomains)" : "url(#fillIps)"}
                stroke="var(--primary)"
                strokeWidth={2}
                stackId="a"
                connectNulls={false}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
