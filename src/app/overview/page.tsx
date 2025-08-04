"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { RouteGuard } from "@/components/route-guard"
import { OverviewProvider } from "@/components/overview-context"
import {
  SidebarProvider,
} from "@/components/ui/sidebar"

function OverviewContent() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
      </div>
    </div>
  )
}

export default function OverviewPage() {
  return (
    <RouteGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <OverviewProvider>
              <OverviewContent />
            </OverviewProvider>
          </div>
        </main>
      </SidebarProvider>
    </RouteGuard>
  )
}
