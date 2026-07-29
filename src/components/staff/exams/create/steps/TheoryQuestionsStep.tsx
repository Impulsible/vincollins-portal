// src/components/staff/exams/create/steps/TheoryQuestionsStep.tsx - COMPLETE UPDATE WITH MANUAL THEORY TOTAL

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
            <p key={i} className="mb-1 font-semibold text-blue-700">
              {line}
            </p>
          );
        if (line.match(/^[a-z]\./i))
          return (
            <p key={i} className="mb-1 ml-4 text-gray-700">
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

// ✅ Mark distribution interface
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
  // ✅ NEW PROPS
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

  // ✅ Calculate remaining marks for theory
  const remainingForTheory = useMemo(() => {
    return Math.max(0, 60 - objectiveTotal);
  }, [objectiveTotal]);

  // ✅ Calculate marks per theory question
  const calculatedTheoryMarksPerQuestion = useMemo(() => {
    const count = questions.length || 1;
    return theoryTotalMarks / count;
  }, [theoryTotalMarks, questions.length]);

  // ✅ Check if theory total is valid
  const isValidTheoryTotal = theoryTotalMarks <= remainingForTheory;

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
  const isBalanced = markDistribution?.isBalanced ?? (totalMarks + objectiveTotal === 60);

  // ✅ Auto-update questions when theory total changes
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
      setParseError(
        "No questions detected. Ensure questions start with numbers (1. 2. etc.)"
      );
      return;
    }

    setParsedPreview(itemsWithMarks);
    setShowPreview(true);
    toast.success(
      `Detected ${itemsWithMarks.length} question(s) — review before importing`
    );
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
          toast.success(
            `${itemsWithMarks.length} questions found — review before importing`
          );
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

  // ── Theory disabled screen ────────────────────────────────────────────────
  if (!hasTheory) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full">
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-purple-100 rounded-xl mx-auto flex items-center justify-center">
              <Brain className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">Theory Disabled</p>
              <p className="text-xs text-muted-foreground mt-1">
                Enable theory to add essay-type questions
              </p>
            </div>
            <Button
              onClick={() => onHasTheoryChange(true)}
              className="bg-purple-600 hover:bg-purple-700 h-9 text-sm"
            >
              <Brain className="mr-1.5 h-3.5 w-3.5" />
              Enable Theory
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-3 sm:space-y-4">

        {/* ── THEORY TOTAL MARKS INPUT ── */}
        <div className={cn(
          "p-4 rounded-lg border",
          isValidTheoryTotal 
            ? "bg-blue-50 border-blue-200" 
            : "bg-red-50 border-red-200"
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Calculator className={cn(
                  "h-4 w-4",
                  isValidTheoryTotal ? "text-blue-600" : "text-red-600"
                )} />
                <Label className={cn(
                  "text-sm font-semibold",
                  isValidTheoryTotal ? "text-blue-700" : "text-red-700"
                )}>
                  Theory Total Marks
                </Label>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
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
                  "w-24 text-center font-bold text-lg",
                  !isValidTheoryTotal && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              <span className={cn(
                "text-sm whitespace-nowrap",
                isValidTheoryTotal ? "text-blue-600" : "text-red-600"
              )}>
                / {remainingForTheory} max
              </span>
            </div>
          </div>
          
          {!isValidTheoryTotal && (
            <p className="text-xs text-red-600 mt-2">
              ⚠️ Theory total cannot exceed {remainingForTheory} marks (remaining after objective)
            </p>
          )}
          
          {questions.length > 0 && theoryTotalMarks > 0 && isValidTheoryTotal && (
            <div className="mt-3 p-2 bg-white rounded-lg border border-blue-100">
              <p className="text-xs text-gray-600">
                {questions.length} theory questions × {calculatedTheoryMarksPerQuestion.toFixed(2)} marks each
              </p>
            </div>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { v: questions.length, l: "Questions", c: "purple" },
            { v: theoryTotalMarks, l: "Theory Marks", c: "emerald" },
            { v: remainingForTheory, l: "Available", c: "blue" },
            { v: calculatedTheoryMarksPerQuestion.toFixed(2), l: "Per Question", c: "amber" },
          ].map(({ v, l, c }) => (
            <div
              key={l}
              className={cn(
                "p-2 rounded-lg border text-center",
                `bg-${c}-50 border-${c}-100`
              )}
            >
              <p className={cn("text-lg font-bold", `text-${c}-700`)}>{v}</p>
              <p className={cn("text-[10px]", `text-${c}-600`)}>{l}</p>
            </div>
          ))}
        </div>

        {/* ── Mark Distribution Warning ── */}
        {!isValidTheoryTotal && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 text-xs">
              Theory total ({theoryTotalMarks}) exceeds available ({remainingForTheory}) marks.
              {objectiveTotal} objective + {theoryTotalMarks} theory = {objectiveTotal + theoryTotalMarks} 
              (must equal 60)
            </AlertDescription>
          </Alert>
        )}

        {markDistribution && !markDistribution.isBalanced && isValidTheoryTotal && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 text-xs">
              Total: {objectiveTotal} + {theoryTotalMarks} = {objectiveTotal + theoryTotalMarks} 
              {objectiveTotal + theoryTotalMarks !== 60 && " (must equal 60)"}
            </AlertDescription>
          </Alert>
        )}

        {/* ── Mode switcher ── */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
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
                  ? "bg-white shadow-sm text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* ══ SMART PASTE ══════════════════════════════════════════════════════ */}
        {mode === "smart" && (
          <div className="space-y-3">
            <div className={cn(
              "border rounded-lg p-2 flex items-center justify-between",
              isValidTheoryTotal ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-200"
            )}>
              <div className="flex items-center gap-2">
                <Calculator className={cn(
                  "h-3.5 w-3.5",
                  isValidTheoryTotal ? "text-purple-600" : "text-gray-400"
                )} />
                <span className={cn(
                  "text-xs",
                  isValidTheoryTotal ? "text-purple-700" : "text-gray-500"
                )}>
                  Each theory question will be {calculatedTheoryMarksPerQuestion.toFixed(2)} marks
                </span>
              </div>
              <Badge className={cn(
                "text-[10px]",
                isValidTheoryTotal ? "bg-purple-200 text-purple-700" : "bg-gray-200 text-gray-500"
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
              placeholder={
                `1. Question text here...\n\na. Sub-question a\nb. Sub-question b\n\nMarks: ${calculatedTheoryMarksPerQuestion.toFixed(2)}`
              }
              accentColor="purple"
              onInsertExample={() => onBulkTextChange(THEORY_TEMPLATE)}
              onDownloadTemplate={downloadTemplate}
              parseButtonLabel="Smart Parse"
              parseButtonIcon={<Sparkles className="mr-1.5 h-3.5 w-3.5" />}
              textareaClassName="text-sm sm:text-base leading-relaxed font-mono"
              textareaRows={16}
              // ✅ Pass mark info
              showMarkInfo={true}
              defaultMark={defaultMark}
              objectiveTotal={objectiveTotal}
              theoryTotal={theoryTotalMarks}
              isBalanced={objectiveTotal + theoryTotalMarks === 60}
            />

            {!showPreview && parseError && (
              <Alert variant="destructive" className="rounded-lg">
                <AlertCircle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs sm:text-sm">
                  {parseError}
                </AlertDescription>
              </Alert>
            )}

            {/* ── Preview panel ── */}
            {showPreview && parsedPreview.length > 0 && (
              <div className="border-2 border-purple-200 rounded-lg overflow-hidden">
                <div className="bg-purple-50 px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-purple-600" />
                    <span className="font-semibold text-xs sm:text-sm text-purple-800">
                      Preview — {parsedPreview.length} question(s)
                    </span>
                    <Badge className="bg-purple-200 text-purple-700 text-[10px]">
                      {calculatedTheoryMarksPerQuestion.toFixed(2)} marks each
                    </Badge>
                  </div>
                  <button
                    onClick={() => {
                      setShowPreview(false);
                      setParsedPreview([]);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="max-h-[320px] overflow-y-auto divide-y">
                  {parsedPreview.map((q, idx) => (
                    <div key={idx} className="p-3 bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center text-[10px] font-bold text-purple-700 flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          {renderContent(q.question)}
                          {q.sub_questions?.map((sq, si) => (
                            <p
                              key={si}
                              className="text-xs sm:text-sm text-gray-600 ml-2"
                            >
                              <span className="font-semibold text-purple-600">
                                {String.fromCharCode(97 + si)}.
                              </span>{" "}
                              {sq.text}
                            </p>
                          ))}
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 mt-1"
                          >
                            {q.marks || calculatedTheoryMarksPerQuestion} marks
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 px-3 py-2 flex gap-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPreview(false);
                      setParsedPreview([]);
                    }}
                    className="flex-1 h-9 text-xs sm:text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-9 text-xs sm:text-sm"
                  >
                    Import {parsedPreview.length} Question(s)
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ MANUAL ADD ═══════════════════════════════════════════════════════ */}
        {mode === "manual" && (
          <div className="space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                Manual Theory Question
              </Label>
              <Badge className={cn(
                "text-[10px]",
                isValidTheoryTotal ? "bg-purple-100 text-purple-700" : "bg-red-100 text-red-700"
              )}>
                {calculatedTheoryMarksPerQuestion.toFixed(2)} marks each
              </Badge>
            </div>

            <div>
              <Textarea
                value={manualQ.question}
                onChange={(e) =>
                  setManualQ((p) => ({ ...p, question: e.target.value }))
                }
                rows={8}
                className="mt-1 resize-y text-sm sm:text-base leading-relaxed font-mono min-h-[160px]"
                placeholder="Enter the full theory question here...

e.g.
1. Describe the structure of the human heart.

   a. Name the four chambers
   b. Explain the role of valves"
              />
            </div>

            {/* Image upload */}
            <div className="border rounded-lg p-3 bg-white">
              <Label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
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
                    className="max-h-20 rounded border object-contain"
                  />
                  <div className="flex-1 space-y-1.5">
                    <Input
                      placeholder="Image caption (optional)..."
                      value={manualQ.image_caption}
                      onChange={(e) =>
                        setManualQ((p) => ({
                          ...p,
                          image_caption: e.target.value,
                        }))
                      }
                      className="text-sm sm:text-base h-9"
                    />
                    <button
                      onClick={() =>
                        setManualQ((p) => ({
                          ...p,
                          image_url: "",
                          image_caption: "",
                        }))
                      }
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove image
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="theory-img"
                  className="cursor-pointer flex items-center gap-2 p-3 border border-dashed rounded-lg hover:border-purple-400 hover:bg-purple-50/30 transition-colors"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600 shrink-0" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-gray-400 shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm text-gray-500">
                    {isUploadingImage
                      ? "Uploading..."
                      : "Upload a diagram or figure"}
                  </span>
                </label>
              )}
            </div>

            {/* Marks input - Auto-calculated */}
            <div>
              <Label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                Marks (Auto-calculated)
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={calculatedTheoryMarksPerQuestion.toFixed(2)}
                  disabled
                  className={cn(
                    "h-10 text-sm sm:text-base w-32",
                    isValidTheoryTotal ? "bg-gray-100 text-gray-600" : "bg-red-50 text-red-600"
                  )}
                />
                <span className="text-xs text-gray-400">
                  Based on {theoryTotalMarks} total marks
                </span>
              </div>
            </div>

            <Button
              onClick={handleAddManual}
              disabled={!isValidTheoryTotal}
              className={cn(
                "w-full h-10 text-sm sm:text-base",
                isValidTheoryTotal
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-gray-400 cursor-not-allowed"
              )}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Theory Question
            </Button>
          </div>
        )}

        {/* ── Question list ── */}
        {questions.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-semibold text-gray-600 uppercase">
                Theory Questions ({questions.length})
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onQuestionsChange([])}
                className="text-red-500 text-[10px] h-6"
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
                  onDelete={(id) =>
                    onQuestionsChange(questions.filter((x) => x.id !== id))
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}