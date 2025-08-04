"use client"

import { SidebarIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { SearchForm } from "@/components/search-form"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    
    if (segments.length === 0 || segments[0] === 'overview') {
      return (
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/overview">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Overview</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      )
    }

    if (segments[0] === 'inventory') {
      if (segments[1] === 'assets') {
        return (
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/overview">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inventory/assets">Inventory</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Assets</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        )
      }
      
      if (segments[1] === 'findings') {
        return (
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/overview">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inventory/assets">Inventory</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Findings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        )
      }
      
      // Default inventory page
      return (
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/overview">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Inventory</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      )
    }

    if (segments[0] === 'reports') {
      return (
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/overview">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      )
    }

    if (segments[0] === 'settings') {
      return (
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/overview">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      )
    }

    // Default fallback
    return (
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/overview">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="capitalize">
            {segments[segments.length - 1].replace('-', ' ')}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    )
  }

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-16 w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          {getBreadcrumbs()}
        </Breadcrumb>
        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
        <div className="ml-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

