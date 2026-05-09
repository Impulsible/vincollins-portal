// components/layout/header/DesktopNav.tsx - WITH ALL NAVIGATION ITEMS
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, Users, MonitorPlay, FileCheck, Activity, GraduationCap,
  BookOpen, FileText, Phone, Laptop, Briefcase, MessageSquare, BarChart3,
  ChevronDown
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type UserRole = 'admin' | 'teacher' | 'student'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  shortName?: string
  isDropdown?: boolean
  dropdownItems?: { name: string; href: string; icon: React.ElementType }[]
}

const userManagementItems = [
  { name: 'Students', href: '/admin/students', icon: GraduationCap },
  { name: 'Staff', href: '/admin/staff', icon: Briefcase },
  { name: 'Inquiries', href: '/admin/inquiries', icon: MessageSquare },
]

const navMap: Record<UserRole, NavItem[]> = {
  admin: [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard, shortName: 'Home' },
    { name: 'User Management', href: '#', icon: Users, shortName: 'Users', isDropdown: true, dropdownItems: userManagementItems },
    { name: 'Exam Approvals', href: '/admin/exams', icon: MonitorPlay, shortName: 'Exams' },
    { name: 'Reports', href: '/admin/report-cards', icon: FileCheck, shortName: 'Reports' },
    { name: 'Monitor', href: '/admin/monitor', icon: Activity, shortName: 'Monitor' },
  ],
  teacher: [
    { name: 'Overview', href: '/staff', icon: LayoutDashboard, shortName: 'Home' },
    { name: 'Exams', href: '/staff/exams', icon: MonitorPlay, shortName: 'Exams' },
    { name: 'Assignments', href: '/staff/assignments', icon: FileText, shortName: 'Assign' },
    { name: 'Students', href: '/staff/students', icon: Users, shortName: 'Students' },
    { name: 'Analytics', href: '/staff/analytics', icon: BarChart3, shortName: 'Stats' },
  ],
  student: [
    { name: 'Overview', href: '/student', icon: LayoutDashboard, shortName: 'Home' },
    { name: 'My Exams', href: '/student/exams', icon: MonitorPlay, shortName: 'Exams' },
    { name: 'Results', href: '/student/results', icon: GraduationCap, shortName: 'Results' },
    { name: 'Profile', href: '/student/profile', icon: Users, shortName: 'Profile' },
  ],
}

interface DesktopNavProps {
  userRole?: string
}

export function DesktopNav({ userRole }: DesktopNavProps) {
  const pathname = usePathname()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const role = (userRole || 'student') as UserRole
  const items = navMap[role] || navMap.student

  const isActive = (href: string) => {
    if (href === '#') return false
    if (href === '/admin') return pathname === '/admin'
    if (href === '/staff') return pathname === '/staff'
    if (href === '/student') return pathname === '/student'
    return pathname === href || pathname?.startsWith(href + '/')
  }

  const isUserManagementActive = () => {
    return pathname?.startsWith('/admin/students') || 
           pathname?.startsWith('/admin/staff') || 
           pathname?.startsWith('/admin/inquiries')
  }

  return (
    <div className="flex items-center gap-0.5 xl:gap-1.5 bg-white/15 backdrop-blur-sm rounded-full p-0.5 lg:p-1 shadow-lg">
      {items.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href) || (item.isDropdown && isUserManagementActive())
        
        if (item.isDropdown && item.dropdownItems) {
          return (
            <DropdownMenu key={item.name} open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "relative px-3 lg:px-3.5 xl:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition-all duration-300 rounded-full whitespace-nowrap flex items-center gap-1.5 lg:gap-2",
                    isUserManagementActive()
                      ? "text-[#0A2472] bg-white shadow-lg" 
                      : "text-white hover:text-white hover:bg-white/25"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 lg:h-4 lg:w-4", isUserManagementActive() ? "text-[#0A2472]" : "text-white")} />
                  <span className="hidden xl:inline">{item.name}</span>
                  <span className="lg:hidden xl:hidden">Users</span>
                  <ChevronDown className={cn("h-3 w-3 lg:h-3.5 lg:w-3.5 transition-transform duration-300", userMenuOpen && "rotate-180")} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 mt-2">
                {item.dropdownItems.map((subItem) => {
                  const SubIcon = subItem.icon
                  const isSubActive = pathname?.startsWith(subItem.href)
                  return (
                    <DropdownMenuItem key={subItem.name} asChild>
                      <Link
                        href={subItem.href}
                        className={cn("flex items-center gap-2 cursor-pointer", isSubActive && "bg-primary/10 text-primary font-medium")}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <SubIcon className="h-4 w-4" />
                        <span>{subItem.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            prefetch={false}
            className={cn(
              "relative px-3 lg:px-3.5 xl:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition-all duration-300 rounded-full whitespace-nowrap flex items-center gap-1.5 lg:gap-2",
              active 
                ? "text-[#0A2472] bg-white shadow-lg" 
                : "text-white hover:text-white hover:bg-white/25"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5 lg:h-4 lg:w-4", active ? "text-[#0A2472]" : "text-white")} />
            <span className="hidden xl:inline">{item.name}</span>
            <span className="lg:hidden xl:hidden">{item.shortName || item.name}</span>
          </Link>
        )
      })}
    </div>
  )
}