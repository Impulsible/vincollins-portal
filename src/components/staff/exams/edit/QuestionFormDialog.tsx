// src/components/staff/exams/edit/QuestionFormDialog.tsx - WITH TABLE PASTE, DIAGRAM UPLOADER & DARK MODE
"use client";

import {
  useState,
  useEffect,
  useRef,
  ClipboardEvent,
  Dispatch,
  SetStateAction,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  X,
  Plus,
  AlertCircle,
  CheckCircle2,
  Save,
  FileCheck,
  Image as ImageIcon,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Table as TableIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { QuestionContent } from "@/components/shared/QuestionContent";
import { createClient } from "@/lib/supabase/client";
import type { Question } from "./types";

interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<Question>;
  onSave: (data: Partial<Question>) => void;
  onCancel?: () => void;
  defaultMark?: number;
}

export function QuestionFormDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  onCancel,
  defaultMark = 0.5,
}: QuestionFormDialogProps) {
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [points, setPoints] = useState<number>(defaultMark);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageCaption, setImageCaption] = useState<string>("");
  const [isDraft, setIsDraft] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const draftStatus =
        initialData?.is_draft !== undefined ? initialData.is_draft : true;
      const markValue =
        initialData?.points !== undefined ? initialData.points : defaultMark;
      setQuestionText(initialData?.question_text || "");
      setOptions(
        initialData?.options && initialData.options.length > 0
          ? initialData.options
          : ["", "", "", ""],
      );
      setCorrectAnswer(initialData?.correct_answer || "");
      setImageUrl(initialData?.image_url || "");
      setImageCaption(initialData?.image_caption || "");
      setPoints(markValue);
      setIsDraft(draftStatus);
      setShowPreview(false);
    }
  }, [open, initialData, defaultMark]);

  const isQuestionComplete = (): boolean => {
    const validOptions = options.filter((opt) => opt.trim() !== "");
    return (
      questionText.trim() !== "" &&
      validOptions.length >= 2 &&
      correctAnswer.trim() !== "" &&
      validOptions.includes(correctAnswer)
    );
  };

  const getValidOptions = (): string[] =>
    options.filter((opt) => opt.trim() !== "");

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    if (correctAnswer === options[index] && value.trim() === "") {
      setCorrectAnswer("");
    }
  };

  const handleAddOption = () => {
    if (options.length >= 6) return toast.error("Maximum 6 options allowed");
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    const validOptions = getValidOptions();
    if (validOptions.length <= 2)
      return toast.error("Minimum 2 options required");
    const removedOption = options[index];
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    if (correctAnswer === removedOption) {
      setCorrectAnswer("");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP, SVG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const fileName = `questions/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;

      const { data, error } = await supabase.storage
        .from("exam-assets")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (error) {
        // Fallback to Base64 data URL if storage bucket fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageUrl(reader.result as string);
          toast.success("Diagram attached (local format)");
          setIsUploadingImage(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("exam-assets")
        .getPublicUrl(data.path);

      setImageUrl(publicUrlData.publicUrl);
      toast.success("Diagram uploaded successfully");
    } catch (err) {
      console.error("Image upload failed, falling back to base64:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        toast.success("Diagram attached");
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImageCaption("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (saveAsDraft: boolean = false) => {
    if (!questionText.trim())
      return toast.error("Please enter a question text");

    const validOptions = getValidOptions();
    if (saveAsDraft) {
      const data: Partial<Question> = {
        question_text: questionText.trim(),
        options: validOptions.length > 0 ? validOptions : ["", "", "", ""],
        correct_answer: correctAnswer || "",
        points: points || defaultMark,
        image_url: imageUrl || null,
        image_caption: imageCaption || null,
        is_draft: true,
      };
      setIsSubmitting(true);
      onSave(data);
      setTimeout(() => setIsSubmitting(false), 500);
      return;
    }

    if (validOptions.length < 2)
      return toast.error("Please enter at least 2 options");
    if (!correctAnswer) return toast.error("Please select the correct answer");
    if (!validOptions.includes(correctAnswer))
      return toast.error("Correct answer must match one of the options");

    const data: Partial<Question> = {
      question_text: questionText.trim(),
      options: validOptions,
      correct_answer: correctAnswer,
      points: points || defaultMark,
      image_url: imageUrl || null,
      image_caption: imageCaption || null,
      is_draft: false,
    };
    setIsSubmitting(true);
    onSave(data);
    setTimeout(() => setIsSubmitting(false), 500);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      if (onCancel) onCancel();
    }
  };

  const complete = isQuestionComplete();
  const validOptions = getValidOptions();
  const isEditing = !!initialData?.id;

  function handleTablePaste(
    e: ClipboardEvent<HTMLTextAreaElement>,
    setQuestionText: Dispatch<SetStateAction<string>>,
  ): void {
    throw new Error("Function not implemented.");
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-lg">
              {isEditing ? "Edit Objective Question" : "Add Objective Question"}
              {isDraft && !complete && (
                <Badge
                  variant="outline"
                  className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                >
                  Draft
                </Badge>
              )}
              {complete && !isDraft && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                  Complete
                </Badge>
              )}
              {!isEditing && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 text-[10px]">
                  {defaultMark} mark each
                </Badge>
              )}
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs gap-1.5 h-8"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Edit Mode
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-blue-500" /> Live Preview
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {!complete && (
            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs sm:text-sm whitespace-pre-line">
                {!questionText.trim() && "• Question text is required\n"}
                {validOptions.length < 2 &&
                  "• At least 2 options are required\n"}
                {!correctAnswer && "• Please select the correct answer"}
              </AlertDescription>
            </Alert>
          )}

          {complete && (
            <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              <AlertDescription className="text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm flex items-center gap-2">
                <FileCheck className="h-4 w-4" /> Question is complete and ready
                for CBT.
              </AlertDescription>
            </Alert>
          )}

          {/* LIVE PREVIEW CARD */}
          {showPreview ? (
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-blue-100 dark:border-blue-900/40">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Question Preview
                </span>
                <Badge variant="secondary" className="text-xs">
                  {points} Marks
                </Badge>
              </div>

              <QuestionContent
                text={questionText || "_No question text provided yet_"}
                imageUrl={imageUrl}
                imageCaption={imageCaption}
              />

              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Options:
                </span>
                {validOptions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {validOptions.map((opt, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-2.5 rounded-lg border text-sm flex items-center justify-between",
                          opt === correctAnswer
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {opt === correctAnswer && (
                          <Badge className="bg-emerald-600 text-white text-[10px] h-5">
                            Correct
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-400">
                    No options configured yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* QUESTION TEXT WITH TABLE PASTE */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label
                    htmlFor="question-text"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    Question Text <span className="text-red-500">*</span>
                  </Label>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <TableIcon className="h-3 w-3 text-blue-500" />
                    Auto-formats tables from Excel/Word
                  </span>
                </div>
                <Textarea
                  id="question-text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  onPaste={(e) => handleTablePaste(e, setQuestionText)}
                  placeholder="Enter your question here... (Paste tables from Excel, Word, or ChatGPT directly)"
                  className="min-h-[90px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-sans"
                  disabled={isSubmitting}
                />
              </div>

              {/* DIAGRAM / IMAGE ATTACHMENT */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-indigo-500" />
                    Attach Diagram / Image (Optional)
                  </Label>
                  {imageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remove Diagram
                    </Button>
                  )}
                </div>

                {imageUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-center max-w-sm mx-auto">
                      <img
                        src={imageUrl}
                        alt="Question diagram"
                        className="max-h-36 mx-auto object-contain rounded"
                      />
                    </div>
                    <Input
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      placeholder="Add an optional diagram caption or label..."
                      className="text-xs h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="diag-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingImage || isSubmitting}
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                      )}
                      {isUploadingImage ? "Uploading..." : "Upload Image"}
                    </Button>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      Supports JPG, PNG, WebP & SVG
                    </span>
                  </div>
                )}
              </div>

              {/* OPTIONS BUILDER */}
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Options <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-2">
                    ({validOptions.length} of minimum 2)
                  </span>
                </Label>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                  Enter options. Mark the correct answer in the section below.
                </p>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-9 rounded-md text-sm font-semibold shrink-0 transition-colors",
                          opt.trim() && correctAnswer === opt
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50"
                            : opt.trim()
                              ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              : "bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-600",
                        )}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <Input
                        value={opt}
                        onChange={(e) =>
                          handleOptionChange(idx, e.target.value)
                        }
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className={cn(
                          "flex-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white",
                          correctAnswer === opt &&
                            opt.trim() &&
                            "border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20",
                        )}
                        disabled={isSubmitting}
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(idx)}
                          className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {opt.trim() && correctAnswer === opt && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 whitespace-nowrap">
                          ✓ Correct
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="mt-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    disabled={isSubmitting}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Option
                  </Button>
                )}
              </div>

              {/* CORRECT ANSWER SELECTION */}
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Correct Answer{" "}
                  {validOptions.length >= 2 && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                {validOptions.length >= 2 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                    {validOptions.map((opt) => {
                      const idx = options.indexOf(opt);
                      const isSelected = correctAnswer === opt;
                      return (
                        <Button
                          key={idx}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => setCorrectAnswer(opt)}
                          className={cn(
                            "truncate justify-start text-xs sm:text-sm h-9",
                            isSelected
                              ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white border-transparent font-semibold shadow-sm"
                              : "border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800/50 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300",
                            isSubmitting && "opacity-50 cursor-not-allowed",
                          )}
                          disabled={isSubmitting}
                        >
                          <span className="font-bold mr-1.5">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <span className="truncate">
                            {opt.length > 20
                              ? opt.substring(0, 20) + "..."
                              : opt}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 dark:text-amber-500 mt-1.5">
                    Please add at least 2 options to select the correct answer.
                  </p>
                )}
                {correctAnswer && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-2 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Selected Answer:{" "}
                    <span className="underline">{correctAnswer}</span>
                  </p>
                )}
              </div>

              {/* POINTS / MARKS */}
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Points for this Question
                </Label>
                <div className="flex items-center gap-4 mt-1.5">
                  <Input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(parseFloat(e.target.value) || 0)}
                    min={0.25}
                    step={0.25}
                    className="w-32 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Default: {defaultMark} mark
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 flex-wrap pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={!questionText.trim() || isSubmitting}
            className="gap-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Save className="h-4 w-4" />
            {isEditing ? "Save Changes as Draft" : "Save as Draft"}
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white gap-2 font-medium shadow-sm"
            disabled={!complete || isSubmitting}
          >
            <FileCheck className="h-4 w-4" />
            {isEditing ? "Update Complete" : "Add Complete Question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
