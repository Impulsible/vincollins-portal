// components/layout/MobileBottomNav.tsx - STATS REMOVED
'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home, BookOpen, Award, User, MoreHorizontal,
  Calendar, Bell, Settings, HelpCircle, LogOut,
  TrendingUp, FileText, GraduationCap, X,
  LayoutDashboard, Users, MonitorPlay, BarChart3,
  Shield, KeyRound, CreditCard, School
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

type UserRole = 'student' | 'staff' | 'admin'

interface MobileBottomNavProps {
  role: UserRole
  activeTab: string
  onTabChange: (tab: string) => void
  profile?: {
    full_name?: string
    name?: string
    email?: string
    photo_url?: string | null
    avatar_url?: string | null
    class?: string
    department?: string
    vin_id?: string
  } | null
  onLogout?: () => void
  notificationCount?: number
}

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  route: string
  roles: UserRole[]
}

// All navigation items with role-based access
const allNavItems: NavItem[] = [
  // Student Navigation
  { id: 'overview', label: 'Home', icon: Home, route: '/student', roles: ['student'] },
  { id: 'exams', label: 'Exams', icon: BookOpen, route: '/student/exams', roles: ['student'] },
  { id: 'results', label: 'Results', icon: Award, route: '/student/results', roles: ['student'] },
  { id: 'profile', label: 'Profile', icon: User, route: '/student/profile', roles: ['student'] },
  
  // Staff Navigation
  { id: 'staff-overview', label: 'Home', icon: Home, route: '/staff', roles: ['staff'] },
  { id: 'staff-exams', label: 'Exams', icon: MonitorPlay, route: '/staff/exams', roles: ['staff'] },
  { id: 'staff-students', label: 'Students', icon: Users, route: '/staff/students', roles: ['staff'] },
  { id: 'staff-profile', label: 'Profile', icon: User, route: '/staff/profile', roles: ['staff'] },
  
  // Admin Navigation
  { id: 'admin-overview', label: 'Home', icon: Home, route: '/admin', roles: ['admin'] },
  { id: 'admin-exams', label: 'Exams', icon: MonitorPlay, route: '/admin/exams', roles: ['admin'] },
  { id: 'admin-users', label: 'Users', icon: Users, route: '/admin/users', roles: ['admin'] },
  { id: 'admin-settings', label: 'Settings', icon: Settings, route: '/admin/settings', roles: ['admin'] },
]

// More menu items with role-based access
const moreMenuItems: NavItem[] = [
  // Student More Items
  { id: 'attendance', label: 'Attendance', icon: Calendar, route: '/student/attendance', roles: ['student'] },
  { id: 'assignments', label: 'Assignments', icon: FileText, route: '/student/assignments', roles: ['student'] },
  { id: 'courses', label: 'Courses', icon: School, route: '/student/courses', roles: ['student'] },
  { id: 'performance', label: 'Performance', icon: TrendingUp, route: '/student/performance', roles: ['student'] },
  { id: 'notifications', label: 'Notifications', icon: Bell, route: '/student/notifications', roles: ['student'] },
  { id: 'report-card', label: 'Report Card', icon: Award, route: '/student/report-card', roles: ['student'] },
  { id: 'settings', label: 'Settings', icon: Settings, route: '/student/settings', roles: ['student'] },
  { id: 'help', label: 'Help', icon: HelpCircle, route: '/student/help', roles: ['student'] },
  
  // Staff More Items
  { id: 'staff-assignments', label: 'Assignments', icon: FileText, route: '/staff/assignments', roles: ['staff'] },
  { id: 'staff-analytics', label: 'Analytics', icon: BarChart3, route: '/staff/analytics', roles: ['staff'] },
  { id: 'staff-notifications', label: 'Notifications', icon: Bell, route: '/staff/notifications', roles: ['staff'] },
  { id: 'staff-report-cards', label: 'Report Cards', icon: Award, route: '/staff/report-cards', roles: ['staff'] },
  { id: 'staff-settings', label: 'Settings', icon: Settings, route: '/staff/settings', roles: ['staff'] },
  { id: 'staff-help', label: 'Help', icon: HelpCircle, route: '/staff/help', roles: ['staff'] },
  
  // Admin More Items
  { id: 'admin-reports', label: 'Reports', icon: BarChart3, route: '/admin/reports', roles: ['admin'] },
  { id: 'admin-approvals', label: 'Approvals', icon: Shield, route: '/admin/approvals', roles: ['admin'] },
  { id: 'admin-report-cards', label: 'Report Cards', icon: Award, route: '/admin/report-cards', roles: ['admin'] },
  { id: 'admin-notifications', label: 'Notifications', icon: Bell, route: '/admin/notifications', roles: ['admin'] },
  { id: 'admin-billing', label: 'Billing', icon: CreditCard, route: '/admin/billing', roles: ['admin'] },
  { id: 'admin-help', label: 'Help', icon: HelpCircle, route: '/admin/help', roles: ['admin'] },
]

const formatDisplayName = (name?: string): string => {
  if (!name) return 'User'
  return name.replace(/[._]/g, ' ').replace(/\s+/g, ' ').trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const getInitials = (name?: string): string => {
  if (!name) return 'U'
  const parts = formatDisplayName(name).split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'admin': return 'Administrator'
    case 'staff': return 'Teacher'
    case 'student': return 'Student'
    default: return role
  }
}

export function MobileBottomNav({
  role,
  activeTab,
  onTabChange,
  profile,
  onLogout,
  notificationCount = 0
}: MobileBottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  // Filter nav items based on role
  const mainItems = allNavItems.filter(item => item.roles.includes(role)).slice(0, 4)
  const moreItems = moreMenuItems.filter(item => item.roles.includes(role))

  const handleNavigation = (route: string, tabId: string) => {
    onTabChange(tabId)
    router.push(route)
    setMoreMenuOpen(false)
  }

  const handleLogout = () => {
    setMoreMenuOpen(false)
    onLogout?.()
  }

  const isActive = (item: NavItem): boolean => {
    if (item.route === `/${role}`) {
      return pathname === `/${role}`
    }
    return pathname?.startsWith(item.route) || activeTab === item.id
  }

  const displayName = profile?.full_name || profile?.name || 'User'
  const avatarUrl = profile?.photo_url || profile?.avatar_url || undefined

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="flex items-center justify-around px-2 py-1">
          {mainItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.route, item.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative",
                  active 
                    ? role === 'admin' ? "text-purple-600 dark:text-purple-400" 
                      : role === 'staff' ? "text-blue-600 dark:text-blue-400"
                      : "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className={cn(
                      "absolute inset-0 rounded-xl -z-10",
                      role === 'admin' ? "bg-purple-50 dark:bg-purple-950/30"
                      : role === 'staff' ? "bg-blue-50 dark:bg-blue-950/30"
                      : "bg-emerald-50 dark:bg-emerald-950/30"
                    )}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={cn(
                  "h-5 w-5 transition-all",
                  active && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] font-medium mt-0.5",
                  active && "font-semibold"
                )}>
                  {item.label}
                </span>
              </button>
            )
          })}

          {/* More Button */}
          <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all",
                  moreMenuOpen 
                    ? role === 'admin' ? "text-purple-600 dark:text-purple-400"
                      : role === 'staff' ? "text-blue-600 dark:text-blue-400"
                      : "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-[10px] font-medium mt-0.5">More</span>
              </button>
            </SheetTrigger>
            
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
              <SheetHeader className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg font-bold">Menu</SheetTitle>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>
              </SheetHeader>
              
              <ScrollArea className="h-full pb-20">
                {/* Profile Section */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Avatar className={cn(
                      "h-14 w-14 ring-2",
                      role === 'admin' ? "ring-purple-100 dark:ring-purple-900"
                      : role === 'staff' ? "ring-blue-100 dark:ring-blue-900"
                      : "ring-emerald-100 dark:ring-emerald-900"
                    )}>
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback className={cn(
                        "bg-gradient-to-br text-white text-lg font-bold",
                        role === 'admin' ? "from-purple-600 to-indigo-600"
                        : role === 'staff' ? "from-blue-600 to-indigo-600"
                        : "from-emerald-600 to-teal-600"
                      )}>
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {profile?.email || `${role}@vincollins.edu.ng`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn(
                          "text-[10px] text-white",
                          role === 'admin' ? 'bg-purple-500' :
                          role === 'staff' ? 'bg-blue-500' : 'bg-emerald-500'
                        )}>
                          {getRoleDisplayName(role)}
                        </Badge>
                        {profile?.class && (
                          <Badge variant="outline" className="text-[10px]">
                            {profile.class}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="p-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
                    Navigation
                  </p>
                  <div className="space-y-1">
                    {moreItems.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item)
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigation(item.route, item.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                            active 
                              ? role === 'admin' 
                                ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300"
                                : role === 'staff'
                                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                                : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="text-sm font-medium">{item.label}</span>
                          {(item.id === 'notifications' || item.id === 'staff-notifications' || item.id === 'admin-notifications') && notificationCount > 0 && (
                            <Badge className="ml-auto bg-red-500 text-white text-[10px]">
                              {notificationCount}
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Sign Out */}
                <div className="p-3">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all"
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>

                {/* Footer */}
                <div className="p-4 text-center">
                  <p className="text-[10px] text-slate-400">
                    Vincollins College • v1.0.0
                  </p>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}