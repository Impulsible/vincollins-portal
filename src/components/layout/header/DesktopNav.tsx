// components/layout/header/DesktopNav.tsx
'use client'

import { useState, memo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  ChevronDown, Home, BookOpen, Laptop, Phone, FileText,
  LayoutDashboard, Users, MonitorPlay, GraduationCap,
  Briefcase, MessageSquare, FileCheck, Activity, BarChart3
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { NavigationItem, UserRole } from './types'

const publicNavigation: NavigationItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Admission', href: '/admission', icon: FileText },
  { name: 'Schools', href: '/schools', icon: BookOpen },
  { name: 'CBT Platform', href: '#cbt', icon: Laptop, isCbt: true },
  { name: 'Contact', href: '/contact', icon: Phone },
]

const studentNavigation: NavigationItem[] = [
  { name: 'Overview', href: '/student', icon: LayoutDashboard },
  { name: 'My Exams', href: '/student/exams', icon: MonitorPlay },
  { name: 'Results', href: '/student/results', icon: GraduationCap },
  { name: 'Profile', href: '/student/profile', icon: Users },
]

const teacherNavigation: NavigationItem[] = [
  { name: 'Overview', href: '/staff', icon: LayoutDashboard },
  { name: 'Exams', href: '/staff/exams', icon: MonitorPlay },
  { name: 'Assignments', href: '/staff/assignments', icon: FileText },
  { name: 'Students', href: '/staff/students', icon: Users },
  { name: 'Analytics', href: '/staff/analytics', icon: BarChart3 },
]

const adminNavigation: NavigationItem[] = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { 
    name: 'User Management', href: '#', icon: Users, isDropdown: true,
    dropdownItems: [
      { name: 'Students', href: '/admin/students', icon: GraduationCap },
      { name: 'Staff', href: '/admin/staff', icon: Briefcase },
      { name: 'Inquiries', href: '/admin/inquiries', icon: MessageSquare },
    ]
  },
  { name: 'Exam Approvals', href: '/admin/exams', icon: MonitorPlay },
  { name: 'Reports', href: '/admin/report-cards', icon: FileCheck },
  { name: 'Monitor', href: '/admin/monitor', icon: Activity },
]

function getNavigation(role?: UserRole, isPublic: boolean = true): NavigationItem[] {
  if (isPublic) return publicNavigation
  switch (role) {
    case 'admin': return adminNavigation
    case 'teacher': return teacherNavigation
    case 'student': return studentNavigation
    default: return publicNavigation
  }
}

interface DesktopNavProps {
  userRole?: UserRole
  pathname: string
  isPublic?: boolean
  onCbtClick: () => void
}

export const DesktopNav = memo(function DesktopNav({ userRole, pathname, isPublic = true, onCbtClick }: DesktopNavProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const nav = getNavigation(userRole, isPublic)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '#') return false
    return pathname === href || pathname?.startsWith(href + '/')
  }

  const isUserManagementActive = () => {
    return !!(pathname?.startsWith('/admin/students') || pathname?.startsWith('/admin/staff') || pathname?.startsWith('/admin/inquiries'))
  }

  return (
    <div className="flex items-center gap-0.5 xl:gap-1.5 bg-white/15 backdrop-blur-sm rounded-full p-0.5 lg:p-1 shadow-lg">
      {nav.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href) || (item.isDropdown && isUserManagementActive())

        if (item.isDropdown && item.dropdownItems) {
          return (
            <DropdownMenu key={item.name} open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "relative px-3 lg:px-3.5 xl:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition-all rounded-full whitespace-nowrap flex items-center gap-1.5 lg:gap-2",
                  isUserManagementActive() ? "text-[#0A2472] bg-white shadow-lg" : "text-white hover:text-white hover:bg-white/25"
                )}>
                  <Icon className={cn("h-3.5 w-3.5 lg:h-4 lg:w-4", isUserManagementActive() ? "text-[#0A2472]" : "text-white")} />
                  <span className="hidden xl:inline">{item.name}</span>
                  <span className="lg:hidden xl:hidden">Users</span>
                  <ChevronDown className={cn("h-3 w-3 lg:h-3.5 lg:w-3.5 transition-transform", userMenuOpen && "rotate-180")} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 mt-2">
                {item.dropdownItems.map((sub) => (
                  <DropdownMenuItem key={sub.name} asChild>
                    <Link href={sub.href} className={cn("flex items-center gap-2 cursor-pointer", pathname?.startsWith(sub.href) && "bg-primary/10 text-primary font-medium")}
                      onClick={() => setUserMenuOpen(false)}>
                      <sub.icon className="h-4 w-4" /><span>{sub.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }

        return (
          <Link key={item.name} href={item.href} prefetch={false}
            onClick={item.isCbt ? (e) => { e.preventDefault(); onCbtClick() } : undefined}
            className={cn(
              "relative px-3 lg:px-3.5 xl:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition-all rounded-full whitespace-nowrap",
              active ? "text-[#0A2472] bg-white shadow-lg" : "text-white hover:text-white hover:bg-white/25"
            )}>
            <div className="flex items-center gap-1.5 lg:gap-2">
              <Icon className={cn("h-3.5 w-3.5 lg:h-4 lg:w-4", active ? "text-[#0A2472]" : "text-white")} />
              <span className="hidden xl:inline">{item.name}</span>
              <span className="lg:hidden xl:hidden">
                {item.name === 'CBT Platform' ? 'CBT' : 
                 item.name === 'Exam Approvals' ? 'Exams' :
                 item.name === 'User Management' ? 'Users' :
                 item.name === 'My Exams' ? 'Exams' : item.name.substring(0, 4)}
              </span>
              {item.isCbt && <Badge className="text-[8px] px-1 py-0 bg-[#F5A623] text-[#0A2472] font-bold">CBT</Badge>}
            </div>
          </Link>
        )
      })}
    </div>
  )
})