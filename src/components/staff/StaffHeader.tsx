// components/staff/StaffHeader.tsx
'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useStaffContext } from '@/app/staff/layout'
import { LogOut, Menu } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function StaffHeader() {
  const router = useRouter()
  const { profile, sidebarCollapsed, setSidebarCollapsed, handleLogout } = useStaffContext()

  const getInitials = (name?: string) => {
    if (!name) return 'ST'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="h-16 px-4 md:px-6 flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Staff Portal
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {profile?.full_name || 'Staff Member'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {profile?.role === 'admin' ? 'Administrator' : 'Teacher'}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Logout</span>
        </Button>
      </div>
    </div>
  )
}