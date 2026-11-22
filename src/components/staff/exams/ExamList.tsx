'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  PlusCircle,
  Eye,
  Edit,
  MoreVertical,
  Copy,
  Send,
  Trash2,
  Clock,
  FileText,
  Users,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Exam {
  id: string;
  title: string;
  subject: string;
  class: string;
  duration?: number;
  duration_minutes?: number;
  time_limit_minutes?: number;
  duration_mins?: number;
  time_limit?: number;
  status: string;
  total_questions: number;
  total_marks: number;
  has_theory: boolean;
  created_at: string;
  instructions?: string;
  description?: string;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  pass_mark?: number;
  created_by?: string;
  teacher_name?: string;
}

export interface ExamListProps {
  exams: Exam[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onCreateExam: () => void;
  onViewExam: (id: string) => void;
  onEditExam: (id: string) => void;
  onDeleteExam: (id: string) => Promise<void> | void;
  onDuplicateExam: (id: string) => Promise<void> | void;
  onSubmitForApproval: (id: string) => Promise<void> | void;
  onViewSubmissions?: (id: string) => void;
  onEnterScores?: (id: string) => void;
  totalExams: number;
  draftCount: number;
  pendingCount: number;
  approvedCount: number;
  publishedCount: number;
  termInfo?: {
    termName: string;
    sessionYear: string;
    termCode: string;
    isCurrent: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCURATE DURATION RESOLUTION (Strictly avoids hardcoded fallbacks)
// ─────────────────────────────────────────────────────────────────────────────
const getExamDuration = (exam: Exam): number | null => {
  const e = exam as any;
  const raw =
    exam.duration_minutes ??
    exam.duration ??
    e.time_limit_minutes ??
    e.duration_mins ??
    e.time_limit;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'published':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Published
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <CheckCircle2 className="w-3 h-3" />
          Approved
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case 'draft':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          Draft
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase">
          {status || 'Unknown'}
        </span>
      );
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export function ExamList({
  exams,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onCreateExam,
  onViewExam,
  onEditExam,
  onDeleteExam,
  onDuplicateExam,
  onSubmitForApproval,
  onViewSubmissions,
  onEnterScores,
  totalExams,
  draftCount,
  pendingCount,
  approvedCount,
  publishedCount,
  termInfo,
}: ExamListProps) {
  const router = useRouter();
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (exam: Exam) => {
    setExamToDelete(exam);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!examToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteExam(examToDelete.id);
      setDeleteDialogOpen(false);
      setExamToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (exam: Exam) => {
    setDuplicatingId(exam.id);
    try {
      await onDuplicateExam(exam.id);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleSubmitForReview = async (exam: Exam) => {
    setSubmittingId(exam.id);
    try {
      await onSubmitForApproval(exam.id);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleViewSubmissions = (examId: string) => {
    if (onViewSubmissions) {
      onViewSubmissions(examId);
    } else {
      router.push(`/staff/exams/${examId}/submissions`);
    }
  };

  const handleEnterScores = (examId: string) => {
    if (onEnterScores) {
      onEnterScores(examId);
    } else {
      router.push(`/staff/exams/${examId}/scores`);
    }
  };

  const statCards = [
    {
      id: 'all',
      label: 'Total Exams',
      count: totalExams,
      color: 'text-slate-900 dark:text-white',
      border: 'border-slate-200 dark:border-slate-800',
      activeBg: 'bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-400',
    },
    {
      id: 'draft',
      label: 'Drafts',
      count: draftCount,
      color: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-800',
      activeBg: 'bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-400',
    },
    {
      id: 'pending',
      label: 'Pending Review',
      count: pendingCount,
      color: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200/60 dark:border-amber-900/40',
      activeBg: 'bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-500',
    },
    {
      id: 'approved',
      label: 'Approved',
      count: approvedCount,
      color: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200/60 dark:border-blue-900/40',
      activeBg: 'bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-500',
    },
    {
      id: 'published',
      label: 'Published',
      count: publishedCount,
      color: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200/60 dark:border-emerald-900/40',
      activeBg: 'bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500',
    },
  ];

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Exam Control Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Manage questions, submit for review, and track submissions.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={onCreateExam}
          className="w-full sm:w-auto h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm transition-all duration-150 flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Exam</span>
        </Button>
      </div>

      {/* ── Academic Term Banner ───────────────────────────────────── */}
      {termInfo?.termName && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-white">
              {termInfo.termName}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Academic Session: {termInfo.sessionYear}</span>
            {termInfo.isCurrent && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] font-semibold border-0 px-2 py-0.5">
                Current Active Term
              </Badge>
            )}
          </div>
          <div className="text-slate-500 text-[11px] font-medium ml-auto sm:ml-0">
            Total Records: {exams.length}
          </div>
        </div>
      )}

      {/* ── Stat Metric Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {statCards.map((card) => {
          const isSelected = statusFilter === card.id;
          return (
            <button
              key={card.id}
              onClick={() => onStatusFilterChange(card.id)}
              className={cn(
                'text-left p-3 sm:p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-150 relative overflow-hidden',
                card.border,
                isSelected ? card.activeBg : 'hover:border-slate-300 dark:hover:border-slate-700'
              )}
            >
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                {card.label}
              </p>
              <p className={cn('text-lg sm:text-2xl font-bold mt-1 tracking-tight', card.color)}>
                {card.count}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Controls ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Search by title, subject, or target class..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9.5 h-10 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All' },
            { id: 'draft', label: 'Drafts' },
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'published', label: 'Published' },
          ].map((pill) => {
            const isActive = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => onStatusFilterChange(pill.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Content Area ──────────────────────────────────────── */}
      {exams.length === 0 ? (
        <Card className="border border-dashed border-slate-300 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 rounded-2xl">
          <CardContent className="py-14 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No examinations found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No exams matching "${searchQuery}". Try a different keyword.`
                  : 'Get started by creating your first exam with objective or theory questions.'}
              </p>
            </div>
            <Button
              onClick={onCreateExam}
              variant="outline"
              size="sm"
              className="mt-2 rounded-xl text-xs font-medium dark:border-slate-700"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Create Exam
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* ── Mobile View: High-Density Interactive Cards (< 1024px) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
            {exams.map((exam) => {
              const duration = getExamDuration(exam);
              const isDraft = exam.status === 'draft';
              const isApproved = exam.status === 'approved';
              const isPublished = exam.status === 'published';
              const isPending = exam.status === 'pending';

              return (
                <div
                  key={exam.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {exam.subject || 'Subject'}
                        </span>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {exam.class || 'Class'}
                        </span>
                      </div>
                      {getStatusBadge(exam.status)}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                      {exam.title || 'Untitled Exam'}
                    </h3>
                  </div>

                  {/* Metadata Matrix */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{duration ? `${duration} mins` : 'Untimed'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{exam.total_questions || 0} Qs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{exam.total_marks || 0} pts</span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">
                      {formatDate(exam.created_at)}
                    </span>

                    <div className="flex items-center gap-1">
                      {isDraft && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSubmitForReview(exam)}
                          disabled={submittingId === exam.id}
                          className="h-8 px-2.5 text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        >
                          {submittingId === exam.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Send className="w-3 h-3 mr-1" />
                          )}
                          Submit
                        </Button>
                      )}

                      {(isPublished || isApproved || isPending) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewSubmissions(exam.id)}
                          className="h-8 px-2.5 text-xs text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        >
                          <Users className="w-3.5 h-3.5 mr-1" />
                          Submissions
                        </Button>
                      )}

                      {isDraft ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditExam(exam.id)}
                          className="h-8 w-8 p-0 text-slate-600 dark:text-slate-300"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewExam(exam.id)}
                          className="h-8 w-8 p-0 text-slate-600 dark:text-slate-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl text-xs"
                        >
                          <DropdownMenuItem
                            onClick={() => onViewExam(exam.id)}
                            className="cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 mr-2" /> View Exam Structure
                          </DropdownMenuItem>

                          {isPublished && (
                            <DropdownMenuItem
                              onClick={() => handleEnterScores(exam.id)}
                              className="cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5 mr-2" /> Enter Theory Scores
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => handleDuplicate(exam)}
                            disabled={duplicatingId === exam.id}
                            className="cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 mr-2" />
                            {duplicatingId === exam.id ? 'Duplicating...' : 'Duplicate Exam'}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="dark:bg-slate-800" />

                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(exam)}
                            className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Exam
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop View: Professional Clean Table (>= 1024px) ── */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <TableHead className="py-3 px-4">Exam Details</TableHead>
                  <TableHead className="py-3 px-4">Subject & Class</TableHead>
                  <TableHead className="py-3 px-4 text-center">Structure</TableHead>
                  <TableHead className="py-3 px-4 text-center">Duration</TableHead>
                  <TableHead className="py-3 px-4">Lifecycle Status</TableHead>
                  <TableHead className="py-3 px-4">Created</TableHead>
                  <TableHead className="py-3 px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
                {exams.map((exam) => {
                  const duration = getExamDuration(exam);
                  const isDraft = exam.status === 'draft';
                  const isApproved = exam.status === 'approved';
                  const isPublished = exam.status === 'published';
                  const isPending = exam.status === 'pending';

                  return (
                    <TableRow
                      key={exam.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <TableCell className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {exam.title || 'Untitled Exam'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {exam.has_theory ? 'Objective + Theory' : 'Objective Only'}
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {exam.subject || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {exam.class || 'All Classes'}
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4 text-center">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {exam.total_questions || 0} Qs
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {exam.total_marks || 0} marks
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{duration ? `${duration}m` : 'Untimed'}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        {getStatusBadge(exam.status)}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-slate-400 text-[11px]">
                        {formatDate(exam.created_at)}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDraft && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSubmitForReview(exam)}
                              disabled={submittingId === exam.id}
                              className="h-7.5 px-2.5 text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"
                            >
                              {submittingId === exam.id ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <Send className="w-3 h-3 mr-1" />
                              )}
                              Submit
                            </Button>
                          )}

                          {(isPublished || isApproved || isPending) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewSubmissions(exam.id)}
                              className="h-7.5 px-2.5 text-xs text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                            >
                              <Users className="w-3.5 h-3.5 mr-1" />
                              Submissions
                            </Button>
                          )}

                          {isDraft ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEditExam(exam.id)}
                              className="h-7.5 w-7.5 p-0 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit Draft"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onViewExam(exam.id)}
                              className="h-7.5 w-7.5 p-0 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7.5 w-7.5 p-0 text-slate-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl text-xs"
                            >
                              <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-wider">
                                Exam Actions
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => onViewExam(exam.id)}
                                className="cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 mr-2" /> View Details
                              </DropdownMenuItem>
                              {isPublished && (
                                <DropdownMenuItem
                                  onClick={() => handleEnterScores(exam.id)}
                                  className="cursor-pointer"
                                >
                                  <Award className="w-3.5 h-3.5 mr-2" /> Enter Scores
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDuplicate(exam)}
                                disabled={duplicatingId === exam.id}
                                className="cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 mr-2" />
                                {duplicatingId === exam.id ? 'Duplicating...' : 'Duplicate Exam'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="dark:bg-slate-800" />
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(exam)}
                                className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Exam
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Accessible Delete Confirmation Dialog ───────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl dark:bg-slate-950 dark:border-slate-800">
          <DialogHeader>
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 mb-2">
              <AlertCircle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Delete Examination
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900 dark:text-white">
                {examToDelete?.title || 'this exam'}
              </strong>
              ? This action will permanently remove questions and associated records.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="rounded-xl text-xs dark:border-slate-800"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="rounded-xl text-xs bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Confirm Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}