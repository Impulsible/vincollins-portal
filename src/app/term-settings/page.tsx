// src/app/admin/term-settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Save, CheckCircle, Edit, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Note: Calendar components will be available after running:
// pnpm dlx shadcn@latest add calendar popover
// Uncomment these imports after installing:
// import { Calendar } from '@/components/ui/calendar'
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface TermSetting {
  id?: string
  session_year: string
  term: string
  term_name: string
  start_date: string
  end_date: string
  total_weeks: number
  is_current: boolean
}

export default function TermSettingsPage() {
  const [terms, setTerms] = useState<TermSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTerm, setEditingTerm] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<TermSetting>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTerm, setNewTerm] = useState<Partial<TermSetting>>({
    term: 'first',
    term_name: 'First Term',
    session_year: new Date().getFullYear().toString(),
    start_date: '',
    end_date: '',
    total_weeks: 12,
    is_current: false
  })

  useEffect(() => {
    loadTerms()
  }, [])

  const loadTerms = async () => {
    try {
      const { data, error } = await supabase
        .from('term_settings')
        .select('*')
        .order('session_year', { ascending: false })
        .order('term')
      
      if (error) throw error
      setTerms(data || [])
    } catch (error) {
      console.error('Error loading terms:', error)
      toast.error('Failed to load terms')
    } finally {
      setLoading(false)
    }
  }

  const calculateWeeks = (startDate: string, endDate: string): number => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.ceil(diffDays / 7)
  }

  const handleSetCurrent = async (termId: string) => {
    try {
      await supabase
        .from('term_settings')
        .update({ is_current: false })
        .neq('id', termId)
      
      const { error } = await supabase
        .from('term_settings')
        .update({ is_current: true })
        .eq('id', termId)
      
      if (error) throw error
      
      toast.success('Current term updated')
      loadTerms()
    } catch (error) {
      console.error('Error setting current term:', error)
      toast.error('Failed to update current term')
    }
  }

  const handleSave = async (term: TermSetting) => {
    try {
      const updates: Partial<TermSetting> = {}
      
      if (formData.start_date) updates.start_date = formData.start_date
      if (formData.end_date) updates.end_date = formData.end_date
      if (formData.total_weeks) updates.total_weeks = formData.total_weeks

      // Recalculate weeks if dates changed
      const startDate = formData.start_date || term.start_date
      const endDate = formData.end_date || term.end_date
      if (formData.start_date || formData.end_date) {
        updates.total_weeks = calculateWeeks(startDate, endDate)
      }

      const { error } = await supabase
        .from('term_settings')
        .update(updates)
        .eq('id', term.id)
      
      if (error) throw error
      
      toast.success('Term updated successfully')
      setEditingTerm(null)
      setFormData({})
      loadTerms()
    } catch (error) {
      console.error('Error updating term:', error)
      toast.error('Failed to update term')
    }
  }

  const handleAddTerm = async () => {
    try {
      if (!newTerm.start_date || !newTerm.end_date) {
        toast.error('Please select start and end dates')
        return
      }

      const weeks = calculateWeeks(newTerm.start_date, newTerm.end_date)
      
      const { error } = await supabase
        .from('term_settings')
        .insert({
          ...newTerm,
          total_weeks: weeks,
          is_current: false
        })
      
      if (error) throw error
      
      toast.success('Term added successfully')
      setShowAddForm(false)
      setNewTerm({
        term: 'first',
        term_name: 'First Term',
        session_year: new Date().getFullYear().toString(),
        start_date: '',
        end_date: '',
        total_weeks: 12,
        is_current: false
      })
      loadTerms()
    } catch (error) {
      console.error('Error adding term:', error)
      toast.error('Failed to add term')
    }
  }

  const termOptions = [
    { value: 'first', label: 'First Term' },
    { value: 'second', label: 'Second Term' },
    { value: 'third', label: 'Third Term' },
  ]

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Term Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage academic terms and sessions
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {showAddForm ? 'Cancel' : 'Add New Term'}
        </Button>
      </div>

      {/* Add New Term Form */}
      {showAddForm && (
        <Card className="mb-6 border-2 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Add New Term</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Session Year</Label>
                <Input
                  type="text"
                  placeholder="e.g., 2024/2025"
                  value={newTerm.session_year}
                  onChange={(e) => setNewTerm({ ...newTerm, session_year: e.target.value })}
                />
              </div>
              <div>
                <Label>Term</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={newTerm.term}
                  onChange={(e) => {
                    const selected = termOptions.find(t => t.value === e.target.value)
                    setNewTerm({ 
                      ...newTerm, 
                      term: e.target.value,
                      term_name: selected?.label || 'First Term'
                    })
                  }}
                >
                  {termOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newTerm.start_date}
                  onChange={(e) => setNewTerm({ ...newTerm, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newTerm.end_date}
                  onChange={(e) => setNewTerm({ ...newTerm, end_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Total Weeks (Auto-calculated)</Label>
                <Input
                  type="number"
                  value={newTerm.total_weeks}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
                <Button onClick={handleAddTerm}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Term
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terms List */}
      <div className="grid gap-4">
        {terms.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No terms configured yet</p>
              <Button 
                variant="link" 
                onClick={() => setShowAddForm(true)}
                className="mt-2"
              >
                Add your first term
              </Button>
            </CardContent>
          </Card>
        ) : (
          terms.map((term) => (
            <Card key={term.id} className={cn(
              "border-2 transition-all",
              term.is_current && "border-emerald-500 shadow-lg bg-gradient-to-r from-emerald-50/30 to-white"
            )}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <CardTitle className="text-lg sm:text-xl">
                      {term.term_name} • {term.session_year}
                    </CardTitle>
                    {term.is_current && (
                      <Badge className="bg-emerald-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Current Term
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!term.is_current && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSetCurrent(term.id!)}
                      >
                        Set as Current
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTerm(term.id!)
                        setFormData({})
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingTerm === term.id ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        defaultValue={term.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        defaultValue={term.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Total Weeks</Label>
                      <Input
                        type="number"
                        defaultValue={term.total_weeks}
                        onChange={(e) => setFormData({ ...formData, total_weeks: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="sm:col-span-3 flex gap-2">
                      <Button onClick={() => handleSave(term)}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setEditingTerm(null)
                        setFormData({})
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Start Date</p>
                      <p className="font-medium">{new Date(term.start_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">End Date</p>
                      <p className="font-medium">{new Date(term.end_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Total Weeks</p>
                      <p className="font-medium">{term.total_weeks} weeks</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Term</p>
                      <p className="font-medium capitalize">{term.term}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}