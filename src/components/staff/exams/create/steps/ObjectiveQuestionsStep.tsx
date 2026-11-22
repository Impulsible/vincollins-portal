// src/components/staff/exams/create/steps/ObjectiveQuestionsStep.tsx
'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  Plus,
  CheckCheck,
  Sparkles,
  BookOpen,
  Calculator,
  Target,
  TrendingUp,
  AlertCircle,
  Zap,
  ImageIcon,
  X,
  Loader2,
  Trash2,
  Eye,
  ShieldAlert,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { clipboardToMarkdown } from '@/lib/table-paste';
import { QuestionContent, hasTable } from '@/components/shared/QuestionContent';
import { hasRelativeOptions } from '@/app/student/exams/constants';
import { BulkImporter } from '../components/BulkImporter';
import { ObjectiveCard } from '../components/QuestionCard';
import {
  parseObjectiveText,
  parseDocument,
  type ParsedQuestion,
} from '@/hooks/useQuestionParser';
import { OBJECTIVE_TEMPLATE } from '../constants';
import type { Question, ParseResult } from '../types';

/* ─── Helpers ─── */

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const uploadImage = async (
  file: File
): Promise<{ url: string; isFallback: boolean }> => {
  try {
    const ext = file.name.split('.').pop() || 'png';
    const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
    const filePath = `exam-images/temp/${Date.now()}-${crypto.randomUUID()}.${cleanExt}`;

    const { error } = await supabase.storage
      .from('exam-assets')
      .upload(filePath, file, {
        contentType: file.type || 'image/png',
        upsert: true,
      });

    if (error) {
      console.warn(
        'Storage upload failed, using Base64 fallback:',
        error.message
      );
      const base64 = await fileToBase64(file);
      return { url: base64, isFallback: true };
    }

    const { data } = supabase.storage
      .from('exam-assets')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      const base64 = await fileToBase64(file);
      return { url: base64, isFallback: true };
    }

    return { url: data.publicUrl, isFallback: false };
  } catch (err) {
    console.warn('Storage exception, using Base64 fallback:', err);
    const base64 = await fileToBase64(file);
    return { url: base64, isFallback: true };
  }
};

const EXAM_TOTAL = 60;
const MARK_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 5] as const;

/* ─── Types ─── */

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

interface ObjectiveQuestionsStepProps {
  questions: Question[];
  onQuestionsChange: (q: Question[]) => void;
  objectiveMax: number;
  defaultMark: number;
  bulkText: string;
  onBulkTextChange: (v: string) => void;
  onParse?: (text: string) => ParseResult<Question>;
  passageText: string;
  onPassageTextChange: (v: string) => void;
  hasPassage: boolean;
  onHasPassageChange: (v: boolean) => void;
  markDistribution?: MarkDistribution;
  onDefaultMarkChange?: (mark: number) => void;
}

/* ─── Main Component ─── */

export function ObjectiveQuestionsStep({
  questions,
  onQuestionsChange,
  defaultMark,
  bulkText,
  onBulkTextChange,
  passageText,
  onPassageTextChange,
  hasPassage,
  onHasPassageChange,
  markDistribution,
  onDefaultMarkChange,
}: ObjectiveQuestionsStepProps) {
  const [mode, setMode] = useState<'bulk' | 'manual'>('bulk');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [manualQ, setManualQ] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    image_url: '',
    image_caption: '',
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── Derived Scoring State ── */

  const objectiveTotal = useMemo(
    () => questions.reduce((s, q) => s + (Number(q.marks) || defaultMark), 0),
    [questions, defaultMark]
  );

  const theoryTotal = markDistribution?.theoryTotal ?? 0;
  const grandTotal = objectiveTotal + theoryTotal;
  const remaining = Math.max(0, EXAM_TOTAL - grandTotal);
  const isOver = grandTotal > EXAM_TOTAL;
  const isBalanced = grandTotal === EXAM_TOTAL;

  const roomForMoreQuestions = useMemo(() => {
    if (defaultMark <= 0) return 0;
    return Math.floor(remaining / defaultMark);
  }, [remaining, defaultMark]);

  const objectivePercent = Math.min((objectiveTotal / EXAM_TOTAL) * 100, 100);
  const theoryPercent = Math.min((theoryTotal / EXAM_TOTAL) * 100, 100);

  const manualHasRelative = useMemo(
    () => hasRelativeOptions(manualQ.options),
    [manualQ.options]
  );

  /* ── Handlers ── */

  const handleMarkUpdate = useCallback(
    (newMark: number) => {
      if (onDefaultMarkChange) onDefaultMarkChange(newMark);
      onQuestionsChange(questions.map((q) => ({ ...q, marks: newMark })));
      toast.success(`Objective mark updated to ${newMark} per question`);
    },
    [onDefaultMarkChange, onQuestionsChange, questions]
  );

  const handleAutoBalanceMarks = useCallback(() => {
    if (questions.length === 0) return;
    const targetObj = Math.max(0, EXAM_TOTAL - theoryTotal);
    const calculatedMark = Number((targetObj / questions.length).toFixed(2));
    if (calculatedMark <= 0) return;

    if (onDefaultMarkChange) onDefaultMarkChange(calculatedMark);
    onQuestionsChange(questions.map((q) => ({ ...q, marks: calculatedMark })));
    toast.success(
      `Balanced ${questions.length} questions to ${calculatedMark} marks each (${targetObj} total)`
    );
  }, [questions, theoryTotal, onDefaultMarkChange, onQuestionsChange]);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    setIsUploadingImage(true);
    try {
      const { url, isFallback } = await uploadImage(file);
      setManualQ((p) => ({ ...p, image_url: url }));
      if (isFallback) {
        toast.info('Diagram attached locally');
      } else {
        toast.success('Diagram attached successfully');
      }
    } catch {
      toast.error('Failed to attach diagram');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleQuestionPaste = async (
    e: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    // 1. Direct Screenshot/Image Paste Detection
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        await handleImageFile(file);
        return;
      }
    }

    // 2. Table Paste Detection
    const md = clipboardToMarkdown(e.clipboardData);
    if (!md) return;

    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart: s, selectionEnd: en, value } = el;
    const before = value.slice(0, s);
    const after = value.slice(en);

    const pre = !before
      ? ''
      : before.endsWith('\n\n')
      ? ''
      : before.endsWith('\n')
      ? '\n'
      : '\n\n';
    const post = !after || after.startsWith('\n') ? '' : '\n\n';
    const insert = pre + md + post;

    setManualQ((p) => ({ ...p, question: before + insert + after }));
    const pos = (before + insert).length;
    requestAnimationFrame(() => el.setSelectionRange(pos, pos));
    toast.success('Table formatted into question text');
  };

  /* ── Bulk Universal Parser Invocation ── */
  const handleParse = useCallback(() => {
    if (!bulkText.trim()) {
      toast.error('Paste questions first');
      return;
    }
    setParseError(null);

    // Call authoritative universal parser
    const result = parseObjectiveText(bulkText, defaultMark);

    if (result.warnings.length > 0) {
      result.warnings.forEach((w) => toast.warning(w, { duration: 5000 }));
    }

    if (result.items.length === 0) {
      setParseError(
        'No valid questions found. Ensure format has questions, options (A-D), and Answers.'
      );
      return;
    }

    const projected = objectiveTotal + result.items.length * defaultMark;
    if (projected + theoryTotal > EXAM_TOTAL) {
      toast.warning(
        `Importing ${result.items.length} questions sets total to ${(
          projected + theoryTotal
        ).toFixed(1)} (target ${EXAM_TOTAL}). Auto-balance to calibrate.`,
        { duration: 6000 }
      );
    }

    // Convert parsed items to full Question structure
    const convertedItems: Question[] = result.items.map((item) => ({
      id: item.id,
      type: 'mcq',
      question: item.question,
      options: item.options,
      correct_answer: item.correct_answer,
      marks: item.marks,
      image_url: item.image_url,
      image_caption: item.image_caption,
    }));

    onQuestionsChange([...questions, ...convertedItems]);
    onBulkTextChange('');
    toast.success(
      `✅ Added ${convertedItems.length} question${
        convertedItems.length === 1 ? '' : 's'
      }`
    );
  }, [
    bulkText,
    questions,
    onQuestionsChange,
    onBulkTextChange,
    defaultMark,
    objectiveTotal,
    theoryTotal,
  ]);

  const handleFileParse = useCallback(
    async (file: File) => {
      setIsParsingFile(true);
      try {
        const text = await parseDocument(file);
        const result = parseObjectiveText(text, defaultMark);

        if (result.items.length > 0) {
          const convertedItems: Question[] = result.items.map((item) => ({
            id: item.id,
            type: 'mcq',
            question: item.question,
            options: item.options,
            correct_answer: item.correct_answer,
            marks: item.marks,
            image_url: item.image_url,
            image_caption: item.image_caption,
          }));

          onQuestionsChange([...questions, ...convertedItems]);
          if (result.warnings.length > 0) {
            result.warnings.forEach((w) => toast.warning(w));
          }
          toast.success(
            `✅ ${convertedItems.length} question${
              convertedItems.length === 1 ? '' : 's'
            } imported from file`
          );
        } else {
          toast.warning('No valid questions found in file.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'File parse failed';
        setParseError(msg);
        toast.error(msg);
      } finally {
        setIsParsingFile(false);
      }
    },
    [questions, onQuestionsChange, defaultMark]
  );

  const handleAddManual = useCallback(() => {
    if (!manualQ.question.trim()) {
      toast.error('Question text is required');
      return;
    }
    if (!manualQ.correct_answer) {
      toast.error('Select a correct answer');
      return;
    }
    const filledOptions = manualQ.options.filter((o) => o.trim());
    if (filledOptions.length < 2) {
      toast.error('Add at least 2 options');
      return;
    }

    onQuestionsChange([
      ...questions,
      {
        id: crypto.randomUUID(),
        type: 'mcq',
        question: manualQ.question.trim(),
        options: manualQ.options,
        correct_answer: manualQ.correct_answer,
        marks: defaultMark,
        image_url: manualQ.image_url || undefined,
        image_caption: manualQ.image_caption || undefined,
      },
    ]);

    setManualQ({
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      image_url: '',
      image_caption: '',
    });
    toast.success('Objective question added');
  }, [manualQ, questions, onQuestionsChange, defaultMark]);

  const downloadTemplate = useCallback(() => {
    const blob = new Blob([OBJECTIVE_TEMPLATE], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'objective_template.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-950 transition-colors duration-300">
      <div className="p-3 sm:p-5 lg:p-6 max-w-4xl mx-auto w-full space-y-5">
        {/* ── Scoring Summary Card ── */}
        <div
          className={cn(
            'rounded-2xl border p-4 sm:p-5 space-y-4 shadow-sm transition-all duration-300 backdrop-blur-sm',
            isBalanced
              ? 'bg-gradient-to-br from-emerald-50/80 via-emerald-50/30 to-green-50/80 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-green-950/30 border-emerald-200/80 dark:border-emerald-800/40'
              : isOver
              ? 'bg-gradient-to-br from-rose-50/80 via-red-50/30 to-rose-50/80 dark:from-rose-950/40 dark:via-slate-900/60 dark:to-red-950/30 border-rose-200/80 dark:border-rose-800/40'
              : 'bg-gradient-to-br from-blue-50/80 via-blue-50/30 to-indigo-50/80 dark:from-blue-950/40 dark:via-slate-900/60 dark:to-indigo-950/30 border-blue-200/80 dark:border-blue-800/40'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'p-1.5 rounded-lg',
                  isBalanced
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                    : isOver
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                    : 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                )}
              >
                <Calculator className="h-4 w-4" />
              </div>
              <div>
                <span
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider block',
                    isBalanced
                      ? 'text-emerald-800 dark:text-emerald-300'
                      : isOver
                      ? 'text-rose-800 dark:text-rose-300'
                      : 'text-blue-800 dark:text-blue-300'
                  )}
                >
                  {isBalanced
                    ? 'Objective Marks Balanced'
                    : isOver
                    ? 'Objective Marks Exceed Limit'
                    : 'Objective Section Composer'}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Target: {EXAM_TOTAL} Marks Total ({objectiveTotal.toFixed(1)}{' '}
                  Objective + {theoryTotal.toFixed(1)} Theory)
                </p>
              </div>
            </div>

            <Badge
              className={cn(
                'text-xs sm:text-sm font-bold px-2.5 py-1 border-0 shadow-sm',
                isBalanced
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                  : isOver
                  ? 'bg-rose-600 text-white dark:bg-rose-500'
                  : 'bg-blue-600 text-white dark:bg-blue-500'
              )}
            >
              {grandTotal.toFixed(1)} / {EXAM_TOTAL} Marks
            </Badge>
          </div>

          <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
              style={{ width: `${objectivePercent}%` }}
              title={`Objective: ${objectiveTotal.toFixed(1)} marks`}
            />
            <div
              className={cn(
                'h-full transition-all duration-500',
                isBalanced
                  ? 'bg-emerald-500 dark:bg-emerald-400'
                  : isOver
                  ? 'bg-rose-500 dark:bg-rose-400'
                  : 'bg-purple-400 dark:bg-purple-500'
              )}
              style={{ width: `${theoryPercent}%` }}
              title={`Theory: ${theoryTotal.toFixed(1)} marks`}
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-2 sm:p-2.5 text-center border border-slate-100 dark:border-slate-800 shadow-2xs">
              <p className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                {questions.length}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Questions
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-2 sm:p-2.5 text-center border border-blue-100 dark:border-blue-900/40 shadow-2xs">
              <p className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-300">
                {objectiveTotal.toFixed(1)}
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                Obj Marks
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-2 sm:p-2.5 text-center border border-purple-100 dark:border-purple-900/40 shadow-2xs">
              <p className="text-base sm:text-lg font-black text-purple-700 dark:text-purple-300">
                {theoryTotal.toFixed(1)}
              </p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                Theory Marks
              </p>
            </div>

            <div
              className={cn(
                'rounded-xl p-2 sm:p-2.5 text-center border shadow-2xs transition-colors',
                isBalanced
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40'
                  : isOver
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40'
                  : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40'
              )}
            >
              <p
                className={cn(
                  'text-base sm:text-lg font-black',
                  isBalanced
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : isOver
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-600 dark:text-amber-400'
                )}
              >
                {remaining.toFixed(1)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Unallocated
              </p>
            </div>
          </div>
        </div>

        {/* ── Mark Controls & Auto-balance ── */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Mark Per Question
                </Label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select standard value or auto-balance across all objective
                  items
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                {MARK_OPTIONS.map((mk) => (
                  <button
                    key={mk}
                    type="button"
                    onClick={() => handleMarkUpdate(mk)}
                    className={cn(
                      'min-w-[34px] h-7 px-2 rounded-lg text-xs font-bold transition-all',
                      defaultMark === mk
                        ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    )}
                  >
                    {mk}
                  </button>
                ))}
              </div>

              {questions.length > 0 && !isBalanced && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoBalanceMarks}
                  className="h-8 text-[11px] font-semibold text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  title="Evenly distribute remaining objective marks among all current questions"
                >
                  <Sparkles className="h-3 w-3 mr-1 text-blue-500" />
                  Auto-Target
                </Button>
              )}
            </div>
          </div>

          {questions.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {questions.length} questions × {defaultMark} mk ={' '}
                <strong className="text-blue-600 dark:text-blue-400">
                  {objectiveTotal.toFixed(1)} marks
                </strong>
              </span>

              {!isOver && !isBalanced && roomForMoreQuestions > 0 && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  <Zap className="h-3 w-3" />
                  Room for {roomForMoreQuestions} more questions at {defaultMark}{' '}
                  mk
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Over Mark Warning ── */}
        {isOver && (
          <Alert className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50">
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <AlertDescription className="text-rose-700 dark:text-rose-300 text-xs">
              Total ({grandTotal.toFixed(1)}) exceeds {EXAM_TOTAL} by{' '}
              {(grandTotal - EXAM_TOTAL).toFixed(1)} marks. Lower the mark per
              question or remove excess items.
            </AlertDescription>
          </Alert>
        )}

        {/* ── Comprehension Reading Passage ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant={hasPassage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onHasPassageChange(!hasPassage)}
              className={cn(
                'text-xs h-8 font-semibold rounded-xl transition-all',
                hasPassage
                  ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 text-white shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              {hasPassage
                ? '📖 Reading Passage Active'
                : 'Attach Comprehension Passage'}
            </Button>

            {hasPassage && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                {passageText.length} chars •{' '}
                {passageText.split(/\s+/).filter(Boolean).length} words
              </span>
            )}
          </div>

          {hasPassage && (
            <div className="space-y-2 p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-900/40">
              <Label className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Reading Passage Content (Shown above questions in CBT Runner)
              </Label>
              <Textarea
                value={passageText}
                onChange={(e) => onPassageTextChange(e.target.value)}
                rows={6}
                className="resize-y text-xs sm:text-sm leading-relaxed bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/60 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 min-h-[140px]"
                placeholder="Paste the reading comprehension narrative, story, or continuous passage here..."
              />
            </div>
          )}
        </div>

        {/* ── Mode Switcher ── */}
        <ModeSwitcher
          modes={[
            {
              id: 'bulk',
              label: 'Bulk Parser & Word Import',
              icon: Sparkles,
            },
            {
              id: 'manual',
              label: 'Single Question Composer',
              icon: Plus,
            },
          ]}
          active={mode}
          onChange={(v) => setMode(v as 'bulk' | 'manual')}
        />

        {/* ── Mode A: Bulk Import ── */}
        {mode === 'bulk' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Parsed questions receive{' '}
                <strong className="text-blue-600 dark:text-blue-400">
                  {defaultMark} mark{defaultMark === 1 ? '' : 's'}
                </strong>{' '}
                each
              </span>
              {!isOver && !isBalanced && roomForMoreQuestions > 0 && (
                <Badge className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-0">
                  Capacity: +{roomForMoreQuestions} questions
                </Badge>
              )}
            </div>

            <BulkImporter
              value={bulkText}
              onChange={onBulkTextChange}
              onFileParse={handleFileParse}
              onParse={handleParse}
              isParsingFile={isParsingFile}
              parseError={parseError}
              placeholder={`1. What is the chemical symbol for Gold?\nA. Ag\nB. Au\nC. Fe\nD. Pb\nAnswer: B\nMarks: ${defaultMark}`}
              accentColor="emerald"
              onInsertExample={() => onBulkTextChange(OBJECTIVE_TEMPLATE)}
              onDownloadTemplate={downloadTemplate}
              parseButtonLabel="Parse & Add to Exam"
              parseButtonIcon={<CheckCheck className="mr-1.5 h-3.5 w-3.5" />}
              textareaClassName="text-xs sm:text-sm leading-relaxed font-mono"
              textareaRows={12}
            />
          </div>
        )}

        {/* ── Mode B: Manual Composer ── */}
        {mode === 'manual' && (
          <div className="space-y-4 p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Compose Objective Question
                  </Label>
                  <p className="text-[11px] text-slate-400">
                    Supports tables, diagrams, screenshots, and 4 option choices
                  </p>
                </div>
              </div>
              <Badge className="text-xs bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-0">
                {defaultMark} Marks
              </Badge>
            </div>

            <div>
              <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Question Text / Prompt
              </Label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) await handleImageFile(f);
                }}
                className={cn(
                  'relative rounded-xl border mt-1 transition-all',
                  isDraggingFile
                    ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-blue-400'
                    : 'border-slate-200 dark:border-slate-800'
                )}
              >
                <Textarea
                  ref={textareaRef}
                  value={manualQ.question}
                  onChange={(e) =>
                    setManualQ((p) => ({ ...p, question: e.target.value }))
                  }
                  onPaste={handleQuestionPaste}
                  rows={4}
                  className="w-full resize-y text-xs sm:text-sm font-normal leading-relaxed bg-transparent border-0 focus-visible:ring-0 p-3 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-h-[90px]"
                  placeholder="e.g. Which of the following organelles is responsible for cellular respiration in eukaryotic cells? (Or paste table / screenshot directly)"
                />

                {isDraggingFile && (
                  <div className="absolute inset-0 bg-blue-600/10 dark:bg-blue-900/30 backdrop-blur-2xs flex flex-col items-center justify-center rounded-xl pointer-events-none">
                    <UploadCloud className="h-7 w-7 text-blue-600 dark:text-blue-400 animate-bounce" />
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mt-1">
                      Drop Diagram to Attach
                    </p>
                  </div>
                )}
              </div>
            </div>

            {(hasTable(manualQ.question) || manualQ.image_url) && (
              <div className="rounded-xl border border-dashed border-blue-200 dark:border-blue-800 p-3 bg-slate-50/50 dark:bg-slate-950/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-1.5">
                  <Eye className="h-3 w-3" /> Live Render Preview
                </span>
                <QuestionContent
                  text={manualQ.question}
                  imageUrl={manualQ.image_url}
                  imageCaption={manualQ.image_caption}
                  className="text-xs text-slate-700 dark:text-slate-300"
                />
              </div>
            )}

            <div>
              <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Question Diagram / Figure (Optional)
              </Label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="obj-diagram-input"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageFile(f);
                }}
              />

              {manualQ.image_url ? (
                <div className="flex items-center gap-2 mt-1 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <img
                    src={manualQ.image_url}
                    alt="Diagram preview"
                    className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <Input
                    type="text"
                    placeholder="Caption (e.g. Figure 1: Electric circuit diagram)"
                    value={manualQ.image_caption}
                    onChange={(e) =>
                      setManualQ((p) => ({
                        ...p,
                        image_caption: e.target.value,
                      }))
                    }
                    className="h-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setManualQ((p) => ({
                        ...p,
                        image_url: '',
                        image_caption: '',
                      }))
                    }
                    className="h-7 px-2 text-rose-500 hover:text-rose-600 text-xs"
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="obj-diagram-input"
                  className="mt-1 cursor-pointer flex items-center justify-center gap-2 h-9 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all text-slate-500 dark:text-slate-400"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                  )}
                  <span className="text-xs font-medium">
                    {isUploadingImage
                      ? 'Attaching diagram...'
                      : 'Upload Diagram or Paste Screenshot (Ctrl+V)'}
                  </span>
                </label>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Options Choices (Click letter pill to mark as correct answer)
                </Label>
                {manualHasRelative && (
                  <Badge
                    variant="outline"
                    className="text-[9px] h-4 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                  >
                    <ShieldAlert className="h-2.5 w-2.5 mr-1" /> Option shuffle
                    locked for this item
                  </Badge>
                )}
              </div>

              {manualQ.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isCorrect = opt && manualQ.correct_answer === opt;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (opt.trim()) {
                          setManualQ((p) => ({ ...p, correct_answer: opt }));
                        }
                      }}
                      disabled={!opt.trim()}
                      className={cn(
                        'w-8 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all shadow-2xs',
                        isCorrect
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 dark:ring-emerald-800 shadow-xs'
                          : opt.trim()
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                          : 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                      )}
                      title={
                        isCorrect
                          ? 'Correct answer'
                          : 'Click to mark as correct'
                      }
                    >
                      {letter}
                    </button>

                    <Input
                      value={opt}
                      onChange={(e) => {
                        const opts = [...manualQ.options];
                        const oldVal = opts[idx];
                        opts[idx] = e.target.value;
                        setManualQ((p) => ({
                          ...p,
                          options: opts,
                          correct_answer:
                            p.correct_answer === oldVal
                              ? e.target.value
                              : p.correct_answer,
                        }));
                      }}
                      className={cn(
                        'h-9 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200',
                        isCorrect &&
                          'border-emerald-400 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20'
                      )}
                      placeholder={`Option ${letter}`}
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Confirmed Correct Answer
              </Label>
              <Select
                value={manualQ.correct_answer}
                onValueChange={(v) =>
                  setManualQ((p) => ({ ...p, correct_answer: v }))
                }
              >
                <SelectTrigger className="mt-1 h-9 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                  <SelectValue placeholder="Select correct answer" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {manualQ.options.map(
                    (o, i) =>
                      o.trim() && (
                        <SelectItem
                          key={i}
                          value={o}
                          className="text-xs sm:text-sm"
                        >
                          {String.fromCharCode(65 + i)}. {o}
                        </SelectItem>
                      )
                  )}
                  {manualQ.options.every((o) => !o.trim()) && (
                    <div className="px-2 py-1.5 text-xs text-slate-400">
                      Fill in options above first
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              onClick={handleAddManual}
              disabled={isOver}
              className={cn(
                'w-full h-10 text-sm font-semibold text-white shadow-md transition-all',
                isOver
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-emerald-500/20'
              )}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Question ({defaultMark} mark
              {defaultMark === 1 ? '' : 's'})
            </Button>
          </div>
        )}

        {/* ── Question Repository List ── */}
        {questions.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Objective Questions ({questions.length})
              </Label>

              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs border-0">
                  {objectiveTotal.toFixed(1)} Marks Total
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm(
                        `Delete all ${questions.length} objective questions?`
                      )
                    ) {
                      onQuestionsChange([]);
                      toast.success('Objective list cleared');
                    }
                  }}
                  className="text-rose-500 hover:text-rose-600 text-xs h-7 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="max-h-[360px] sm:max-h-[440px] overflow-y-auto space-y-2 pr-1">
              {questions.map((q, i) => (
                <ObjectiveCard
                  key={q.id}
                  question={q}
                  index={i}
                  onDelete={(id) =>
                    onQuestionsChange(questions.filter((x) => x.id !== id))
                  }
                />
              ))}
            </div>

            <div className="flex items-center justify-between px-3 py-2 bg-slate-100/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Obj {objectiveTotal.toFixed(1)} + Theory{' '}
                {theoryTotal.toFixed(1)} ={' '}
                <strong
                  className={cn(
                    isBalanced
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isOver
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  {grandTotal.toFixed(1)} / {EXAM_TOTAL} Marks
                </strong>
              </span>

              {isBalanced && (
                <Badge className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-0">
                  ✓ Section Balanced
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {questions.length === 0 && (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
            <CheckCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">
              No objective questions added yet. Use the bulk parser or single
              question composer above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Mode Switcher Sub-component ─── */

function ModeSwitcher({
  modes,
  active,
  onChange,
}: {
  modes: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 gap-1">
      {modes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all',
            active === id
              ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-800 dark:text-white'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}