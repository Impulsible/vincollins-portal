// app/staff/notes/page.tsx - SAFE VERSION + DARK MODE
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Plus, Search, Loader2, BookOpen, Eye, Edit, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function NotesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<any[]>([])
  const [filteredNotes, setFilteredNotes] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/portal')
        return
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
        await loadNotes(profileData.id)
      }
    } catch (error) {
      console.error('Auth error:', error)
      router.replace('/portal')
    }
  }

  const loadNotes = async (userId: string, showToast = false) => {
    try {
      setRefreshing(true)
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setNotes(data || [])
      setFilteredNotes(data || [])

      if (showToast) {
        toast.success(`Loaded ${data?.length || 0} notes`)
      }
    } catch (error) {
      console.error('Error loading notes:', error)
      toast.error('Failed to load notes')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      setFilteredNotes(notes.filter(n => 
        n.title?.toLowerCase().includes(query) ||
        n.subject?.toLowerCase().includes(query)
      ))
    } else {
      setFilteredNotes(notes)
    }
  }, [notes, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 transition-colors duration-300">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Study Notes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {filteredNotes.length} of {notes.length} notes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => profile?.id && loadNotes(profile.id, true)} 
            disabled={refreshing}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button 
            onClick={() => router.push('/staff/notes/create')} 
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Note
          </Button>
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">No notes found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery ? 'Try a different search term' : 'Create your first note'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => router.push('/staff/notes/create')}
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredNotes.map((note) => (
                <div 
                  key={note.id} 
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-lg truncate text-slate-800 dark:text-slate-100">{note.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{note.subject || 'General'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        asChild 
                        className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Link href={`/staff/notes/${note.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        asChild 
                        className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Link href={`/staff/notes/${note.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}