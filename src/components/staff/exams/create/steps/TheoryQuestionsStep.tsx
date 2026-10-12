// src/components/staff/exams/create/steps/TheoryQuestionsStep.tsx - WITH DARK MODE

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus, Brain, Layers, Sparkles, Loader2, ImageIcon, X, Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { BulkImporter } from "../components/BulkImporter";
import { TheoryCard } from "../components/QuestionCard";
import { parseDocument } from "../hooks/useQuestionParser";
import { THEORY_TEMPLATE } from "../constants";
import type { TheoryQuestion, ParseResult } from "../types";

const renderContent = (text: string) => {
  if (!text) return null;
  return (
    <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
      {text.split("\n").map((line, i) => {
        if (line.match(/^\d+\./))
          return (
            <p key={i} className="mb-1 font-semibold text-blue-700 dark:text-blue-400">
              {line}
            </p>
          );
        if (line.match(/^[a-z]\./i))
          return (
            <p key={i} className="mb-1 ml-4 text-gray-700 dark:text-slate-300">
              {line}
            </p>
          );
        if (line === "") return <br key={i} />;
        return <p key={i} className="mb-1">{line}</p>;
      })}
    </div>
  );
};

const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const ext = file.name.split(".").pop();
    const filePath = `exam-images/temp/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("exam-assets")
      .upload(filePath, file);
    if (error) throw error;
    return supabase.storage
      .from("exam-assets")
      .getPublicUrl(filePath).data.publicUrl;
  } catch {
    return null;
  }
};

interface MarkDistribution {
  objectiveTotal: number;
  theoryTotal: number;
  examTotal: number;
  ca1Max: number;
  ca2Max: number;
  caTotal: number;
  grandTotal: number;
  questionCount: number;
  theoryQuestionCount: number;
  marksPerTheoryQuestion: number;
  isBalanced: boolean;
  theoryMarksPerQuestion: number;
}

interface TheoryQuestionsStepProps {
  questions: TheoryQuestion[];
  onQuestionsChange: (q: TheoryQuestion[]) => void;
  hasTheory: boolean;
  onHasTheoryChange: (v: boolean) => void;
  theoryMax: number;
  bulkText: string;
  onBulkTextChange: (v: string) => void;
  onParse: (text: string) => ParseResult<TheoryQuestion>;
  markDistribution?: MarkDistribution;
  defaultMark?: number;
  theoryTotalMarks: number;
  onTheoryTotalMarksChange: (value: number) => void;
  objectiveTotal: number;
}

export function TheoryQuestionsStep({
  questions,
  onQuestionsChange,
  hasTheory,
  onHasTheoryChange,
  theoryMax,
  bulkText,
  onBulkTextChange,
  onParse,
  markDistribution,
  defaultMark = 0.5,
  theoryTotalMarks,
  onTheoryTotalMarksChange,
  objectiveTotal,
}: TheoryQuestionsStepProps) {
  const [mode, setMode] = useState<"smart" | "manual">("smart");
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<TheoryQuestion[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [manualQ, setManualQ] = useState({
    question: "",
    marks: 10,
    image_url: "",
    image_caption: "",
  });

  const remainingForTheory = useMemo(() => Math.max(0, 60 - objectiveTotal), [objectiveTotal]);

  const calculatedTheoryMarksPerQuestion = useMemo(() => {
    const count = questions.length || 1;
    return theoryTotalMarks / count;
  }, [theoryTotalMarks, questions.length]);

  const isValidTheoryTotal = theoryTotalMarks <= remainingForTheory;

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  useEffect(() => {
    if (questions.length > 0 && theoryTotalMarks > 0) {
      const marksPerQ = theoryTotalMarks / questions.length;
      const updatedQuestions = questions.map(q => ({
        ...q,
        marks: Math.round(marksPerQ * 100) / 100,
      }));
      if (updatedQuestions.some((q, i) => q.marks !== questions[i]?.marks)) {
        onQuestionsChange(updatedQuestions);
      }
    }
  }, [theoryTotalMarks, questions.length]);

  const handleParse = useCallback(() => {
    if (!bulkText.trim()) {
      toast.error("Paste theory questions first");
      return;
    }
    setParseError(null);
    const result = onParse(bulkText);

    const itemsWithMarks = result.items.map(q => ({
      ...q,
      marks: calculatedTheoryMarksPerQuestion || q.marks || 10,
    }));

    if (result.warnings.length > 0) {
      result.warnings.forEach((w) => toast.warning(w, { duration: 5000 }));
    }
    if (itemsWithMarks.length === 0) {
      setParseError("No questions detected. Ensure questions start with numbers (1. 2. etc.)");
      return;
    }

    setParsedPreview(itemsWithMarks);
    setShowPreview(true);
    toast.success(`Detected ${itemsWithMarks.length} question(s) — review before importing`);
  }, [bulkText, onParse, calculatedTheoryMarksPerQuestion]);

  const handleImport = () => {
    const questionsWithMarks = parsedPreview.map(q => ({
      ...q,
      marks: calculatedTheoryMarksPerQuestion || q.marks || 10,
    }));
    onQuestionsChange([...questions, ...questionsWithMarks]);
    onBulkTextChange("");
    setParsedPreview([]);
    setShowPreview(false);
    toast.success(`✅ Added ${questionsWithMarks.length} theory questions`);
  };

  const handleFileParse = useCallback(
    async (file: File) => {
      setIsParsingFile(true);
      try {
        const text = await parseDocument(file);
        const result = onParse(text);
        const itemsWithMarks = result.items.map(q => ({
          ...q,
          marks: calculatedTheoryMarksPerQuestion || q.marks || 10,
        }));
        if (itemsWithMarks.length > 0) {
          setParsedPreview(itemsWithMarks);
          setShowPreview(true);
          toast.success(`${itemsWithMarks.length} questions found — review before importing`);
        } else {
          toast.warning("No questions found. Check the format.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "File parse failed";
        setParseError(msg);
      } finally {
        setIsParsingFile(false);
      }
    },
    [onParse, calculatedTheoryMarksPerQuestion]
  );

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    const url = await uploadImage(file);
    if (url) {
      setManualQ((p) => ({ ...p, image_url: url }));
      toast.success("Image uploaded");
    } else {
      toast.error("Image upload failed");
    }
    setIsUploadingImage(false);
  };

  const handleAddManual = () => {
    if (!manualQ.question.trim()) {
      toast.error("Enter question text");
      return;
    }
    const marks = calculatedTheoryMarksPerQuestion || manualQ.marks || 10;
    onQuestionsChange([
      ...questions,
      {
        id: crypto.randomUUID(),
        question: manualQ.question,
        marks: marks,
        image_url: manualQ.image_url || undefined,
        image_caption: manualQ.image_caption || undefined,
      },
    ]);
    setManualQ({ question: "", marks: 10, image_url: "", image_caption: "" });
    toast.success("Theory question added");
  };

  const downloadTemplate = () => {
    const blob = new Blob([THEORY_TEMPLATE], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "theory_template.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hasTheory) {
    return (
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full">
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/50 rounded-xl mx-auto flex items-center justify-center">
              <Brain className="h-8 w-8 text-purple-400 dark:text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700 dark:text-slate-200">Theory Disabled</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enable theory to add essay-type questions
              </p>
            </div>
            <Button
              onClick={() => onHasTheoryChange(true)}
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 h-9 text-sm text-white"
            >
              <Brain className="mr-1.5 h-3.5 w-3.5" />
              Enable Theory
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-3 sm:space-y-4">

        {/* Theory Total Input */}
        <div className={cn(
          "p-4 rounded-lg border transition-colors",
          isValidTheoryTotal 
            ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50" 
            : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50"
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Calculator className={cn(
                  "h-4 w-4",
                  isValidTheoryTotal 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-red-600 dark:text-red-400"
                )} />
                <Label className={cn(
                  "text-sm font-semibold",
                  isValidTheoryTotal 
                    ? "text-blue-700 dark:text-blue-300" 
                    : "text-red-700 dark:text-red-300"
                )}>
                  Theory Total Marks
                </Label>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enter the total marks for the theory section
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0"
                max={remainingForTheory}
                value={theoryTotalMarks}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onTheoryTotalMarksChange(Math.min(val, remainingForTheory));
                }}
                className={cn(
                  "w-24 text-center font-bold text-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700",
                  !isValidTheoryTotal && "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                )}
              />
              <span className={cn(
                "text-sm whitespace-nowrap",
                isValidTheoryTotal 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                / {remainingForTheory} max
              </span>
            </div>
          </div>
          
          {!isValidTheoryTotal && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              ⚠️ Theory total cannot exceed {remainingForTheory} marks (remaining after objective)
            </p>
          )}
          
          {questions.length > 0 && theoryTotalMarks > 0 && isValidTheoryTotal && (
            <div className="mt-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/50">
              <p className="text-xs text-gray-600 dark:text-slate-300">
                {questions.length} theory questions × {calculatedTheoryMarksPerQuestion.toFixed(2)} marks each
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { v: questions.length, l: "Questions", cls: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/50", tCls: "text-purple-700 dark:text-purple-300", sCls: "text-purple-600 dark:text-purple-400" },
            { v: theoryTotalMarks, l: "Theory Marks", cls: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50", tCls: "text-emerald-700 dark:text-emerald-300", sCls: "text-emerald-600 dark:text-emerald-400" },
            { v: remainingForTheory, l: "Available", cls: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50", tCls: "text-blue-700 dark:text-blue-300", sCls: "text-blue-600 dark:text-blue-400" },
            { v: calculatedTheoryMarksPerQuestion.toFixed(2), l: "Per Question", cls: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50", tCls: "text-amber-700 dark:text-amber-300", sCls: "text-amber-600 dark:text-amber-400" },
          ].map(({ v, l, cls, tCls, sCls }) => (
            <div key={l} className={cn("p-2 rounded-lg border text-center", cls)}>
              <p className={cn("text-lg font-bold", tCls)}>{v}</p>
              <p className={cn("text-[10px]", sCls)}>{l}</p>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {!isValidTheoryTotal && (
          <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300 text-xs">
              Theory total ({theoryTotalMarks}) exceeds available ({remainingForTheory}) marks.
              {objectiveTotal} objective + {theoryTotalMarks} theory = {objectiveTotal + theoryTotalMarks} 
              (must equal 60)
            </AlertDescription>
          </Alert>
        )}

        {markDistribution && !markDistribution.isBalanced && isValidTheoryTotal && (
          <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs">
              Total: {objectiveTotal} + {theoryTotalMarks} = {objectiveTotal + theoryTotalMarks} 
              {objectiveTotal + theoryTotalMarks !== 60 && " (must equal 60)"}
            </AlertDescription>
          </Alert>
        )}

        {/* Mode switcher */}
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
          {[
            { id: "smart",  label: "Smart Paste", Icon: Sparkles },
            { id: "manual", label: "Manual Add",  Icon: Plus },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id as "smart" | "manual")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all",
                mode === id
                  ? "bg-white dark:bg-slate-700 shadow-sm text-gray-800 dark:text-white"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Smart paste */}
        {mode === "smart" && (
          <div className="space-y-3">
            <div className={cn(
              "border rounded-lg p-2 flex items-center justify-between",
              isValidTheoryTotal 
                ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50" 
                : "bg-gray-50 dark:bg-slate-900/60 border-gray-200 dark:border-slate-800"
            )}>
              <div className="flex items-center gap-2">
                <Calculator className={cn(
                  "h-3.5 w-3.5",
                  isValidTheoryTotal 
                    ? "text-purple-600 dark:text-purple-400" 
                    : "text-gray-400 dark:text-slate-500"
                )} />
                <span className={cn(
                  "text-xs",
                  isValidTheoryTotal 
                    ? "text-purple-700 dark:text-purple-300" 
                    : "text-gray-500 dark:text-slate-400"
                )}>
                  Each theory question will be {calculatedTheoryMarksPerQuestion.toFixed(2)} marks
                </span>
              </div>
              <Badge className={cn(
                "text-[10px]",
                isValidTheoryTotal 
                  ? "bg-purple-200 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-0" 
                  : "bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-0"
              )}>
                {isValidTheoryTotal ? "Auto-calculated" : "⚠️ Adjust marks"}
              </Badge>
            </div>

            <BulkImporter
              value={bulkText}
              onChange={onBulkTextChange}
              onFileParse={handleFileParse}
              onParse={handleParse}
              isParsingFile={isParsingFile}
              parseError={showPreview ? null : parseError}
              placeholder={`1. Question text here...\n\na. Sub-question a\nb. Sub-question b\n\nMarks: ${calculatedTheoryMarksPerQuestion.toFixed(2)}`}
              accentColor="purple"
              onInsertExample={() => onBulkTextChange(THEORY_TEMPLATE)}
              onDownloadTemplate={downloadTemplate}
              parseButtonLabel="Smart Parse"
              parseButtonIcon={<Sparkles className="mr-1.5 h-3.5 w-3.5" />}
              textareaClassName="text-sm sm:text-base leading-relaxed font-mono"
              textareaRows={16}
              showMarkInfo={true}
              defaultMark={defaultMark}
              objectiveTotal={objectiveTotal}
              theoryTotal={theoryTotalMarks}
              isBalanced={objectiveTotal + theoryTotalMarks === 60}
            />

            {!showPreview && parseError && (
              <Alert variant="destructive" className="rounded-lg">
                <AlertCircle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs sm:text-sm">{parseError}</AlertDescription>
              </Alert>
            )}

            {showPreview && parsedPreview.length > 0 && (
              <div className="border-2 border-purple-200 dark:border-purple-900/50 rounded-lg overflow-hidden">
                <div className="bg-purple-50 dark:bg-purple-950/30 px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-xs sm:text-sm text-purple-800 dark:text-purple-300">
                      Preview — {parsedPreview.length} question(s)
                    </span>
                    <Badge className="bg-purple-200 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] border-0">
                      {calculatedTheoryMarksPerQuestion.toFixed(2)} marks each
                    </Badge>
                  </div>
                  <button
                    onClick={() => { setShowPreview(false); setParsedPreview([]); }}
                    className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-0.5 rounded"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedPreview.map((q, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-950 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-purple-100 dark:bg-purple-950/50 rounded flex items-center justify-center text-[10px] font-bold text-purple-700 dark:text-purple-300 flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          {renderContent(q.question)}
                          {q.sub_questions?.map((sq, si) => (
                            <p key={si} className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 ml-2">
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                {String.fromCharCode(97 + si)}.
                              </span>{" "}
                              {sq.text}
                            </p>
                          ))}
                          <Badge variant="outline" className="text-[10px] h-4 mt-1 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            {q.marks || calculatedTheoryMarksPerQuestion} marks
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 dark:bg-slate-900/60 px-3 py-2 flex gap-2 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    variant="outline"
                    onClick={() => { setShowPreview(false); setParsedPreview([]); }}
                    className="flex-1 h-9 text-xs sm:text-sm border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 h-9 text-xs sm:text-sm text-white"
                  >
                    Import {parsedPreview.length} Question(s)
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual */}
        {mode === "manual" && (
          <div className="space-y-3 p-3 sm:p-4 bg-gray-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
                Manual Theory Question
              </Label>
              <Badge className={cn(
                "text-[10px]",
                isValidTheoryTotal 
                  ? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-0" 
                  : "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-0"
              )}>
                {calculatedTheoryMarksPerQuestion.toFixed(2)} marks each
              </Badge>
            </div>

            <div>
              <Textarea
                value={manualQ.question}
                onChange={(e) => setManualQ((p) => ({ ...p, question: e.target.value }))}
                rows={8}
                className="mt-1 resize-y text-sm sm:text-base leading-relaxed font-mono min-h-[160px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Enter the full theory question here..."
              />
            </div>

            {/* Image upload */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900">
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                Diagram / Image (Optional)
              </Label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="theory-img"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f);
                }}
              />
              {manualQ.image_url ? (
                <div className="flex items-start gap-3">
                  <img
                    src={manualQ.image_url}
                    alt="diagram"
                    className="max-h-20 rounded border border-slate-200 dark:border-slate-700 object-contain"
                  />
                  <div className="flex-1 space-y-1.5">
                    <Input
                      placeholder="Image caption (optional)..."
                      value={manualQ.image_caption}
                      onChange={(e) => setManualQ((p) => ({ ...p, image_caption: e.target.value }))}
                      className="text-sm sm:text-base h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <button
                      onClick={() => setManualQ((p) => ({ ...p, image_url: "", image_caption: "" }))}
                      className="text-xs text-red-500 dark:text-red-400 hover:underline"
                    >
                      Remove image
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="theory-img"
                  className="cursor-pointer flex items-center gap-2 p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-colors"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600 dark:text-purple-400 shrink-0" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-gray-400 dark:text-slate-500 shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                    {isUploadingImage ? "Uploading..." : "Upload a diagram or figure"}
                  </span>
                </label>
              )}
            </div>

            <div>
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
                Marks (Auto-calculated)
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={calculatedTheoryMarksPerQuestion.toFixed(2)}
                  disabled
                  className={cn(
                    "h-10 text-sm sm:text-base w-32 border-slate-200 dark:border-slate-700",
                    isValidTheoryTotal 
                      ? "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400" 
                      : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                  )}
                />
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  Based on {theoryTotalMarks} total marks
                </span>
              </div>
            </div>

            <Button
              onClick={handleAddManual}
              disabled={!isValidTheoryTotal}
              className={cn(
                "w-full h-10 text-sm sm:text-base text-white",
                isValidTheoryTotal
                  ? "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500"
                  : "bg-gray-400 dark:bg-gray-700 cursor-not-allowed"
              )}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Theory Question
            </Button>
          </div>
        )}

        {/* Question list */}
        {questions.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase">
                Theory Questions ({questions.length})
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onQuestionsChange([])}
                className="text-red-500 dark:text-red-400 text-[10px] h-6 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Clear All
              </Button>
            </div>
            <div className="max-h-[200px] sm:max-h-[300px] lg:max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
              {questions.map((q, i) => (
                <TheoryCard
                  key={q.id}
                  question={q}
                  index={i}
                  onDelete={(id) => onQuestionsChange(questions.filter((x) => x.id !== id))}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}