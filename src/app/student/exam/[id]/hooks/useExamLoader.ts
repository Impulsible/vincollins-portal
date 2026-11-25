// src/app/student/exam/[id]/hooks/useExamLoader.ts
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { calculateScore } from "../utils/scoring";
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
 * Safely extracts options from Arrays, JSON strings, Objects, or separate columns
 */
function extractOptions(q: any): string[] {
  if (!q) return [];
  let raw = q.options ?? q.choices;

  // 1. JSON String parsing
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = raw.split(/\n|,/).map((s: string) => s.trim()).filter(Boolean);
    }
  }

  // 2. Standard Array
  if (Array.isArray(raw)) {
    return raw
      .map((opt) => {
        if (typeof opt === "string") return opt;
        if (typeof opt === "number") return String(opt);
        if (typeof opt === "object" && opt !== null) {
          return (
            (opt as any).text ||
            (opt as any).option ||
            (opt as any).value ||
            (opt as any).label ||
            ""
          );
        }
        return String(opt ?? "");
      })
      .map((s) => String(s).trim())
      .filter(Boolean);
  }

  // 3. Object dictionary e.g. { A: "...", B: "..." }
  if (typeof raw === "object" && raw !== null) {
    return Object.values(raw)
      .map((opt) => {
        if (typeof opt === "string") return opt;
        if (typeof opt === "object" && opt !== null) {
          return (
            (opt as any).text ||
            (opt as any).option ||
            (opt as any).value ||
            ""
          );
        }
        return String(opt ?? "");
      })
      .map((s) => String(s).trim())
      .filter(Boolean);
  }

  // 4. Separate column fallbacks (option_a, option_b, etc.)
  const sep = [
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d,
    q.option_e,
    q.option_f,
    q.optionA,
    q.optionB,
    q.optionC,
    q.optionD,
    q.optionE,
  ]
    .filter((v) => typeof v === "string" && v.trim())
    .map((v) => v.trim());

  if (sep.length > 0) return sep;

  return [];
}

/**
 * Consolidates questions from both the relational 'questions' table
 * and the 'exams.questions' / 'exams.theory_questions' JSONB columns.
 */
function consolidateExamQuestions(
  examData: any,
  tableQuestions: any[]
): {
  objectiveQuestions: Question[];
  theoryQuestions: Question[];
} {
  const parseJsonSafe = (raw: any): any[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const jsonObjectives = parseJsonSafe(examData.questions);
  const jsonTheory = parseJsonSafe(examData.theory_questions);

  const objMap = new Map<string, any>();
  const theoryMap = new Map<string, any>();

  // Process rows from relational 'questions' table
  for (const q of tableQuestions) {
    const opts = extractOptions(q);
    const subQs = Array.isArray(q.sub_questions) ? q.sub_questions : [];
    const isTheory =
      q.type === "theory" ||
      q.is_theory === true ||
      (opts.length === 0 && subQs.length > 0);

    const key = String(q.id || q.question_text || q.question);

    if (isTheory) {
      theoryMap.set(key, {
        ...q,
        id: String(q.id ?? `th-${theoryMap.size}`),
        question: q.question_text || q.question || "",
        question_text: q.question_text || q.question || "",
        type: "theory",
        is_theory: true,
        sub_questions: subQs,
        marks: Math.max(1, Math.round(Number(q.marks || q.points || 10))),
        points: Math.max(1, Math.round(Number(q.points || q.marks || 10))),
      });
    } else {
      objMap.set(key, {
        ...q,
        id: String(q.id ?? `obj-${objMap.size}`),
        question: q.question_text || q.question || "",
        question_text: q.question_text || q.question || "",
        options: opts,
        type: "objective",
        is_theory: false,
        marks: Math.max(1, Math.round(Number(q.marks || q.points || 1))),
        points: Math.max(1, Math.round(Number(q.points || q.marks || 1))),
      });
    }
  }

  // Merge JSON objectives
  for (const q of jsonObjectives) {
    const key = String(q.id || q.question || q.question_text);
    const opts = extractOptions(q);
    if (!objMap.has(key)) {
      objMap.set(key, {
        ...q,
        id: String(q.id ?? `obj-${objMap.size}`),
        question: q.question || q.question_text || "",
        question_text: q.question_text || q.question || "",
        options: opts,
        type: "objective",
        is_theory: false,
        marks: Math.max(1, Math.round(Number(q.marks || q.points || 1))),
        points: Math.max(1, Math.round(Number(q.points || q.marks || 1))),
      });
    }
  }

  // Merge JSON theory
  for (const q of jsonTheory) {
    const key = String(q.id || q.question || q.question_text);
    const subQs = Array.isArray(q.sub_questions) ? q.sub_questions : [];
    if (!theoryMap.has(key)) {
      theoryMap.set(key, {
        ...q,
        id: String(q.id ?? `th-${theoryMap.size}`),
        question: q.question || q.question_text || "",
        question_text: q.question_text || q.question || "",
        type: "theory",
        is_theory: true,
        sub_questions: subQs,
        marks: Math.max(1, Math.round(Number(q.marks || q.points || 10))),
        points: Math.max(1, Math.round(Number(q.points || q.marks || 10))),
      });
    }
  }

  return {
    objectiveQuestions: Array.from(objMap.values()),
    theoryQuestions: Array.from(theoryMap.values()),
  };
}

/**
 * Prepares questions:
 * - Section A (Objectives) always comes first.
 * - Section B (Theory) always comes after Objectives.
 * - Only Objectives are shuffled (Languages like English/French/Yoruba are locked).
 */
function processExamQuestions(
  rawObjectives: Question[],
  rawTheory: Question[],
  subjectInput?: any,
  examSettings: { shuffle_questions?: boolean; shuffle_options?: boolean } = {},
  examTitleInput?: any,
  fullExamData?: any
): Question[] {
  const subjectStr =
    typeof subjectInput === "string"
      ? subjectInput
      : subjectInput?.name || subjectInput?.title || subjectInput?.subject || "";

  const titleStr =
    typeof examTitleInput === "string"
      ? examTitleInput
      : examTitleInput?.title || examTitleInput?.name || "";

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

  const isExcludedSubject = isSubjectExcludedFromShuffle(
    subjectStr,
    combinedTitleContext
  );

  const allowQuestionShuffle = isExcludedSubject
    ? false
    : (examSettings.shuffle_questions ?? true);

  const allowOptionShuffleGlobally = isExcludedSubject
    ? false
    : (examSettings.shuffle_options ?? true);

  // 1. Process Objectives (Section A)
  let orderedObjectives = [...rawObjectives];
  if (allowQuestionShuffle) {
    orderedObjectives = shuffleArray(orderedObjectives);
  } else {
    orderedObjectives = orderedObjectives.sort((a: any, b: any) => {
      const numA = Number(
        a.order_number ??
          a.order_index ??
          a.q_index ??
          a.question_number ??
          a.question_index ??
          a.display_order ??
          a.display_number
      );
      const numB = Number(
        b.order_number ??
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
      return 0;
    });
  }

  // 2. Process Theory (Section B)
  const orderedTheory = [...rawTheory].sort((a: any, b: any) => {
    const numA = Number(
      a.order_number ??
        a.order_index ??
        a.question_number ??
        a.question_index ??
        a.display_number
    );
    const numB = Number(
      b.order_number ??
        b.order_index ??
        b.question_number ??
        b.question_index ??
        b.display_number
    );
    if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) {
      return numA - numB;
    }
    return 0;
  });

  // 3. Assemble: Objectives first (Q1..Q40), then Theory (Q41..Q45)
  const allTogether = [...orderedObjectives, ...orderedTheory];

  return allTogether.map((q, index) => {
    const options = extractOptions(q);
    const containsRelativePhrases = hasRelativeOptions(options);

    const shouldShuffleOptions =
      allowOptionShuffleGlobally &&
      !containsRelativePhrases &&
      q.type !== "theory";

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

      // 3. Exam Row Fetch
      let examData: Exam;
      try {
        examData = await fetchExam(examId);
      } catch {
        setLoadError("Exam not found");
        return;
      }
      setExam(examData);

      // 4. Relational Questions Table Fetch (Guarantees objectives are loaded)
      const supabase = createClient();
      let tableQuestions: any[] = [];
      try {
        const { data: qRows, error: qErr } = await supabase
          .from("questions")
          .select("*")
          .eq("exam_id", examId)
          .order("order_number", { ascending: true });

        if (!qErr && Array.isArray(qRows)) {
          tableQuestions = qRows;
        }
      } catch (err) {
        console.warn("[useExamLoader] Failed to read relational questions:", err);
      }

      // 5. Consolidate & Merge Objectives + Theory
      const { objectiveQuestions, theoryQuestions } = consolidateExamQuestions(
        examData,
        tableQuestions
      );

      const subjectName =
        examData.subject || (examData as any).subject_name || "";
      const examTitle = examData.title || "";

      // 6. Section A & Section B arrangement with option extraction
      const processedQuestions = processExamQuestions(
        objectiveQuestions,
        theoryQuestions,
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

      const objectiveCount = objectiveQuestions.length;
      const theoryCount = theoryQuestions.length;

      const objectiveMax = objectiveCount || examData.objective_max || 20;
      const theoryMax =
        theoryCount > 0
          ? examData.theory_max ?? Math.max(0, 60 - objectiveMax)
          : 0;
      const actualTotalMarks = objectiveMax + theoryMax;

      // 7. Dynamic Duration Resolution
      const dynamicDuration = resolveExamDuration(examData);

      // 8. Attempts Resolution
      const allAttempts = await fetchAttempts(
        examId,
        userProfile?.id ?? session.userId
      );
      const completed = getCompletedAttempts(allAttempts);
      const active = getActiveAttempt(allAttempts);
      const completedCount = completed.length;

      // In-progress attempt resume check
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