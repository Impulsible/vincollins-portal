"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Eye,
  Calculator,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  FileQuestion,
  BookOpen,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  FileText,
  LayoutList,
  Target,
  Users,
  Sparkles,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionContent } from "@/components/shared/QuestionContent";
import { ExamHeader } from "./ExamHeader";
import { ExamDetailsTab } from "./ExamDetailsTab";
import { PreviewTab } from "./PreviewTab";
import { QuestionFormDialog } from "./QuestionFormDialog";
import { TheoryQuestionFormDialog } from "./TheoryQuestionFormDialog";
import { cn } from "@/lib/utils";
import type { Exam, Question, TheoryQuestion, ExamDetailsForm } from "./types";

/* ─── CONSTANTS ─── */
const CURRENT_TERM = "third";
const CURRENT_SESSION = "2025/2026";
const EXAM_TOTAL_MARKS = 60;

const TERM_NAMES: Record<string, string> = {
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
};

const CLASSES = [
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SS1",
  "SS2",
  "SS3",
  "SS1 Science",
  "SS1 Arts",
  "SS1 Commercial",
  "SS2 Science",
  "SS2 Arts",
  "SS2 Commercial",
  "SS3 Science",
  "SS3 Arts",
  "SS3 Commercial",
];

const AVAILABLE_SESSIONS = ["2025/2026", "2026/2027"];

const JSS_SUBJECTS = [
  "Mathematics",
  "English Studies",
  "Basic Science",
  "Basic Technology",
  "Social Studies",
  "Civic Education",
  "Christian Religious Studies",
  "Islamic Religious Studies",
  "Business Studies",
  "Music",
  "Home Economics",
  "Agricultural Science",
  "Physical and Health Education",
  "Information Technology",
  "Security Education",
  "Yoruba",
  "Cultural and Creative Arts",
  "French",
];

const SS_SUBJECTS = [
  "Mathematics",
  "English Language",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Government",
  "Literature in English",
  "Geography",
  "Commerce",
  "Data Processing",
  "Further Mathematics",
  "Civic Education",
  "CRS",
  "Financial Accounting",
  "Agricultural Science",
];

/* ─── HELPERS ─── */
function isObjectiveRow(q: any): boolean {
  return (
    q?.type === "objective" ||
    q?.question_type === "mcq" ||
    q?.question_type === "objective"
  );
}

function isTheoryRow(q: any): boolean {
  return q?.type === "theory" || q?.question_type === "theory" || q?.question_type === "essay";
}

/* ─── PURE COMPONENTS ─── */
function StatTile({
  value,
  label,
  accent,
}: {
  value: string | number;
  label: string;
  accent: string;
}) {
  return (
    <div className={cn("rounded-lg p-2.5 sm:p-3 text-center", accent)}>
      <p className="text-lg sm:text-2xl font-bold leading-none mb-0.5 sm:mb-1">
        {value}
      </p>
      <p className="text-[10px] sm:text-[11px] font-medium opacity-70 leading-tight">
        {label}
      </p>
    </div>
  );
}

interface QuestionCardProps {
  question: Question | TheoryQuestion;
  index: number;
  type: "objective" | "theory";
  onEdit: () => void;
  onDelete: () => void;
  onPointsChange?: (points: number) => void;
}

function QuestionCard({
  question,
  index,
  type,
  onEdit,
  onDelete,
  onPointsChange,
}: QuestionCardProps) {
  const objQ = type === "objective" ? (question as Question) : null;
  const theoryQ = type === "theory" ? (question as TheoryQuestion) : null;
  
  // Strict unsigned integer marks
  const currentPoints = Math.max(
    1,
    Math.round(
      Number(
        question.points !== undefined && question.points !== null
          ? question.points
          : (question as any).marks ?? (type === "theory" ? 8 : 1)
      ) || (type === "theory" ? 8 : 1)
    )
  );

  const isComplete =
    type === "objective"
      ? !!(objQ?.correct_answer && objQ?.options?.some((o: string) => o.trim()))
      : true;

  const statusConfig = question.is_draft
    ? {
        label: "Draft",
        icon: FileText,
        classes:
          "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/50",
        badge:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      }
    : isComplete
      ? {
          label: "Complete",
          icon: CheckCircle2,
          classes:
            "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800",
          badge:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        }
      : {
          label: "Incomplete",
          icon: AlertTriangle,
          classes:
            "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800",
          badge:
            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        };

  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={cn(
        "rounded-xl border p-3 sm:p-4 transition-all hover:shadow-sm group",
        statusConfig.classes,
      )}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] sm:text-xs font-medium gap-1 border-0 px-1.5 py-0.5",
                  type === "objective"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
                )}
              >
                {type === "objective" ? (
                  <BookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                ) : (
                  <FlaskConical className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                )}
                {type === "objective" ? "Obj" : "Theory"}
              </Badge>
              <Badge
                className={cn(
                  "text-[10px] sm:text-xs font-medium gap-1 border-0 px-1.5 py-0.5",
                  statusConfig.badge,
                )}
              >
                <StatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {statusConfig.label}
              </Badge>
              {question.image_url && (
                <Badge
                  variant="outline"
                  className="text-[10px] sm:text-xs font-medium text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 gap-1"
                >
                  <ImageIcon className="h-2.5 w-2.5" /> Diagram
                </Badge>
              )}
            </div>

            {/* Integer Marks Control */}
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase">
                Marks:
              </label>
              {type === "theory" && onPointsChange ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    max="60"
                    value={currentPoints}
                    onChange={(e) =>
                      onPointsChange(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-14 h-6 text-center text-xs font-bold rounded border border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">
                    mks
                  </span>
                </div>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 dark:border-slate-700 px-1.5 py-0.5"
                >
                  {currentPoints} pt{currentPoints !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>

          <QuestionContent
            text={question.question_text}
            imageUrl={question.image_url ?? undefined}
            imageCaption={question.image_caption ?? undefined}
            className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100"
          />

          {type === "objective" && objQ?.options && (
            <div className="mt-2.5 sm:mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {objQ.options.map((opt: string, idx: number) => {
                const letter = String.fromCharCode(65 + idx);
                const isCorrect =
                  objQ.correct_answer === letter || objQ.correct_answer === opt;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] sm:text-xs px-2 py-1.5 rounded-md border",
                      isCorrect
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 font-medium"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400",
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                        isCorrect
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400",
                      )}
                    >
                      {letter}
                    </span>
                    <span className="truncate">
                      {opt || <span className="italic opacity-50">Empty</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {type === "theory" &&
            theoryQ?.sub_questions &&
            theoryQ.sub_questions.length > 0 && (
              <div className="mt-2.5 space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {theoryQ.sub_questions.length} Sub-question
                  {theoryQ.sub_questions.length !== 1 ? "s" : ""}:
                </p>
                <div className="space-y-1 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                  {theoryQ.sub_questions.map((sub, sIdx) => {
                    const subPts = Math.max(
                      1,
                      Math.round(Number(sub.points ?? (sub as any).marks) || 1)
                    );
                    return (
                      <div
                        key={sub.id || sIdx}
                        className="text-xs text-slate-600 dark:text-slate-300"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {sub.label || (sub as any).question_number || `(${String.fromCharCode(97 + sIdx)})`}
                        </span>{" "}
                        {sub.question_text}{" "}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          ({subPts} pts)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Mobile action buttons */}
          <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="flex-1 h-8 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              <Edit className="h-3 w-3 mr-1" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="flex-1 h-8 text-xs text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        </div>

        {/* Desktop action buttons */}
        <div className="flex-shrink-0 hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export function EditExamPage({ examId: propExamId }: { examId?: string }) {
  const router = useRouter();
  const params = useParams();
  const examId = propExamId || (params?.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("questions");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>([]);
  const [hasTheory, setHasTheory] = useState(false);
  const [questionsToAnswer, setQuestionsToAnswer] = useState<number>(4);
  const [passageText, setPassageText] = useState("");
  const [hasPassage, setHasPassage] = useState(false);
  
  // Unsigned integer default mark for objective
  const [defaultMark, setDefaultMark] = useState<number>(1);

  const [examDetails, setExamDetails] = useState<ExamDetailsForm>({
    title: "",
    subject: "",
    class: "",
    duration: 60,
    instructions: "",
    pass_mark: 30,
    shuffle_questions: true,
    shuffle_options: true,
    term: CURRENT_TERM,
    session_year: CURRENT_SESSION,
    target_audience: "all",
  });

  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [showTheoryDialog, setShowTheoryDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingTheoryQuestion, setEditingTheoryQuestion] =
    useState<TheoryQuestion | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<{
    id: string;
    type: "objective" | "theory";
  } | null>(null);

  const hasMarksColRef = useRef(true);

  const availableSubjects = useMemo(() => {
    if (!examDetails.class) return [];
    return examDetails.class.startsWith("JSS") ? JSS_SUBJECTS : SS_SUBJECTS;
  }, [examDetails.class]);

  const objectiveCount = questions.length;
  const theoryCount = theoryQuestions.length;
  const totalQuestions = objectiveCount + theoryCount;
  
  // Integer Objective Points
  const totalObjectivePoints = Math.round(objectiveCount * defaultMark);

  // Unsigned Integer Candidate Theory Selection Count (N of M)
  const effectiveN = useMemo(() => {
    if (!hasTheory || theoryCount === 0) return 0;
    const qAns = Math.max(1, Math.round(Number(questionsToAnswer) || 1));
    return Math.min(qAns, theoryCount);
  }, [hasTheory, questionsToAnswer, theoryCount]);

  // Top-N Integer Theory Marks Sum
  const totalTheoryPoints = useMemo(() => {
    if (!hasTheory || theoryCount === 0 || effectiveN === 0) return 0;
    const sorted = [...theoryQuestions].sort(
      (a, b) =>
        Math.round(Number(b.points ?? (b as any).marks) || 0) -
        Math.round(Number(a.points ?? (a as any).marks) || 0),
    );
    return sorted
      .slice(0, effectiveN)
      .reduce(
        (sum, q) =>
          sum + Math.max(1, Math.round(Number(q.points ?? (q as any).marks) || 0)),
        0,
      );
  }, [hasTheory, theoryCount, effectiveN, theoryQuestions]);

  const targetTheoryMarks = Math.max(0, EXAM_TOTAL_MARKS - totalObjectivePoints);
  const totalExamPoints = totalObjectivePoints + totalTheoryPoints;
  const passMarkPercentage =
    totalExamPoints > 0 ? (examDetails.pass_mark / totalExamPoints) * 100 : 0;
  const isBalanced = totalExamPoints === EXAM_TOTAL_MARKS;

  const draftCount = [...questions, ...theoryQuestions].filter(
    (q) => q.is_draft,
  ).length;

  const buildQuestionsJSON = useCallback(() => {
    return questions.map((q, idx) => {
      const pts = Math.max(1, Math.round(Number(q.points) || defaultMark));
      return {
        id: q.id,
        question: q.question_text,
        question_text: q.question_text,
        options: q.options || [],
        correct_answer: q.correct_answer || "",
        answer: q.correct_answer || "",
        marks: pts,
        points: pts,
        type: "objective",
        image_url: q.image_url || null,
        image_caption: q.image_caption || null,
        order: idx + 1,
        order_number: idx + 1,
      };
    });
  }, [questions, defaultMark]);

  const buildTheoryQuestionsJSON = useCallback(() => {
    return theoryQuestions.map((q, idx) => {
      const pts = Math.max(
        1,
        Math.round(Number(q.points ?? (q as any).marks) || 8)
      );
      return {
        id: q.id,
        question: q.question_text,
        question_text: q.question_text,
        marks: pts,
        points: pts,
        type: "theory",
        sub_questions: (q.sub_questions || []).map((sub: any) => ({
          ...sub,
          points: Math.max(1, Math.round(Number(sub.points ?? sub.marks) || 1)),
          marks: Math.max(1, Math.round(Number(sub.points ?? sub.marks) || 1)),
        })),
        keywords: q.keywords || [],
        model_answer: q.model_answer || "",
        image_url: q.image_url || null,
        image_caption: q.image_caption || null,
        order: idx + 1,
        order_number: idx + 1,
      };
    });
  }, [theoryQuestions]);

  const loadQuestions = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setRefreshing(true);
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .eq("exam_id", examId)
          .is("deleted_at", null)
          .order("order_number", { ascending: true });

        if (error) throw error;
        const rows = data || [];

        if (rows.length > 0) {
          hasMarksColRef.current = "marks" in rows[0];
        }

        const objQs = rows.filter(isObjectiveRow).map((q) => {
          const rawPts =
            q.points !== undefined && q.points !== null
              ? q.points
              : q.marks !== undefined && q.marks !== null
                ? q.marks
                : defaultMark;
          const pts = Math.max(1, Math.round(Number(rawPts) || defaultMark));

          return {
            ...q,
            question_text: q.question_text || q.question || "",
            options: q.options || [],
            points: pts,
            marks: pts,
            type: "objective" as const,
            question_type: q.question_type || "mcq",
            image_url: q.image_url || null,
            image_caption: q.image_caption || null,
          };
        });
        setQuestions(objQs as Question[]);

        const thQs = rows.filter(isTheoryRow).map((q) => {
          const rawPts =
            q.points !== undefined && q.points !== null
              ? q.points
              : q.marks !== undefined && q.marks !== null
                ? q.marks
                : 8;
          const pts = Math.max(1, Math.round(Number(rawPts) || 8));

          return {
            ...q,
            question_text: q.question_text || q.question || "",
            points: pts,
            marks: pts,
            sub_questions: (q.sub_questions || []).map((sub: any) => ({
              ...sub,
              points: Math.max(1, Math.round(Number(sub.points ?? sub.marks) || 1)),
              marks: Math.max(1, Math.round(Number(sub.points ?? sub.marks) || 1)),
            })),
            keywords: q.keywords || [],
            type: "theory" as const,
            question_type: "theory" as const,
            image_url: q.image_url || null,
            image_caption: q.image_caption || null,
          };
        });
        setTheoryQuestions(thQs as TheoryQuestion[]);

        if (!silent) toast.success("Questions refreshed");
      } catch {
        if (!silent) toast.error("Failed to refresh questions");
      } finally {
        setRefreshing(false);
      }
    },
    [examId, defaultMark],
  );

  const loadExamData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const { data: examData, error } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();

      if (error) {
        setLoadError(`Failed to load exam: ${error.message}`);
        throw error;
      }
      if (!examData) {
        setLoadError("Exam not found");
        throw new Error("Exam not found");
      }

      const merged = {
        ...examData,
        shuffle_questions:
          examData.shuffle_questions ?? examData.randomize_questions ?? true,
        shuffle_options:
          examData.shuffle_options ?? examData.randomize_options ?? true,
        pass_mark: Math.round(Number(examData.pass_mark ?? examData.passing_marks) || 30),
      };

      setExam(merged as Exam);
      setHasTheory(Boolean(examData.has_theory));
      setDefaultMark(Math.max(1, Math.round(Number(examData.default_mark) || 1)));

      // Load using the correct schema column names
      const savedTheoryCount =
        examData.theory_questions_to_answer ??
        examData.required_theory_count;

      if (savedTheoryCount && Number(savedTheoryCount) > 0) {
        setQuestionsToAnswer(Math.round(Number(savedTheoryCount)));
      } else {
        const match = (examData.instructions || "").match(/Answer (?:any )?(\d+)/i);
        setQuestionsToAnswer(match && match[1] ? parseInt(match[1], 10) : 4);
      }

      setExamDetails({
        title: examData.title || "",
        subject: examData.subject || "",
        class: examData.class || "",
        duration: Math.round(Number(examData.duration ?? examData.duration_minutes) || 60),
        instructions: examData.instructions || examData.description || "",
        pass_mark: merged.pass_mark,
        shuffle_questions: merged.shuffle_questions,
        shuffle_options: merged.shuffle_options,
        term: examData.term || CURRENT_TERM,
        session_year: examData.session_year || CURRENT_SESSION,
        target_audience: examData.target_audience || "all",
      });

      setPassageText(examData.passage_text || "");
      setHasPassage(Boolean(examData.passage_text));

      await loadQuestions(true);
    } catch {
      toast.error("Failed to load exam data");
    } finally {
      setLoading(false);
    }
  }, [examId, loadQuestions]);

  useEffect(() => {
    if (examId) loadExamData();
  }, [examId, loadExamData]);

  // Clean Auto-Balance: Allocates exact unsigned integer marks (e.g. 8 marks each)
  const handleAutoBalance = async () => {
    if (theoryCount === 0) {
      toast.error("Please add theory questions first");
      return;
    }
    const n = effectiveN > 0 ? effectiveN : theoryCount;
    const requiredTarget = Math.max(0, EXAM_TOTAL_MARKS - totalObjectivePoints);
    const marksPerQ = Math.max(1, Math.round(requiredTarget / n));

    const updated = theoryQuestions.map((q) => {
      let subQs = q.sub_questions;
      if (subQs && subQs.length > 0) {
        const subMarks = Math.max(1, Math.round(marksPerQ / subQs.length));
        subQs = subQs.map((sub) => ({
          ...sub,
          points: subMarks,
          marks: subMarks,
        }));
      }
      return {
        ...q,
        points: marksPerQ,
        marks: marksPerQ,
        sub_questions: subQs,
      };
    });

    setTheoryQuestions(updated);

    try {
      await Promise.all(
        updated.map(async (q) => {
          const payload: Record<string, any> = {
            points: marksPerQ,
            sub_questions: q.sub_questions,
            updated_at: new Date().toISOString(),
          };
          if (hasMarksColRef.current) payload.marks = marksPerQ;

          const { error } = await supabase
            .from("questions")
            .update(payload)
            .eq("id", q.id);

          if (error && error.message?.includes("marks")) {
            hasMarksColRef.current = false;
            await supabase
              .from("questions")
              .update({
                points: marksPerQ,
                sub_questions: q.sub_questions,
                updated_at: new Date().toISOString(),
              })
              .eq("id", q.id);
          }
        }),
      );

      toast.success(
        `Balanced: ${marksPerQ} marks per question (${n} required × ${marksPerQ} = ${n * marksPerQ} marks)`,
      );
    } catch {
      toast.error("Failed to update question marks in database");
    }
  };

  // Inline mark changer: guarantees unsigned integer persistence
  const handleUpdateTheoryMarks = async (id: string, newPoints: number) => {
    const intPoints = Math.max(1, Math.round(newPoints));

    setTheoryQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, points: intPoints, marks: intPoints } : q,
      ),
    );

    try {
      const payload: Record<string, any> = {
        points: intPoints,
        updated_at: new Date().toISOString(),
      };
      if (hasMarksColRef.current) payload.marks = intPoints;

      const { error } = await supabase
        .from("questions")
        .update(payload)
        .eq("id", id);

      if (error && error.message?.includes("marks")) {
        hasMarksColRef.current = false;
        await supabase
          .from("questions")
          .update({
            points: intPoints,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
      }
    } catch (e) {
      console.error("Inline mark update note:", e);
    }
  };

  // Master Save Handler: Persists using exact `exams` and `questions` table schema
  const handleSaveExam = async () => {
    if (!examDetails.title.trim()) {
      toast.error("Please enter an exam title");
      setActiveTab("details");
      return;
    }
    if (!examDetails.subject) {
      toast.error("Please select a subject");
      setActiveTab("details");
      return;
    }
    if (!examDetails.class) {
      toast.error("Please select a class");
      setActiveTab("details");
      return;
    }
    if (totalExamPoints !== EXAM_TOTAL_MARKS) {
      toast.error(
        `Exam total must equal ${EXAM_TOTAL_MARKS} marks. Current total is ${totalExamPoints}`,
      );
      return;
    }

    setSaving(true);
    try {
      const questionsJSON = buildQuestionsJSON();
      const theoryQuestionsJSON = buildTheoryQuestionsJSON();
      const qAnswer = effectiveN > 0 ? effectiveN : questionsToAnswer;
      const singleTheoryMark =
        theoryQuestions.length > 0
          ? Math.max(1, Math.round(Number(theoryQuestions[0]?.points ?? (theoryQuestions[0] as any)?.marks) || 8))
          : 8;

      const formattedInstructions =
        examDetails.instructions.trim() ||
        (hasTheory
          ? `Section A: Objective (${objectiveCount} questions, ${totalObjectivePoints} marks).\nSection B: Theory - Answer any ${qAnswer} of ${theoryCount} questions (${singleTheoryMark} marks each, ${totalTheoryPoints} marks total).`
          : `Answer all ${objectiveCount} objective questions.`);

      // 1. Sync every theory and objective question to `questions` table
      await Promise.all([
        ...theoryQuestions.map(async (tq, idx) => {
          const pts = Math.max(
            1,
            Math.round(Number(tq.points ?? (tq as any).marks) || 8)
          );
          const payload: Record<string, any> = {
            question_text: tq.question_text || "",
            points: pts,
            sub_questions: tq.sub_questions || [],
            keywords: tq.keywords || [],
            model_answer: tq.model_answer || "",
            order_number: idx + 1,
            is_draft: tq.is_draft ?? false,
            updated_at: new Date().toISOString(),
          };
          if (hasMarksColRef.current) payload.marks = pts;

          const { error } = await supabase
            .from("questions")
            .update(payload)
            .eq("id", tq.id);

          if (error && error.message?.includes("marks")) {
            hasMarksColRef.current = false;
            await supabase
              .from("questions")
              .update({
                points: pts,
                sub_questions: tq.sub_questions || [],
                updated_at: new Date().toISOString(),
              })
              .eq("id", tq.id);
          }
        }),
        ...questions.map(async (oq, idx) => {
          const pts = Math.max(1, Math.round(Number(oq.points) || defaultMark));
          const payload: Record<string, any> = {
            question_text: oq.question_text || "",
            points: pts,
            options: oq.options || [],
            correct_answer: oq.correct_answer || "",
            order_number: idx + 1,
            is_draft: oq.is_draft ?? false,
            updated_at: new Date().toISOString(),
          };
          if (hasMarksColRef.current) payload.marks = pts;

          const { error } = await supabase
            .from("questions")
            .update(payload)
            .eq("id", oq.id);

          if (error && error.message?.includes("marks")) {
            hasMarksColRef.current = false;
            await supabase
              .from("questions")
              .update({ points: pts, updated_at: new Date().toISOString() })
              .eq("id", oq.id);
          }
        }),
      ]);

      // 2. Save complete exam configuration using the exact verified columns
      const examPayload = {
        title: examDetails.title.trim(),
        subject: examDetails.subject,
        class: examDetails.class,
        duration: Math.max(1, Math.round(Number(examDetails.duration) || 60)),
        duration_minutes: Math.max(1, Math.round(Number(examDetails.duration) || 60)),
        pass_mark: Math.max(1, Math.round(Number(examDetails.pass_mark) || 30)),
        description: formattedInstructions,
        instructions: formattedInstructions,
        randomize_questions: Boolean(examDetails.shuffle_questions),
        randomize_options: Boolean(examDetails.shuffle_options),
        shuffle_questions: Boolean(examDetails.shuffle_questions),
        shuffle_options: Boolean(examDetails.shuffle_options),
        has_theory: Boolean(hasTheory),
        required_theory_count: qAnswer,
        theory_questions_to_answer: qAnswer,
        theory_questions_total: theoryCount,
        theory_marks_per_question: singleTheoryMark,
        theory_total: totalTheoryPoints,
        theory_total_marks: totalTheoryPoints,
        theory_max: totalTheoryPoints,
        objective_count: objectiveCount,
        objective_total_marks: totalObjectivePoints,
        objective_max: totalObjectivePoints,
        term: examDetails.term,
        session_year: examDetails.session_year,
        target_audience: examDetails.target_audience || "all",
        total_questions: totalQuestions,
        total_marks: EXAM_TOTAL_MARKS,
        total_points: EXAM_TOTAL_MARKS,
        exam_total_marks: EXAM_TOTAL_MARKS,
        exam_total: EXAM_TOTAL_MARKS,
        ca1_max: 10,
        ca2_max: 10,
        ca_total_marks: 20,
        grand_total_marks: 100,
        default_mark: Math.max(1, Math.round(defaultMark)),
        passage_text: hasPassage ? passageText : null,
        questions: questionsJSON,
        theory_questions: theoryQuestionsJSON,
        updated_at: new Date().toISOString(),
      };

      const { error: examErr } = await supabase
        .from("exams")
        .update(examPayload)
        .eq("id", examId);

      if (examErr) throw examErr;

      toast.success("Exam and question marks saved successfully across system");
      router.push("/staff/exams");
    } catch (e: any) {
      console.error("Save error:", e);
      toast.error(e.message || "Failed to update exam");
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async (data: Partial<Question>) => {
    if (!data.question_text?.trim()) {
      toast.error("Question text is required");
      return;
    }
    const opts = (data.options || []).filter((o) => o.trim());
    const isDraft = data.is_draft ?? true;
    const pts = Math.max(1, Math.round(Number(data.points) || defaultMark));

    const payload: Record<string, any> = {
      exam_id: examId,
      question_text: data.question_text.trim(),
      question_type: "mcq",
      type: "objective",
      options: opts.length ? opts : ["", "", "", ""],
      correct_answer: data.correct_answer?.trim() || "",
      points: pts,
      order_number: questions.length + 1,
      is_draft: isDraft,
      sub_questions: [],
      keywords: [],
      model_answer: "",
      image_url: data.image_url || null,
      image_caption: data.image_caption || null,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (hasMarksColRef.current) payload.marks = pts;

    const { error } = await supabase
      .from("questions")
      .insert([payload])
      .select()
      .single();

    if (error) {
      toast.error(`Failed to add question: ${error.message}`);
      return;
    }
    await loadQuestions(true);
    toast.success(isDraft ? "Question saved as draft" : "Question added");
    setShowQuestionDialog(false);
    setEditingQuestion(null);
  };

  const handleUpdateQuestion = async (id: string, data: Partial<Question>) => {
    if (!data.question_text?.trim()) {
      toast.error("Question text is required");
      return;
    }
    const opts = (data.options || []).filter((o) => o.trim());
    const isDraft = data.is_draft ?? false;
    const pts = Math.max(1, Math.round(Number(data.points) || defaultMark));

    const payload: Record<string, any> = {
      question_text: data.question_text.trim(),
      options: opts.length ? opts : ["", "", "", ""],
      correct_answer: data.correct_answer?.trim() || "",
      points: pts,
      is_draft: isDraft,
      question_type: "mcq",
      type: "objective",
      image_url: data.image_url !== undefined ? data.image_url : null,
      image_caption:
        data.image_caption !== undefined ? data.image_caption : null,
      updated_at: new Date().toISOString(),
    };
    if (hasMarksColRef.current) payload.marks = pts;

    const { error } = await supabase
      .from("questions")
      .update(payload)
      .eq("id", id);

    if (error) {
      toast.error(`Failed to update: ${error.message}`);
      return;
    }
    await loadQuestions(true);
    toast.success(isDraft ? "Question saved as draft" : "Question updated");
    setShowQuestionDialog(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    const { error } = await supabase
      .from("questions")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionToDelete.id);

    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
      return;
    }
    await loadQuestions(true);
    toast.success("Question deleted");
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };

  const handleAddTheoryQuestion = async (data: Partial<TheoryQuestion>) => {
    if (!data.question_text?.trim()) {
      toast.error("Question text is required");
      return;
    }
    const isDraft = data.is_draft ?? true;
    const defaultPoints = Math.max(
      1,
      Math.round(
        Number(
          data.points ??
            (effectiveN > 0 ? targetTheoryMarks / effectiveN : 8)
        )
      )
    );

    const payload: Record<string, any> = {
      exam_id: examId,
      question_text: data.question_text.trim(),
      question_type: "theory",
      type: "theory",
      points: defaultPoints,
      order_number: theoryQuestions.length + 1,
      sub_questions: data.sub_questions || [],
      keywords: data.keywords || [],
      model_answer: data.model_answer || "",
      is_draft: isDraft,
      options: [],
      correct_answer: "",
      image_url: data.image_url || null,
      image_caption: data.image_caption || null,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (hasMarksColRef.current) payload.marks = defaultPoints;

    const { error } = await supabase
      .from("questions")
      .insert([payload])
      .select()
      .single();

    if (error) {
      toast.error(`Failed to add theory question: ${error.message}`);
      return;
    }
    await loadQuestions(true);
    toast.success(
      isDraft ? "Theory question saved as draft" : "Theory question added",
    );
    setShowTheoryDialog(false);
    setEditingTheoryQuestion(null);
  };

  const handleUpdateTheoryQuestion = async (
    id: string,
    data: Partial<TheoryQuestion>,
  ) => {
    if (!data.question_text?.trim()) {
      toast.error("Question text is required");
      return;
    }
    const isDraft = data.is_draft ?? false;
    const pts = Math.max(
      1,
      Math.round(Number(data.points ?? (data as any).marks) || 8)
    );

    const payload: Record<string, any> = {
      question_text: data.question_text.trim(),
      points: pts,
      sub_questions: data.sub_questions || [],
      keywords: data.keywords || [],
      model_answer: data.model_answer || "",
      is_draft: isDraft,
      question_type: "theory",
      type: "theory",
      image_url: data.image_url !== undefined ? data.image_url : null,
      image_caption:
        data.image_caption !== undefined ? data.image_caption : null,
      updated_at: new Date().toISOString(),
    };
    if (hasMarksColRef.current) payload.marks = pts;

    const { error } = await supabase
      .from("questions")
      .update(payload)
      .eq("id", id);

    if (error) {
      toast.error(`Failed to update: ${error.message}`);
      return;
    }
    await loadQuestions(true);
    toast.success(
      isDraft ? "Theory question saved as draft" : "Theory question updated",
    );
    setShowTheoryDialog(false);
    setEditingTheoryQuestion(null);
  };

  /* ─── RENDERERS ─── */
  if (loading) {
    return (
      <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-5 max-w-[1600px] mx-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Skeleton className="h-12 sm:h-14 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-24 sm:h-28 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              className="h-10 rounded-lg bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
        <Skeleton className="h-[320px] sm:h-[420px] w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (loadError || !exam) {
    return (
      <div className="p-3 sm:p-6 lg:p-8 max-w-lg mx-auto mt-6 sm:mt-10 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
        <Alert
          variant="destructive"
          className="rounded-xl border-2 dark:bg-red-950/30 dark:border-red-900/50"
        >
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <p>{loadError || "Exam not found"}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/staff/exams")}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 w-full sm:w-auto"
            >
              ← Back to Exams
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <div className="p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 max-w-[1600px] mx-auto pb-24 sm:pb-6">
        <ExamHeader
          examId={examId}
          examTitle={exam?.title}
          term={examDetails.term}
          termName={TERM_NAMES[examDetails.term] || "Third Term"}
          sessionYear={examDetails.session_year}
          saving={saving}
          onSave={handleSaveExam}
        />

        {/* Controls Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
          {/* Objective Mark Selector */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/50">
            <div className="flex items-center gap-2 min-w-0">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                Mark/Obj Q:
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2].map((mark) => (
                <button
                  key={mark}
                  onClick={() => {
                    setDefaultMark(mark);
                    setQuestions((prev) =>
                      prev.map((q) => ({ ...q, points: mark, marks: mark })),
                    );
                    toast.info(`Default objective mark set to ${mark}`);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-semibold transition-all min-w-[40px]",
                    defaultMark === mark
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-700",
                  )}
                >
                  {mark}
                </button>
              ))}
            </div>
            <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 w-full sm:w-auto sm:ml-auto">
              {objectiveCount} × {defaultMark} ={" "}
              <strong>{totalObjectivePoints} marks</strong>
            </span>
          </div>

          {/* Theory N of M & Auto-Balance Controls */}
          {hasTheory && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800/50">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                    Theory Rule:
                  </span>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400">
                    Candidates answer {effectiveN} of {theoryCount} Qs ({totalTheoryPoints} marks)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg px-2 py-1">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Answer
                  </span>
                  <Input
                    type="number"
                    min="1"
                    max={theoryCount || 1}
                    value={questionsToAnswer}
                    onChange={(e) =>
                      setQuestionsToAnswer(
                        Math.max(1, parseInt(e.target.value, 10) || 1),
                      )
                    }
                    className="w-12 h-6 text-center text-xs font-bold border-0 bg-transparent p-0 focus-visible:ring-0 text-purple-700 dark:text-purple-300"
                  />
                  <span className="text-[11px] text-slate-500 font-medium">
                    of {theoryCount}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleAutoBalance}
                  className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1 px-2.5 shadow-sm"
                >
                  <Sparkles className="h-3 w-3" /> Auto-Balance
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Validation / Over-Limit Alert Banner */}
        {!isBalanced && (
          <Alert
            variant="destructive"
            className="rounded-xl border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200 py-2.5"
          >
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-xs font-medium">
              Total is {totalExamPoints} marks —{" "}
              {totalExamPoints > EXAM_TOTAL_MARKS
                ? `exceeds ${EXAM_TOTAL_MARKS} by ${totalExamPoints - EXAM_TOTAL_MARKS}. Reduce objective points or theory question marks to balance.`
                : `short of ${EXAM_TOTAL_MARKS} by ${EXAM_TOTAL_MARKS - totalExamPoints}. Adjust marks to reach exactly ${EXAM_TOTAL_MARKS}.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Points Summary Card */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950/50 flex-shrink-0">
                  <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200 truncate">
                  Points Allocation Summary
                </h3>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <Badge
                  className={cn(
                    "text-[10px] whitespace-nowrap",
                    isBalanced
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
                  )}
                >
                  {isBalanced
                    ? `Balanced: ${EXAM_TOTAL_MARKS} / ${EXAM_TOTAL_MARKS}`
                    : `Current: ${totalExamPoints} / ${EXAM_TOTAL_MARKS}`}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadQuestions(false)}
                  disabled={refreshing}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
                >
                  <RefreshCw
                    className={cn("h-4 w-4", refreshing && "animate-spin")}
                  />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <StatTile
                value={objectiveCount}
                label="Objective Qs"
                accent="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
              />
              <StatTile
                value={`${totalObjectivePoints} mks`}
                label="Obj. Points"
                accent="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"
              />
              <StatTile
                value={hasTheory ? `${effectiveN} of ${theoryCount}` : "0"}
                label="Theory Choice"
                accent="bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300"
              />
              <StatTile
                value={`${totalTheoryPoints} mks`}
                label="Theory Points"
                accent="bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Default Obj Mark
                  </p>
                  <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                    {defaultMark}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Obj / Theory Balance
                  </p>
                  <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                    {totalObjectivePoints} / {totalTheoryPoints}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right space-y-0.5">
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Pass Mark Target
                </p>
                <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">
                  {examDetails.pass_mark}
                  <span className="text-xs sm:text-sm font-normal text-slate-400 dark:text-slate-500">
                    {" "}
                    / {totalExamPoints}
                  </span>
                  <span className="ml-1.5 text-[10px] sm:text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-semibold">
                    {totalExamPoints > 0 ? Math.round(passMarkPercentage) : 0}%
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passage Editor */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={hasPassage ? "default" : "outline"}
              size="sm"
              onClick={() => setHasPassage(!hasPassage)}
              className={cn(
                "text-xs w-full sm:w-auto",
                hasPassage &&
                  "bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-500 border-0",
              )}
            >
              <BookOpen className="h-3 w-3 mr-1" />
              {hasPassage ? "📖 Passage Enabled" : "Add Comprehension Passage"}
            </Button>
            {hasPassage && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 hidden sm:inline">
                Students will see this during the exam
              </span>
            )}
          </div>
          {hasPassage && (
            <div className="p-2.5 sm:p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/50">
              <Label className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase">
                Comprehension Passage
              </Label>
              <Textarea
                value={passageText}
                onChange={(e) => setPassageText(e.target.value)}
                rows={6}
                className="mt-1 resize-none text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Paste the reading passage here..."
              />
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-1 mb-3 sm:mb-4 sticky top-0 z-10">
            <TabsList className="w-full grid grid-cols-3 bg-transparent gap-1 h-auto">
              {[
                {
                  value: "questions",
                  label: `Questions`,
                  shortLabel: "Qs",
                  count: totalQuestions,
                  icon: LayoutList,
                },
                {
                  value: "details",
                  label: "Exam Details",
                  shortLabel: "Details",
                  icon: FileText,
                },
                {
                  value: "preview",
                  label: "Preview",
                  shortLabel: "Preview",
                  icon: Eye,
                },
              ].map(({ value, label, shortLabel, count, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    "flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg transition-all font-medium",
                    "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 dark:data-[state=inactive]:text-slate-400 dark:data-[state=inactive]:hover:text-slate-200",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{shortLabel}</span>
                  {count !== undefined && count > 0 && (
                    <span
                      className={cn(
                        "text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full font-semibold",
                        activeTab === value
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="questions" className="mt-0">
            {totalQuestions === 0 ? (
              <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <CardContent className="py-10 sm:py-16 text-center px-4">
                  <div className="inline-flex p-3 sm:p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3 sm:mb-4">
                    <FileQuestion className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    No questions yet
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">
                    Start building your exam by adding questions below.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center">
                    <Button
                      onClick={() => {
                        setEditingQuestion(null);
                        setShowQuestionDialog(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-sm gap-2 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4" /> Add Objective Question
                    </Button>
                    {hasTheory && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingTheoryQuestion(null);
                          setShowTheoryDialog(true);
                        }}
                        className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4" /> Add Theory Question
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <div className="flex flex-col gap-3 px-3 sm:px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <LayoutList className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                      All Questions
                    </span>
                    <span className="text-[10px] sm:text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                      {totalQuestions}
                    </span>
                    {draftCount > 0 && (
                      <span className="text-[10px] sm:text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        {draftCount} draft{draftCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingQuestion(null);
                        setShowQuestionDialog(true);
                      }}
                      className="flex-1 sm:flex-none h-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs gap-1.5 shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" /> Objective
                    </Button>
                    {hasTheory && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingTheoryQuestion(null);
                          setShowTheoryDialog(true);
                        }}
                        className="flex-1 sm:flex-none h-8 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        <Plus className="h-3.5 w-3.5" /> Theory
                      </Button>
                    )}
                  </div>
                </div>

                <CardContent className="p-2 sm:p-4">
                  <ScrollArea className="h-[460px] sm:h-[520px] pr-1 sm:pr-2">
                    <div className="space-y-2 sm:space-y-2.5 pr-1 sm:pr-2">
                      {objectiveCount > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 py-1">
                            <BookOpen className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                              Objective ({objectiveCount})
                            </span>
                            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                          </div>
                          {questions.map((q, idx) => (
                            <QuestionCard
                              key={q.id}
                              index={idx + 1}
                              question={q}
                              type="objective"
                              onEdit={() => {
                                setEditingQuestion(q);
                                setShowQuestionDialog(true);
                              }}
                              onDelete={() => {
                                setQuestionToDelete({
                                  id: q.id,
                                  type: "objective",
                                });
                                setDeleteDialogOpen(true);
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {theoryCount > 0 && (
                        <div className="space-y-2 mt-4">
                          <div className="flex items-center gap-2 py-1">
                            <FlaskConical className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                              Theory ({theoryCount}) — Candidates answer {effectiveN}
                            </span>
                            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                          </div>
                          {theoryQuestions.map((q, idx) => (
                            <QuestionCard
                              key={q.id}
                              index={questions.length + idx + 1}
                              question={q}
                              type="theory"
                              onPointsChange={(pts) =>
                                handleUpdateTheoryMarks(q.id, pts)
                              }
                              onEdit={() => {
                                setEditingTheoryQuestion(q);
                                setShowTheoryDialog(true);
                              }}
                              onDelete={() => {
                                setQuestionToDelete({
                                  id: q.id,
                                  type: "theory",
                                });
                                setDeleteDialogOpen(true);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="mt-0">
            <ExamDetailsTab
              formData={examDetails}
              onChange={(data) => setExamDetails({ ...examDetails, ...data })}
              availableSubjects={availableSubjects}
              classes={CLASSES}
              availableSessions={AVAILABLE_SESSIONS}
              currentSession={CURRENT_SESSION}
              hasTheory={hasTheory}
              onHasTheoryChange={setHasTheory}
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <PreviewTab
              examDetails={examDetails}
              questions={questions}
              theoryQuestions={theoryQuestions}
              hasTheory={hasTheory}
              passageText={hasPassage ? passageText : undefined}
              defaultMark={defaultMark}
              theoryTotalMarks={totalTheoryPoints}
            />
          </TabsContent>
        </Tabs>

        {/* Mobile Sticky Save Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-20 sm:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Total Marks
              </p>
              <p
                className={cn(
                  "text-sm font-bold",
                  isBalanced
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
                )}
              >
                {totalExamPoints} / {EXAM_TOTAL_MARKS}
              </p>
            </div>
            <Button
              onClick={handleSaveExam}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm h-10"
            >
              {saving ? "Saving..." : "Save Exam"}
            </Button>
          </div>
        </div>

        {/* Dialogs */}
        <QuestionFormDialog
          open={showQuestionDialog}
          onOpenChange={(open) => {
            setShowQuestionDialog(open);
            if (!open) setEditingQuestion(null);
          }}
          initialData={editingQuestion || undefined}
          onSave={(data) =>
            editingQuestion
              ? handleUpdateQuestion(editingQuestion.id, data)
              : handleAddQuestion(data)
          }
          onCancel={() => {
            setShowQuestionDialog(false);
            setEditingQuestion(null);
          }}
        />

        <TheoryQuestionFormDialog
          open={showTheoryDialog}
          onOpenChange={(open) => {
            setShowTheoryDialog(open);
            if (!open) setEditingTheoryQuestion(null);
          }}
          initialData={editingTheoryQuestion || undefined}
          onSave={(data) =>
            editingTheoryQuestion
              ? handleUpdateTheoryQuestion(editingTheoryQuestion.id, data)
              : handleAddTheoryQuestion(data)
          }
          onCancel={() => {
            setShowTheoryDialog(false);
            setEditingTheoryQuestion(null);
          }}
        />

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 flex-shrink-0">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <DialogTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Delete Question?
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 pl-0 sm:pl-11">
                This action is permanent and cannot be undone. The question will
                be removed from this exam.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto h-9 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="w-full sm:w-auto h-9 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white gap-1.5"
                onClick={handleDeleteQuestion}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default EditExamPage;