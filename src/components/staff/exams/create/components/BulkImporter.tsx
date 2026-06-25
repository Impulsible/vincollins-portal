// src/components/staff/exams/create/components/BulkImporter.tsx

"use client";

import { useRef } from "react";
import { FileUp, Loader2, X, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkImporterProps {
  value: string;
  onChange: (v: string) => void;
  onFileParse: (file: File) => Promise<void>;
  onParse: () => void;
  isParsingFile: boolean;
  parseError: string | null;
  placeholder: string;
  rows?: number;
  accentColor?: "emerald" | "purple";
  onInsertExample: () => void;
  onDownloadTemplate: () => void;
  parseButtonLabel?: string;
  parseButtonIcon?: React.ReactNode;
}

export function BulkImporter({
  value,
  onChange,
  onFileParse,
  onParse,
  isParsingFile,
  parseError,
  placeholder,
  rows = 8,
  accentColor = "emerald",
  onInsertExample,
  onDownloadTemplate,
  parseButtonLabel = "Parse & Add",
  parseButtonIcon,
}: BulkImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accent = {
    emerald: {
      border: "hover:border-emerald-400 hover:bg-emerald-50/30",
      icon: "group-hover:bg-emerald-100 group-hover:text-emerald-600",
      btn: "bg-emerald-600 hover:bg-emerald-700",
      spinner: "text-emerald-600",
    },
    purple: {
      border: "hover:border-purple-400 hover:bg-purple-50/30",
      icon: "group-hover:bg-purple-100 group-hover:text-purple-600",
      btn: "bg-purple-600 hover:bg-purple-700",
      spinner: "text-purple-600",
    },
  }[accentColor];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onFileParse(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Template Buttons */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Upload a file or paste text below
        </p>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onInsertExample}
            className="h-6 text-[10px] px-2"
          >
            <Sparkles className="h-2.5 w-2.5 mr-1" />
            Example
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadTemplate}
            className="h-6 text-[10px] px-2"
          >
            <Download className="h-2.5 w-2.5 mr-1" />
            Template
          </Button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed border-gray-200 rounded-lg p-4 sm:p-6",
          "text-center cursor-pointer transition-all group",
          accent.border
        )}
      >
        {isParsingFile ? (
          <Loader2
            className={cn("h-6 w-6 mx-auto animate-spin", accent.spinner)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center transition-colors",
                accent.icon
              )}
            >
              <FileUp className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-xs font-medium text-gray-600">Upload file</p>
            <p className="text-[10px] text-muted-foreground">
              .doc .docx .pdf .txt
            </p>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.doc,.docx,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Text Area */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="font-mono text-[10px] resize-none"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 bg-white rounded border"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Parse Button */}
      <Button
        onClick={onParse}
        className={cn("w-full h-9 text-xs", accent.btn)}
        disabled={!value.trim() || isParsingFile}
      >
        {parseButtonIcon}
        {parseButtonLabel}
      </Button>

      {/* Error */}
      {parseError && (
        <Alert variant="destructive" className="rounded-lg">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">{parseError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}