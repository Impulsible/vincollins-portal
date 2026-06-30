// src/components/staff/exams/edit/EditExamPage.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Eye, Calculator, AlertCircle, Plus, Edit, Trash2,
  RefreshCw, FileQuestion, BookOpen, FlaskConical,
  CheckCircle2, AlertTriangle, FileText, LayoutList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ExamHeader } from "./ExamHeader";
import { ExamDetailsTab } from "./ExamDetailsTab";
import { PreviewTab } from "./PreviewTab";
import { QuestionFormDialog } from "./QuestionFormDialog";
import { TheoryQuestionFormDialog } from "./TheoryQuestionFormDialog";
import { cn } from "@/lib/utils";
import type { Exam, Question, TheoryQuestion, ExamDetailsForm } from "./types";

const CURRENT_TERM = "third";
const CURRENT_SESSION = "2025/2026";
const TERM_NAMES: Record<string, string> = {
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
};

const CLASSES = [
  "JSS 1", "JSS 2", "JSS 3",
  "SS1", "SS2", "SS3",
  "SS1 Science", "SS1 Arts", "SS1 Commercial",
  "SS2 Science", "SS2 Arts", "SS2 Commercial",
  "SS3 Science", "SS3 Arts", "SS3 Commercial",
];

const AVAILABLE_SESSIONS = ["2025/2026", "2026/2027"];

const JSS_SUBJECTS = [
  "Mathematics", "English Studies", "Basic Science", "Basic Technology",
  "Social Studies", "Civic Education", "Christian Religious Studies",
  "Islamic Religious Studies", "Business Studies", "Music", "Home Economics",
  "Agricultural Science", "Physical and Health Education",
  "Information Technology", "Security Education", "Yoruba",
  "Cultural and Creative Arts", "French",
];

const SS_SUBJECTS = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology",
  "Economics", "Government", "Literature in English", "Geography",
  "Commerce", "Data Processing", "Further Mathematics", "Civic Education",
  "CRS", "Financial Accounting", "Agricultural Science",
];

interface EditExamPageProps {
  examId: string;
}

// ── Mini stat tile used inside the summary card ────────────────────────────
function StatTile({
  value, label, accent,
}: { value: string | number; label: string; accent: string }) {
  return (
    <div className={cn("rounded-lg p-3 text-center", accent)}>
      <p className="text-2xl font-bold leading-none mb-1">{value}</p>
      <p className="text-[11px] font-medium opacity-70 leading-tight">{label}</p>
    </div>
  );
}

export function EditExamPage({ examId }: EditExamPageProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("questions");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>([]);
  const [hasTheory, setHasTheory] = useState(false);

  const [objectivePointsPerQuestion, setObjectivePointsPerQuestion] = useState(1);
  const [theoryPointsPerQuestion, setTheoryPointsPerQuestion] = useState(5);

  const [examDetails, setExamDetails] = useState<ExamDetailsForm>({
    title: "", subject: "", class: "", duration: 60, instructions: "",
    pass_mark: 50, shuffle_questions: true, shuffle_options: true,
    term: CURRENT_TERM, session_year: CURRENT_SESSION, target_audience: "all",
  });

  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [showTheoryDialog, setShowTheoryDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingTheoryQuestion, setEditingTheoryQuestion] = useState<TheoryQuestion | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string; type: "objective" | "theory" } | null>(null);

  const initialLoadDoneRef = useRef(false);

  const availableSubjects = useMemo(() => {
    if (!examDetails.class) return [];
    return examDetails.class.startsWith("JSS") ? JSS_SUBJECTS : SS_SUBJECTS;
  }, [examDetails.class]);

  const objectiveCount = questions.length;
  const theoryCount = theoryQuestions.length;
  const totalQuestions = objectiveCount + theoryCount;
  const totalObjectivePoints = objectiveCount * objectivePointsPerQuestion;
  const totalTheoryPoints = theoryCount * theoryPointsPerQuestion;
  const totalExamPoints = totalObjectivePoints + totalTheoryPoints;
  const passMarkPercentage = totalExamPoints > 0 ? (examDetails.pass_mark / totalExamPoints) * 100 : 0;

  // ── Load questions ────────────────────────────────────────────────────────
  const loadQuestions = useCallback(async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const { data, error } = await supabase
        .from("questions").select("*").eq("exam_id", examId)
        .is("deleted_at", null).order("order_number", { ascending: true });
      if (error) throw error;

      const objQs = (data || []).filter((q) => q.type === "objective").map((q) => ({
        ...q, question_text: q.question_text || "", options: q.options || [],
        points: typeof q.points === "string" ? parseFloat(q.points) : q.points || 1,
        type: "objective" as const, question_type: q.question_type || "mcq",
      }));
      setQuestions(objQs as Question[]);
      if (objQs[0]?.points) setObjectivePointsPerQuestion(objQs[0].points);

      const thQs = (data || []).filter((q) => q.type === "theory").map((q) => ({
        ...q, question_text: q.question_text || "",
        points: typeof q.points === "string" ? parseFloat(q.points) : q.points || 5,
        sub_questions: q.sub_questions || [], keywords: q.keywords || [],
        type: "theory" as const, question_type: "theory" as const,
      }));
      setTheoryQuestions(thQs as TheoryQuestion[]);
      if (thQs[0]?.points) setTheoryPointsPerQuestion(thQs[0].points);

      if (!silent) toast.success("Questions refreshed");
    } catch {
      if (!silent) toast.error("Failed to refresh questions");
    } finally {
      setRefreshing(false);
    }
  }, [examId]);

  // ── Load exam ─────────────────────────────────────────────────────────────
  const loadExamData = useCallback(async () => {
    try {
      setLoading(true); setLoadError(null);
      const { data: examData, error } = await supabase.from("exams").select("*").eq("id", examId).single();
      if (error) { setLoadError(`Failed to load exam: ${error.message}`); throw error; }
      if (!examData) { setLoadError("Exam not found"); throw new Error("Exam not found"); }

      const merged = {
        ...examData,
        shuffle_questions: examData.shuffle_questions ?? examData.randomize_questions ?? true,
        shuffle_options: examData.shuffle_options ?? examData.randomize_options ?? true,
        pass_mark: examData.pass_mark ?? 50,
      };
      setExam(merged as Exam);
      setHasTheory(examData.has_theory || false);
      setExamDetails({
        title: examData.title || "", subject: examData.subject || "", class: examData.class || "",
        duration: examData.duration || 60, instructions: examData.instructions || examData.description || "",
        pass_mark: examData.pass_mark || 50, shuffle_questions: merged.shuffle_questions,
        shuffle_options: merged.shuffle_options, term: examData.term || CURRENT_TERM,
        session_year: examData.session_year || CURRENT_SESSION, target_audience: examData.target_audience || "all",
      });
      await loadQuestions(true);
      initialLoadDoneRef.current = true;
    } catch {
      toast.error("Failed to load exam data");
    } finally {
      setLoading(false);
    }
  }, [examId, loadQuestions]);

  useEffect(() => { if (examId) loadExamData(); }, [examId, loadExamData]);

  // ── Auto-update totals ────────────────────────────────────────────────────
  const updateExamTotals = useCallback(async () => {
    if (!examId || loading || !initialLoadDoneRef.current) return;
    await supabase.from("exams").update({
      total_questions: totalQuestions, total_marks: totalExamPoints,
      total_points: totalExamPoints, updated_at: new Date().toISOString(),
    }).eq("id", examId);
  }, [examId, totalQuestions, totalExamPoints, loading]);

  useEffect(() => {
    if (!loading && initialLoadDoneRef.current) updateExamTotals();
  }, [totalQuestions, totalExamPoints, updateExamTotals, loading]);

  const handleRefresh = useCallback(() => loadQuestions(false), [loadQuestions]);

  // ── Save exam ─────────────────────────────────────────────────────────────
  const handleSaveExam = async () => {
    if (!examDetails.title.trim()) { toast.error("Please enter an exam title"); setActiveTab("details"); return; }
    if (!examDetails.subject) { toast.error("Please select a subject"); setActiveTab("details"); return; }
    if (!examDetails.class) { toast.error("Please select a class"); setActiveTab("details"); return; }

    setSaving(true);
    try {
      const payload: any = {
        title: examDetails.title.trim(), subject: examDetails.subject, class: examDetails.class,
        duration: examDetails.duration, pass_mark: examDetails.pass_mark,
        description: examDetails.instructions, instructions: examDetails.instructions,
        randomize_questions: examDetails.shuffle_questions, randomize_options: examDetails.shuffle_options,
        shuffle_questions: examDetails.shuffle_questions, shuffle_options: examDetails.shuffle_options,
        has_theory: hasTheory, term: examDetails.term, session_year: examDetails.session_year,
        target_audience: examDetails.target_audience, total_questions: totalQuestions,
        total_marks: totalExamPoints, total_points: totalExamPoints, updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("exams").update(payload).eq("id", examId);
      if (error) {
        const safe = {
          title: payload.title, subject: payload.subject, class: payload.class,
          duration: payload.duration, pass_mark: payload.pass_mark,
          description: payload.instructions, instructions: payload.instructions,
          has_theory: hasTheory, term: payload.term, session_year: payload.session_year,
          total_questions: totalQuestions, total_marks: totalExamPoints, updated_at: payload.updated_at,
        };
        const { error: e2 } = await supabase.from("exams").update(safe).eq("id", examId);
        if (e2) throw e2;
      }
      toast.success("Exam updated successfully");
      router.push("/staff/exams");
    } catch (e: any) {
      toast.error(e.message || "Failed to update exam");
    } finally {
      setSaving(false);
    }
  };

  // ── Objective CRUD ────────────────────────────────────────────────────────
  const handleAddQuestion = async (data: Partial<Question>) => {
    if (!data.question_text?.trim()) { toast.error("Question text is required"); return; }
    const opts = (data.options || []).filter((o) => o.trim());
    const isDraft = data.is_draft ?? true;
    const { error } = await supabase.from("questions").insert([{
      exam_id: examId, question_text: data.question_text.trim(), question_type: "mcq", type: "objective",
      options: opts.length ? opts : ["", "", "", ""], correct_answer: data.correct_answer?.trim() || "",
      points: objectivePointsPerQuestion, order_number: questions.length + 1, is_draft: isDraft,
      sub_questions: [], keywords: [], model_answer: "", image_url: null, image_caption: null,
      deleted_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }]).select().single();
    if (error) { toast.error(`Failed to add question: ${error.message}`); return; }
    await loadQuestions(true);
    toast.success(isDraft ? "Question saved as draft" : "Question added");
    setShowQuestionDialog(false); setEditingQuestion(null);
  };

  const handleUpdateQuestion = async (id: string, data: Partial<Question>) => {
    if (!data.question_text?.trim()) { toast.error("Question text is required"); return; }
    const opts = (data.options || []).filter((o) => o.trim());
    const isDraft = data.is_draft ?? false;
    const { error } = await supabase.from("questions").update({
      question_text: data.question_text.trim(), options: opts.length ? opts : ["", "", "", ""],
      correct_answer: data.correct_answer?.trim() || "", points: data.points || objectivePointsPerQuestion,
      is_draft: isDraft, question_type: "mcq", type: "objective", updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast.error(`Failed to update: ${error.message}`); return; }
    await loadQuestions(true);
    toast.success(isDraft ? "Question saved as draft" : "Question updated");
    setShowQuestionDialog(false); setEditingQuestion(null);
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    const { error } = await supabase.from("questions").update({
      deleted_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq("id", questionToDelete.id);
    if (error) { toast.error(`Failed to delete: ${error.message}`); return; }
    await loadQuestions(true);
    toast.success("Question deleted");
    setDeleteDialogOpen(false); setQuestionToDelete(null);
  };

  // ── Theory CRUD ───────────────────────────────────────────────────────────
  const handleAddTheoryQuestion = async (data: Partial<TheoryQuestion>) => {
    if (!data.question_text?.trim()) { toast.error("Question text is required"); return; }
    const isDraft = data.is_draft ?? true;
    const { error } = await supabase.from("questions").insert([{
      exam_id: examId, question_text: data.question_text.trim(), question_type: "theory", type: "theory",
      points: theoryPointsPerQuestion, order_number: theoryQuestions.length + 1,
      sub_questions: data.sub_questions || [], keywords: data.keywords || [],
      model_answer: data.model_answer || "", is_draft: isDraft, options: [], correct_answer: "",
      image_url: (data as any).image_url || null, image_caption: (data as any).image_caption || null,
      deleted_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }]).select().single();
    if (error) { toast.error(`Failed to add theory question: ${error.message}`); return; }
    await loadQuestions(true);
    toast.success(isDraft ? "Theory question saved as draft" : "Theory question added");
    setShowTheoryDialog(false); setEditingTheoryQuestion(null);
  };

  const handleUpdateTheoryQuestion = async (id: string, data: Partial<TheoryQuestion>) => {
    if (!data.question_text?.trim()) { toast.error("Question text is required"); return; }
    const isDraft = data.is_draft ?? false;
    const { error } = await supabase.from("questions").update({
      question_text: data.question_text.trim(), points: data.points || theoryPointsPerQuestion,
      sub_questions: data.sub_questions || [], keywords: data.keywords || [],
      model_answer: data.model_answer || "", is_draft: isDraft,
      question_type: "theory", type: "theory",
      image_url: (data as any).image_url || null, image_caption: (data as any).image_caption || null,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast.error(`Failed to update: ${error.message}`); return; }
    await loadQuestions(true);
    toast.success(isDraft ? "Theory question saved as draft" : "Theory question updated");
    setShowTheoryDialog(false); setEditingTheoryQuestion(null);
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    );
  }

  if (loadError || !exam) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto mt-10">
        <Alert variant="destructive" className="rounded-xl border-2">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="space-y-3">
            <p>{loadError || "Exam not found"}</p>
            <Button size="sm" variant="outline" onClick={() => router.push("/staff/exams")}>
              ← Back to Exams
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── Points summary card ───────────────────────────────────────────────────
  const PointsSummary = () => (
    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
              <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">Points Summary</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}
            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600">
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <StatTile value={objectiveCount} label="Objective Qs" accent="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300" />
          <StatTile value={totalObjectivePoints} label="Obj. Points" accent="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300" />
          <StatTile value={theoryCount} label="Theory Qs" accent="bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300" />
          <StatTile value={totalTheoryPoints} label="Theory Points" accent="bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300" />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Points</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{totalExamPoints}</p>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Pass Mark</p>
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
              {examDetails.pass_mark}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500"> / {totalExamPoints}</span>
              <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-semibold">
                {totalExamPoints > 0 ? Math.round(passMarkPercentage) : 0}%
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ── Question card ─────────────────────────────────────────────────────────
  const QuestionCard = ({
    question, index, type, onEdit, onDelete,
  }: {
    question: any; index: number; type: "objective" | "theory"; onEdit: () => void; onDelete: () => void;
  }) => {
    const isComplete = type === "objective"
      ? !!(question.correct_answer && question.options?.some((o: string) => o.trim()))
      : true;

    const statusConfig = question.is_draft
      ? { label: "Draft", icon: FileText, classes: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" }
      : isComplete
        ? { label: "Complete", icon: CheckCircle2, classes: "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" }
        : { label: "Incomplete", icon: AlertTriangle, classes: "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };

    const StatusIcon = statusConfig.icon;

    return (
      <div className={cn("rounded-xl border p-4 transition-all hover:shadow-sm group", statusConfig.classes)}>
        <div className="flex items-start gap-3">
          {/* Index bubble */}
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            {index}
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <Badge variant="outline" className={cn("text-xs font-medium gap-1 border-0", type === "objective" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400")}>
                {type === "objective" ? <BookOpen className="h-3 w-3" /> : <FlaskConical className="h-3 w-3" />}
                {type === "objective" ? "Objective" : "Theory"}
              </Badge>
              <Badge className={cn("text-xs font-medium gap-1 border-0", statusConfig.badge)}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {question.points} pt{question.points !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Question text */}
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug line-clamp-3">
              {question.question_text}
            </p>

            {/* Options (objective) */}
            {type === "objective" && question.options && (
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1">
                {question.options.map((opt: string, idx: number) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isCorrect = question.correct_answer === letter || question.correct_answer === opt;
                  return (
                    <div key={idx} className={cn("flex items-center gap-1.5 text-xs px-2 py-1 rounded-md",
                      isCorrect ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium" : "text-slate-500 dark:text-slate-400")}>
                      <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                        isCorrect ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400")}>
                        {letter}
                      </span>
                      <span className="truncate">{opt || <span className="italic opacity-50">Empty</span>}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sub-questions count (theory) */}
            {type === "theory" && question.sub_questions?.length > 0 && (
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {question.sub_questions.length} sub-question{question.sub_questions.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={onEdit}
              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30">
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}
              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ── Questions list ────────────────────────────────────────────────────────
  const QuestionsList = () => {
    if (questions.length === 0 && theoryQuestions.length === 0) {
      return (
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="py-16 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
              <FileQuestion className="h-10 w-10 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">No questions yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Start building your exam by adding questions below.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => { setEditingQuestion(null); setShowQuestionDialog(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                <Plus className="h-4 w-4" /> Add Objective Question
              </Button>
              {hasTheory && (
                <Button variant="outline" onClick={() => { setEditingTheoryQuestion(null); setShowTheoryDialog(true); }} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Theory Question
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    const draftCount = [...questions, ...theoryQuestions].filter((q) => q.is_draft).length;

    return (
      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        {/* Card header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <LayoutList className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              All Questions
            </span>
            <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
              {totalQuestions}
            </span>
            {draftCount > 0 && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                {draftCount} draft{draftCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { setEditingQuestion(null); setShowQuestionDialog(true); }}
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm">
              <Plus className="h-3.5 w-3.5" /> Objective
            </Button>
            {hasTheory && (
              <Button size="sm" variant="outline" onClick={() => { setEditingTheoryQuestion(null); setShowTheoryDialog(true); }}
                className="h-8 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Theory
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          <ScrollArea className="h-[520px] pr-2">
            <div className="space-y-2.5 pr-2">
              {/* Section: Objective */}
              {questions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 py-1">
                    <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Objective Questions ({objectiveCount})
                    </span>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                  </div>
                  {questions.map((q, idx) => (
                    <QuestionCard key={q.id} index={idx + 1} question={q} type="objective"
                      onEdit={() => { setEditingQuestion(q); setShowQuestionDialog(true); }}
                      onDelete={() => { setQuestionToDelete({ id: q.id, type: "objective" }); setDeleteDialogOpen(true); }} />
                  ))}
                </div>
              )}

              {/* Section: Theory */}
              {theoryQuestions.length > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 py-1">
                    <FlaskConical className="h-3.5 w-3.5 text-violet-500" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Theory Questions ({theoryCount})
                    </span>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                  </div>
                  {theoryQuestions.map((q, idx) => (
                    <QuestionCard key={q.id} index={questions.length + idx + 1} question={q} type="theory"
                      onEdit={() => { setEditingTheoryQuestion(q); setShowTheoryDialog(true); }}
                      onDelete={() => { setQuestionToDelete({ id: q.id, type: "theory" }); setDeleteDialogOpen(true); }} />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="p-3 sm:p-5 lg:p-6 space-y-4 max-w-[1600px] mx-auto">

        <ExamHeader
          examId={examId} examTitle={exam?.title}
          term={examDetails.term} termName={TERM_NAMES[examDetails.term] || "Third Term"}
          sessionYear={examDetails.session_year} saving={saving} onSave={handleSaveExam}
        />

        <PointsSummary />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border-0 p-1 mb-4">
            <TabsList className="w-full grid grid-cols-3 bg-transparent gap-1 h-auto">
              {[
                { value: "questions", label: `Questions`, count: totalQuestions, icon: LayoutList },
                { value: "details", label: "Exam Details", icon: FileText },
                { value: "preview", label: "Preview", icon: Eye },
              ].map(({ value, label, count, icon: Icon }) => (
                <TabsTrigger key={value} value={value}
                  className={cn(
                    "flex items-center justify-center gap-2 text-sm py-2.5 px-3 rounded-lg transition-all font-medium",
                    "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 dark:data-[state=inactive]:text-slate-400",
                  )}>
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">{label}</span>
                  {count !== undefined && count > 0 && (
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-semibold",
                      activeTab === value ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="questions" className="mt-0">
            <QuestionsList />
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
            />
          </TabsContent>
        </Tabs>

        {/* ── Dialogs ─────────────────────────────────────────────────────── */}
        <QuestionFormDialog
          open={showQuestionDialog}
          onOpenChange={(open) => { setShowQuestionDialog(open); if (!open) setEditingQuestion(null); }}
          initialData={editingQuestion || undefined}
          onSave={(data) => editingQuestion ? handleUpdateQuestion(editingQuestion.id, data) : handleAddQuestion(data)}
          onCancel={() => { setShowQuestionDialog(false); setEditingQuestion(null); }}
        />

        <TheoryQuestionFormDialog
          open={showTheoryDialog}
          onOpenChange={(open) => { setShowTheoryDialog(open); if (!open) setEditingTheoryQuestion(null); }}
          initialData={editingTheoryQuestion || undefined}
          onSave={(data) => editingTheoryQuestion ? handleUpdateTheoryQuestion(editingTheoryQuestion.id, data) : handleAddTheoryQuestion(data)}
          onCancel={() => { setShowTheoryDialog(false); setEditingTheoryQuestion(null); }}
        />

        {/* Delete confirmation */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <DialogTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Delete Question?
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 pl-11">
                This action is permanent and cannot be undone. The question will be removed from this exam.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" size="sm" className="h-9" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" className="h-9 bg-red-600 hover:bg-red-700 text-white gap-1.5" onClick={handleDeleteQuestion}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}