// src/components/student/exams/SearchBar.tsx - FIXED VERSION

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string  // ✅ Dynamic placeholder
  className?: string    // ✅ Custom className
  disabled?: boolean    // ✅ Disabled state
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search...',  // ✅ Only fallback
  className,
  disabled = false 
}: SearchBarProps) {
  return (
    <div className={cn("relative w-full xs:w-64", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="pl-9 pr-4 h-9 w-full bg-background"
      />
    </div>
  )
}