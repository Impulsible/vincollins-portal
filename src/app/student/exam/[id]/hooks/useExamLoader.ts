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
 * Safely parses marks as floating point numbers without rounding (preserves 0.5).
 */
function parseMark(val: any, fallback: number): number {
  if (val === null || val === undefined || val === "") return fallback;
  const num = Number(val);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

/**
 * Strips accidental trailing "Marks: 0.5" or "[1 mark]" appended to the question text.
 */
function cleanQuestionText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\s*\(?\s*marks?:\s*\d+(\.\d+)?\s*\)?\s*$/i, "")
    .replace(/\s*\[\s*\d+(\.\d+)?\s*marks?\s*\]\s*$/i, "")
    .replace(/\s*\(\s*\d+(\.\d+)?\s*marks?\s*\)\s*$/i, "")
    .trim();
}

/**
 * Normalizes question text into a signature for deduplication.
 * Strips question numbering (e.g. "1.", "1a.", "(a)"), punctuation, and spacing.
 */
function getQuestionSignature(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/^\s*(question\s*)?[0-9]+[\.\)\:\-]?\s*(\([a-z0-9]+\))?\s*/i, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 100);
}

/**
 * Robustly resolves the exam duration in minutes directly from whatever 
 * the teacher set (90, 120, 45, etc.), overcoming database default mismatches.
 */
export function getTeacherExamDuration(exam: any): number {
  if (!exam) return 60;

  const colA = Number(exam.duration);
  const colB = Number(exam.duration_minutes);

  const candidates = [colA, colB].filter((n) => Number.isFinite(n) && n > 0);

  if (candidates.length > 0) {
    if (candidates.length > 1 && candidates.includes(60)) {
      const teacherCustomTime = candidates.find((c) => c !== 60);
      if (teacherCustomTime) {
        return teacherCustomTime <= 4 ? Math.round(teacherCustomTime * 60) : Math.round(teacherCustomTime);
      }
    }

    const primary = candidates[0];
    if (primary > 0 && primary <= 4) {
      return Math.round(primary * 60);
    }
    return Math.round(primary);
  }

  const raw =
    exam.time_limit_minutes ??
    exam.time_limit ??
    exam.duration_mins ??
    exam.total_time;

  if (typeof raw === "string") {
    const cleaned = raw.trim().toLowerCase();
    if (cleaned.includes("hr") || cleaned.includes("hour")) {
      const match = cleaned.match(/([\d.]+)/);
      if (match) {
        const hrs = parseFloat(match[1]);
        if (Number.isFinite(hrs) && hrs > 0) return Math.round(hrs * 60);
      }
    }

    const num = parseFloat(cleaned);
    if (Number.isFinite(num) && num > 0) {
      if (num <= 4 && !cleaned.includes("min")) return Math.round(num * 60);
      return Math.round(num);
    }
  }

  return 60;
}

/**
 * Safely extracts options from Arrays, JSON strings, Objects, 
 * or separate columns (option_a, option_b, etc.).
 */
function extractOptions(q: any): string[] {
  if (!q) return [];
  let candidates: string[] = [];

  let raw = q.options ?? q.choices ?? q.answers;

  if (typeof raw === "string" && raw.trim().length > 0) {
    try {
      raw = JSON.parse(raw);
    } catch {
      if (raw.includes("\n") || raw.includes(",")) {
        raw = raw.split(/\n|,/).map((s: string) => s.trim()).filter(Boolean);
      }
    }
  }

  if (Array.isArray(raw) && raw.length > 0) {
    candidates = raw
      .map((opt) => {
        if (typeof opt === "string") return opt.trim();
        if (typeof opt === "number") return String(opt).trim();
        if (typeof opt === "object" && opt !== null) {
          return String(
            opt.text ||
            opt.option ||
            opt.value ||
            opt.label ||
            opt.content ||
            opt.option_text ||
            opt.choice ||
            ""
          ).trim();
        }
        return String(opt ?? "").trim();
      })
      .filter(Boolean);
  } else if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    candidates = Object.values(raw)
      .map((opt) => {
        if (typeof opt === "string") return opt.trim();
        if (typeof opt === "object" && opt !== null) {
          return String(
            (opt as any).text ||
            (opt as any).option ||
            (opt as any).value ||
            (opt as any).label ||
            ""
          ).trim();
        }
        return String(opt ?? "").trim();
      })
      .filter(Boolean);
  }

  if (candidates.length > 0) {
    return candidates;
  }

  const sep = [
    q.option_a, q.option_b, q.option_c, q.option_d, q.option_e, q.option_f,
    q.optionA, q.optionB, q.optionC, q.optionD, q.optionE,
    q.opt_a, q.opt_b, q.opt_c, q.opt_d,
    q.optA, q.optB, q.optC, q.optD,
  ]
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());

  if (sep.length > 0) {
    return sep;
  }

  return [];
}

/**
 * Accurately determines if a question is Theory or Objective.
 */
function isQuestionTheory(q: any, opts: string[]): boolean {
  if (opts.length >= 2) {
    return false;
  }

  const subQs = Array.isArray(q.sub_questions) ? q.sub_questions : [];
  if (subQs.length > 0) {
    return true;
  }

  const rawType = String(q.type || "").toLowerCase().trim();
  if (
    rawType === "theory" ||
    rawType === "essay" ||
    rawType === "structured" ||
    rawType === "subjective" ||
    rawType === "short_answer"
  ) {
    return true;
  }

  if (q.is_theory === true || String(q.is_theory) === "true") {
    return true;
  }

  const section = String(
    q.section || q.section_header || q.sectionHeader || ""
  ).toLowerCase();
  if (
    section.includes("theory") ||
    section.includes("section b") ||
    section.includes("part b")
  ) {
    return true;
  }

  if (opts.length === 0) {
    return true;
  }

  return false;
}

/**
 * Consolidates questions without duplicate theory or objective rows.
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
    if (typeof raw === "string" && raw.trim().length > 0) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const jsonObjectives = [
    ...parseJsonSafe(examData?.questions),
    ...parseJsonSafe(examData?.objective_questions),
    ...parseJsonSafe(examData?.objectives),
  ];

  const jsonTheory = [
    ...parseJsonSafe(examData?.theory_questions),
    ...parseJsonSafe(examData?.theory),
  ];

  const objMap = new Map<string, any>();
  const theoryMap = new Map<string, any>();

  const seenObjSignatures = new Set<string>();
  const seenTheorySignatures = new Set<string>();

  const processQuestion = (q: any, fallbackPrefix: string) => {
    if (!q) return;
    const opts = extractOptions(q);
    const isTheory = isQuestionTheory(q, opts);
    const subQs = Array.isArray(q.sub_questions) ? q.sub_questions : [];

    const rawText = q.question_text || q.question || q.prompt || q.text || "";
    const questionText = cleanQuestionText(rawText);
    const signature = getQuestionSignature(questionText);

    // Reject non-question instruction headers (e.g. "SECTION B: THEORY INSTRUCTIONS")
    const isInstructionHeader =
      questionText.length < 150 &&
      /^(section\s+[ab]|instructions?|part\s+[ab])\s*[:\-]/i.test(questionText.trim()) &&
      !/(what|define|explain|list|calculate|state|describe|discuss|mention|name|differentiate|solve|convert|simplify)/i.test(questionText);

    if (isInstructionHeader) return;

    if (isTheory) {
      // Deduplicate by text signature to guarantee no duplicates
      if (signature && seenTheorySignatures.has(signature)) return;
      if (signature) seenTheorySignatures.add(signature);

      const key = String(q.id || `${fallbackPrefix}-th-${theoryMap.size + 1}`);
      const theoryMarks = parseMark(q.marks ?? q.points, 10.0);

      theoryMap.set(key, {
        ...q,
        id: key,
        question: questionText,
        question_text: questionText,
        type: "theory",
        is_theory: true,
        options: [],
        sub_questions: subQs,
        marks: theoryMarks,
        points: theoryMarks,
      });
    } else {
      if (signature && seenObjSignatures.has(signature)) return;
      if (signature) seenObjSignatures.add(signature);

      const key = String(q.id || `${fallbackPrefix}-obj-${objMap.size + 1}`);
      const objMarks = parseMark(q.marks ?? q.points, 0.5);

      objMap.set(key, {
        ...q,
        id: key,
        question: questionText,
        question_text: questionText,
        options: opts,
        type: "objective",
        is_theory: false,
        marks: objMarks,
        points: objMarks,
      });
    }
  };

  // 1. Process relational DB questions first (Primary Source of Truth)
  for (const q of tableQuestions) {
    processQuestion(q, "rel");
  }

  // 2. ONLY fallback to JSON columns if relational table had 0 objectives
  if (objMap.size === 0) {
    for (const q of jsonObjectives) {
      processQuestion(q, "json-obj");
    }
  }

  // 3. ONLY fallback to JSON columns if relational table had 0 theory questions
  if (theoryMap.size === 0) {
    for (const q of jsonTheory) {
      processQuestion(q, "json-th");
    }
  }

  return {
    objectiveQuestions: Array.from(objMap.values()),
    theoryQuestions: Array.from(theoryMap.values()),
  };
}

/**
 * Prepares questions:
 * - Section A (Objectives) ALWAYS comes first (Q1..Q40).
 * - Section B (Theory) ALWAYS comes after Objectives (Q41..Q46).
 * - Only Objectives are shuffled. Theory questions are NEVER shuffled.
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
          0
      );
      const numB = Number(
        b.order_number ??
          b.order_index ??
          b.q_index ??
          b.question_number ??
          b.question_index ??
          b.display_order ??
          0
      );
      return numA - numB;
    });
  }

  // 2. Process Theory (Section B) - NEVER SHUFFLED
  const orderedTheory = [...rawTheory].sort((a: any, b: any) => {
    const numA = Number(
      a.order_number ??
        a.order_index ??
        a.question_number ??
        a.question_index ??
        a.display_order ??
        0
    );
    const numB = Number(
      b.order_number ??
        b.order_index ??
        b.question_number ??
        b.question_index ??
        b.display_order ??
        0
    );
    return numA - numB;
  });

  // 3. Assemble: Objectives first (Q1..Q40), then Theory (Q41..Q46)
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

      // 4. Relational Questions Table Fetch (Filter out soft-deleted & draft questions)
      const supabase = createClient();
      let tableQuestions: any[] = [];
      try {
        const { data: qRows, error: qErr } = await supabase
          .from("questions")
          .select("*")
          .eq("exam_id", examId);

        if (!qErr && Array.isArray(qRows)) {
          tableQuestions = qRows.filter((q: any) => !q.deleted_at && q.is_draft !== true);
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

      // 6. Section A (Objectives) & Section B (Theory) arrangement
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

      // Teacher's explicit max marks (Default: 20 max for objectives, 40 max for theory)
      const teacherObjMax = Number(examData.objective_max);
      const objectiveMax = Number.isFinite(teacherObjMax) && teacherObjMax > 0 
        ? teacherObjMax 
        : (objectiveCount * 0.5);

      const teacherTheoryMax = Number(examData.theory_max);
      const theoryMax = theoryCount > 0
        ? (Number.isFinite(teacherTheoryMax) && teacherTheoryMax > 0 ? teacherTheoryMax : Math.max(0, 60 - objectiveMax))
        : 0;

      const teacherTotal = Number(examData.total_marks);
      const actualTotalMarks = Number.isFinite(teacherTotal) && teacherTotal > 0
        ? teacherTotal
        : (objectiveMax + theoryMax);

      // 7. Dynamic Teacher Duration
      const dynamicDuration = getTeacherExamDuration(examData);

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
          toast.error("Exam data corrupted — missing start time. Contact support.");
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

        const teacherObjMax = Number(exam.objective_max);
        const objectiveMax = Number.isFinite(teacherObjMax) && teacherObjMax > 0 
          ? teacherObjMax 
          : (objCount * 0.5);

        const teacherTheoryMax = Number(exam.theory_max);
        const theoryMax = theoCount > 0
          ? (Number.isFinite(teacherTheoryMax) && teacherTheoryMax > 0 ? teacherTheoryMax : Math.max(0, 60 - objectiveMax))
          : 0;

        const teacherTotal = Number(exam.total_marks);
        const actualTotalMarks = Number.isFinite(teacherTotal) && teacherTotal > 0
          ? teacherTotal
          : (objectiveMax + theoryMax);

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