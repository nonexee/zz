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

export const description = "Asset discovery trends starting from first scan"

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

type SummaryData = {
  period: string;
  granularity: string;
  totalDataPoints: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  firstScanDate?: string;
  totals: {
    domainsDiscovered: number;
    ipsDiscovered: number;
    portsDiscovered: number;
    servicesDiscovered: number;
    endpointsDiscovered: number;
    certificatesDiscovered: number;
  };
  currentTotals: {
    domains: number;
    ips: number;
    ports: number;
    services: number;
    endpoints: number;
    certificates: number;
  };
  breakdown: {
    httpEndpoints: number;
    httpsEndpoints: number;
    tcpPorts: number;
    udpPorts: number;
    validCertificates: number;
    wildcardCertificates: number;
  };
}

export function ChartUnifiedAssetDiscovery() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [viewMode, setViewMode] = React.useState<"cumulative" | "new">("cumulative")

  const [chartData, setChartData] = React.useState<ChartData[]>([])
  const [summary, setSummary] = React.useState<SummaryData | null>(null)
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
      
      // The backend now returns clean data starting from first scan
      setChartData(response.data)
      setSummary(response.summary)
      
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
    if (!summary) {
      return "Loading chart data..."
    }

    if (summary.totalDataPoints === 0) {
      return "No scan data available yet"
    }

    const view = viewMode === "cumulative" ? "cumulative totals" : "daily discoveries"
    const dataPoints = summary.totalDataPoints
    const unit = dataPoints === 1 ? "day" : "days"
    
    // Show when scanning started if we have that info
    if (summary.firstScanDate) {
      const firstScanDate = new Date(summary.firstScanDate)
      const daysSinceFirstScan = Math.floor((Date.now() - firstScanDate.getTime()) / (24 * 60 * 60 * 1000))
      return `Asset discovery ${view} over ${dataPoints} ${unit} (scanning started ${daysSinceFirstScan} days ago)`
    }
    
    return `Asset discovery ${view} over ${dataPoints} ${unit}`
  }

  // Show empty state for no scans
  if (!loading && summary && summary.totalDataPoints === 0) {
    return (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Asset Discovery Trends</CardTitle>
            <CardDescription>No asset discovery data available</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="h-[350px] flex items-center justify-center bg-muted rounded-md">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No scans have been completed yet</p>
              <p className="text-sm text-muted-foreground">
                Asset discovery trends will appear here after your first scan
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show current state for single data point (first scan)
  if (!loading && summary && summary.totalDataPoints === 1) {
    const currentData = chartData[0]
    
    return (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Assets Discovered in Initial Scan</CardTitle>
            <CardDescription>
              {summary.firstScanDate && new Date(summary.firstScanDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
              })} - Trends will show after more scans
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-l-blue-500">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {currentData.cumulativeDomains}
              </div>
              <div className="text-sm text-muted-foreground">Domains</div>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border-l-4 border-l-emerald-500">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {currentData.cumulativeIps}
              </div>
              <div className="text-sm text-muted-foreground">IP Addresses</div>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-l-4 border-l-orange-500">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {currentData.cumulativePorts}
              </div>
              <div className="text-sm text-muted-foreground">Open Ports</div>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-l-purple-500">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {currentData.cumulativeEndpoints}
              </div>
              <div className="text-sm text-muted-foreground">Web Endpoints</div>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border-l-4 border-l-indigo-500">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {currentData.cumulativeServices}
              </div>
              <div className="text-sm text-muted-foreground">Services</div>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-teal-50 dark:bg-teal-950/20 rounded-lg border-l-4 border-l-teal-500">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {currentData.cumulativeCertificates}
              </div>
              <div className="text-sm text-muted-foreground">TLS Certificates</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-center text-muted-foreground text-sm">
              � Initial scan completed! Trends and charts will appear here as you perform more scans over time.
            </p>
          </div>
        </CardContent>
      </Card>
    )
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
            data={chartData}
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
                  // Add dots for better visibility on sparse data
                  dot={chartData.length <= 5 ? { r: 4 } : false}
                  activeDot={{ r: 6 }}
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
