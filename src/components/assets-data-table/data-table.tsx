"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"

// Types to match the page component
interface PaginationState {
  pageIndex: number
  pageSize: number
}

interface FiltersState {
  type?: 'domain' | 'ip'
  status: 'active' | 'inactive' | 'all'
  search?: string
}

interface SortingState {
  id: string
  desc: boolean
}[]

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  
  // Pagination props (controlled externally)
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  totalCount: number
  
  // Filter props (controlled externally)
  filters: FiltersState
  onFiltersChange: (filters: FiltersState) => void
  
  // Sorting props (controlled externally)
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  
  // Loading and error states
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  onPaginationChange,
  totalCount,
  filters,
  onFiltersChange,
  sorting,
  onSortingChange,
  isLoading = false,
  error = null,
  onRetry
}: DataTableProps<TData, TValue>) {
  
  // Row selection (local state - doesn't affect API)
  const [rowSelection, setRowSelection] = React.useState({})
  
  // Column visibility (local state)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  
  // Column filters for search (we'll map this to our filters)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    
    // State
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination
    },
    
    // Row selection
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    
    // Sorting - controlled externally
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      onSortingChange(newSorting)
    },
    
    // Column visibility - local
    onColumnVisibilityChange: setColumnVisibility,
    
    // Column filters - we'll handle this specially
    onColumnFiltersChange: (updater) => {
      const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater
      setColumnFilters(newFilters)
      
      // Map column filters to our filters format
      const searchFilter = newFilters.find(f => f.id === 'identifier')
      const typeFilter = newFilters.find(f => f.id === 'type')
      const statusFilter = newFilters.find(f => f.id === 'status')
      
      onFiltersChange({
        ...filters,
        search: searchFilter?.value as string | undefined,
        type: typeFilter?.value as ('domain' | 'ip') | undefined,
        status: statusFilter?.value as ('active' | 'inactive' | 'all') || filters.status
      })
    },
    
    // Pagination - controlled externally  
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater
      onPaginationChange(newPagination)
    },
    
    // Manual pagination (we control it via API)
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    
    // Page count calculation
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    
    // Core functionality
    getCoreRowModel: getCoreRowModel(),
  })

  // Sync column filters with external filters
  React.useEffect(() => {
    const newColumnFilters: ColumnFiltersState = []
    
    if (filters.search) {
      newColumnFilters.push({ id: 'identifier', value: filters.search })
    }
    if (filters.type) {
      newColumnFilters.push({ id: 'type', value: [filters.type] })
    }
    if (filters.status !== 'all') {
      newColumnFilters.push({ id: 'status', value: [filters.status] })
    }
    
    setColumnFilters(newColumnFilters)
  }, [filters])

  return (
    <div className="h-full flex flex-col">
      {/* Fixed toolbar */}
      <div className="flex-shrink-0 mb-4">
        <DataTableToolbar 
          table={table} 
          isLoading={isLoading}
          totalCount={totalCount}
        />
      </div>
      
      {/* Table container with loading overlay */}
      <div className="flex-1 min-h-0 rounded-md border relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        )}
        
        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive mb-2 font-medium">Error loading data</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              {onRetry && (
                <button 
                  onClick={onRetry}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Table */}
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>Loading assets...</span>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-2">No assets found</p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your filters or check back later
                        </p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Fixed pagination */}
      <div className="flex-shrink-0 mt-4">
        <DataTablePagination 
          table={table} 
          totalCount={totalCount}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
