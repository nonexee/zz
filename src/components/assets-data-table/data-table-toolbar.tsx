import { Table } from "@tanstack/react-table"
import { X, Globe, Server, Activity, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

const assetTypes = [
  { label: "Domain", value: "domain", icon: Globe },
  { label: "IP Address", value: "ip", icon: Server },
]

const assetStatuses = [
  { label: "Active", value: "active", icon: Activity },
  { label: "Inactive", value: "inactive", icon: EyeOff },
]

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  isLoading?: boolean
  totalCount?: number
}

export function DataTableToolbar<TData>({
  table,
  isLoading = false,
  totalCount = 0,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Search input */}
        <Input
          placeholder="Filter assets..."
          value={(table.getColumn("identifier")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("identifier")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
          disabled={isLoading}
        />
        
        {/* Asset type filter */}
        {table.getColumn("type") && (
          <DataTableFacetedFilter
            column={table.getColumn("type")}
            title="Type"
            options={assetTypes}
          />
        )}
        
        {/* Asset status filter */}
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={assetStatuses}
          />
        )}
        
        {/* Clear filters button */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
            disabled={isLoading}
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
        
        {/* Loading indicator in toolbar */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Loading...</span>
          </div>
        )}
      </div>
      
      {/* Right side - view options and total count */}
      <div className="flex items-center space-x-4">
        {/* Total count display */}
        {totalCount > 0 && (
          <div className="text-sm text-muted-foreground">
            {totalCount.toLocaleString()} asset{totalCount !== 1 ? 's' : ''}
          </div>
        )}
        
        {/* View options */}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
