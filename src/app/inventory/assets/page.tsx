"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { RouteGuard } from "@/components/route-guard"
import { DataTableSimple } from "@/components/data-table-simple"
import {
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function InventoryAssetsPage() {
  return (
    <RouteGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* Page Header */}
                <div className="px-4 lg:px-6">
                  <div className="flex flex-col gap-2">
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem>
                          <BreadcrumbLink href="/overview">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbLink href="/inventory">Inventory</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>Assets</BreadcrumbPage>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
                      <p className="text-muted-foreground">
                        View and manage all discovered assets in your attack surface
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assets Table */}
                <DataTableSimple />
              </div>
            </div>
          </div>
        </main>
      </SidebarProvider>
    </RouteGuard>
  )
}
