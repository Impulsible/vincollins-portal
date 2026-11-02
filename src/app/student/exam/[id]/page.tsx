// src/app/student/exam/[id]/page.tsx

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useExamLoader } from "./hooks/useExamLoader";
import { useExamSecurity } from "./hooks/useExamSecurity";
import { useAutoSave } from "./hooks/useAutoSave";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { calculateScore } from "./utils/scoring";
import type { ExamState, ExamResult } from "./types";
import { Loader2, XCircle } from "lucide-react";

import { LoadingView } from "@/components/student/exam/views/LoadingView";
import { ErrorView } from "@/components/student/exam/views/ErrorView";
import { InstructionsView } from "@/components/student/exam/views/InstructionsView";
import { ResumeDialog } from "@/components/student/exam/views/ResumeDialog";
import { ExamInterface } from "@/components/student/exam/views/ExamInterface";
import { CompletedView } from "@/components/student/exam/views/CompletedView";
import { FullscreenPrompt } from "@/components/student/exam/views/FullscreenPrompt";
import { SubmitDialog } from "@/components/student/exam/dialogs/SubmitDialog";
import { ResultDialog } from "@/components/student/exam/dialogs/ResultDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────────────────────
// Last-resort fallback only. For resumes we NEVER call this — we use the
// started_at captured during the initial loadExam() read.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchCanonicalStart(attemptId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("exam_attempts")
    .select("started_at, created_at")
    .eq("id", attemptId)
    .single();
  if (error || !data) return null;
  const raw = data.started_at || data.created_at;
  if (!raw) return null;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Safely parse an ISO timestamp to epoch-ms.
// ─────────────────────────────────────────────────────────────────────────────
function parseStartMs(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export default function TakeExamPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params.id as string;
  const isResumeQuery = searchParams.get("resume") === "true";

  const isSubmittingRef = useRef(false);
  const examEndedRef = useRef(false);

  const [isFullyRestored, setIsFullyRestored] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [dbStartTime, setDbStartTime] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [examState, setExamState] = useState<ExamState>({
    currentIndex: 0,
    answers: {},
    theoryAnswers: {},
    flaggedQuestions: new Set(),
    examStarted: false,
    examEnded: false,
    showInstructions: true,
    showQuestionPalette: false,
    showSubmitDialog: false,
    showResultDialog: false,
    showFullscreenPrompt: false,
    startingExam: false,
    isSubmitting: false,
  });

  const {
    loading, loadError, exam, profile, allQuestions, hasCompletedAttempt,
    examResult, setExamResult, attemptId, setAttemptId, attemptsUsed,
    resumeData, showResumeDialog, setShowResumeDialog, examTerminated,
    handleResumeExam, startNewAttempt,
  } = useExamLoader(examId, router);

  const { isOnline } = useNetworkStatus();

  // ═════════════════════════════════════════════════════════════════════════
  // 🔒 SECURITY
  // ═════════════════════════════════════════════════════════════════════════
  const {
    tabSwitches, fullscreenExits, setFullscreen, showFullscreenPrompt,
    setShowFullscreenPrompt, securityViolated,
  } = useExamSecurity({
    examStarted: examState.examStarted && isFullyRestored,
    examEndedRef: examEndedRef,
    onViolation: () => router.push("/student/exams"),
    initialTabSwitches: resumeData?.tabSwitches || 0,
    initialFullscreenExits: resumeData?.fullscreenExits || 0,
    attemptId: attemptId || undefined,
    answers: examState.answers,
    questions: allQuestions,
    onAutoSubmit: async (reason: string) => {
      await handleSubmit(true, reason);
    },
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 💾 AUTOSAVE
  // ═════════════════════════════════════════════════════════════════════════
  const { autoSaving, lastSaved } = useAutoSave({
    attemptId: attemptId || undefined,
    isActive: examState.examStarted && isFullyRestored,
    answers: examState.answers,
    questions: allQuestions,
    examEndedRef: examEndedRef,
  });

  const isTerminated = examTerminated || securityViolated;

  const theoryQuestionCount = allQuestions.filter((q) => q.type === "theory").length;
  const requiredTheory = exam?.required_theory_count || theoryQuestionCount;
  const answeredTheoryCount = allQuestions.filter(
    (q) => q.type === "theory" && (examState.answers[q.id] || "").trim()
  ).length;
  const objectiveCount = allQuestions.filter((q) => q.type !== "theory").length;
  const requiredTotal = objectiveCount + requiredTheory;
  const answeredCount = Object.keys(examState.answers).filter(
    (k) => examState.answers[k]?.trim()
  ).length;
  const requiredUnanswered = Math.max(0, requiredTotal - answeredCount);
  const progressPercentage =
    requiredTotal > 0 ? Math.min(100, (answeredCount / requiredTotal) * 100) : 0;

  // ═════════════════════════════════════════════════════════════════════════
  // 🔄 CENTRAL FUNCTION: enter exam from ANY attempt (new or resumed)
  //
  // Accepts `knownStartMs` — the started_at we already read during initial
  // load. We use this directly and NEVER re-fetch from DB, eliminating the
  // race condition where a trigger overwrites started_at between our read
  // and our re-read.
  // ═════════════════════════════════════════════════════════════════════════
  const enterExam = async (
    existingAttemptId: string,
    fallbackAnswers: Record<string, string> = {},
    knownStartMs?: number | null,
  ) => {
    let startMs = knownStartMs ?? null;

    if (startMs == null || !Number.isFinite(startMs)) {
      console.warn('[enterExam] knownStartMs missing — falling back to DB re-fetch');
      startMs = await fetchCanonicalStart(existingAttemptId);
    }

    if (startMs == null || !Number.isFinite(startMs)) {
      toast.error("Cannot load exam — missing start time.");
      return false;
    }

    const durationMin = Math.max(1, Number(exam?.duration) || 30);
    const totalSec = durationMin * 60;
    const elapsed = Math.floor((Date.now() - startMs) / 1000);
    const remaining = Math.max(0, totalSec - elapsed);

    if (remaining > totalSec) {
      console.error('[enterExam] remaining > totalSec — start time is in the future!', {
        startMs: new Date(startMs).toISOString(),
        now: new Date().toISOString(),
        remaining,
        totalSec,
      });
      toast.error("Exam timer data is inconsistent. Please contact support.");
      return false;
    }

    setAttemptId(existingAttemptId);
    setDbStartTime(startMs);
    setTimeLeft(remaining);

    setExamState((prev) => ({
      ...prev,
      answers: fallbackAnswers,
      examStarted: true,
      showInstructions: false,
      startingExam: false,
    }));
    examEndedRef.current = false;
    isSubmittingRef.current = false;
    setShowResumeDialog(false);

    // Already expired → auto-submit
    if (remaining <= 0) {
      setTimeout(() => setIsFullyRestored(true), 0);
      await handleSubmit(true, "Time already expired on resume");
      return true;
    }

    setTimeout(() => {
      setIsFullyRestored(true);
      try {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } catch {}
    }, 200);
    return true;
  };

  // ═════════════════════════════════════════════════════════════════════════
  // 🔄 RESUME — from ResumeDialog "Resume Exam" button
  // ═════════════════════════════════════════════════════════════════════════
  const onResumeExam = async () => {
    const data = await handleResumeExam();
    if (!data || !data.attemptId) return;

    const knownStartMs = parseStartMs(data.started_at);

    if (knownStartMs == null) {
      console.error('[onResumeExam] resumeData.started_at is invalid:', data.started_at);
      toast.error("Cannot resume — corrupted start time.");
      return;
    }

    const ok = await enterExam(
      data.attemptId,
      data.answers || {},
      knownStartMs,
    );
    if (!ok) return;
  };

  // Auto-resume when ?resume=true
  useEffect(() => {
    if (isResumeQuery && resumeData && !examState.examStarted && !showResumeDialog) {
      onResumeExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResumeQuery, resumeData, examState.examStarted, showResumeDialog]);

  // ═════════════════════════════════════════════════════════════════════════
  // ▶️ START — from InstructionsView "Start Exam" button
  // ═════════════════════════════════════════════════════════════════════════
  const startExam = async () => {
    setExamState((prev) => ({ ...prev, startingExam: true }));
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if ((elem as any).webkitRequestFullscreen) await (elem as any).webkitRequestFullscreen();
      setFullscreen(true);

      const result = await startNewAttempt();
      if (!result) {
        setExamState((prev) => ({ ...prev, startingExam: false }));
        return;
      }

      const knownStartMs = parseStartMs(result.started_at);

      const ok = await enterExam(
        result.attemptId,
        {},
        knownStartMs,
      );

      if (!ok) {
        setExamState((prev) => ({ ...prev, startingExam: false }));
        return;
      }

      toast.success(result.isResuming ? "Exam resumed!" : "Exam started! Good luck!");
    } catch (error: any) {
      toast.error("Failed to start exam");
      setExamState((prev) => ({ ...prev, startingExam: false }));
    }
  };

  const handleReturnToFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if ((elem as any).webkitRequestFullscreen) await (elem as any).webkitRequestFullscreen();
      setFullscreen(true);
      setTimeout(() => setShowFullscreenPrompt(false), 300);
    } catch (err) {
      toast.error("Please press F11 on your keyboard to enter fullscreen.");
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // 📤 SUBMIT
  //
  // ✅ FIX: Only checks isSubmittingRef as the re-entry guard.
  //    We do NOT check examEndedRef here because the timer sets
  //    examEndedRef = true BEFORE calling handleSubmit (to stop further
  //    ticks). Checking it would block the auto-submit entirely.
  // ═════════════════════════════════════════════════════════════════════════
  const handleSubmit = useCallback(
    async (isAuto = false, reason = "manual") => {
      // ✅ FIX: Only block on isSubmittingRef — examEndedRef is set by
      //    the timer BEFORE calling us, so checking it would always bail.
      if (isSubmittingRef.current) return;

      if (attemptId) {
        const { data: attempt } = await supabase
          .from("exam_attempts")
          .select("submitted_at, status")
          .eq("id", attemptId)
          .single();
        if (
          attempt?.submitted_at ||
          ["pending_theory", "graded", "completed", "terminated"].includes(attempt?.status)
        ) {
          toast.warning("This exam has already been submitted.");
          examEndedRef.current = true;
          setExamState((prev) => ({ ...prev, examStarted: false, examEnded: true }));
          return;
        }
      }

      isSubmittingRef.current = true;
      examEndedRef.current = true;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setExamState((prev) => ({
        ...prev,
        examEnded: true,
        isSubmitting: true,
        showSubmitDialog: false,
      }));

      try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) {}

      try {
        const result = calculateScore(allQuestions, examState.answers);
        const passingScore = exam?.passing_percentage || 50;
        const objectiveQuestions = allQuestions.filter((q) => q.type !== "theory");
        const actualObjectiveMax = objectiveQuestions.reduce(
          (sum, q) => sum + Number(q.marks || q.points || 1),
          0
        );
        const EXAM_PORTION_MAX = 60;
        const actualTheoryMax = Math.max(0, EXAM_PORTION_MAX - actualObjectiveMax);
        const hasTheoryQuestions = actualTheoryMax > 0 && theoryQuestionCount > 0;
        const status = hasTheoryQuestions ? "pending_theory" : "completed";
        const CA_PORTION_MAX = 40;
        const grandTotalMax = EXAM_PORTION_MAX + CA_PORTION_MAX;

        const objectiveAnswers: Record<string, string> = {};
        const theoryAnswers: Record<string, string> = {};
        allQuestions.forEach((q: any) => {
          if (q.type === "theory") theoryAnswers[q.id] = examState.answers[q.id] || "";
          else objectiveAnswers[q.id] = examState.answers[q.id] || "";
        });

        let caTotalScore = 0, ca1Score = 0, ca2Score = 0;
        if (profile?.id) {
          try {
            const { data: caData } = await supabase
              .from("ca_scores")
              .select("ca1_score, ca2_score")
              .eq("student_id", profile.id)
              .eq("exam_id", examId)
              .maybeSingle();
            if (caData) {
              ca1Score = Number(caData.ca1_score) || 0;
              ca2Score = Number(caData.ca2_score) || 0;
              caTotalScore = ca1Score + ca2Score;
            }
          } catch (caError) { console.warn(caError); }
        }

        const objectiveScore = result.score || 0;
        const theoryScore = 0;
        const caScore = caTotalScore || 0;

        let currentPercentage = 0, isPassed = false;
        if (status === "pending_theory") {
          currentPercentage = actualObjectiveMax > 0
            ? Math.round((objectiveScore / actualObjectiveMax) * 100)
            : 0;
          isPassed = false;
        } else if (status === "completed" && caScore === 0) {
          currentPercentage = EXAM_PORTION_MAX > 0
            ? Math.round(((objectiveScore + theoryScore) / EXAM_PORTION_MAX) * 100)
            : 0;
          isPassed = currentPercentage >= passingScore;
        } else if (status === "completed" && caScore > 0) {
          currentPercentage = grandTotalMax > 0
            ? Math.round(((caScore + objectiveScore + theoryScore) / grandTotalMax) * 100)
            : 0;
          isPassed = currentPercentage >= passingScore;
        }

        if (attemptId) {
          const updateData = {
            status,
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_auto_submitted: isAuto,
            auto_submit_reason: isAuto ? reason : null,
            tab_switches: tabSwitches || 0,
            fullscreen_exits: fullscreenExits || 0,
            answers: objectiveAnswers,
            theory_answers: theoryAnswers,
            objective_score: objectiveScore,
            objective_total: actualObjectiveMax,
            theory_score: theoryScore,
            theory_total: actualTheoryMax,
            total_score: objectiveScore + theoryScore + caScore,
            total_marks: grandTotalMax,
            percentage: currentPercentage,
            is_passed: isPassed,
            correct_count: result.correct || 0,
            incorrect_count: result.incorrect || 0,
            unanswered_count: result.unanswered || 0,
          };
          const { error } = await supabase
            .from("exam_attempts")
            .update(updateData)
            .eq("id", attemptId);
          if (error) {
            toast.error("Failed to save exam results: " + error.message);
            setExamState((prev) => ({ ...prev, isSubmitting: false }));
            isSubmittingRef.current = false;
            // Don't reset examEndedRef — timer should stay stopped
            return;
          }
        }

        const { data: allAttempts } = await supabase
          .from("exam_attempts")
          .select("id, status")
          .eq("exam_id", examId)
          .eq("student_id", profile?.id)
          .in("status", ["completed", "graded", "pending_theory", "terminated"]);
        const totalCompletedAttempts = allAttempts?.length || 1;

        const finalResult: ExamResult = {
          ...result,
          theory_score: 0,
          theory_total: actualTheoryMax,
          is_passed: isPassed,
          passing_percentage: passingScore,
          status,
          attempts_used: totalCompletedAttempts,
          max_attempts: exam?.max_attempts || 10,
          submitted_at: new Date().toISOString(),
          percentage: currentPercentage,
          total_score: objectiveScore + theoryScore + caScore,
          total_marks: grandTotalMax,
          objective_score: objectiveScore,
          objective_total: actualObjectiveMax,
          ca_score: caTotalScore,
          ca1_score: ca1Score,
          ca2_score: ca2Score,
          grade: isPassed ? "P" : "F",
        };
        setExamResult(finalResult);
        setExamState((prev) => ({
          ...prev,
          examStarted: false,
          isSubmitting: false,
          showResultDialog: true,
        }));

        // ✅ FIX: Show a specific toast when auto-submitted due to timeout
        if (isAuto && reason === "Time expired") {
          toast.error(
            hasTheoryQuestions
              ? `⏰ Time's up! Exam auto-submitted. Theory pending grading. Score: ${currentPercentage}%`
              : `⏰ Time's up! Exam auto-submitted. Score: ${currentPercentage}%`,
            { duration: 6000 }
          );
        } else {
          toast.success(
            hasTheoryQuestions
              ? `Exam submitted! Theory pending grading. Score: ${currentPercentage}%`
              : `Exam completed! Score: ${currentPercentage}%`
          );
        }
      } catch (error: any) {
        toast.error("Failed to submit exam: " + (error.message || "Unknown error"));
        setExamState((prev) => ({ ...prev, isSubmitting: false }));
        isSubmittingRef.current = false;
        // Don't reset examEndedRef — timer should stay stopped on error too
      }
    },
    [
      allQuestions,
      examState.answers,
      exam,
      attemptId,
      tabSwitches,
      fullscreenExits,
      profile,
      examId,
      theoryQuestionCount,
    ]
  );

  // ═════════════════════════════════════════════════════════════════════════
  // ✅ FIX: Keep a ref to the latest handleSubmit so the timer always calls
  //    the current version with fresh answers, not a stale closure from mount.
  // ═════════════════════════════════════════════════════════════════════════
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // ═════════════════════════════════════════════════════════════════════════
  // ⏱️ TIMER — single source of truth, driven by dbStartTime
  //
  // ✅ FIX: Uses handleSubmitRef.current so it always invokes the latest
  //    handleSubmit with current answers, not a stale closure.
  // ═════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!examState.examStarted || !exam || dbStartTime == null) return;
    if (!Number.isFinite(dbStartTime) || dbStartTime <= 0) return;

    const totalSeconds = Math.max(1, Number(exam.duration) || 30) * 60;

    const tick = () => {
      if (examEndedRef.current) return;
      const elapsed = Math.floor((Date.now() - dbStartTime) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0 && !examEndedRef.current) {
        // Stop future ticks immediately
        examEndedRef.current = true;
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        // ✅ Call the LATEST handleSubmit via ref
        handleSubmitRef.current(true, "Time expired");
      }
    };

    tick();
    timerIntervalRef.current = setInterval(tick, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examState.examStarted, dbStartTime, exam?.duration]);

  const updateAnswer = (questionId: string, value: string) => {
    setExamState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  };

  const toggleFlag = (questionId: string) => {
    setExamState((prev) => {
      const newFlags = new Set(prev.flaggedQuestions);
      newFlags.has(questionId) ? newFlags.delete(questionId) : newFlags.add(questionId);
      return { ...prev, flaggedQuestions: newFlags };
    });
  };

  const navigate = (direction: "prev" | "next") => {
    setExamState((prev) => ({
      ...prev,
      currentIndex:
        direction === "prev"
          ? Math.max(0, prev.currentIndex - 1)
          : Math.min(allQuestions.length - 1, prev.currentIndex + 1),
    }));
  };

  const goToQuestion = (index: number) => {
    setExamState((prev) => ({ ...prev, currentIndex: index, showQuestionPalette: false }));
  };

  if (loading) return <LoadingView />;
  if (loadError)
    return <ErrorView message={loadError} onBack={() => router.push("/student")} />;

  if (isTerminated) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 border-red-200 shadow-lg rounded-2xl bg-white">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-red-700 mb-2">Exam Terminated</h2>
          <p className="text-red-600 mb-4">Security Policy Violation</p>
          <p className="text-slate-500 text-sm mb-6">
            Your answers have been saved and this attempt is recorded with your current score.
          </p>
          <Button onClick={() => router.push("/student/exams")} className="w-full rounded-xl">
            Back to Exams
          </Button>
        </Card>
      </div>
    );
  }

  if (showResumeDialog) {
    return (
      <ResumeDialog
        resumeData={resumeData}
        totalQuestions={allQuestions.length}
        onResume={onResumeExam}
        maxAttempts={exam?.max_attempts || 1}
        attemptsUsed={attemptsUsed}
        unloadCount={resumeData?.unloadCount || 0}
        examTerminated={examTerminated}
      />
    );
  }

  if (hasCompletedAttempt && !examState.examStarted && !examState.showResultDialog) {
    return (
      <CompletedView
        exam={exam}
        profile={profile}
        examResult={examResult}
        allQuestions={allQuestions}
        onBackToDashboard={() => router.push("/student")}
        onViewFullResults={() =>
          setExamState((prev) => ({ ...prev, showResultDialog: true }))
        }
      />
    );
  }

  if (!examState.examStarted && examState.showInstructions) {
    return (
      <InstructionsView
        exam={exam!}
        profile={profile}
        allQuestions={allQuestions}
        startingExam={examState.startingExam}
        onStart={startExam}
        onCancel={() => router.push("/student/exams")}
      />
    );
  }

  if (showFullscreenPrompt) {
    return (
      <FullscreenPrompt
        fullscreenExits={fullscreenExits}
        onReturnToFullscreen={handleReturnToFullscreen}
      />
    );
  }

  if (!isFullyRestored) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500 mt-3">Restoring exam state...</p>
      </div>
    );
  }

  return (
    <>
      <ExamInterface
        exam={exam}
        profile={profile}
        allQuestions={allQuestions}
        currentIndex={examState.currentIndex}
        answers={examState.answers}
        flaggedQuestions={examState.flaggedQuestions}
        answeredCount={answeredCount}
        unansweredCount={requiredUnanswered}
        progressPercentage={progressPercentage}
        timeLeft={timeLeft}
        tabSwitches={tabSwitches}
        fullscreenExits={fullscreenExits}
        isOnline={isOnline}
        autoSaving={autoSaving}
        lastSaved={lastSaved}
        showQuestionPalette={examState.showQuestionPalette}
        onUpdateAnswer={updateAnswer}
        onToggleFlag={toggleFlag}
        onNavigate={navigate}
        onGoToQuestion={goToQuestion}
        onTogglePalette={() =>
          setExamState((prev) => ({
            ...prev,
            showQuestionPalette: !prev.showQuestionPalette,
          }))
        }
        onSubmit={() =>
          setExamState((prev) => ({ ...prev, showSubmitDialog: true }))
        }
      />
      <SubmitDialog
        open={examState.showSubmitDialog}
        onOpenChange={(open: boolean) =>
          setExamState((prev) => ({ ...prev, showSubmitDialog: open }))
        }
        answeredCount={answeredCount}
        totalQuestions={requiredTotal}
        unansweredCount={requiredUnanswered}
        isSubmitting={examState.isSubmitting}
        onSubmit={() => handleSubmit(false)}
        theoryInfo={
          theoryQuestionCount > 0 && requiredTheory < theoryQuestionCount
            ? {
                required: requiredTheory,
                total: theoryQuestionCount,
                answered: answeredTheoryCount,
              }
            : undefined
        }
      />
      <ResultDialog
        open={examState.showResultDialog}
        onOpenChange={(open: boolean) => {
          setExamState((prev) => ({ ...prev, showResultDialog: open }));
          if (!open) router.push("/student/exams");
        }}
        examResult={examResult}
      />
    </>
  );
}