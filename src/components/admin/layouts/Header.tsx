// components/admin/layouts/Header.tsx
'use client'

import { useState, useEffect, type ChangeEvent } from 'react'
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  Settings,
  User,
  Camera,
  LogOut,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AdminProfile {
  id?: string
  full_name?: string
  email?: string
  photo_url?: string
}

interface NotificationItem {
  id: string
  title: string
  message: string
  created_at: string
  read: boolean
}

interface HeaderProps {
  onMenuClick: () => void
  darkMode: boolean
  toggleDarkMode: () => void
  adminProfile: AdminProfile | null
  onProfileUpdate: (profile: AdminProfile) => void
  notifications: NotificationItem[]
  onMarkNotificationRead: (id: string) => void
}

export function Header({
  onMenuClick,
  darkMode,
  toggleDarkMode,
  adminProfile,
  onProfileUpdate,
  notifications,
  onMarkNotificationRead,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !adminProfile?.id) return

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${adminProfile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('profiles').getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: publicUrl })
        .eq('id', adminProfile.id)

      if (updateError) throw updateError

      onProfileUpdate({ ...adminProfile, photo_url: publicUrl })
      toast.success('Profile photo updated successfully!')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const firstName = adminProfile?.full_name?.split(' ')[0] || 'Admin'
  const avatarLetter = adminProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-96 border-0 bg-muted/50 pl-10 focus:ring-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="relative"
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <DropdownMenu
            open={showNotifications}
            onOpenChange={setShowNotifications}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </span>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className="cursor-pointer p-3"
                    onClick={() => onMarkNotificationRead(notif.id)}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          notif.read ? 'bg-gray-100' : 'bg-primary/10'
                        }`}
                      >
                        <Bell
                          className={`h-4 w-4 ${
                            notif.read ? 'text-gray-500' : 'text-primary'
                          }`}
                        />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {notif.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem className="justify-center text-primary">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>

          <div className="mx-1 h-8 w-px bg-border" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group ml-2 flex cursor-pointer items-center gap-3"
              >
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-foreground">
                    Hi, {firstName}!
                  </p>
                  <p className="text-xs text-muted-foreground">{currentTime}</p>
                </div>

                <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-primary/20 transition-all group-hover:scale-105 group-hover:ring-primary/40">
                  <AvatarImage src={adminProfile?.photo_url} alt={firstName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {avatarLetter}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="flex flex-col items-center gap-2 p-3">
                <Avatar className="h-20 w-20 ring-2 ring-primary">
                  <AvatarImage src={adminProfile?.photo_url} alt={firstName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-2xl text-white">
                    {avatarLetter}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center">
                  <p className="font-semibold">{adminProfile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {adminProfile?.email}
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/20"
                  >
                    <Camera className="h-3 w-3" />
                    {uploading ? 'Uploading...' : 'Change Photo'}
                  </label>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>

              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}