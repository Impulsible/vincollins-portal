// src/components/staff/exams/create/components/BulkImporter.tsx
"use client";

import { useRef } from "react";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface BulkImporterProps {
  value: string;
  onChange: (v: string) => void;
  onFileParse: (file: File) => void;
  onParse: () => void;
  isParsingFile?: boolean;
  parseError?: string | null;
  placeholder?: string;
  accentColor?: "emerald" | "blue" | "purple" | "amber";
  onInsertExample?: () => void;
  onDownloadTemplate?: () => void;
  parseButtonLabel?: string;
  parseButtonIcon?: React.ReactNode;
  // ── NEW: allow callers to customise the textarea ──
  textareaClassName?: string;
  textareaRows?: number;
}

const ACCENT = {
  emerald: {
    border: "border-emerald-200 focus-within:border-emerald-400",
    header: "bg-emerald-50 border-b border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    ghost: "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50",
    error: "border-red-300 bg-red-50",
  },
  blue: {
    border: "border-blue-200 focus-within:border-blue-400",
    header: "bg-blue-50 border-b border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700",
    ghost: "text-blue-600 hover:text-blue-700 hover:bg-blue-50",
    error: "border-red-300 bg-red-50",
  },
  purple: {
    border: "border-purple-200 focus-within:border-purple-400",
    header: "bg-purple-50 border-b border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    btn: "bg-purple-600 hover:bg-purple-700",
    ghost: "text-purple-600 hover:text-purple-700 hover:bg-purple-50",
    error: "border-red-300 bg-red-50",
  },
  amber: {
    border: "border-amber-200 focus-within:border-amber-400",
    header: "bg-amber-50 border-b border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    btn: "bg-amber-600 hover:bg-amber-700",
    ghost: "text-amber-600 hover:text-amber-700 hover:bg-amber-50",
    error: "border-red-300 bg-red-50",
  },
} as const;

export function BulkImporter({
  value,
  onChange,
  onFileParse,
  onParse,
  isParsingFile = false,
  parseError = null,
  placeholder = "Paste your questions here...",
  accentColor = "blue",
  onInsertExample,
  onDownloadTemplate,
  parseButtonLabel = "Parse",
  parseButtonIcon,
  // ── defaults give a good readable size ──
  textareaClassName = "text-sm leading-relaxed font-mono",
  textareaRows = 14,
}: BulkImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accent = ACCENT[accentColor];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileParse(file);
      e.target.value = "";
    }
  };

  return (
    <div className={cn("rounded-xl border-2 overflow-hidden transition-colors", accent.border)}>

      {/* ── Toolbar ── */}
      <div className={cn("flex flex-wrap items-center justify-between gap-2 px-3 py-2", accent.header)}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full", accent.badge)}>
            Paste Area
          </span>
          {value && (
            <span className="text-[10px] text-gray-500">
              {value.split("\n").length} lines · {value.length} chars
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {/* Insert example */}
          {onInsertExample && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onInsertExample}
              className={cn("h-6 text-[10px] px-2", accent.ghost)}
            >
              Example
            </Button>
          )}

          {/* Download template */}
          {onDownloadTemplate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDownloadTemplate}
              className={cn("h-6 text-[10px] px-2", accent.ghost)}
            >
              Template
            </Button>
          )}

          {/* Clear */}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              className="h-6 text-[10px] px-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              Clear
            </Button>
          )}

          {/* Upload file */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsingFile}
            className={cn("h-6 text-[10px] px-2", accent.ghost)}
          >
            {isParsingFile ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Upload className="h-3 w-3 mr-1" />
            )}
            {isParsingFile ? "Parsing…" : "Upload"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.doc,.docx,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* ── Paste textarea ── */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={textareaRows}
        placeholder={placeholder}
        className={cn(
          // Base structural styles — no border/ring since the wrapper handles it
          "w-full resize-none rounded-none border-0 ring-0 focus-visible:ring-0",
          "bg-white placeholder:text-gray-300",
          // ── Caller-controlled font/spacing ──
          textareaClassName,
          // Error state
          parseError && accent.error
        )}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />

      {/* ── Error message ── */}
      {parseError && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border-t border-red-200">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600 leading-relaxed">{parseError}</p>
        </div>
      )}

      {/* ── Parse / submit button ── */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
        <p className="text-[10px] text-gray-400 leading-snug hidden sm:block">
          Paste questions above, then click parse to add them.
        </p>
        <Button
          type="button"
          onClick={onParse}
          disabled={!value.trim() || isParsingFile}
          className={cn(
            "h-8 text-xs font-semibold px-4 text-white shrink-0 ml-auto",
            accent.btn
          )}
        >
          {parseButtonIcon}
          {parseButtonLabel}
        </Button>
      </div>
    </div>
  );
}