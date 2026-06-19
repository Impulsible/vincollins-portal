// src/components/staff/exams/edit/EditExamPage.tsx - COMPLETE FIXED VERSION

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ExamHeader } from "./ExamHeader";
import { ExamDetailsTab } from "./ExamDetailsTab";
import { PreviewTab } from "./PreviewTab";
import { QuestionFormDialog } from "./QuestionFormDialog";
import { TheoryQuestionFormDialog } from "./TheoryQuestionFormDialog";
import type { Exam, Question, TheoryQuestion, ExamDetailsForm } from "./types";

// Constants
const CURRENT_TERM = "third";
const CURRENT_SESSION = "2025/2026";
const TERM_NAMES: Record<string, string> = {
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
};

const CLASSES = [
  "JSS 1",
  "JSS 2",
  "JSS 3",
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

interface EditExamPageProps {
  examId: string;
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

  const [objectivePointsPerQuestion, setObjectivePointsPerQuestion] =
    useState<number>(1);
  const [theoryPointsPerQuestion, setTheoryPointsPerQuestion] =
    useState<number>(5);

  const [examDetails, setExamDetails] = useState<ExamDetailsForm>({
    title: "",
    subject: "",
    class: "",
    duration: 60,
    instructions: "",
    pass_mark: 50,
    shuffle_questions: true,
    shuffle_options: true,
    negative_marking: false,
    negative_marking_value: 0.5,
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

  const isUpdatingRef = useRef(false);
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
  const passMarkPercentage =
    totalExamPoints > 0 ? (examDetails.pass_mark / totalExamPoints) * 100 : 0;

  // ============================================
  // LOAD FUNCTIONS
  // ============================================

  const loadQuestions = useCallback(async (caller?: string) => {
    if (isUpdatingRef.current) {
      console.log("⏭️ Skipping loadQuestions - update in progress");
      return;
    }

    try {
      console.log(`🔵 Loading questions for exam: ${examId} (called by: ${caller || 'unknown'})`);

      const { data: allQuestions, error } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", examId)
        .is("deleted_at", null)
        .order("order_number", { ascending: true });

      if (error) {
        console.error("❌ Error loading questions:", error);
        return;
      }

      console.log(`✅ Loaded ${allQuestions?.length || 0} active questions`);

      if (allQuestions && allQuestions.length > 0) {
        const objectiveQs = allQuestions.filter((q) => q.type === "objective");
        const theoryQs = allQuestions.filter((q) => q.type === "theory");

        console.log(
          `📊 Objective: ${objectiveQs.length}, Theory: ${theoryQs.length}`
        );

        if (objectiveQs.length > 0) {
          const parsed = objectiveQs.map((q) => ({
            ...q,
            question_text: q.question_text || "",
            options: q.options || [],
            points:
              typeof q.points === "string" ? parseFloat(q.points) : q.points || 1,
            type: "objective" as const,
            question_type: q.question_type || "mcq",
          }));
          setQuestions(parsed as Question[]);
          if (parsed[0]?.points) {
            setObjectivePointsPerQuestion(parsed[0].points);
          }
        } else {
          setQuestions([]);
        }

        if (theoryQs.length > 0) {
          const parsed = theoryQs.map((q) => ({
            ...q,
            question_text: q.question_text || "",
            points:
              typeof q.points === "string" ? parseFloat(q.points) : q.points || 5,
            sub_questions: q.sub_questions || [],
            keywords: q.keywords || [],
            type: "theory" as const,
            question_type: "theory" as const,
          }));
          setTheoryQuestions(parsed as TheoryQuestion[]);
          if (parsed[0]?.points) {
            setTheoryPointsPerQuestion(parsed[0].points);
          }
        } else {
          setTheoryQuestions([]);
        }
      } else {
        setQuestions([]);
        setTheoryQuestions([]);
      }
    } catch (error) {
      console.error("🔥 Error loading questions:", error);
    }
  }, [examId]);

  const loadExamData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const { data: examData, error: examError } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();

      if (examError) {
        console.error("❌ Exam load error:", examError);
        setLoadError(`Failed to load exam: ${examError.message}`);
        throw examError;
      }

      if (!examData) {
        setLoadError("Exam not found");
        throw new Error("Exam not found");
      }

      console.log("✅ Exam data loaded:", examData);

      const examWithDefaults = {
        ...examData,
        shuffle_questions: examData.shuffle_questions ?? true,
        shuffle_options: examData.shuffle_options ?? true,
        negative_marking: examData.negative_marking ?? false,
        negative_marking_value: examData.negative_marking_value ?? 0.5,
        pass_mark: examData.pass_mark ?? 50,
      };

      setExam(examWithDefaults as Exam);
      setHasTheory(examData.has_theory || false);

      const examTerm = examData.term || CURRENT_TERM;
      const examSession = examData.session_year || CURRENT_SESSION;

      setExamDetails({
        title: examData.title || "",
        subject: examData.subject || "",
        class: examData.class || "",
        duration: examData.duration || 60,
        instructions: examData.description || examData.instructions || "",
        pass_mark: examData.pass_mark || 50,
        shuffle_questions: examWithDefaults.shuffle_questions,
        shuffle_options: examWithDefaults.shuffle_options,
        negative_marking: examWithDefaults.negative_marking,
        negative_marking_value: examWithDefaults.negative_marking_value,
        term: examTerm,
        session_year: examSession,
        target_audience: examData.target_audience || "all",
      });

      await loadQuestions('loadExamData');
      initialLoadDoneRef.current = true;
    } catch (error) {
      console.error("🔥 Error loading exam:", error);
      toast.error("Failed to load exam data. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, [examId, loadQuestions]);

  useEffect(() => {
    if (examId) {
      loadExamData();
    }
  }, [examId, loadExamData]);

  // ============================================
  // UPDATE EXAM TOTALS
  // ============================================
  const updateExamTotals = useCallback(async () => {
    if (!examId || loading) return;
    if (isUpdatingRef.current) {
      console.log("⏭️ Skipping updateExamTotals - update in progress");
      return;
    }

    try {
      console.log("📊 Updating exam totals:", { totalQuestions, totalExamPoints });
      const { error } = await supabase
        .from("exams")
        .update({
          total_questions: totalQuestions,
          total_marks: totalExamPoints,
          updated_at: new Date().toISOString(),
        })
        .eq("id", examId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating exam totals:", error);
    }
  }, [examId, totalQuestions, totalExamPoints, loading]);

  useEffect(() => {
    if (!loading && examId && !isUpdatingRef.current && initialLoadDoneRef.current) {
      updateExamTotals();
    }
  }, [
    totalQuestions,
    totalExamPoints,
    objectivePointsPerQuestion,
    theoryPointsPerQuestion,
    loading,
    examId,
    updateExamTotals,
  ]);

  // ============================================
  // REFRESH
  // ============================================
  const handleRefresh = useCallback(async () => {
    if (isUpdatingRef.current) {
      toast.info("Please wait for the current operation to complete");
      return;
    }
    setRefreshing(true);
    await loadQuestions('manual refresh');
    setRefreshing(false);
    toast.success("Questions refreshed");
  }, [loadQuestions]);

  const handleSaveExam = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("exams")
        .update({
          title: examDetails.title,
          subject: examDetails.subject,
          class: examDetails.class,
          duration: examDetails.duration,
          description: examDetails.instructions,
          pass_mark: examDetails.pass_mark,
          shuffle_questions: examDetails.shuffle_questions,
          shuffle_options: examDetails.shuffle_options,
          negative_marking: examDetails.negative_marking,
          negative_marking_value: examDetails.negative_marking_value,
          has_theory: hasTheory,
          term: examDetails.term,
          session_year: examDetails.session_year,
          target_audience: examDetails.target_audience,
          total_questions: totalQuestions,
          total_marks: totalExamPoints,
          updated_at: new Date().toISOString(),
        })
        .eq("id", examId);

      if (error) throw error;

      toast.success("Exam updated successfully!");
      router.push("/staff/exams");
    } catch (error) {
      console.error("Error updating exam:", error);
      toast.error("Failed to update exam");
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // OBJECTIVE QUESTION CRUD OPERATIONS
  // ============================================

  const handleAddQuestion = async (data: Partial<Question>) => {
    isUpdatingRef.current = true;
    
    try {
      console.log("🔵 handleAddQuestion called with data:", data);

      if (!data.question_text || data.question_text.trim() === "") {
        toast.error("Question text is required");
        isUpdatingRef.current = false;
        return;
      }

      const validOptions = (data.options || []).filter(
        (opt) => opt.trim() !== ""
      );
      if (validOptions.length < 2 && data.is_draft !== true) {
        toast.error("Please add at least 2 options");
        isUpdatingRef.current = false;
        return;
      }

      const isDraft = data.is_draft !== undefined ? data.is_draft : true;

      const newQuestion = {
        exam_id: examId,
        question_text: data.question_text.trim(),
        question_type: "mcq",
        type: "objective",
        options: validOptions.length > 0 ? validOptions : ["", "", "", ""],
        correct_answer: data.correct_answer?.trim() || "",
        points: objectivePointsPerQuestion,
        order_number: questions.length + 1,
        is_draft: isDraft,
        sub_questions: [],
        keywords: [],
        model_answer: "",
        image_url: null,
        image_caption: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("🔵 Inserting objective question:", newQuestion);

      const { data: result, error } = await supabase
        .from("questions")
        .insert([newQuestion])
        .select()
        .single();

      if (error) {
        console.error("❌ Supabase error:", error);
        toast.error(`Failed to add question: ${error.message}`);
        isUpdatingRef.current = false;
        return;
      }

      console.log("✅ Objective question added successfully:", result);

      await loadQuestions('after add');

      toast.success(
        isDraft
          ? "📝 Question saved as draft!"
          : `✅ Question added (${objectivePointsPerQuestion} point${
              objectivePointsPerQuestion !== 1 ? "s" : ""
            })`
      );

      setShowQuestionDialog(false);
      setEditingQuestion(null);
      isUpdatingRef.current = false;
    } catch (error) {
      console.error("🔥 Error adding question:", error);
      toast.error("Failed to add question");
      isUpdatingRef.current = false;
    }
  };

  // ✅ FIXED: Update Objective Question - removed as const, added select and reload
  const handleUpdateQuestion = async (
    questionId: string,
    data: Partial<Question>
  ) => {
    isUpdatingRef.current = true;
    
    try {
      console.log("🔵 handleUpdateQuestion called with data:", JSON.stringify(data, null, 2));
      console.log("🔵 Question ID:", questionId);

      if (!data.question_text || data.question_text.trim() === "") {
        toast.error("Question text is required");
        isUpdatingRef.current = false;
        return;
      }

      const validOptions = (data.options || []).filter(
        (opt) => opt.trim() !== ""
      );

      const isDraft = data.is_draft !== undefined ? data.is_draft : false;

      // ✅ REMOVED as const - using regular strings
      const updateData = {
        question_text: data.question_text.trim(),
        options: validOptions.length > 0 ? validOptions : ["", "", "", ""],
        correct_answer: data.correct_answer?.trim() || "",
        points: data.points || objectivePointsPerQuestion,
        is_draft: isDraft,
        question_type: "mcq",
        type: "objective",
        updated_at: new Date().toISOString(),
      };

      console.log("🔵 Updating objective question with data:", JSON.stringify(updateData, null, 2));

      // ✅ REMOVED .is("deleted_at", null) - RLS policy handles this
      const { data: updatedResult, error: updateError } = await supabase
        .from("questions")
        .update(updateData)
        .eq("id", questionId)
        .select();

      if (updateError) {
        console.error("❌ Update error:", updateError);
        toast.error(`Failed to update question: ${updateError.message}`);
        isUpdatingRef.current = false;
        return;
      }

      console.log("✅ Question updated successfully in database");
      console.log("📝 Updated result:", JSON.stringify(updatedResult, null, 2));

      if (updatedResult && updatedResult.length > 0) {
        console.log(`📝 is_draft now: ${updatedResult[0].is_draft}`);
      }

      // ✅ Reload to get fresh data
      await loadQuestions('after update');

      toast.success(
        isDraft
          ? "📝 Question saved as draft"
          : "✅ Question updated and marked as complete!"
      );

      setShowQuestionDialog(false);
      setEditingQuestion(null);
      isUpdatingRef.current = false;
    } catch (error) {
      console.error("🔥 Error updating question:", error);
      toast.error("Failed to update question. Please try again.");
      isUpdatingRef.current = false;
    }
  };

  // ✅ FIXED: Delete Question with soft delete
  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    isUpdatingRef.current = true;

    try {
      console.log(`🔵 Soft-deleting question: ${questionToDelete.id}`);

      const { error } = await supabase
        .from("questions")
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", questionToDelete.id);

      if (error) {
        console.error("❌ Delete error:", error);
        toast.error(`Failed to delete question: ${error.message}`);
        isUpdatingRef.current = false;
        return;
      }

      console.log("✅ Question soft-deleted successfully");

      await loadQuestions('after delete');

      toast.success("Question deleted successfully");

      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
      isUpdatingRef.current = false;
    } catch (error) {
      console.error("🔥 Error deleting question:", error);
      toast.error("Failed to delete question");
      isUpdatingRef.current = false;
    }
  };

  // ============================================
  // THEORY QUESTION CRUD OPERATIONS
  // ============================================

  const handleAddTheoryQuestion = async (data: Partial<TheoryQuestion>) => {
    isUpdatingRef.current = true;
    
    try {
      console.log("🔵 handleAddTheoryQuestion called with data:", data);

      if (!data.question_text || data.question_text.trim() === "") {
        toast.error("Question text is required");
        isUpdatingRef.current = false;
        return;
      }

      const isDraft = data.is_draft !== undefined ? data.is_draft : true;

      const newQuestion = {
        exam_id: examId,
        question_text: data.question_text.trim(),
        question_type: "theory",
        type: "theory",
        points: theoryPointsPerQuestion,
        order_number: theoryQuestions.length + 1,
        sub_questions: data.sub_questions || [],
        keywords: data.keywords || [],
        model_answer: data.model_answer || "",
        is_draft: isDraft,
        options: [],
        correct_answer: "",
        image_url: (data as any).image_url || null,
        image_caption: (data as any).image_caption || null,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("🔵 Inserting theory question:", newQuestion);

      const { data: result, error } = await supabase
        .from("questions")
        .insert([newQuestion])
        .select()
        .single();

      if (error) {
        console.error("❌ Supabase error:", error);
        toast.error(`Failed to add theory question: ${error.message}`);
        isUpdatingRef.current = false;
        return;
      }

      console.log("✅ Theory question added successfully:", result);

      await loadQuestions('after theory add');

      toast.success(
        isDraft
          ? "📝 Theory question saved as draft"
          : `✅ Theory question added (${theoryPointsPerQuestion} point${
              theoryPointsPerQuestion !== 1 ? "s" : ""
            })`
      );

      setShowTheoryDialog(false);
      setEditingTheoryQuestion(null);
      isUpdatingRef.current = false;
    } catch (error) {
      console.error("🔥 Error adding theory question:", error);
      toast.error("Failed to add theory question");
      isUpdatingRef.current = false;
    }
  };

  // ✅ FIXED: Update Theory Question - removed as const, added select and reload
  const handleUpdateTheoryQuestion = async (
    questionId: string,
    data: Partial<TheoryQuestion>
  ) => {
    isUpdatingRef.current = true;
    
    try {
      console.log("🔵 handleUpdateTheoryQuestion called with data:", JSON.stringify(data, null, 2));
      console.log("🔵 Theory Question ID:", questionId);

      if (!data.question_text || data.question_text.trim() === "") {
        toast.error("Question text is required");
        isUpdatingRef.current = false;
        return;
      }

      const isDraft = data.is_draft !== undefined ? data.is_draft : false;

      // ✅ REMOVED as const - using regular strings
      const updateData = {
        question_text: data.question_text.trim(),
        points: data.points || theoryPointsPerQuestion,
        sub_questions: data.sub_questions || [],
        keywords: data.keywords || [],
        model_answer: data.model_answer || "",
        is_draft: isDraft,
        question_type: "theory",
        type: "theory",
        image_url: (data as any).image_url || null,
        image_caption: (data as any).image_caption || null,
        updated_at: new Date().toISOString(),
      };

      console.log("🔵 Updating theory question with data:", JSON.stringify(updateData, null, 2));

      // ✅ REMOVED .is("deleted_at", null) - RLS policy handles this
      const { data: updatedResult, error: updateError } = await supabase
        .from("questions")
        .update(updateData)
        .eq("id", questionId)
        .select();

      if (updateError) {
        console.error("❌ Update error:", updateError);
        toast.error(`Failed to update theory question: ${updateError.message}`);
        isUpdatingRef.current = false;
        return;
      }

      console.log("✅ Theory question updated successfully in database");
      console.log("📝 Updated result:", JSON.stringify(updatedResult, null, 2));

      if (updatedResult && updatedResult.length > 0) {
        console.log(`📝 is_draft now: ${updatedResult[0].is_draft}`);
      }

      await loadQuestions('after theory update');

      toast.success(
        isDraft
          ? "📝 Theory question saved as draft"
          : "✅ Theory question updated and marked as complete!"
      );

      setShowTheoryDialog(false);
      setEditingTheoryQuestion(null);
      isUpdatingRef.current = false;
    } catch (error) {
      console.error("🔥 Error updating theory question:", error);
      toast.error("Failed to update theory question. Please try again.");
      isUpdatingRef.current = false;
    }
  };

  // ============================================
  // POINTS SUMMARY
  // ============================================
  const PointsSummary = () => (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          <h3 className="font-semibold text-sm sm:text-base text-blue-800 dark:text-blue-300">
            Exam Points Summary
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || isUpdatingRef.current}
            className="ml-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">
              {objectiveCount}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Objective Qs
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">
              {totalObjectivePoints}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Obj Points
            </p>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground">
              ({objectivePointsPerQuestion} pts each)
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">
              {theoryCount}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Theory Qs
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">
              {totalTheoryPoints}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Theory Points
            </p>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground">
              ({theoryPointsPerQuestion} pts each)
            </p>
          </div>
        </div>
        <div className="mt-2 sm:mt-3 pt-2 border-t border-blue-200 dark:border-blue-800 flex justify-between items-center">
          <span className="text-xs sm:text-sm font-medium">
            Total Exam Points:
          </span>
          <span className="text-base sm:text-lg font-bold text-blue-700">
            {totalExamPoints}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="text-muted-foreground">Pass Mark:</span>
          <span className="font-medium">
            {examDetails.pass_mark} / {totalExamPoints} (
            {totalExamPoints > 0 ? Math.round(passMarkPercentage) : 0}%)
          </span>
        </div>
      </CardContent>
    </Card>
  );

  // ============================================
  // QUESTION CARD
  // ============================================
  const QuestionCard = ({
    question,
    index,
    type,
    onEdit,
    onDelete,
  }: {
    question: any;
    index: number;
    type: "objective" | "theory";
    onEdit: () => void;
    onDelete: () => void;
  }) => {
    const isComplete =
      type === "objective"
        ? question.correct_answer &&
          question.options?.some((opt: string) => opt.trim())
        : true;

    return (
      <div
        className={`p-4 rounded-xl group transition-all ${
          question.is_draft
            ? "bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800"
            : isComplete
            ? "bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-800"
            : "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">
                #{index}
              </span>
              <Badge variant={type === "objective" ? "default" : "secondary"}>
                {type === "objective" ? "Objective" : "Theory"}
              </Badge>
              {question.is_draft ? (
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-300 bg-amber-100 dark:bg-amber-900/30"
                >
                  📝 Draft
                </Badge>
              ) : isComplete ? (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  ✅ Complete
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-amber-500 border-amber-300"
                >
                  ⚠️ Incomplete
                </Badge>
              )}
              <Badge variant="outline">{question.points} pts</Badge>
            </div>

            <p className="mt-2 font-medium">{question.question_text}</p>

            {type === "objective" && question.options && (
              <div className="ml-6 mt-2 space-y-1">
                {question.options.map((opt: string, idx: number) => (
                  <p key={idx} className="text-sm">
                    <span className="font-medium">
                      {String.fromCharCode(65 + idx)}.
                    </span>{" "}
                    {opt}
                  </p>
                ))}
              </div>
            )}

            {type === "objective" && question.correct_answer && (
              <div className="flex items-center gap-3 mt-2">
                <Badge className="bg-green-100 text-green-700">
                  Answer: {question.correct_answer}
                </Badge>
              </div>
            )}

            {type === "theory" && question.sub_questions?.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {question.sub_questions.length} sub-question(s)
              </p>
            )}

            {question.is_draft && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                ⚠️ This question is a draft. Complete it before publishing.
              </p>
            )}
          </div>

          <div className="flex gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // QUESTIONS LIST
  // ============================================
  const QuestionsList = () => {
    const allQuestions = [
      ...questions,
      ...theoryQuestions.map((q) => ({ ...q, type: "theory" as const })),
    ];

    if (allQuestions.length === 0) {
      return (
        <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
          <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            No questions yet
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Start by adding your first question
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <Button
              onClick={() => {
                setEditingQuestion(null);
                setShowQuestionDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Objective Question
            </Button>
            {hasTheory && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTheoryQuestion(null);
                  setShowTheoryDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Theory Question
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">
            All Questions ({allQuestions.length})
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setEditingQuestion(null);
                setShowQuestionDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Objective
            </Button>
            {hasTheory && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingTheoryQuestion(null);
                  setShowTheoryDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Theory
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
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
                  setQuestionToDelete({ id: q.id, type: "objective" });
                  setDeleteDialogOpen(true);
                }}
              />
            ))}
            {theoryQuestions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                index={questions.length + idx + 1}
                question={q}
                type="theory"
                onEdit={() => {
                  setEditingTheoryQuestion(q);
                  setShowTheoryDialog(true);
                }}
                onDelete={() => {
                  setQuestionToDelete({ id: q.id, type: "theory" });
                  setDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // ============================================
  // LOADING & ERROR STATES
  // ============================================
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {loadError}
            <div className="mt-4">
              <Button onClick={() => router.push("/staff/exams")}>
                Back to Exams
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Exam not found
            <div className="mt-4">
              <Button onClick={() => router.push("/staff/exams")}>
                Back to Exams
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="relative w-full h-full overflow-y-auto">
      <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
        <ExamHeader
          examId={examId}
          examTitle={exam?.title}
          term={examDetails.term}
          termName={TERM_NAMES[examDetails.term] || "Third Term"}
          sessionYear={examDetails.session_year}
          saving={saving}
          onSave={handleSaveExam}
        />

        <PointsSummary />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-2 mb-4 sm:mb-6 h-auto sm:h-10">
            <TabsTrigger
              value="questions"
              className="text-xs sm:text-sm py-1.5 sm:py-2"
            >
              Questions ({totalQuestions})
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="text-xs sm:text-sm py-1.5 sm:py-2"
            >
              Exam Details
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="text-xs sm:text-sm py-1.5 sm:py-2"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions">
            <QuestionsList />
          </TabsContent>

          <TabsContent value="details">
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

          <TabsContent value="preview">
            <PreviewTab
              examDetails={examDetails}
              questions={questions}
              theoryQuestions={theoryQuestions}
              hasTheory={hasTheory}
            />
          </TabsContent>
        </Tabs>

        <QuestionFormDialog
          open={showQuestionDialog}
          onOpenChange={(open) => {
            setShowQuestionDialog(open);
            if (!open) setEditingQuestion(null);
          }}
          initialData={editingQuestion || undefined}
          onSave={(data) => {
            if (editingQuestion) {
              handleUpdateQuestion(editingQuestion.id, data);
            } else {
              handleAddQuestion(data);
            }
          }}
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
          onSave={(data) => {
            if (editingTheoryQuestion) {
              handleUpdateTheoryQuestion(editingTheoryQuestion.id, data);
            } else {
              handleAddTheoryQuestion(data);
            }
          }}
          onCancel={() => {
            setShowTheoryDialog(false);
            setEditingTheoryQuestion(null);
          }}
        />

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Question</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this question? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteQuestion}>
                Delete Question
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}