'use client'

import * as React from 'react'
import { Moon, Sun, Laptop, Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  align?: 'start' | 'center' | 'end'
}

export function ThemeToggle({ className, align = 'end' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8 sm:h-9 sm:w-9 rounded-xl shrink-0 opacity-80', className)}
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4 text-amber-300" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative h-8 w-8 sm:h-9 sm:w-9 rounded-xl',
            'border border-white/20 dark:border-slate-800',
            'bg-white/10 dark:bg-slate-900/60 backdrop-blur-sm',
            'hover:bg-white/20 dark:hover:bg-slate-800',
            'transition-all text-white shrink-0 cursor-pointer',
            className
          )}
          aria-label="Toggle theme"
        >
          <Sun className={cn(
            'absolute h-4 w-4 transition-all text-amber-300',
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          )} />
          <Moon className={cn(
            'absolute h-4 w-4 transition-all text-blue-300',
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          )} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-2xl p-1.5 min-w-[140px] z-[70]"
      >
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn(
            'rounded-xl text-xs font-medium cursor-pointer flex items-center justify-between py-2 px-2.5 transition-colors',
            theme === 'light'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          )}
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <span>Light</span>
          </div>
          {theme === 'light' && <Check className="h-3.5 w-3.5 text-amber-500" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn(
            'rounded-xl text-xs font-medium cursor-pointer flex items-center justify-between py-2 px-2.5 transition-colors',
            theme === 'dark'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          )}
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-blue-400" />
            <span>Dark</span>
          </div>
          {theme === 'dark' && <Check className="h-3.5 w-3.5 text-blue-400" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={cn(
            'rounded-xl text-xs font-medium cursor-pointer flex items-center justify-between py-2 px-2.5 transition-colors',
            theme === 'system'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          )}
        >
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-slate-400" />
            <span>System</span>
          </div>
          {theme === 'system' && <Check className="h-3.5 w-3.5 text-slate-400" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}