"use client"

import { ColumnDef } from "@tanstack/react-table"
import { 
  Globe, 
  Server, 
  Activity, 
  EyeOff, 
  ExternalLink, 
  Shield, 
  Wifi,
  MoreHorizontal 
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { DataTableColumnHeader } from "./data-table-column-header"

// Asset type based on your API
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
}

// Row Actions Component
function DataTableRowActions({ row }: { row: any }) {
  const asset = row.original as Asset

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem>
          <ExternalLink className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Shield className="mr-2 h-4 w-4" />
          Security Info
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Activity className="mr-2 h-4 w-4" />
          Scan History
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Wifi className="mr-2 h-4 w-4" />
          Network Map
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const columns: ColumnDef<Asset>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "identifier",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Asset" />
    ),
    cell: ({ row }) => {
      const asset = row.original
      const Icon = asset.type === 'domain' ? Globe : Server

      return (
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="max-w-[500px] truncate font-medium">
              {asset.identifier}
            </span>
            {asset.isApex && (
              <Badge variant="outline" className="w-fit text-xs">
                Apex Domain
              </Badge>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      const Icon = type === 'domain' ? Globe : Server
      const label = type === 'domain' ? 'Domain' : 'IP Address'

      return (
        <div className="flex w-[100px] items-center">
          <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.original.isActive

      return (
        <div className="flex items-center">
          {isActive ? (
            <Activity className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <EyeOff className="mr-2 h-4 w-4 text-gray-400" />
          )}
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const isActive = row.original.isActive
      const status = isActive ? "active" : "inactive"
      return value.includes(status)
    },
  },
  {
    accessorKey: "ports",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Open Ports" />
    ),
    cell: ({ row }) => {
      const asset = row.original
      const portCount = asset.portStats?.uniquePortCount || 0
      const topPorts = asset.portStats?.uniqueOpenPorts?.slice(0, 3) || asset.openPorts?.slice(0, 3) || []

      return (
        <div className="flex flex-col space-y-1">
          <span className="font-medium">{portCount}</span>
          {topPorts.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {topPorts.map((port) => (
                <Badge key={port} variant="outline" className="text-xs">
                  {port}
                </Badge>
              ))}
              {portCount > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{portCount - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.portStats?.uniquePortCount || 0
      const b = rowB.original.portStats?.uniquePortCount || 0
      return a - b
    },
  },
  {
    accessorKey: "services",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Services" />
    ),
    cell: ({ row }) => {
      const serviceCount = row.original.serviceStats?.totalServices || 0
      return <span className="font-medium">{serviceCount}</span>
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.serviceStats?.totalServices || 0
      const b = rowB.original.serviceStats?.totalServices || 0
      return a - b
    },
  },
  {
    accessorKey: "endpoints",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Web Endpoints" />
    ),
    cell: ({ row }) => {
      const asset = row.original
      const endpointCount = asset.endpointStats?.totalEndpoints || 0
      const httpsCount = asset.endpointStats?.schemes?.https || 0
      const httpCount = asset.endpointStats?.schemes?.http || 0

      return (
        <div className="flex flex-col space-y-1">
          <span className="font-medium">{endpointCount}</span>
          {endpointCount > 0 && (
            <div className="flex space-x-1">
              {httpsCount > 0 && (
                <Badge variant="default" className="text-xs bg-green-500">
                  {httpsCount} HTTPS
                </Badge>
              )}
              {httpCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {httpCount} HTTP
                </Badge>
              )}
            </div>
          )}
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.endpointStats?.totalEndpoints || 0
      const b = rowB.original.endpointStats?.totalEndpoints || 0
      return a - b
    },
  },
  {
    accessorKey: "certificates",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Certificates" />
    ),
    cell: ({ row }) => {
      const asset = row.original
      const certCount = asset.certificateStats?.totalCertificates || 0
      const validCount = asset.certificateStats?.validCertificates || 0
      const expiringSoon = asset.certificateStats?.expiringSoon || 0

      return (
        <div className="flex flex-col space-y-1">
          <span className="font-medium">{certCount}</span>
          {certCount > 0 && (
            <div className="flex space-x-1">
              {validCount > 0 && (
                <Badge variant="default" className="text-xs bg-green-500">
                  {validCount} Valid
                </Badge>
              )}
              {expiringSoon > 0 && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  {expiringSoon} Expiring
                </Badge>
              )}
            </div>
          )}
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.certificateStats?.totalCertificates || 0
      const b = rowB.original.certificateStatus?.totalCertificates || 0
      return a - b
    },
  },
  {
    accessorKey: "lastSeen",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Seen" />
    ),
    cell: ({ row }) => {
      const lastSeen = row.getValue("lastSeen") as string
      if (!lastSeen) return <span className="text-muted-foreground">N/A</span>
      
      const date = new Date(lastSeen)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
      
      let timeAgo = ""
      if (diffInHours < 1) {
        timeAgo = "Just now"
      } else if (diffInHours < 24) {
        timeAgo = `${diffInHours}h ago`
      } else {
        const diffInDays = Math.floor(diffInHours / 24)
        timeAgo = `${diffInDays}d ago`
      }

      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{timeAgo}</span>
          <span className="text-xs text-muted-foreground">
            {date.toLocaleDateString()}
          </span>
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = new Date(rowA.getValue("lastSeen") || 0).getTime()
      const b = new Date(rowB.getValue("lastSeen") || 0).getTime()
      return a - b
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
