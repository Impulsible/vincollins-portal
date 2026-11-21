// src/components/staff/exams/edit/TheoryQuestionFormDialog.tsx - WITH TABLE PASTE, DIAGRAM UPLOADER & DARK MODE
'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  X,
  Plus,
  Layers,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Table as TableIcon,
  Loader2,
  Brain,
  FileCheck,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { QuestionContent } from '@/components/shared/QuestionContent'
import { createClient } from '@/lib/supabase/client'
import type { TheoryQuestion, TheorySubQuestion } from './types'

interface TheoryQuestionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<TheoryQuestion>
  onSave: (data: Partial<TheoryQuestion>) => void
  onCancel?: () => void
  defaultMark?: number
  totalTheoryMarks?: number
  theoryQuestionCount?: number
  examTotal?: number
}

/**
 * Helper: resolve sub-question text from either canonical field.
 * Prefers question_text, falls back to legacy text.
 */
function getSubText(sq: TheorySubQuestion): string {
  return sq.question_text || sq.text || ''
}

function handleTablePaste(
  event: React.ClipboardEvent<HTMLTextAreaElement>,
  setValue: (value: string) => void
) {
  const clipboard = event.clipboardData
  const html = clipboard.getData('text/html')
  let rows: string[][] = []

  if (html) {
    const table = new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector('table')

    if (table) {
      rows = Array.from(table.querySelectorAll('tr')).map((row) =>
        Array.from(row.querySelectorAll('th, td')).map((cell) =>
          (cell.textContent || '').trim().replace(/\s+/g, ' ').replace(/\|/g, '\\|')
        )
      )
    }
  }

  if (rows.length === 0) {
    const textRows = clipboard
      .getData('text/plain')
      .split(/\r?\n/)
      .filter((row) => row.trim())

    if (textRows.length > 0 && textRows.some((row) => row.includes('\t'))) {
      rows = textRows.map((row) =>
        row.split('\t').map((cell) => cell.trim().replace(/\|/g, '\\|'))
      )
    }
  }

  if (rows.length === 0) return

  event.preventDefault()
  const columnCount = Math.max(...rows.map((row) => row.length))
  const normalizedRows = rows.map((row) =>
    Array.from({ length: columnCount }, (_, index) => row[index] || '')
  )
  const markdownRows = normalizedRows.map((row) => `| ${row.join(' | ')} |`)
  const separator = `| ${Array(columnCount).fill('---').join(' | ')} |`
  const markdown = [markdownRows[0], separator, ...markdownRows.slice(1)].join('\n')
  const target = event.currentTarget
  const start = target.selectionStart
  const end = target.selectionEnd

  setValue(`${target.value.slice(0, start)}${markdown}${target.value.slice(end)}`)
}

/**
 * Helper: normalize any incoming sub-question object into the
 * full TheorySubQuestion shape (fills missing question_text/text).
 */
function normalizeSubQuestion(s: any): TheorySubQuestion {
  const text = s?.question_text || s?.text || ''
  return {
    id: s?.id || Date.now().toString() + Math.random().toString(36).slice(2, 7),
    label: s?.label,
    question_text: text,
    text,
    points: s?.points ?? 0,
    keywords: s?.keywords || [],
    model_answer: s?.model_answer || '',
    sub_sub_questions: s?.sub_sub_questions || [],
  }
}

export function TheoryQuestionFormDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  onCancel,
  defaultMark = 0.5,
  totalTheoryMarks = 0,
  theoryQuestionCount = 0,
  examTotal = 60,
}: TheoryQuestionFormDialogProps) {
  const [questionText, setQuestionText] = useState('')
  const [points, setPoints] = useState(10)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageCaption, setImageCaption] = useState<string>('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [modelAnswer, setModelAnswer] = useState('')
  const [subQuestions, setSubQuestions] = useState<TheorySubQuestion[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [useSubQuestions, setUseSubQuestions] = useState(false)
  const [isDraft, setIsDraft] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const marksPerTheoryQuestion =
    theoryQuestionCount > 0 && totalTheoryMarks > 0
      ? totalTheoryMarks / theoryQuestionCount
      : 0

  useEffect(() => {
    if (open) {
      setQuestionText(initialData?.question_text || '')
      setPoints(
        initialData?.points !== undefined
          ? initialData.points
          : marksPerTheoryQuestion > 0
          ? marksPerTheoryQuestion
          : 10
      )
      setImageUrl(initialData?.image_url || '')
      setImageCaption(initialData?.image_caption || '')
      setKeywords(initialData?.keywords || [])
      setModelAnswer(initialData?.model_answer || '')

      // Normalize loaded sub-questions
      const normalizedSubs = (initialData?.sub_questions || []).map(normalizeSubQuestion)
      setSubQuestions(normalizedSubs)
      setUseSubQuestions(normalizedSubs.length > 0)

      setIsDraft(initialData?.is_draft !== undefined ? initialData.is_draft : true)
      setKeywordInput('')
      setShowPreview(false)
    }
  }, [open, initialData, marksPerTheoryQuestion])

  const isQuestionComplete = (): boolean => {
    if (!questionText.trim()) return false
    if (useSubQuestions) {
      return (
        subQuestions.length > 0 &&
        subQuestions.every((sq) => getSubText(sq).trim() !== '' && sq.points > 0)
      )
    }
    return points > 0
  }

  const handleAddKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase()
    if (!keyword) return
    if (keywords.includes(keyword)) return toast.error('Keyword already added')
    if (keywords.length >= 10) return toast.error('Maximum 10 keywords per question')
    setKeywords([...keywords, keyword])
    setKeywordInput('')
  }

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP, SVG)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setIsUploadingImage(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const fileName = `theory/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`

      const { data, error } = await supabase.storage
        .from('exam-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })

      if (error) {
        // Fallback to local Base64 URL
        const reader = new FileReader()
        reader.onloadend = () => {
          setImageUrl(reader.result as string)
          toast.success('Diagram attached (local format)')
          setIsUploadingImage(false)
        }
        reader.readAsDataURL(file)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('exam-assets')
        .getPublicUrl(data.path)

      setImageUrl(publicUrlData.publicUrl)
      toast.success('Diagram uploaded successfully')
    } catch (err) {
      console.error('Image upload failed, fallback to base64:', err)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageUrl(reader.result as string)
        toast.success('Diagram attached')
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl('')
    setImageCaption('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddSubQuestion = () => {
    const subQuestionPoints =
      marksPerTheoryQuestion > 0
        ? Math.round((marksPerTheoryQuestion / 2) * 100) / 100
        : 5
    setSubQuestions([
      ...subQuestions,
      {
        id: Date.now().toString(),
        question_text: '',
        text: '',
        points: subQuestionPoints,
      },
    ])
  }

  const handleUpdateSubQuestion = (
    index: number,
    data: Partial<TheorySubQuestion>
  ) => {
    const updated = [...subQuestions]
    const merged = { ...updated[index], ...data }

    // Keep question_text and text synchronized
    if (data.question_text !== undefined) {
      merged.text = data.question_text
    } else if (data.text !== undefined) {
      merged.question_text = data.text
    }

    updated[index] = merged
    setSubQuestions(updated)
  }

  const handleDeleteSubQuestion = (index: number) => {
    setSubQuestions(subQuestions.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
      if (onCancel) onCancel()
    }
  }

  const handleSubmit = (saveAsDraft: boolean = false) => {
    if (!questionText.trim()) return toast.error('Please enter question text')

    const calculatedPoints = useSubQuestions
      ? subQuestions.reduce((sum, sq) => sum + (sq.points || 0), 0)
      : points

    if (saveAsDraft) {
      setIsSubmitting(true)
      onSave({
        question_text: questionText.trim(),
        points: calculatedPoints || defaultMark,
        sub_questions: useSubQuestions ? subQuestions : [],
        keywords: keywords.length > 0 ? keywords : undefined,
        model_answer: modelAnswer.trim() || undefined,
        image_url: imageUrl || null,
        image_caption: imageCaption || null,
        is_draft: true,
      })
      setTimeout(() => setIsSubmitting(false), 400)
      return
    }

    if (useSubQuestions) {
      if (subQuestions.length === 0)
        return toast.error('Please add at least one sub-question')

      for (let i = 0; i < subQuestions.length; i++) {
        const sq = subQuestions[i]
        if (!getSubText(sq).trim())
          return toast.error(`Sub-question (${String.fromCharCode(97 + i)}) is empty`)
        if (sq.points <= 0)
          return toast.error(
            `Sub-question (${String.fromCharCode(97 + i)}) points must be greater than 0`
          )
      }
    } else {
      if (points <= 0) return toast.error('Points must be greater than 0')
      if (points > 100) return toast.error('Points cannot exceed 100')
    }

    setIsSubmitting(true)
    onSave({
      question_text: questionText.trim(),
      points: calculatedPoints,
      sub_questions: useSubQuestions ? subQuestions : [],
      keywords: keywords.length > 0 ? keywords : undefined,
      model_answer: modelAnswer.trim() || undefined,
      image_url: imageUrl || null,
      image_caption: imageCaption || null,
      is_draft: false,
    })
    setTimeout(() => setIsSubmitting(false), 400)
  }

  const complete = isQuestionComplete()
  const totalSubQuestionPoints = subQuestions.reduce(
    (sum, sq) => sum + (sq.points || 0),
    0
  )
  const currentTotalMarks = useSubQuestions ? totalSubQuestionPoints : points

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4 flex-wrap gap-2">
            <DialogTitle className="flex items-center gap-2 flex-wrap text-slate-900 dark:text-slate-100 text-lg">
              {initialData?.id ? 'Edit Theory Question' : 'Add Theory Question'}
              {initialData?.is_draft && (
                <Badge
                  variant="outline"
                  className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
                >
                  📝 Draft
                </Badge>
              )}
              {complete && !initialData?.is_draft && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                  ✅ Complete
                </Badge>
              )}
            </DialogTitle>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs gap-1.5 h-8"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Edit Mode
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-purple-500" /> Live Preview
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Marks summary bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Score Allocation:
            </span>
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-0 font-bold">
              Current: {currentTotalMarks} marks
            </Badge>
            {marksPerTheoryQuestion > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-400"
              >
                Suggested: {marksPerTheoryQuestion.toFixed(1)} marks
              </Badge>
            )}
            {totalTheoryMarks > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400"
              >
                Theory Total: {totalTheoryMarks} marks
              </Badge>
            )}
            {examTotal > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400"
              >
                Exam Total: {examTotal} marks
              </Badge>
            )}
          </div>

          {!complete && (
            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs sm:text-sm">
                {useSubQuestions
                  ? 'Add question text, sub-questions, and marks to complete.'
                  : 'Add question text and marks to mark as complete.'}
              </AlertDescription>
            </Alert>
          )}

          {complete && (
            <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              <AlertDescription className="text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm flex items-center gap-1.5">
                <FileCheck className="h-4 w-4" /> Theory question is complete and ready.
              </AlertDescription>
            </Alert>
          )}

          {/* LIVE PREVIEW CARD */}
          {showPreview ? (
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/20 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-purple-900/40">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Theory Question Preview
                </span>
                <Badge variant="secondary" className="font-bold text-xs">
                  {currentTotalMarks} Marks Total
                </Badge>
              </div>

              <QuestionContent
                text={questionText || '_No question text provided yet_'}
                imageUrl={imageUrl}
                imageCaption={imageCaption}
              />

              {useSubQuestions && subQuestions.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-purple-100 dark:border-purple-900/30">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Sub-questions ({subQuestions.length}):
                  </span>
                  <div className="space-y-2">
                    {subQuestions.map((sq, i) => (
                      <div
                        key={sq.id || i}
                        className="p-3 rounded-lg border border-purple-200 dark:border-purple-900/40 bg-white dark:bg-slate-900 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                              ({String.fromCharCode(97 + i)})
                            </span>
                            <div className="flex-1">
                              <QuestionContent
                                text={getSubText(sq) || '_No sub-question text_'}
                              />
                            </div>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-0 text-xs shrink-0">
                            {sq.points || 0} marks
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modelAnswer && (
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50 space-y-1">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Model Answer / Marking Scheme
                  </span>
                  <QuestionContent text={modelAnswer} />
                </div>
              )}

              {keywords.length > 0 && (
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50 space-y-1.5">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> Grading Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((kw) => (
                      <Badge
                        key={kw}
                        variant="outline"
                        className="bg-white dark:bg-slate-950 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs"
                      >
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Single vs Multi toggle */}
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
                <Button
                  type="button"
                  size="sm"
                  variant={!useSubQuestions ? 'default' : 'ghost'}
                  onClick={() => setUseSubQuestions(false)}
                  className={cn(
                    'h-8 text-xs font-semibold',
                    !useSubQuestions
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  Single Question
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={useSubQuestions ? 'default' : 'ghost'}
                  onClick={() => setUseSubQuestions(true)}
                  className={cn(
                    'h-8 text-xs font-semibold',
                    useSubQuestions
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  <Layers className="h-3.5 w-3.5 mr-1" />
                  Multi-part Question (a, b, c)
                </Button>
              </div>

              {/* Main Question Text with Universal Table Paste */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Question Text <span className="text-red-500">*</span>
                  </Label>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <TableIcon className="h-3 w-3 text-purple-500" />
                    Auto-formats tables from Excel/Word
                  </span>
                </div>
                <Textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  onPaste={(e) => handleTablePaste(e, setQuestionText)}
                  placeholder="Enter the main question text or instructions here... (Paste Excel/Word tables directly)"
                  className="min-h-[110px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans"
                  disabled={isSubmitting}
                />
              </div>

              {/* Diagram / Image Attachment */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-indigo-500" />
                    Question Diagram / Illustration (Optional)
                  </Label>
                  {imageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remove Diagram
                    </Button>
                  )}
                </div>

                {imageUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-center max-w-sm mx-auto">
                      <img
                        src={imageUrl}
                        alt="Question diagram"
                        className="max-h-36 mx-auto object-contain rounded"
                      />
                    </div>
                    <Input
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      placeholder="Add an optional diagram caption (e.g. Figure 1: Circuit Diagram)"
                      className="text-xs h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingImage || isSubmitting}
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                      )}
                      {isUploadingImage ? 'Uploading...' : 'Upload Diagram'}
                    </Button>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      Supports JPG, PNG, WebP & SVG
                    </span>
                  </div>
                )}
              </div>

              {/* SINGLE QUESTION MODE */}
              {!useSubQuestions ? (
                <>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Question Points / Marks <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={points}
                      onChange={(e) =>
                        setPoints(parseFloat(e.target.value) || 0)
                      }
                      min={0.5}
                      step={0.5}
                      className="mt-1.5 w-32 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Grading Keywords (Optional)
                    </Label>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                      Add keywords used for rubric evaluation and student feedback.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="e.g., mitochondria, atp, cellular respiration"
                        className="flex-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddKeyword}
                        size="sm"
                        className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        disabled={isSubmitting}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {keywords.map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="secondary"
                            className="gap-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs py-1"
                          >
                            {keyword}
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(keyword)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Model Answer / Marking Scheme (Optional)
                      </Label>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <TableIcon className="h-3 w-3 text-purple-500" />
                        Table paste supported
                      </span>
                    </div>
                    <Textarea
                      value={modelAnswer}
                      onChange={(e) => setModelAnswer(e.target.value)}
                      onPaste={(e) => handleTablePaste(e, setModelAnswer)}
                      placeholder="Enter a model answer or key grading criteria..."
                      className="min-h-[100px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans"
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              ) : (
                /* MULTI-PART SUB-QUESTIONS MODE */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Brain className="h-4 w-4 text-purple-500" />
                      Sub-questions <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddSubQuestion}
                      className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs h-8"
                      disabled={isSubmitting}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Sub-question
                    </Button>
                  </div>

                  {subQuestions.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No sub-questions added yet
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Add structured sub-questions like (a), (b), (c) with individual marks
                      </p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={handleAddSubQuestion}
                        className="text-purple-600 dark:text-purple-400 mt-2"
                      >
                        + Add your first sub-question
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subQuestions.map((sq, idx) => (
                        <div
                          key={sq.id || idx}
                          className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 space-y-2.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                              Part ({String.fromCharCode(97 + idx)})
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubQuestion(idx)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <Textarea
                            value={getSubText(sq)}
                            onChange={(e) =>
                              handleUpdateSubQuestion(idx, {
                                question_text: e.target.value,
                                text: e.target.value,
                              })
                            }
                            onPaste={(e) =>
                              handleTablePaste(e, (val: string) =>
                                handleUpdateSubQuestion(idx, {
                                  question_text: val,
                                  text: val,
                                })
                              )
                            }
                            placeholder={`Enter sub-question (${String.fromCharCode(
                              97 + idx
                            )}) text... (Paste tables directly)`}
                            className="min-h-[65px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-sans"
                            disabled={isSubmitting}
                          />

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Marks:
                              </Label>
                              <Input
                                type="number"
                                value={sq.points}
                                onChange={(e) =>
                                  handleUpdateSubQuestion(idx, {
                                    points: parseFloat(e.target.value) || 0,
                                  })
                                }
                                min={0.5}
                                step={0.5}
                                className="w-20 h-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                disabled={isSubmitting}
                              />
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Sub-part {String.fromCharCode(97 + idx)}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Sub-questions points summary */}
                      <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800/40 flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-semibold text-purple-900 dark:text-purple-300">
                          Total Sub-questions Marks:
                        </span>
                        <span className="font-bold text-purple-700 dark:text-purple-300">
                          {totalSubQuestionPoints} marks
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 flex-wrap pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={!questionText.trim() || isSubmitting}
            className="gap-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Save className="h-4 w-4" />
            {initialData?.id ? 'Save Changes as Draft' : 'Save as Draft'}
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium shadow-sm gap-2"
            disabled={!complete || isSubmitting}
          >
            <FileCheck className="h-4 w-4" />
            {initialData?.id ? 'Update Complete' : 'Add Complete Question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}