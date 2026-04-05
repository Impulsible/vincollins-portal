/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Clock,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface LessonNote {
  id: string
  title: string
  subject: string
  class: string
  topic: string
  content: string
  objectives: string[]
  materials: string[]
  references: string[]
  status: 'draft' | 'published'
  created_by: string
  created_at: string
  updated_at: string
}

// Mock data for demo
const mockNotes: LessonNote[] = [
  {
    id: '1',
    title: 'Introduction to Algebra',
    subject: 'Mathematics',
    class: 'JSS1',
    topic: 'Algebraic Expressions',
    content: 'Algebra is a branch of mathematics dealing with symbols and the rules for manipulating those symbols...',
    objectives: ['Define algebra', 'Identify algebraic terms', 'Simplify algebraic expressions'],
    materials: ['Textbook', 'Whiteboard', 'Markers'],
    references: ['Mathematics Textbook JSS1', 'Algebra Workbook'],
    status: 'published',
    created_by: 'teacher1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Cell Structure',
    subject: 'Biology',
    class: 'SS1',
    topic: 'The Cell',
    content: 'The cell is the basic structural and functional unit of life...',
    objectives: ['Describe cell structure', 'Identify cell organelles', 'Explain cell functions'],
    materials: ['Microscope', 'Cell diagrams', 'Video presentation'],
    references: ['Biology Textbook SS1', 'Cell Biology Reference'],
    status: 'draft',
    created_by: 'teacher1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const subjects = [
  'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology',
  'Literature', 'History', 'Geography', 'Economics', 'Government'
]

const classLevels = [
  'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'
]

export default function LessonNotesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notes, setNotes] = useState<LessonNote[]>(mockNotes)
  const [filteredNotes, setFilteredNotes] = useState<LessonNote[]>(mockNotes)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNote, setSelectedNote] = useState<LessonNote | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<LessonNote>>({
    title: '',
    subject: '',
    class: '',
    topic: '',
    content: '',
    objectives: [],
    materials: [],
    references: [],
    status: 'draft'
  })

  // Mock user
  const user = session?.user || {
    id: 'teacher1',
    name: 'John Doe',
    email: 'teacher@vincollins.edu.ng',
    role: 'teacher'
  }

  const loadLessonNotes = useCallback(async () => {
    setIsLoading(true)
    try {
      // Using mock data instead of actual DB
      setNotes(mockNotes)
      setFilteredNotes(mockNotes)
    } catch (error) {
      console.error('Error loading notes:', error)
      toast.error('Failed to load lesson notes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else {
      loadLessonNotes()
    }
  }, [status, router, loadLessonNotes])

  useEffect(() => {
    let filtered = [...notes]
    
    if (searchQuery) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.topic.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    setFilteredNotes(filtered)
  }, [searchQuery, notes])

  const handleCreateNote = () => {
    setIsCreating(true)
    setIsEditing(false)
    setSelectedNote(null)
    setFormData({
      title: '',
      subject: '',
      class: '',
      topic: '',
      content: '',
      objectives: [],
      materials: [],
      references: [],
      status: 'draft'
    })
  }

  const handleEditNote = (note: LessonNote) => {
    setSelectedNote(note)
    setFormData(note)
    setIsEditing(true)
    setIsCreating(false)
  }

  const handleViewNote = (note: LessonNote) => {
    setSelectedNote(note)
    setIsEditing(false)
    setIsCreating(false)
  }

  const handleSaveNote = async () => {
    if (!formData.title || !formData.subject || !formData.class || !formData.content) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      if (isEditing && selectedNote) {
        // Update existing note
        const updatedNotes = notes.map(note => 
          note.id === selectedNote.id 
            ? { ...note, ...formData, updated_at: new Date().toISOString() }
            : note
        )
        setNotes(updatedNotes)
        toast.success('Lesson note updated successfully')
      } else {
        // Create new note
        const newNote: LessonNote = {
          id: Date.now().toString(),
          title: formData.title!,
          subject: formData.subject!,
          class: formData.class!,
          topic: formData.topic!,
          content: formData.content!,
          objectives: formData.objectives || [],
          materials: formData.materials || [],
          references: formData.references || [],
          status: formData.status || 'draft',
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setNotes([newNote, ...notes])
        toast.success('Lesson note created successfully')
      }
      
      setIsCreating(false)
      setIsEditing(false)
      setSelectedNote(null)
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('Failed to save lesson note')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this lesson note?')) return
    
    setIsLoading(true)
    try {
      setNotes(notes.filter(note => note.id !== noteId))
      toast.success('Lesson note deleted successfully')
      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete lesson note')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishNote = async (noteId: string) => {
    setIsLoading(true)
    try {
      const updatedNotes = notes.map(note => 
        note.id === noteId ? { ...note, status: 'published' as const } : note
      )
      setNotes(updatedNotes)
      if (selectedNote?.id === noteId) {
        setSelectedNote({ ...selectedNote, status: 'published' })
      }
      toast.success('Lesson note published successfully')
    } catch (error) {
      console.error('Error publishing note:', error)
      toast.error('Failed to publish lesson note')
    } finally {
      setIsLoading(false)
    }
  }

  const handleArrayField = (field: 'objectives' | 'materials' | 'references', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item)
    setFormData({ ...formData, [field]: items })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lesson Notes</h1>
            <p className="text-gray-600 mt-1">Create and manage your lesson notes</p>
          </div>
          <Button onClick={handleCreateNote} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Lesson Note
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* List Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No lesson notes found</p>
                    <Button variant="outline" className="mt-4" onClick={handleCreateNote}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first note
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNotes.map((note) => (
                      <Card
                        key={note.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedNote?.id === note.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleViewNote(note)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{note.title}</h3>
                                <Badge variant={note.status === 'published' ? 'default' : 'secondary'}>
                                  {note.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mb-2">
                                {note.subject} • {note.class} • {note.topic}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(note.created_at), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditNote(note)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteNote(note.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detail/Form Panel */}
          <div className="lg:col-span-1">
            {(isCreating || isEditing || selectedNote) ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {isCreating ? 'Create Lesson Note' : isEditing ? 'Edit Lesson Note' : 'Lesson Note Details'}
                    </CardTitle>
                    {!isCreating && !isEditing && selectedNote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNote(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(isCreating || isEditing) ? (
                    // Form View
                    <div className="space-y-4">
                      <div>
                        <Label>Title *</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Enter lesson title"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Subject *</Label>
                          <select
                            className="w-full p-2 border rounded-md"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          >
                            <option value="">Select subject</option>
                            {subjects.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Class *</Label>
                          <select
                            className="w-full p-2 border rounded-md"
                            value={formData.class}
                            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                          >
                            <option value="">Select class</option>
                            {classLevels.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label>Topic</Label>
                        <Input
                          value={formData.topic}
                          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                          placeholder="Enter lesson topic"
                        />
                      </div>
                      <div>
                        <Label>Content *</Label>
                        <Textarea
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          placeholder="Enter lesson content..."
                          rows={8}
                        />
                      </div>
                      <div>
                        <Label>Objectives (comma separated)</Label>
                        <Input
                          value={formData.objectives?.join(', ') || ''}
                          onChange={(e) => handleArrayField('objectives', e.target.value)}
                          placeholder="e.g., Define algebra, Solve equations"
                        />
                      </div>
                      <div>
                        <Label>Materials (comma separated)</Label>
                        <Input
                          value={formData.materials?.join(', ') || ''}
                          onChange={(e) => handleArrayField('materials', e.target.value)}
                          placeholder="e.g., Textbook, Whiteboard"
                        />
                      </div>
                      <div>
                        <Label>References (comma separated)</Label>
                        <Input
                          value={formData.references?.join(', ') || ''}
                          onChange={(e) => handleArrayField('references', e.target.value)}
                          placeholder="e.g., Mathematics Textbook JSS1"
                        />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveNote} className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreating(false)
                            setIsEditing(false)
                            setSelectedNote(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : selectedNote ? (
                    // Detail View
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{selectedNote.title}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge>{selectedNote.subject}</Badge>
                          <Badge variant="outline">{selectedNote.class}</Badge>
                          <Badge variant={selectedNote.status === 'published' ? 'default' : 'secondary'}>
                            {selectedNote.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label>Topic</Label>
                        <p className="text-gray-700">{selectedNote.topic}</p>
                      </div>
                      <div>
                        <Label>Content</Label>
                        <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{selectedNote.content}</p>
                        </div>
                      </div>
                      {selectedNote.objectives.length > 0 && (
                        <div>
                          <Label>Objectives</Label>
                          <ul className="list-disc list-inside text-gray-700">
                            {selectedNote.objectives.map((obj, i) => (
                              <li key={i}>{obj}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedNote.materials.length > 0 && (
                        <div>
                          <Label>Materials</Label>
                          <ul className="list-disc list-inside text-gray-700">
                            {selectedNote.materials.map((mat, i) => (
                              <li key={i}>{mat}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedNote.references.length > 0 && (
                        <div>
                          <Label>References</Label>
                          <ul className="list-disc list-inside text-gray-700">
                            {selectedNote.references.map((ref, i) => (
                              <li key={i}>{ref}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => handleEditNote(selectedNote)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        {selectedNote.status === 'draft' && (
                          <Button onClick={() => handlePublishNote(selectedNote.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Publish
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteNote(selectedNote.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Select a lesson note to view details</p>
                      <Button variant="outline" className="mt-4" onClick={handleCreateNote}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Note
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a lesson note to view details</p>
                  <Button variant="outline" className="mt-4" onClick={handleCreateNote}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Note
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}