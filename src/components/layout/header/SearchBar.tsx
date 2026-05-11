// components/layout/header/SearchBar.tsx
'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  open: boolean
  query: string
  onChange: (q: string) => void
  onClose: () => void
}

export const SearchBar = memo(function SearchBar({ open, query, onChange, onClose }: SearchBarProps) {
  const router = useRouter()

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      onClose()
    }
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 px-3 sm:px-4">
      <form onSubmit={handleSubmit}>
        <div className="max-w-xl mx-auto relative">
          <Input
            type="search"
            placeholder="Search..."
            value={query}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white shadow-2xl border-2 border-primary/30 rounded-full py-4 text-sm"
            autoFocus
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-primary text-white">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
})