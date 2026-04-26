// src/components/student/exams/SearchBar.tsx
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full xs:w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search exams..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-4 h-9 w-full bg-background"
      />
    </div>
  )
}