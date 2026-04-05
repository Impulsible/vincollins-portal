/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/admin/common/Header.tsx
'use client'

import { Search, Moon, Sun, Menu, School } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
  darkMode: boolean
  toggleDarkMode: () => void
  adminProfile: any
  greeting: string
  currentTime: string
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function Header({
  onMenuClick,
  darkMode,
  toggleDarkMode,
  adminProfile,
  greeting,
  currentTime,
  searchQuery,
  setSearchQuery,
}: HeaderProps) {
  const firstName = adminProfile?.full_name?.split(' ')[0] || 'Admin'
  const avatarLetter = adminProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/90">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 ring-1 ring-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:ring-purple-800">
              <School className="h-5 w-5" />
            </div>

            <div className="leading-tight">
              <h1 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">
                Vincollins College
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Admin Dashboard
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search users, exams, submissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'h-11 rounded-xl border-0 bg-gray-100 pl-10 shadow-none transition-all focus-visible:ring-2 focus-visible:ring-purple-500 dark:bg-gray-800'
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleDarkMode}
            className="rounded-xl p-2.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-3 rounded-2xl px-1 py-1 transition-colors">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Hi, {firstName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {greeting} • {currentTime}
              </p>
            </div>

            <Avatar className="h-10 w-10 ring-2 ring-purple-100 transition-all hover:scale-105 dark:ring-purple-900/40">
              <AvatarImage src={adminProfile?.photo_url} alt={firstName} />
              <AvatarFallback className="bg-gradient-to-br from-purple-100 to-purple-200 font-semibold text-purple-700 dark:from-purple-900/40 dark:to-purple-800/40 dark:text-purple-300">
                {avatarLetter}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}