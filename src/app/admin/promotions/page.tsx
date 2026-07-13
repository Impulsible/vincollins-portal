// app/admin/promotions/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'
import {
  Loader2, RefreshCw, ArrowUpCircle, Users, Clock,
  CheckCircle2, XCircle, GraduationCap, Settings,
  ChevronDown, ChevronUp, Search, BookOpen,
  AlertTriangle, Info, Filter, LayoutGrid, LayoutList,
  TrendingUp, Shield, Zap, UserCircle2
} from 'lucide-react'

// ── 1. Updated interface with avatar fields ───────────────────────────────────
interface Promotion {
  id: string
  student_id: string
  student_name: string
  current_class: string
  next_class: string
  status: string
  created_at: string
  avatar_url?: string
  profile_image?: string
  photo_url?: string
}

type ViewMode = 'grid' | 'list'
type SortField = 'name' | 'class' | 'status' | 'date'
type SortDir = 'asc' | 'desc'

// ── 2. Helper to resolve whichever image field the API returns ────────────────
function resolveAvatar(p: Promotion): string | null {
  return p.avatar_url || p.profile_image || p.photo_url || null
}

// ── 3. Helpers ────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function avatarColor(name: string) {
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
    'bg-indigo-500', 'bg-fuchsia-500',
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

// ── 4. Smart Avatar Component ─────────────────────────────────────────────────
function StudentAvatar({
  promotion,
  size = 'md',
}: {
  promotion: Promotion
  size?: 'sm' | 'md' | 'lg'
}) {
  const [imgError, setImgError] = useState(false)
  const avatarUrl = resolveAvatar(promotion)
  const hasImage  = !!avatarUrl && !imgError

  const sizeClass = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  }[size]

  if (hasImage) {
    return (
      <div className={`${sizeClass} relative rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm`}>
        <Image
          src={avatarUrl!}
          alt={promotion.student_name}
          fill
          sizes="56px"
          className="object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={`
        ${sizeClass} ${avatarColor(promotion.student_name)}
        rounded-full flex items-center justify-center
        text-white font-bold flex-shrink-0 ring-2 ring-white shadow-sm
      `}
    >
      {getInitials(promotion.student_name)}
    </div>
  )
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400',   icon: Clock       },
  approved: { label: 'Approved', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-400',     icon: XCircle     },
} as const

function groupByClass(list: Promotion[]) {
  const map: Record<string, Promotion[]> = {}
  for (const p of list) {
    if (!map[p.current_class]) map[p.current_class] = []
    map[p.current_class].push(p)
  }
  for (const cls of Object.keys(map)) {
    map[cls].sort((a, b) => a.student_name.localeCompare(b.student_name))
  }
  const classOrder = [
    'JSS 1', 'JSS 2', 'JSS 3',
    'SS 1', 'SS 1 Science', 'SS 1 Arts', 'SS 1 Commercial',
    'SS 2', 'SS 2 Science', 'SS 2 Arts', 'SS 2 Commercial',
    'SS 3', 'SS 3 Science', 'SS 3 Arts', 'SS 3 Commercial',
  ]
  const sorted: Record<string, Promotion[]> = {}
  for (const cls of classOrder) {
    if (map[cls]) sorted[cls] = map[cls]
  }
  for (const cls of Object.keys(map)) {
    if (!sorted[cls]) sorted[cls] = map[cls]
  }
  return sorted
}

function StatCard({ label, value, icon: Icon, colorClass, onClick, active }: {
  label: string; value: number; icon: React.ElementType
  colorClass: string; onClick?: () => void; active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 text-left w-full
        ${active
          ? `${colorClass} shadow-md scale-[1.02] ring-2 ring-offset-1`
          : 'bg-white border-gray-200 hover:shadow-md hover:scale-[1.01]'}
      `}
    >
      <div className={`p-3 rounded-xl ${active ? 'bg-white/30' : 'bg-gray-100'}`}>
        <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-600'}`} />
      </div>
      <div>
        <p className={`text-2xl font-bold ${active ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        <p className={`text-xs font-medium ${active ? 'text-white/80' : 'text-gray-500'}`}>{label}</p>
      </div>
      {active && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/60 animate-pulse" />}
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function ClassBadge({ label, color = 'blue' }: { label: string; color?: string }) {
  const map: Record<string, string> = {
    blue:   'bg-blue-100 text-blue-700 border-blue-200',
    green:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${map[color] ?? map.blue}`}>
      {label}
    </span>
  )
}

function DepartmentSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none transition-all min-w-[120px]"
    >
      <option value="">Select dept…</option>
      <option value="Science">🔬 Science</option>
      <option value="Arts">🎨 Arts</option>
      <option value="Commercial">💼 Commercial</option>
    </select>
  )
}

// ── Grid View ─────────────────────────────────────────────────────────────────
function GridView({ students, processing, selectedDepartment, onDeptChange, onApprove, onReject }: {
  students: Promotion[]
  processing: string | null
  selectedDepartment: Record<string, string>
  onDeptChange: (id: string, v: string) => void
  onApprove: (p: Promotion) => void
  onReject:  (p: Promotion) => void
}) {
  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {students.map((p) => {
        const isProcessing = processing === p.id
        const needsDept    = p.current_class === 'JSS 3' && p.status === 'pending'
        return (
          <div
            key={p.id}
            className={`relative flex flex-col rounded-xl border p-4 transition-all duration-200 hover:shadow-md
              ${p.status === 'approved' ? 'border-emerald-200 bg-emerald-50/30'
              : p.status === 'rejected' ? 'border-red-200 bg-red-50/30'
              : 'border-gray-200 bg-white hover:border-violet-200'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <StudentAvatar promotion={p} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.student_name}</p>
                <StatusBadge status={p.status} />
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              <ClassBadge label={p.current_class} color="blue" />
              <TrendingUp className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <ClassBadge label={p.next_class} color="green" />
            </div>

            {needsDept && (
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">Select Department *</label>
                <DepartmentSelect
                  value={selectedDepartment[p.student_id] || ''}
                  onChange={(v) => onDeptChange(p.student_id, v)}
                />
              </div>
            )}

            <div className="mt-auto pt-2">
              {p.status === 'pending' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove(p)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(p)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                    Reject
                  </button>
                </div>
              ) : (
                <div className={`text-center text-xs font-medium py-1.5 rounded-lg ${
                  p.status === 'approved' ? 'text-emerald-600 bg-emerald-100' : 'text-red-600 bg-red-100'
                }`}>
                  {p.status === 'approved' ? '✓ Promotion Approved' : '✗ Promotion Rejected'}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── List View ─────────────────────────────────────────────────────────────────
function ListView({ students, processing, selectedDepartment, onDeptChange, onApprove, onReject }: {
  students: Promotion[]
  processing: string | null
  selectedDepartment: Record<string, string>
  onDeptChange: (id: string, v: string) => void
  onApprove: (p: Promotion) => void
  onReject:  (p: Promotion) => void
}) {
  return (
    <div className="divide-y divide-gray-100">
      {students.map((p, idx) => {
        const isProcessing = processing === p.id
        const needsDept    = p.current_class === 'JSS 3' && p.status === 'pending'
        return (
          <div
            key={p.id}
            className={`flex flex-wrap items-center gap-4 px-5 py-3.5 transition-colors
              ${p.status === 'approved' ? 'bg-emerald-50/40'
              : p.status === 'rejected' ? 'bg-red-50/40'
              : 'hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3 min-w-[200px] flex-1">
              <span className="text-xs text-gray-400 w-6 text-right font-mono select-none">{idx + 1}</span>
              <StudentAvatar promotion={p} size="sm" />
              <span className="text-sm font-semibold text-gray-900 truncate">{p.student_name}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <ClassBadge label={p.current_class} color="blue" />
              <TrendingUp className="h-3 w-3 text-gray-400" />
              <ClassBadge label={p.next_class} color="green" />
            </div>

            <div className="w-36">
              {needsDept
                ? <DepartmentSelect value={selectedDepartment[p.student_id] || ''} onChange={(v) => onDeptChange(p.student_id, v)} />
                : <span className="text-xs text-gray-400">—</span>}
            </div>

            <div className="w-24"><StatusBadge status={p.status} /></div>

            <div className="flex gap-2 ml-auto">
              {p.status === 'pending' ? (
                <>
                  <button
                    onClick={() => onApprove(p)}
                    disabled={isProcessing}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(p)}
                    disabled={isProcessing}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                    Reject
                  </button>
                </>
              ) : (
                <span className={`text-xs font-semibold ${p.status === 'approved' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {p.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Class Section ─────────────────────────────────────────────────────────────
function ClassSection({ className, students, viewMode, processing, selectedDepartment, onDeptChange, onApprove, onReject }: {
  className: string; students: Promotion[]; viewMode: ViewMode; processing: string | null
  selectedDepartment: Record<string, string>
  onDeptChange: (studentId: string, dept: string) => void
  onApprove: (p: Promotion) => void; onReject: (p: Promotion) => void
  filter: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const pending  = students.filter(s => s.status === 'pending').length
  const approved = students.filter(s => s.status === 'approved').length
  const rejected = students.filter(s => s.status === 'rejected').length

  return (
    <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 transition-colors border-b border-gray-100"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <BookOpen className="h-4 w-4 text-violet-600" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900">{className}</h3>
            <p className="text-xs text-gray-500">{students.length} student{students.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex -space-x-2">
            {students.slice(0, 4).map(s => (
              <StudentAvatar key={s.student_id} promotion={s} size="sm" />
            ))}
            {students.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-semibold text-gray-600">
                +{students.length - 4}
              </div>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {pending  > 0 && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">{pending} pending</span>}
            {approved > 0 && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">{approved} approved</span>}
            {rejected > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">{rejected} rejected</span>}
          </div>
          {collapsed ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronUp className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {!collapsed && (
        viewMode === 'grid'
          ? <GridView students={students} processing={processing} selectedDepartment={selectedDepartment} onDeptChange={onDeptChange} onApprove={onApprove} onReject={onReject} />
          : <ListView students={students} processing={processing} selectedDepartment={selectedDepartment} onDeptChange={onDeptChange} onApprove={onApprove} onReject={onReject} />
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPromotionsPage() {
  const [promotions, setPromotions]                   = useState<Promotion[]>([])
  const [loading, setLoading]                         = useState(true)
  const [processing, setProcessing]                   = useState<string | null>(null)
  const [bulkLoading, setBulkLoading]                 = useState(false)
  const [processingEndOfTerm, setProcessingEndOfTerm] = useState(false)
  const [initializing, setInitializing]               = useState(false)
  const [error, setError]                             = useState<string | null>(null)
  const [success, setSuccess]                         = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment]   = useState<Record<string, string>>({})
  const [filter, setFilter]                           = useState<string>('all')
  const [initialLoad, setInitialLoad]                 = useState(true)
  const [systemStatus, setSystemStatus]               = useState<any>(null)
  const [searchQuery, setSearchQuery]                 = useState('')
  const [viewMode, setViewMode]                       = useState<ViewMode>('list')
  const [sortField, setSortField]                     = useState<SortField>('name')
  const [sortDir, setSortDir]                         = useState<SortDir>('asc')

  const fetchSystemStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/system-status')
      if (!res.ok) { if (res.status === 405) return; throw new Error() }
      setSystemStatus(await res.json())
    } catch {
      setSystemStatus({ settings: { currentTerm: 'third', currentSession: '2025/2026', promotionStatus: 'pending' }, canProcessPromotions: true, message: 'System ready for promotions' })
    }
  }, [])

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const res  = await fetch('/api/admin/promotions')
      const data = await res.json()
      if (data.promotions) {
        setPromotions(data.promotions)
        const deptSel: Record<string, string> = {}
        data.promotions.forEach((p: Promotion) => {
          if (p.current_class === 'JSS 3' && p.status === 'pending') deptSel[p.student_id] = 'Science'
        })
        setSelectedDepartment(deptSel)
      } else if (!res.ok) throw new Error(data.error || 'Failed to fetch')
    } catch (err: any) { setError(err.message); toast.error('Failed to load promotions') }
    finally { setLoading(false); setInitialLoad(false) }
  }, [])

  useEffect(() => { fetchPromotions(); fetchSystemStatus() }, [fetchPromotions, fetchSystemStatus])

  const handleInitSystem = async () => {
    setInitializing(true); setError(null); setSuccess(null)
    try {
      const res = await fetch('/api/admin/system/init', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('System initialized!'); toast.success('System initialized!')
      await fetchSystemStatus(); await fetchPromotions()
    } catch (err: any) { setError(err.message); toast.error(err.message) }
    finally { setInitializing(false) }
  }

  const handleCreatePromotions = async () => {
    if (!confirm('Create promotion requests for all eligible students?')) return
    setBulkLoading(true); setError(null); setSuccess(null)
    try {
      const res = await fetch('/api/admin/promotions/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(`${data.count || 0} promotions created.`); toast.success(`Created ${data.count || 0} promotions`)
      await fetchPromotions(); await fetchSystemStatus()
    } catch (err: any) { setError(err.message); toast.error(err.message) }
    finally { setBulkLoading(false) }
  }

  // ============================================
  // UPDATED: END OF TERM PROMOTIONS
  // Creates promotions, auto-approves, updates term/session
  // ============================================
  const handleEndOfTermPromotions = async () => {
    if (!confirm(
      '⚠️ END OF TERM PROMOTIONS\n\n' +
      'This will:\n' +
      '1. ✅ Create promotions for ALL eligible students\n' +
      '2. ✅ Auto-approve all promotions\n' +
      '3. ✅ Update all students to their next class\n' +
      '4. ✅ Change system from THIRD term to FIRST term\n' +
      '5. ✅ Advance session (e.g., 2025/2026 → 2026/2027)\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Continue?'
    )) return

    setProcessingEndOfTerm(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/end-of-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process end of term promotions')
      }

      if (!data.success) {
        toast.warning(data.message)
        setError(data.message)
        return
      }

      setSuccess(`✅ ${data.message}`)
      toast.success('End of term promotions completed!')
      await fetchPromotions()
      await fetchSystemStatus()

    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message)
      toast.error(err.message)
    } finally {
      setProcessingEndOfTerm(false)
    }
  }

  const handleApprove = async (promotion: Promotion) => {
    const dept = selectedDepartment[promotion.student_id] || null
    if (promotion.current_class === 'JSS 3' && !dept) { toast.error('Please select a department'); return }
    setProcessing(promotion.id); setError(null); setSuccess(null)
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: promotion.student_id, action: 'approve', department: dept }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${promotion.student_name} promoted`)
      await fetchPromotions(); await fetchSystemStatus()
    } catch (err: any) { setError(err.message); toast.error(err.message) }
    finally { setProcessing(null) }
  }

  const handleReject = async (promotion: Promotion) => {
    if (!confirm(`Reject promotion for ${promotion.student_name}?`)) return
    setProcessing(promotion.id); setError(null); setSuccess(null)
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: promotion.student_id, action: 'reject' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.info(`${promotion.student_name} rejected`)
      await fetchPromotions(); await fetchSystemStatus()
    } catch (err: any) { setError(err.message); toast.error(err.message) }
    finally { setProcessing(null) }
  }

  const handleApproveAll = async () => {
    const pending = promotions.filter(p => p.status === 'pending')
    if (!pending.length) { toast.info('No pending promotions'); return }
    const missing = pending.filter(p => p.current_class === 'JSS 3' && !selectedDepartment[p.student_id])
    if (missing.length) { toast.error(`Select dept for ${missing.length} JSS 3 student(s)`); return }
    if (!confirm(`Approve all ${pending.length} pending promotions?`)) return
    setBulkLoading(true); setError(null); setSuccess(null)
    let approved = 0, failed = 0
    for (const promo of pending) {
      try {
        const res = await fetch('/api/admin/promotions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: promo.student_id, action: 'approve', department: selectedDepartment[promo.student_id] || null }),
        })
        res.ok ? approved++ : failed++
      } catch { failed++ }
    }
    setSuccess(`Approved ${approved}${failed ? `, ${failed} failed` : ''}`)
    toast.success(`Approved ${approved} students`)
    await fetchPromotions(); await fetchSystemStatus()
    setBulkLoading(false)
  }

  const { filteredGrouped, pendingCount, approvedCount, rejectedCount, totalFiltered } = useMemo(() => {
    const pendingCount  = promotions.filter(p => p.status === 'pending').length
    const approvedCount = promotions.filter(p => p.status === 'approved').length
    const rejectedCount = promotions.filter(p => p.status === 'rejected').length
    let list = promotions.filter(p => {
      const matchFilter = filter === 'all' || p.status === filter
      const q = searchQuery.toLowerCase()
      const matchSearch = !q || p.student_name.toLowerCase().includes(q) || p.current_class.toLowerCase().includes(q)
      return matchFilter && matchSearch
    })
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortField === 'name')   cmp = a.student_name.localeCompare(b.student_name)
      if (sortField === 'class')  cmp = a.current_class.localeCompare(b.current_class)
      if (sortField === 'status') cmp = a.status.localeCompare(b.status)
      if (sortField === 'date')   cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortDir === 'asc' ? cmp : -cmp
    })
    return { filteredGrouped: groupByClass(list), pendingCount, approvedCount, rejectedCount, totalFiltered: list.length }
  }, [promotions, filter, searchQuery, sortField, sortDir])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  if (initialLoad && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-violet-600 animate-spin" />
            <GraduationCap className="absolute inset-0 m-auto h-6 w-6 text-violet-600" />
          </div>
          <p className="text-gray-700 font-semibold">Loading Promotions…</p>
          <p className="text-gray-400 text-sm mt-1">Please wait</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-200">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Promotion Management</h1>
              <p className="text-sm text-gray-500 mt-0.5">Students sorted A–Z within each class</p>
            </div>
          </div>
          <button
            onClick={() => { fetchPromotions(); fetchSystemStatus() }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* System Status */}
        {systemStatus && (
          <div className={`mb-6 rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            systemStatus.canProcessPromotions ? 'bg-emerald-50 border-emerald-200'
            : systemStatus.settings?.promotionStatus === 'completed' ? 'bg-blue-50 border-blue-200'
            : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${systemStatus.canProcessPromotions ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                <Info className={`h-4 w-4 ${systemStatus.canProcessPromotions ? 'text-emerald-600' : 'text-amber-600'}`} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{systemStatus.message || 'System Ready'}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Term: <strong>{systemStatus.settings?.currentTerm || 'Third'}</strong> &nbsp;·&nbsp;
                  Session: <strong>{systemStatus.settings?.currentSession || '2025/2026'}</strong> &nbsp;·&nbsp;
                  Status: <strong>{systemStatus.settings?.promotionStatus === 'completed' ? '✅ Completed' : '⏳ Pending'}</strong>
                </p>
              </div>
            </div>
            {systemStatus.canProcessPromotions && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-full animate-pulse">
                <Zap className="h-3 w-3" /> Ready for End of Term
              </span>
            )}
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-medium">{success}</p>
            <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600 text-lg leading-none">×</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total"    value={promotions.length} icon={Users}        colorClass="bg-gradient-to-br from-violet-500 to-purple-600 border-violet-400" onClick={() => setFilter('all')}      active={filter === 'all'}      />
          <StatCard label="Pending"  value={pendingCount}      icon={Clock}        colorClass="bg-gradient-to-br from-amber-400 to-orange-500 border-amber-400"    onClick={() => setFilter('pending')}  active={filter === 'pending'}  />
          <StatCard label="Approved" value={approvedCount}     icon={CheckCircle2} colorClass="bg-gradient-to-br from-emerald-400 to-green-600 border-emerald-400" onClick={() => setFilter('approved')} active={filter === 'approved'} />
          <StatCard label="Rejected" value={rejectedCount}     icon={XCircle}      colorClass="bg-gradient-to-br from-red-400 to-rose-600 border-red-400"          onClick={() => setFilter('rejected')} active={filter === 'rejected'} />
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <button onClick={handleCreatePromotions} disabled={bulkLoading} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
              Create Promotions
            </button>
            <button onClick={handleApproveAll} disabled={bulkLoading || pendingCount === 0} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve All{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
            {/* ============================================
                UPDATED: END OF TERM PROMOTIONS BUTTON
                ============================================ */}
            <button
              onClick={handleEndOfTermPromotions}
              disabled={processingEndOfTerm || !systemStatus?.canProcessPromotions}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              {processingEndOfTerm ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
              {processingEndOfTerm ? 'Processing…' : 'End of Term Promotions'}
            </button>
            <button onClick={handleInitSystem} disabled={initializing} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              {initializing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
              {initializing ? 'Initializing…' : 'Init System'}
            </button>
            <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1" />
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => setViewMode('list')} className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`} title="List view">
                <LayoutList className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`} title="Grid view">
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text" placeholder="Search by name or class…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">×</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
            {(['name', 'class', 'status', 'date'] as SortField[]).map(f => (
              <button key={f} onClick={() => toggleSort(f)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors border ${sortField === f ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}
              >
                {f} {sortField === f && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
            ))}
          </div>
        </div>

        {searchQuery && (
          <p className="text-sm text-gray-500 mb-4">
            Showing <strong>{totalFiltered}</strong> result{totalFiltered !== 1 ? 's' : ''} for "<strong>{searchQuery}</strong>"
          </p>
        )}

        {/* Content */}
        {Object.keys(filteredGrouped).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-gray-700 font-semibold text-lg">No promotions found</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter === 'all' && !searchQuery ? 'Click "Create Promotions" to get started.' : 'Try adjusting your search or filter.'}
            </p>
            {filter === 'all' && !searchQuery && (
              <button onClick={handleCreatePromotions} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
                <BookOpen className="h-4 w-4" /> Create Promotions
              </button>
            )}
          </div>
        ) : (
          Object.entries(filteredGrouped).map(([cls, students]) => (
            <ClassSection
              key={cls} className={cls} students={students} viewMode={viewMode}
              processing={processing} selectedDepartment={selectedDepartment}
              onDeptChange={(id, v) => setSelectedDepartment(prev => ({ ...prev, [id]: v }))}
              onApprove={handleApprove} onReject={handleReject} filter={filter}
            />
          ))
        )}

        <div className="mt-8 text-center text-xs text-gray-400">
          <Shield className="inline h-3 w-3 mr-1" />
          Promotion actions are logged and irreversible. Review carefully before approving.
        </div>
      </div>
    </div>
  )
}