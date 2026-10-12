// src/components/staff/exams/create/CreateExamDialog.tsx - FIXED + DARK MODE

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

import { STEPS, DEFAULT_EXAM_DETAILS, MARK_CONSTANTS } from "./constants";
import type {
  CreateExamDialogProps,
  ExamDetails,
  Question,
  TheoryQuestion,
  ScoringRule,
  StepId,
  MarkDistribution,
} from "./types";

const calculateMarkDistribution = (
  questions: Question[],
  theoryQuestions: TheoryQuestion[],
  defaultMark: number,
  theoryTotalMarks: number
): MarkDistribution => {
  const objectiveTotal = questions.reduce((sum, q) => sum + (q.marks || defaultMark), 0);
  const questionCount = questions.length;
  
  const theoryTotal = theoryTotalMarks;
  const theoryQuestionCount = theoryQuestions.length;
  
  const marksPerTheoryQuestion = theoryQuestionCount > 0 
    ? theoryTotal / theoryQuestionCount 
    : 0;
  
  const examTotal = objectiveTotal + theoryTotal;
  const isBalanced = examTotal === MARK_CONSTANTS.EXAM_TOTAL;
  const isOver = examTotal > MARK_CONSTANTS.EXAM_TOTAL;
  
  return {
    objectiveTotal,
    theoryTotal,
    examTotal,
    ca1Max: MARK_CONSTANTS.CA1_MAX,
    ca2Max: MARK_CONSTANTS.CA2_MAX,
    caTotal: MARK_CONSTANTS.CA_TOTAL,
    grandTotal: MARK_CONSTANTS.GRAND_TOTAL,
    questionCount,
    theoryQuestionCount,
    marksPerTheoryQuestion,
    isBalanced,
    theoryMarksPerQuestion: marksPerTheoryQuestion,
  };
};

export function CreateExamDialog({
  open,
  onOpenChange,
  onSuccess,
  teacherProfile,
}: CreateExamDialogProps) {
  const [activeStep, setActiveStep] = useState<StepId>("details");
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());

  const [examDetails, setExamDetails] = useState<ExamDetails>(DEFAULT_EXAM_DETAILS);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQuestion[]>([]);
  const [hasTheory, setHasTheory] = useState(false);

  const [objectiveMax, setObjectiveMax] = useState(20);
  const [theoryMax, setTheoryMax] = useState(40);
  const [defaultMark, setDefaultMark] = useState<number>(MARK_CONSTANTS.DEFAULT_MARK);
  const [theoryQuestionsTotal, setTheoryQuestionsTotal] = useState(0);
  const [theoryQuestionsToAnswer, setTheoryQuestionsToAnswer] = useState<number | null>(null);
  const [theoryMarksPerQuestion, setTheoryMarksPerQuestion] = useState(10);
  const [scoringRule, setScoringRule] = useState<ScoringRule>("standard");
  const [theoryTotalMarks, setTheoryTotalMarks] = useState<number>(MARK_CONSTANTS.DEFAULT_THEORY_TOTAL);

  const [bulkQuestionsText, setBulkQuestionsText] = useState("");
  const [bulkTheoryText, setBulkTheoryText] = useState("");

  const [passageText, setPassageText] = useState("");
  const [hasPassage, setHasPassage] = useState(false);

  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  const { debouncedSave, loadFromStorage, clearStorage } = useExamDraft();
  const { parseObjective, parseTheory } = useQuestionParser(defaultMark);

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);
  const { loading, submit } = useExamSubmit(onSuccess, handleClose);

  const markDistribution = useMemo(() => {
    return calculateMarkDistribution(
      questions,
      theoryQuestions,
      defaultMark,
      theoryTotalMarks
    );
  }, [questions, theoryQuestions, defaultMark, theoryTotalMarks]);

  const examProgress = useMemo(() => {
    let score = 0;
    if (examDetails.title) score += 25;
    if (examDetails.subject) score += 25;
    if (examDetails.class) score += 25;
    if (questions.length > 0 || theoryQuestions.length > 0) score += 25;
    return score;
  }, [examDetails, questions, theoryQuestions]);

  const totalMarks = markDistribution.examTotal;
  const isOver = totalMarks > MARK_CONSTANTS.EXAM_TOTAL;
  const currentStepIndex = STEPS.findIndex((s) => s.id === activeStep);
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === STEPS.length - 1;

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
      passageText,
      hasPassage,
      theoryTotalMarks,
    });
  }, [
    activeStep, hasTheory, examDetails, questions, theoryQuestions,
    objectiveMax, theoryMax, theoryQuestionsTotal, theoryQuestionsToAnswer,
    theoryMarksPerQuestion, scoringRule, defaultMark, bulkQuestionsText,
    bulkTheoryText, passageText, hasPassage, theoryTotalMarks, debouncedSave,
  ]);

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
    setDefaultMark(draft.defaultMark ?? MARK_CONSTANTS.DEFAULT_MARK);
    setBulkQuestionsText(draft.bulkQuestionsText ?? "");
    setBulkTheoryText(draft.bulkTheoryText ?? "");
    setPassageText(draft.passageText ?? "");
    setHasPassage(draft.hasPassage ?? false);
    setTheoryTotalMarks(draft.theoryTotalMarks ?? MARK_CONSTANTS.DEFAULT_THEORY_TOTAL);

    toast.info("📝 Draft restored", {
      description: `${draft.questions?.length ?? 0} obj + ${draft.theoryQuestions?.length ?? 0} theory`,
      duration: 3000,
    });
  }, [open, loadFromStorage]);

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
    setPassageText("");
    setHasPassage(false);
    setDefaultMark(MARK_CONSTANTS.DEFAULT_MARK);
    setObjectiveMax(20);
    setTheoryMax(40);
    setTheoryQuestionsTotal(0);
    setTheoryQuestionsToAnswer(null);
    setTheoryMarksPerQuestion(10);
    setScoringRule("standard");
    setTheoryTotalMarks(MARK_CONSTANTS.DEFAULT_THEORY_TOTAL);
    toast.success("Started fresh!");
  }, [clearStorage]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        toast.info("💾 Progress auto-saved", { duration: 2000 });
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  const handleSubmit = useCallback(
    async (submitForApproval: boolean) => {
      if (isOver) {
        toast.error(`Exam total (${totalMarks}) exceeds ${MARK_CONSTANTS.EXAM_TOTAL} marks. Please reduce questions.`);
        return;
      }
      if (totalMarks !== MARK_CONSTANTS.EXAM_TOTAL) {
        toast.error(`Exam total must be ${MARK_CONSTANTS.EXAM_TOTAL} marks. Current total: ${totalMarks}`);
        return;
      }

      const success = await submit({
        examDetails,
        questions,
        theoryQuestions,
        hasTheory,
        objectiveMax: markDistribution.objectiveTotal,
        theoryMax: theoryTotalMarks,
        theoryQuestionsTotal,
        theoryQuestionsToAnswer,
        theoryMarksPerQuestion: markDistribution.marksPerTheoryQuestion,
        scoringRule,
        teacherProfile,
        submitForApproval,
        passageText: hasPassage ? passageText : null,
        defaultMark,
        markDistribution,
        theoryTotalMarks,
      });
      
      if (success) {
        clearStorage();
        setHasSavedDraft(false);
      }
    },
    [
      submit, examDetails, questions, theoryQuestions, hasTheory,
      theoryQuestionsTotal, theoryQuestionsToAnswer, scoringRule, teacherProfile,
      clearStorage, passageText, hasPassage, defaultMark, totalMarks, isOver,
      markDistribution, theoryTotalMarks,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col p-0 overflow-hidden gap-0",
          "w-[100vw] h-[100dvh] rounded-none",
          "sm:w-[98vw] sm:h-[98vh] sm:rounded-xl",
          "md:w-[96vw] md:h-[96vh] md:rounded-2xl",
          "lg:w-[94vw] lg:max-w-[1400px] lg:h-[95vh]",
          "xl:max-w-[1500px] 2xl:max-w-[1600px]",
          "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
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

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {(questions.length > 0 || theoryQuestions.length > 0) && (
                <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                  <span className="text-[10px] text-white font-semibold">
                    {questions.length + theoryQuestions.length}Q
                  </span>
                  <span className={cn(
                    "text-[10px]",
                    totalMarks === MARK_CONSTANTS.EXAM_TOTAL ? "text-gray-400" : 
                    isOver ? "text-red-400" : "text-amber-400"
                  )}>
                    • {totalMarks}mk
                    {isOver && " ⛔"}
                    {totalMarks !== MARK_CONSTANTS.EXAM_TOTAL && !isOver && " ⚠️"}
                  </span>
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

          <div className="mt-2 bg-white/5 border border-white/10 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
            <StepIndicator
              currentStep={activeStep}
              completedSteps={completedSteps}
              onStepClick={goToStep}
            />
          </div>
        </div>

        {/* Draft banner */}
        {hasSavedDraft && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 px-3 py-1.5 flex items-center justify-between flex-shrink-0">
            <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 font-medium truncate">
              📝 Draft restored — {questions.length} obj
              {theoryQuestions.length > 0 ? ` + ${theoryQuestions.length} theory` : ""}
            </p>
            <button
              onClick={() => setHasSavedDraft(false)}
              className="text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 p-0.5 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Step content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white dark:bg-slate-950">
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
              questionCount={questions.length}
              markDistribution={markDistribution}
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
              passageText={passageText}
              onPassageTextChange={setPassageText}
              hasPassage={hasPassage}
              onHasPassageChange={setHasPassage}
              markDistribution={markDistribution}
              onDefaultMarkChange={(newMark: number) => {
                setDefaultMark(newMark);
                setQuestions(prev => prev.map(q => ({ ...q, marks: newMark })));
              }}
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
              markDistribution={markDistribution}
              defaultMark={defaultMark}
              theoryTotalMarks={theoryTotalMarks}
              onTheoryTotalMarksChange={setTheoryTotalMarks}
              objectiveTotal={markDistribution.objectiveTotal}
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
              passageText={hasPassage ? passageText : undefined}
              defaultMark={defaultMark}
              markDistribution={markDistribution}
              theoryTotalMarks={theoryTotalMarks}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 sm:py-2.5">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 h-7 sm:h-8 px-2 text-xs"
              >
                <X className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Close</span>
              </Button>
              {!isFirst && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goPrev}
                  className="h-7 sm:h-8 px-2 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:mr-0.5" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
            </div>

            <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Obj: {markDistribution.objectiveTotal.toFixed(1)}mk</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span>Theory: {markDistribution.theoryTotal.toFixed(1)}mk</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className={cn(
                "font-semibold",
                totalMarks === MARK_CONSTANTS.EXAM_TOTAL ? "text-emerald-600 dark:text-emerald-400" : 
                isOver ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
              )}>
                Total: {totalMarks}mk
                {isOver && " ⛔ OVER"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {!isLast ? (
                <Button
                  onClick={goNext}
                  disabled={isOver}
                  className={cn(
                    "h-7 sm:h-8 px-3 sm:px-4 text-xs",
                    isOver 
                      ? "bg-gray-400 dark:bg-gray-700 cursor-not-allowed" 
                      : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  )}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit(false)}
                    disabled={loading || isOver}
                    className="h-7 sm:h-8 px-2 sm:px-3 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
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
                    disabled={loading || isOver || totalMarks !== MARK_CONSTANTS.EXAM_TOTAL}
                    className={cn(
                      "h-7 sm:h-8 px-2 sm:px-3 text-xs",
                      !isOver && totalMarks === MARK_CONSTANTS.EXAM_TOTAL
                        ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                        : "bg-gray-400 dark:bg-gray-700 cursor-not-allowed"
                    )}
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