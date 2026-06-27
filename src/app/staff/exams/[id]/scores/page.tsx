// app/staff/exams/[id]/scores/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Save, Loader2, RefreshCw,
  Users, Award, Calculator, CheckCircle,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
interface ExamMeta {
  id: string
  title: string
  subject: string
  class: string
  total_marks: number
  objective_max: number
  theory_max: number
}

interface StudentRow {
  attemptId: string
  studentId: string
  studentName: string
  studentEmail: string
  studentClass: string
  photoUrl: string | null
  objectiveScore: number
  theoryScore: number
  caTotal: number
  status: string
  // editable
  theoryInput: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const getWAECGrade = (pct: number): string => {
  if (pct >= 75) return 'A1'
  if (pct >= 70) return 'B2'
  if (pct >= 65) return 'B3'
  if (pct >= 60) return 'C4'
  if (pct >= 55) return 'C5'
  if (pct >= 50) return 'C6'
  if (pct >= 45) return 'D7'
  if (pct >= 40) return 'E8'
  return 'F9'
}

const getInitials = (name: string): string => {
  if (!name) return 'ST'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function EnterScoresPage() {
  const router = useRouter()
  const params = useParams()

  // ✅ Safely extract id
  const examId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string)

  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [exam, setExam]           = useState<ExamMeta | null>(null)
  const [rows, setRows]           = useState<StudentRow[]>([])

  // ── Load data ────────────────────────────────────────────────────────────────
  const loadData = useCallback(
    async (showToast = false) => {
      if (!examId) return
      showToast ? setRefreshing(true) : setLoading(true)

      try {
        // Auth
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/portal'); return }

        // Exam meta
        const { data: examData, error: examErr } = await supabase
          .from('exams')
          .select(
            'id, title, subject, class, total_marks, objective_max, theory_max',
          )
          .eq('id', examId)
          .single()

        if (examErr) throw examErr
        setExam(examData)

        // Attempts
        const { data: subs, error: subsErr } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('exam_id', examId)
          .order('submitted_at', { ascending: false })

        if (subsErr) throw subsErr

        const safeSubs   = subs ?? []
        const studentIds = [
          ...new Set(safeSubs.map((s) => s.student_id as string)),
        ]

        // Batch profiles
        const { data: profiles } = studentIds.length
          ? await supabase
              .from('profiles')
              .select('id, full_name, email, photo_url, class')
              .in('id', studentIds)
          : { data: [] as any[] }

        const profileMap = new Map(
          (profiles ?? []).map((p) => [p.id, p]),
        )

        // Batch CA scores
        const { data: caScores } = studentIds.length
          ? await supabase
              .from('ca_scores')
              .select('student_id, ca1_score, ca2_score')
              .in('student_id', studentIds)
              .eq('exam_id', examId)
          : { data: [] as any[] }

        const caMap = new Map<string, number>()
        ;(caScores ?? []).forEach((c) => {
          caMap.set(
            c.student_id,
            (c.ca1_score ?? 0) + (c.ca2_score ?? 0),
          )
        })

        // Build rows
        const built: StudentRow[] = safeSubs.map((sub) => {
          const student = profileMap.get(sub.student_id)

          const objScore  = Number(sub.objective_score ?? 0)
          let theoryScore = Number(sub.theory_score ?? 0)

          if (theoryScore === 0 && sub.theory_feedback) {
            try {
              const fb =
                typeof sub.theory_feedback === 'string'
                  ? JSON.parse(sub.theory_feedback)
                  : sub.theory_feedback
              if (fb?.total?.score !== undefined) {
                theoryScore = Number(fb.total.score)
              }
            } catch { /* ignore */ }
          }

          return {
            attemptId:     sub.id,
            studentId:     sub.student_id,
            studentName:   student?.full_name  ?? sub.student_name  ?? 'Unknown',
            studentEmail:  student?.email      ?? sub.student_email ?? '',
            studentClass:  student?.class      ?? sub.student_class ?? '—',
            photoUrl:      student?.photo_url  ?? null,
            objectiveScore: objScore,
            theoryScore,
            caTotal:        caMap.get(sub.student_id) ?? 0,
            status:         sub.status,
            theoryInput:    theoryScore > 0 ? String(theoryScore) : '',
          }
        })

        setRows(built)
        if (showToast) toast.success(`Refreshed — ${built.length} students`)

      } catch (e: any) {
        console.error('[EnterScoresPage] load error:', e)
        toast.error(e.message ?? 'Failed to load')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [examId, router],
  )

  useEffect(() => { loadData() }, [loadData])

  // ── Update single row theory input ───────────────────────────────────────────
  const updateTheoryInput = (attemptId: string, value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.attemptId === attemptId ? { ...r, theoryInput: value } : r,
      ),
    )
  }

  // ── Save all scores ───────────────────────────────────────────────────────────
  const handleSaveAll = async () => {
    if (!exam) return
    setSaving(true)

    const theoryMax   = exam.theory_max    || 40
    const objectiveMax = exam.objective_max || 20
    const examTotal   = objectiveMax + theoryMax

    let successCount = 0
    let errorCount   = 0

    for (const row of rows) {
      try {
        const tScore    = Math.round(parseFloat(row.theoryInput) || 0)
        const examScore = row.objectiveScore + tScore
        const pct       = examTotal > 0
          ? Math.round((examScore / examTotal) * 100)
          : 0
        const grade    = getWAECGrade(pct)
        const isPassed = pct >= 40

        const updateData: Record<string, any> = {
          status:          'graded',
          theory_score:    tScore,
          theory_total:    theoryMax,
          objective_total: objectiveMax,
          exam_score:      examScore,
          exam_total:      examTotal,
          total_score:     examScore,
          total_marks:     examTotal,
          percentage:      pct,
          is_passed:       isPassed,
          updated_at:      new Date().toISOString(),
          theory_feedback: {
            total: {
              score:    tScore,
              max:      theoryMax,
              feedback: `Theory: ${tScore}/${theoryMax}`,
            },
          },
        }

        // Try grade column
        try {
          await supabase.from('exam_attempts').select('grade').limit(1)
          updateData.grade = grade
        } catch { /* column may not exist */ }

        const { error } = await supabase
          .from('exam_attempts')
          .update(updateData)
          .eq('id', row.attemptId)

        if (error) throw error
        successCount++

      } catch (err) {
        console.error(
          `[EnterScoresPage] save error for ${row.studentName}:`,
          err,
        )
        errorCount++
      }
    }

    setSaving(false)

    if (errorCount === 0) {
      toast.success(`✅ Saved scores for ${successCount} students`)
    } else {
      toast.warning(
        `Saved ${successCount}, failed ${errorCount}`,
      )
    }

    // Reload to reflect saved data
    loadData()
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const theoryMax    = exam?.theory_max    || 40
  const objectiveMax = exam?.objective_max || 20
  const examTotal    = objectiveMax + theoryMax

  const gradedCount = rows.filter((r) => r.status === 'graded').length

  // ── Guards ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/staff/exams')}
            className="shrink-0"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />Back
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">
              Enter Scores
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 truncate">
              {exam?.title && `${exam.title} • `}
              {exam?.subject && `${exam.subject} • `}
              {rows.length} students
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="h-8 text-xs"
          >
            <RefreshCw
              className={cn(
                'h-3.5 w-3.5 mr-1.5',
                refreshing && 'animate-spin',
              )}
            />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={saving || rows.length === 0}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
          >
            {saving
              ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          {
            label: 'Total Students',
            value: rows.length,
            color: '',
            icon: Users,
          },
          {
            label: 'Graded',
            value: gradedCount,
            color: 'text-purple-600',
            icon: Award,
          },
          {
            label: 'Obj Max',
            value: objectiveMax,
            color: 'text-blue-600',
            icon: Calculator,
          },
          {
            label: 'Theory Max',
            value: theoryMax,
            color: 'text-emerald-600',
            icon: CheckCircle,
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[11px] text-slate-500">{stat.label}</p>
              <p className={cn('text-lg font-bold', stat.color)}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Score entry info */}
      <Card className="border-0 shadow-sm bg-blue-50 border-blue-100">
        <CardContent className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-blue-700">
            💡 <strong>How it works:</strong> Objective scores are
            auto-calculated. Enter theory scores below then click
            &ldquo;Save All&rdquo; to grade all students at once.
            CA scores are managed separately in the CA Scores section.
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      {rows.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-12">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">
              No submissions yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 border-b px-4 sm:px-6 pt-4">
            <CardTitle className="text-sm sm:text-base">
              Student Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs">Student</TableHead>
                    <TableHead className="text-center text-xs">
                      Objective/{objectiveMax}
                    </TableHead>
                    <TableHead className="text-center text-xs">
                      Theory/{theoryMax}
                    </TableHead>
                    <TableHead className="text-center text-xs">
                      CA
                    </TableHead>
                    <TableHead className="text-center text-xs">
                      Total/{examTotal}
                    </TableHead>
                    <TableHead className="text-center text-xs">
                      Grade
                    </TableHead>
                    <TableHead className="text-center text-xs">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.map((row) => {
                    const tScore    = Math.round(
                      parseFloat(row.theoryInput) || 0,
                    )
                    const examScore = row.objectiveScore + tScore
                    const grandTotal = row.caTotal + examScore
                    const pct       = examTotal > 0
                      ? Math.round((examScore / examTotal) * 100)
                      : 0
                    const grade = getWAECGrade(pct)

                    return (
                      <TableRow
                        key={row.attemptId}
                        className="hover:bg-slate-50"
                      >
                        {/* Student */}
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-7 w-7 shrink-0 hidden sm:flex">
                              <AvatarImage
                                src={row.photoUrl ?? undefined}
                              />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(row.studentName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-xs sm:text-sm truncate">
                                {row.studentName}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {row.studentClass}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Objective */}
                        <TableCell className="text-center text-xs sm:text-sm font-medium">
                          {row.objectiveScore}
                        </TableCell>

                        {/* Theory input */}
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            max={theoryMax}
                            step="0.5"
                            value={row.theoryInput}
                            onChange={(e) =>
                              updateTheoryInput(
                                row.attemptId,
                                e.target.value,
                              )
                            }
                            placeholder="0"
                            className="h-8 w-20 text-center text-sm mx-auto"
                          />
                        </TableCell>

                        {/* CA */}
                        <TableCell className="text-center text-xs sm:text-sm font-medium">
                          {row.caTotal > 0 ? row.caTotal : '—'}
                        </TableCell>

                        {/* Total */}
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              'font-semibold text-xs sm:text-sm',
                              pct >= 50
                                ? 'text-emerald-600'
                                : 'text-red-600',
                            )}
                          >
                            {examScore}
                          </span>
                        </TableCell>

                        {/* Grade */}
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              'text-xs',
                              pct >= 75
                                ? 'bg-emerald-100 text-emerald-700'
                                : pct >= 50
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700',
                            )}
                          >
                            {grade}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              row.status === 'graded'
                                ? 'border-purple-300 text-purple-700'
                                : 'border-slate-300 text-slate-600',
                            )}
                          >
                            {row.status === 'graded'
                              ? '✅ Graded'
                              : row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save All bottom button */}
      {rows.length > 0 && (
        <Button
          onClick={handleSaveAll}
          disabled={saving}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base rounded-xl shadow-lg"
        >
          {saving
            ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            : <Save className="mr-2 h-5 w-5" />}
          {saving
            ? 'Saving all scores…'
            : `Save All Scores — ${rows.length} Students`}
        </Button>
      )}
    </div>
  )
}