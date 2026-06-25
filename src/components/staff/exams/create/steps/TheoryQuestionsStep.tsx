// src/components/staff/exams/create/steps/TheoryQuestionsStep.tsx

"use client";

import { useState, useCallback } from "react";
import {
  Plus, Brain, Layers, Sparkles, Loader2, ImageIcon, X,
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
    <div className="whitespace-pre-wrap leading-relaxed text-xs">
      {text.split("\n").map((line, i) => {
        if (line.match(/^\d+\./)) return <p key={i} className="mb-1 font-semibold text-blue-700">{line}</p>;
        if (line.match(/^[a-z]\./i)) return <p key={i} className="mb-1 ml-4 text-gray-700">{line}</p>;
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
    return supabase.storage.from("exam-assets").getPublicUrl(filePath).data
      .publicUrl;
  } catch {
    return null;
  }
};

interface TheoryQuestionsStepProps {
  questions: TheoryQuestion[];
  onQuestionsChange: (q: TheoryQuestion[]) => void;
  hasTheory: boolean;
  onHasTheoryChange: (v: boolean) => void;
  theoryMax: number;
  bulkText: string;
  onBulkTextChange: (v: string) => void;
  onParse: (text: string) => ParseResult<TheoryQuestion>;
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

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  const handleParse = useCallback(() => {
    if (!bulkText.trim()) {
      toast.error("Paste theory questions first");
      return;
    }
    setParseError(null);
    const result = onParse(bulkText);

    if (result.warnings.length > 0) {
      result.warnings.forEach((w) => toast.warning(w, { duration: 5000 }));
    }
    if (result.items.length === 0) {
      setParseError(
        "No questions detected. Ensure questions start with numbers (1. 2. etc.)"
      );
      return;
    }

    setParsedPreview(result.items);
    setShowPreview(true);
    toast.success(`Detected ${result.items.length} question(s) — review before importing`);
  }, [bulkText, onParse]);

  const handleImport = () => {
    onQuestionsChange([...questions, ...parsedPreview]);
    onBulkTextChange("");
    setParsedPreview([]);
    setShowPreview(false);
    toast.success(`✅ Added ${parsedPreview.length} theory questions`);
  };

  const handleFileParse = useCallback(
    async (file: File) => {
      setIsParsingFile(true);
      try {
        const text = await parseDocument(file);
        const result = onParse(text);
        if (result.items.length > 0) {
          setParsedPreview(result.items);
          setShowPreview(true);
          toast.success(`${result.items.length} questions found — review before importing`);
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
    [onParse]
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
    onQuestionsChange([
      ...questions,
      {
        id: crypto.randomUUID(),
        question: manualQ.question,
        marks: manualQ.marks,
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
              className="bg-purple-600 hover:bg-purple-700 h-9 text-xs"
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
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-3 sm:space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: questions.length, l: "Questions", c: "purple" },
            { v: totalMarks, l: "Marks", c: "emerald" },
            { v: theoryMax, l: "Max", c: "blue" },
          ].map(({ v, l, c }) => (
            <div key={l} className={cn("p-2 rounded-lg border text-center", `bg-${c}-50 border-${c}-100`)}>
              <p className={cn("text-lg font-bold", `text-${c}-700`)}>{v}</p>
              <p className={cn("text-[10px]", `text-${c}-600`)}>{l}</p>
            </div>
          ))}
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {[
            { id: "smart", label: "Smart Paste", Icon: Sparkles },
            { id: "manual", label: "Manual Add", Icon: Plus },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id as "smart" | "manual")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium",
                mode === id ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Smart Paste */}
        {mode === "smart" && (
          <div className="space-y-3">
            <BulkImporter
              value={bulkText}
              onChange={onBulkTextChange}
              onFileParse={handleFileParse}
              onParse={handleParse}
              isParsingFile={isParsingFile}
              parseError={showPreview ? null : parseError}
              placeholder={`1. Question...\n\na. Sub-question a\nb. Sub-question b\n\n10 marks`}
              rows={10}
              accentColor="purple"
              onInsertExample={() => onBulkTextChange(THEORY_TEMPLATE)}
              onDownloadTemplate={downloadTemplate}
              parseButtonLabel="Smart Parse"
              parseButtonIcon={<Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            />

            {!showPreview && parseError && (
              <Alert variant="destructive" className="rounded-lg">
                <AlertCircle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs">{parseError}</AlertDescription>
              </Alert>
            )}

            {/* Preview */}
            {showPreview && parsedPreview.length > 0 && (
              <div className="border-2 border-purple-200 rounded-lg overflow-hidden">
                <div className="bg-purple-50 px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-purple-600" />
                    <span className="font-semibold text-xs text-purple-800">
                      Preview — {parsedPreview.length} question(s)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowPreview(false);
                      setParsedPreview([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="max-h-[300px] overflow-y-auto divide-y">
                  {parsedPreview.map((q, idx) => (
                    <div key={idx} className="p-3 bg-white hover:bg-gray-50">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center text-[10px] font-bold text-purple-700 flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          {renderContent(q.question)}
                          {q.sub_questions?.map((sq, si) => (
                            <p key={si} className="text-[10px] text-gray-600 ml-2 mt-0.5">
                              <span className="font-semibold text-purple-600">
                                {String.fromCharCode(97 + si)}.
                              </span>{" "}
                              {sq.text}
                            </p>
                          ))}
                          <Badge variant="outline" className="text-[10px] h-4 mt-1.5">
                            {q.marks} marks
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
                    className="flex-1 h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                  >
                    Import {parsedPreview.length} Question(s)
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Add */}
        {mode === "manual" && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
            <div>
              <Label className="text-[10px] font-semibold text-gray-600 uppercase">
                Question
              </Label>
              <Textarea
                value={manualQ.question}
                onChange={(e) =>
                  setManualQ((p) => ({ ...p, question: e.target.value }))
                }
                rows={5}
                className="mt-1 resize-none text-xs"
                placeholder="Enter the full theory question here..."
              />
            </div>

            {/* Image Upload */}
            <div className="border rounded-lg p-2">
              <Label className="text-[10px] font-semibold text-gray-600 uppercase mb-1 block">
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
                <div className="flex items-start gap-2">
                  <img
                    src={manualQ.image_url}
                    alt="diagram"
                    className="max-h-16 rounded border object-contain"
                  />
                  <div className="flex-1">
                    <Input
                      placeholder="Image caption..."
                      value={manualQ.image_caption}
                      onChange={(e) =>
                        setManualQ((p) => ({
                          ...p,
                          image_caption: e.target.value,
                        }))
                      }
                      className="text-xs h-7"
                    />
                    <button
                      onClick={() =>
                        setManualQ((p) => ({
                          ...p,
                          image_url: "",
                          image_caption: "",
                        }))
                      }
                      className="text-[10px] text-red-500 mt-1 hover:underline"
                    >
                      Remove image
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="theory-img"
                  className="cursor-pointer flex items-center gap-2 p-2 border border-dashed rounded hover:border-purple-400 transition-colors"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5 text-gray-400" />
                  )}
                  <span className="text-[10px] text-gray-500">
                    {isUploadingImage ? "Uploading..." : "Upload diagram or figure"}
                  </span>
                </label>
              )}
            </div>

            <div>
              <Label className="text-[10px] font-semibold text-gray-600 uppercase">
                Marks
              </Label>
              <Input
                type="number"
                min={1}
                value={manualQ.marks}
                onChange={(e) =>
                  setManualQ((p) => ({
                    ...p,
                    marks: parseInt(e.target.value) || 10,
                  }))
                }
                className="mt-1 h-8 text-xs"
              />
            </div>

            <Button
              onClick={handleAddManual}
              className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-xs"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Theory Question
            </Button>
          </div>
        )}

        {/* Question List */}
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