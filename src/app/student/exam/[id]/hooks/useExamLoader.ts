"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { calculateScore } from "../utils/scoring";
import { normalizeExamQuestions } from "../utils/questionNormalizer";
import {
  isSubjectExcludedFromShuffle,
  hasRelativeOptions,
  resolveExamDuration,
} from "../constants";
import {
  requireSession,
  fetchProfile,
  fetchExam,
  fetchAttempts,
  getCompletedAttempts,
  getActiveAttempt,
  buildExamResult,
  autoSubmitOnUnloadExceeded,
  incrementUnloadCount,
  findInProgressAttempt,
  createAttempt,
} from "../services/examLoaderService";
import type {
  Exam,
  Profile,
  Question,
  ExamResult,
  ResumeData,
  StartAttemptResult,
  UseExamLoaderReturn,
} from "../types";

const MAX_UNLOADS = 3;

/**
 * A genuine "security terminated" attempt is one whose status is
 * literally `terminated`.
 */
function isSecurityTerminated(attempt: {
  status?: string | null;
  is_auto_submitted?: boolean | null;
}): boolean {
  return attempt.status === "terminated";
}

/**
 * Standard Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Prepares and normalizes questions and options per subject and content rules:
 * - Languages & Reasoning (Yoruba, French, English, etc.): STRICT LOCK (Questions and Options never shuffle).
 * - Maths / Sciences / Others: Full question and option shuffle.
 * - Relative Options ("All/None of the above"): Locks option order for that question.
 */
function processExamQuestions(
  rawQuestions: Question[],
  subjectInput?: any,
  examSettings: { shuffle_questions?: boolean; shuffle_options?: boolean } = {},
  examTitleInput?: any,
  fullExamData?: any
): Question[] {
  // Normalize subject string
  const subjectStr =
    typeof subjectInput === "string"
      ? subjectInput
      : subjectInput?.name || subjectInput?.title || subjectInput?.subject || "";

  // Normalize title string
  const titleStr =
    typeof examTitleInput === "string"
      ? examTitleInput
      : examTitleInput?.title || examTitleInput?.name || "";

  // Combine title with any descriptive metadata to catch diacritics / keywords
  const extraStr =
    typeof fullExamData === "string"
      ? fullExamData
      : [
          fullExamData?.description,
          fullExamData?.instructions,
          fullExamData?.subject_name,
        ]
          .filter(Boolean)
          .join(" ");

  const combinedTitleContext = [titleStr, extraStr].filter(Boolean).join(" ");

  // Check if subject or title/context is protected (Yoruba, French, English, etc.)
  // Passes exactly 2 arguments conforming to (subject?: string, examTitle?: string)
  const isExcludedSubject = isSubjectExcludedFromShuffle(
    subjectStr,
    combinedTitleContext
  );

  // Tier 1: Question Shuffling Rule
  const allowQuestionShuffle = isExcludedSubject
    ? false
    : (examSettings.shuffle_questions ?? true);

  // Tier 1: Base Option Shuffling Rule
  const allowOptionShuffleGlobally = isExcludedSubject
    ? false
    : (examSettings.shuffle_options ?? true);

  // 1. Order Questions
  let orderedQuestions = [...rawQuestions];
  if (allowQuestionShuffle) {
    orderedQuestions = shuffleArray(orderedQuestions);
  } else {
    // Preserve strict original order created by teacher
    orderedQuestions = orderedQuestions.sort((a: any, b: any) => {
      const numA = Number(
        a.order_index ??
          a.q_index ??
          a.question_number ??
          a.question_index ??
          a.display_order ??
          a.display_number
      );
      const numB = Number(
        b.order_index ??
          b.q_index ??
          b.question_number ??
          b.question_index ??
          b.display_order ??
          b.display_number
      );

      if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) {
        return numA - numB;
      }
      if (a.created_at && b.created_at) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return 0;
    });
  }

  // 2. Order Options for each Question
  return orderedQuestions.map((q, index) => {
    let options: string[] = [];

    if (Array.isArray(q.options)) {
      options = q.options.map((opt) => {
        if (typeof opt === "string") return opt;
        if (typeof opt === "object" && opt !== null && "text" in opt) {
          const text = (opt as { text?: unknown }).text;
          return typeof text === "string" ? text : String(text ?? "");
        }
        return String(opt ?? "");
      });
    } else if (typeof q.options === "string") {
      try {
        const parsed = JSON.parse(q.options);
        if (Array.isArray(parsed)) {
          options = parsed.map((opt) => {
            if (typeof opt === "string") return opt;
            if (typeof opt === "object" && opt !== null && "text" in opt) {
              const text = (opt as { text?: unknown }).text;
              return typeof text === "string" ? text : String(text ?? "");
            }
            return String(opt ?? "");
          });
        } else {
          options = [];
        }
      } catch {
        options = [];
      }
    }

    // Tier 2: Check for relative phrases ("All of the above", "None of the above", etc.)
    const containsRelativePhrases = hasRelativeOptions(options);

    // Options shuffle only if globally permitted AND no relative phrases exist
    const shouldShuffleOptions =
      allowOptionShuffleGlobally && !containsRelativePhrases;

    const finalizedOptions = shouldShuffleOptions
      ? shuffleArray([...options])
      : [...options];

    return {
      ...q,
      display_number: index + 1,
      options: finalizedOptions,
    };
  });
}

export function useExamLoader(
  examId: string,
  router: ReturnType<typeof useRouter>
): UseExamLoaderReturn {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [hasCompletedAttempt, setHasCompletedAttempt] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [examTerminated, setExamTerminated] = useState(false);

  const loadedRef = useRef(false);

  // ── Main Load ──────────────────────────────────────────────────────────

  const loadExam = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    setLoadError(null);

    try {
      // 1. Auth Check
      let session: { userId: string; email: string };
      try {
        session = await requireSession();
      } catch {
        router.push("/portal");
        return;
      }

      // 2. Profile Fetch
      const userProfile = await fetchProfile(session.userId);
      if (userProfile) setProfile(userProfile);

      // 3. Exam Fetch
      let examData: Exam;
      try {
        examData = await fetchExam(examId);
      } catch {
        setLoadError("Exam not found");
        return;
      }
      setExam(examData);

      // 4. Normalize & Apply Subject/Option Shuffle Rules
      const {
        questions: normalizedQuestions,
        objectiveCount,
        theoryCount,
      } = normalizeExamQuestions(examData);

      const subjectName =
        examData.subject || (examData as any).subject_name || "";
      const examTitle = examData.title || "";

      // Enforces locked shuffle for Yoruba, French, English, etc.
      const processedQuestions = processExamQuestions(
        normalizedQuestions,
        subjectName,
        {
          shuffle_questions: examData.shuffle_questions,
          shuffle_options:
            typeof examData.shuffle_options === "boolean"
              ? examData.shuffle_options
              : undefined,
        },
        examTitle,
        examData
      );
      setAllQuestions(processedQuestions);

      const objectiveMax = objectiveCount || examData.objective_max || 20;
      const theoryMax =
        theoryCount > 0
          ? examData.theory_max ?? Math.max(0, 60 - objectiveMax)
          : 0;
      const actualTotalMarks = objectiveMax + theoryMax;

      // 5. Dynamic Duration Resolution
      const dynamicDuration = resolveExamDuration(examData);

      // 6. Attempts Resolution
      const allAttempts = await fetchAttempts(
        examId,
        userProfile?.id ?? session.userId
      );
      const completed = getCompletedAttempts(allAttempts);
      const active = getActiveAttempt(allAttempts);
      const completedCount = completed.length;

      // PRIORITY 1: In-progress resume check
      if (active) {
        const latest = active;
        setAttemptsUsed(completedCount);

        if (isSecurityTerminated(latest)) {
          setHasCompletedAttempt(true);
          setExamTerminated(true);
          setExamResult(
            buildExamResult({
              attempt: latest,
              exam: examData,
              objectiveMax,
              theoryMax,
              actualTotalMarks,
              completedCount,
            })
          );
          return;
        }

        const newUnloadCount = (latest.unload_count || 0) + 1;

        if (newUnloadCount >= MAX_UNLOADS) {
          const result = await autoSubmitOnUnloadExceeded({
            attemptId: latest.id,
            answers: latest.answers || {},
            allQuestions: processedQuestions,
            exam: examData,
            objectiveMax,
            theoryMax,
            actualTotalMarks,
            unloadCount: newUnloadCount,
            calcScore: calculateScore,
          });
          setHasCompletedAttempt(true);
          setAttemptsUsed(completedCount + 1);
          setExamResult(result);
          return;
        }

        const originalStartedAt = latest.started_at;
        if (!originalStartedAt) {
          toast.error(
            "Exam data corrupted — missing start time. Contact support."
          );
          return;
        }

        await incrementUnloadCount(latest.id, newUnloadCount);

        setResumeData({
          attemptId: latest.id,
          answers: latest.answers || {},
          started_at: originalStartedAt,
          duration: dynamicDuration,
          tabSwitches: latest.tab_switches || 0,
          fullscreenExits: latest.fullscreen_exits || 0,
          unloadCount: newUnloadCount,
          currentIndex: latest.current_index || 0,
          flaggedQuestions: latest.flagged_questions || [],
        });
        setShowResumeDialog(true);
        return;
      }

      // Case A: Max attempts reached
      if (completedCount >= (examData.max_attempts || 1)) {
        setHasCompletedAttempt(true);
        setAttemptsUsed(completedCount);
        const latest = completed[0];
        if (isSecurityTerminated(latest)) setExamTerminated(true);
        setExamResult(
          buildExamResult({
            attempt: latest,
            exam: examData,
            objectiveMax,
            theoryMax,
            actualTotalMarks,
            completedCount,
          })
        );
        return;
      }

      // Case B: Existing attempts, none in-progress
      if (allAttempts.length > 0) {
        const latest = allAttempts[0];
        setAttemptsUsed(completedCount);

        if (isSecurityTerminated(latest)) {
          setHasCompletedAttempt(true);
          setExamTerminated(true);
          setExamResult(
            buildExamResult({
              attempt: latest,
              exam: examData,
              objectiveMax,
              theoryMax,
              actualTotalMarks,
              completedCount,
            })
          );
          return;
        }

        if (
          ["completed", "pending_theory", "graded"].includes(
            String(latest.status)
          )
        ) {
          setHasCompletedAttempt(true);
          setExamResult(
            buildExamResult({
              attempt: latest,
              exam: examData,
              objectiveMax,
              theoryMax,
              actualTotalMarks,
              completedCount,
            })
          );
          return;
        }
      }

      // Case C: Fresh attempt ready
      setAttemptsUsed(0);
      setHasCompletedAttempt(false);
      setAttemptId(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load exam";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [examId, router]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  // ── Start New Attempt ──────────────────────────────────────────────────

  const startNewAttempt =
    useCallback(async (): Promise<StartAttemptResult | null> => {
      try {
        const session = await requireSession();

        const existing = await findInProgressAttempt(examId, session.userId);
        if (existing?.started_at) {
          setExamTerminated(false);
          return {
            attemptId: existing.id,
            isResuming: true,
            attemptNumber: existing.attempt_number,
            started_at: existing.started_at,
          };
        }

        if (!exam || !profile) {
          toast.error("Exam data not loaded");
          return null;
        }

        const allAttempts = await fetchAttempts(examId, session.userId);
        const completedCount = getCompletedAttempts(allAttempts).length;
        const attemptNumber = completedCount + 1;

        const objCount = allQuestions.filter((q) => q.type !== "theory").length;
        const theoCount = allQuestions.filter(
          (q) => q.type === "theory"
        ).length;
        const objectiveMax = objCount || exam.objective_max || 20;
        const theoryMax =
          theoCount > 0
            ? exam.theory_max ?? Math.max(0, 60 - objectiveMax)
            : 0;
        const actualTotalMarks = objectiveMax + theoryMax;

        setExamTerminated(false);
        return await createAttempt({
          examId,
          studentId: session.userId,
          studentName:
            profile.full_name || session.email.split("@")[0] || "Student",
          studentEmail: session.email,
          studentClass: (profile.class as string) || "",
          attemptNumber,
          exam,
          objectiveMax,
          theoryMax,
          actualTotalMarks,
        });
      } catch {
        toast.error("Failed to start exam");
        return null;
      }
    }, [examId, exam, profile, allQuestions]);

  // ── Resume Existing Attempt ────────────────────────────────────────────

  const handleResumeExam = useCallback(async (): Promise<ResumeData | null> => {
    if (!resumeData) return null;
    if (examTerminated) {
      toast.error("This exam was terminated due to security violations");
      router.push("/student");
      return null;
    }
    setExamTerminated(false);
    return resumeData;
  }, [resumeData, examTerminated, router]);

  return {
    loading,
    loadError,
    exam,
    profile,
    allQuestions,
    hasCompletedAttempt,
    examResult,
    setExamResult,
    attemptId,
    setAttemptId,
    attemptsUsed,
    resumeData,
    showResumeDialog,
    setShowResumeDialog,
    examTerminated,
    handleResumeExam,
    startNewAttempt,
  };
}