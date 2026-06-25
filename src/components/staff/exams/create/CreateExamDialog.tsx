// src/components/staff/exams/create/CreateExamDialog.tsx

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  GraduationCap, X, RotateCcw, ChevronLeft,
  ChevronRight, Save, Send, Loader2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { StepIndicator } from "./components/StepIndicator";
import { ExamDetailsStep } from "./steps/ExamDetailsStep";
import { ObjectiveQuestionsStep } from "./steps/ObjectiveQuestionsStep";
import { TheoryQuestionsStep } from "./steps/TheoryQuestionsStep";
import { PreviewStep } from "./steps/PreviewStep";

import { useExamDraft } from "./hooks/useExamDraft";
import { useExamSubmit } from "./hooks/useExamSubmit";
import { useQuestionParser } from "./hooks/useQuestionParser";

import { STEPS, DEFAULT_EXAM_DETAILS } from "./constants";
import type {
  CreateExamDialogProps,
  ExamDetails,
  Question,
  TheoryQuestion,
  ScoringRule,
  StepId,
} from "./types";

export function CreateExamDialog({
  open,
  onOpenChange,
  onSuccess,
  teacherProfile,
}: CreateExamDialogProps) {
  // ── Navigation ────────────────────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState<StepId>("details");
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());

  // ── Exam State ────────────────────────────────────────────────────────────
  const [examDetails, setExamDetails] = useState<ExamDetails>(DEFAULT_EXAM_DETAILS);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>([]);
  const [hasTheory, setHasTheory] = useState(false);

  // ── Config ────────────────────────────────────────────────────────────────
  const [objectiveMax, setObjectiveMax] = useState(20);
  const [theoryMax, setTheoryMax] = useState(40);
  const [defaultMark, setDefaultMark] = useState(0.5);
  const [theoryQuestionsTotal, setTheoryQuestionsTotal] = useState(0);
  const [theoryQuestionsToAnswer, setTheoryQuestionsToAnswer] = useState<number | null>(null);
  const [theoryMarksPerQuestion, setTheoryMarksPerQuestion] = useState(10);
  const [scoringRule, setScoringRule] = useState<ScoringRule>("standard");

  // ── Bulk Text ─────────────────────────────────────────────────────────────
  const [bulkQuestionsText, setBulkQuestionsText] = useState("");
  const [bulkTheoryText, setBulkTheoryText] = useState("");

  // ── Draft UI ──────────────────────────────────────────────────────────────
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  // ── Services ──────────────────────────────────────────────────────────────
  const { debouncedSave, loadFromStorage, clearStorage } = useExamDraft();
  const { parseObjective, parseTheory } = useQuestionParser(defaultMark);

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  const { loading, submit } = useExamSubmit(onSuccess, handleClose);

  // ── Derived ───────────────────────────────────────────────────────────────
  const examProgress = useMemo(() => {
    let score = 0;
    if (examDetails.title) score += 25;
    if (examDetails.subject) score += 25;
    if (examDetails.class) score += 25;
    if (questions.length > 0 || theoryQuestions.length > 0) score += 25;
    return score;
  }, [examDetails, questions, theoryQuestions]);

  const totalMarks = objectiveMax + theoryMax;
  const currentStepIndex = STEPS.findIndex((s) => s.id === activeStep);
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === STEPS.length - 1;

  // ── Auto-save ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const hasData =
      examDetails.title ||
      examDetails.subject ||
      questions.length > 0 ||
      theoryQuestions.length > 0;
    if (!hasData) return;

    debouncedSave({
      activeStep,
      hasTheory,
      examDetails,
      questions,
      theoryQuestions,
      objectiveMax,
      theoryMax,
      theoryQuestionsTotal,
      theoryQuestionsToAnswer,
      theoryMarksPerQuestion,
      scoringRule,
      defaultMark,
      bulkQuestionsText,
      bulkTheoryText,
    });
  }, [
    activeStep, hasTheory, examDetails, questions, theoryQuestions,
    objectiveMax, theoryMax, theoryQuestionsTotal, theoryQuestionsToAnswer,
    theoryMarksPerQuestion, scoringRule, defaultMark,
    bulkQuestionsText, bulkTheoryText, debouncedSave,
  ]);

  // ── Load draft on open ────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const draft = loadFromStorage();
    if (!draft) return;

    setHasSavedDraft(true);
    setActiveStep((draft.activeStep as StepId) || "details");
    setHasTheory(draft.hasTheory ?? false);
    setExamDetails(draft.examDetails ?? DEFAULT_EXAM_DETAILS);
    setQuestions(draft.questions ?? []);
    setTheoryQuestions(draft.theoryQuestions ?? []);
    setObjectiveMax(draft.objectiveMax ?? 20);
    setTheoryMax(draft.theoryMax ?? 40);
    setTheoryQuestionsTotal(draft.theoryQuestionsTotal ?? 0);
    setTheoryQuestionsToAnswer(draft.theoryQuestionsToAnswer ?? null);
    setTheoryMarksPerQuestion(draft.theoryMarksPerQuestion ?? 10);
    setScoringRule(draft.scoringRule ?? "standard");
    setDefaultMark(draft.defaultMark ?? 0.5);
    setBulkQuestionsText(draft.bulkQuestionsText ?? "");
    setBulkTheoryText(draft.bulkTheoryText ?? "");

    toast.info("📝 Draft restored", {
      description: `${draft.questions?.length ?? 0} obj + ${draft.theoryQuestions?.length ?? 0} theory`,
      duration: 3000,
    });
  }, [open, loadFromStorage]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goToStep = useCallback((id: StepId) => setActiveStep(id), []);

  const goNext = useCallback(() => {
    setCompletedSteps((prev) => new Set([...prev, activeStep]));
    const next = STEPS[currentStepIndex + 1];
    if (next) setActiveStep(next.id);
  }, [activeStep, currentStepIndex]);

  const goPrev = useCallback(() => {
    const prev = STEPS[currentStepIndex - 1];
    if (prev) setActiveStep(prev.id);
  }, [currentStepIndex]);

  // ── Clear Draft ───────────────────────────────────────────────────────────
  const handleClearDraft = useCallback(() => {
    clearStorage();
    setHasSavedDraft(false);
    setActiveStep("details");
    setCompletedSteps(new Set());
    setHasTheory(false);
    setExamDetails(DEFAULT_EXAM_DETAILS);
    setQuestions([]);
    setTheoryQuestions([]);
    setBulkQuestionsText("");
    setBulkTheoryText("");
    setDefaultMark(0.5);
    setObjectiveMax(20);
    setTheoryMax(40);
    setTheoryQuestionsTotal(0);
    setTheoryQuestionsToAnswer(null);
    setTheoryMarksPerQuestion(10);
    setScoringRule("standard");
    toast.success("Started fresh!");
  }, [clearStorage]);

  // ── Close ────────────────────────────────────────────────────────────────
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        toast.info("💾 Progress auto-saved", { duration: 2000 });
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (submitForApproval: boolean) => {
      const success = await submit({
        examDetails,
        questions,
        theoryQuestions,
        hasTheory,
        objectiveMax,
        theoryMax,
        theoryQuestionsTotal,
        theoryQuestionsToAnswer,
        theoryMarksPerQuestion,
        scoringRule,
        teacherProfile,
        submitForApproval,
      });
      if (success) {
        clearStorage();
        setHasSavedDraft(false);
      }
    },
    [
      submit, examDetails, questions, theoryQuestions, hasTheory,
      objectiveMax, theoryMax, theoryQuestionsTotal, theoryQuestionsToAnswer,
      theoryMarksPerQuestion, scoringRule, teacherProfile, clearStorage,
    ]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col p-0 overflow-hidden gap-0",
          "w-[100vw] h-[100dvh] rounded-none",
          "sm:w-[98vw] sm:h-[98vh] sm:rounded-xl",
          "md:w-[96vw] md:h-[96vh] md:rounded-2xl",
          "lg:w-[94vw] lg:max-w-[1400px] lg:h-[95vh]",
          "xl:max-w-[1500px] 2xl:max-w-[1600px]"
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-gray-900 to-slate-800 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-white font-bold text-xs sm:text-sm leading-tight truncate">
                  {examDetails.title || "Create New Exam"}
                </h2>
                <p className="text-gray-500 text-[10px] truncate hidden sm:block">
                  {examDetails.subject && examDetails.class
                    ? `${examDetails.subject} • ${examDetails.class}`
                    : "Follow the steps below"}
                </p>
              </div>
            </div>

            {/* Stats + Reset */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {(questions.length > 0 || theoryQuestions.length > 0) && (
                <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                  <span className="text-[10px] text-white font-semibold">
                    {questions.length + theoryQuestions.length}Q
                  </span>
                  <span className="text-[10px] text-gray-400">• {totalMarks}mk</span>
                </div>
              )}
              <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                <div className="w-10 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${examProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{examProgress}%</span>
              </div>
              {(examDetails.title || questions.length > 0) && (
                <button
                  onClick={handleClearDraft}
                  title="Start fresh"
                  className="text-gray-500 hover:text-white p-1 rounded transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Step Indicator */}
          <div className="mt-2 bg-white/5 border border-white/10 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
            <StepIndicator
              currentStep={activeStep}
              completedSteps={completedSteps}
              onStepClick={goToStep}
            />
          </div>
        </div>

        {/* ── Draft Banner ────────────────────────────────────────────────── */}
        {hasSavedDraft && (
          <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center justify-between flex-shrink-0">
            <p className="text-[10px] sm:text-xs text-amber-700 font-medium truncate">
              📝 Draft restored — {questions.length} obj
              {theoryQuestions.length > 0
                ? ` + ${theoryQuestions.length} theory`
                : ""}
            </p>
            <button
              onClick={() => setHasSavedDraft(false)}
              className="text-amber-500 hover:text-amber-700 p-0.5 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* ── Step Content ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeStep === "details" && (
            <ExamDetailsStep
              examDetails={examDetails}
              onExamDetailsChange={setExamDetails}
              hasTheory={hasTheory}
              onHasTheoryChange={setHasTheory}
              objectiveMax={objectiveMax}
              onObjectiveMaxChange={setObjectiveMax}
              theoryMax={theoryMax}
              onTheoryMaxChange={setTheoryMax}
              defaultMark={defaultMark}
              onDefaultMarkChange={setDefaultMark}
            />
          )}

          {activeStep === "questions" && (
            <ObjectiveQuestionsStep
              questions={questions}
              onQuestionsChange={setQuestions}
              objectiveMax={objectiveMax}
              defaultMark={defaultMark}
              bulkText={bulkQuestionsText}
              onBulkTextChange={setBulkQuestionsText}
              onParse={parseObjective}
            />
          )}

          {activeStep === "theory" && (
            <TheoryQuestionsStep
              questions={theoryQuestions}
              onQuestionsChange={setTheoryQuestions}
              hasTheory={hasTheory}
              onHasTheoryChange={setHasTheory}
              theoryMax={theoryMax}
              bulkText={bulkTheoryText}
              onBulkTextChange={setBulkTheoryText}
              onParse={parseTheory}
            />
          )}

          {activeStep === "preview" && (
            <PreviewStep
              examDetails={examDetails}
              questions={questions}
              theoryQuestions={theoryQuestions}
              hasTheory={hasTheory}
              objectiveMax={objectiveMax}
              theoryMax={theoryMax}
            />
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 bg-white border-t px-3 sm:px-4 py-2 sm:py-2.5">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Left */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="text-gray-500 h-7 sm:h-8 px-2 text-xs"
              >
                <X className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Close</span>
              </Button>
              {!isFirst && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goPrev}
                  className="h-7 sm:h-8 px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:mr-0.5" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
            </div>

            {/* Step Dots */}
            <div className="hidden sm:flex items-center gap-1">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    s.id === activeStep
                      ? "bg-emerald-600 w-5"
                      : completedSteps.has(s.id)
                      ? "bg-emerald-400 w-1.5"
                      : "bg-gray-200 w-1.5"
                  )}
                />
              ))}
            </div>

            {/* Right */}
            <div className="flex items-center gap-1.5">
              {!isLast ? (
                <Button
                  onClick={goNext}
                  className="h-7 sm:h-8 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-xs"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                    className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
                  >
                    {loading ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3 w-3" />
                    )}
                    Draft
                  </Button>
                  <Button
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                    className="h-7 sm:h-8 px-2 sm:px-3 bg-emerald-600 hover:bg-emerald-700 text-xs"
                  >
                    {loading ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="mr-1 h-3 w-3" />
                    )}
                    Submit
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}