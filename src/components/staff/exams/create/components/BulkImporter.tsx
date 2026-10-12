// src/components/staff/exams/create/components/BulkImporter.tsx - WITH COMPLETE DARK MODE

"use client";

import { useRef, useState, useEffect } from "react";
import { Upload, Loader2, AlertCircle, Table, BarChart3, Image as ImageIcon, FileText, Check, AlertTriangle, Sparkles, Eye, EyeOff, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  textareaClassName?: string;
  textareaRows?: number;
  defaultMark?: number;
  objectiveTotal?: number;
  theoryTotal?: number;
  isBalanced?: boolean;
  showMarkInfo?: boolean;
}

interface ContentAnalysis {
  hasTables: boolean;
  hasCharts: boolean;
  hasImages: boolean;
  hasMath: boolean;
  hasCode: boolean;
  hasLists: boolean;
  tableCount: number;
  chartCount: number;
  imageCount: number;
  totalQuestions: number;
  detectedFormat: 'markdown' | 'html' | 'plain' | 'mixed';
}

const ACCENT = {
  emerald: {
    border: "border-emerald-200 dark:border-emerald-900/50 focus-within:border-emerald-400 dark:focus-within:border-emerald-600",
    header: "bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-900/50",
    badge: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400",
    btn: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
    ghost: "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
    error: "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30",
  },
  blue: {
    border: "border-blue-200 dark:border-blue-900/50 focus-within:border-blue-400 dark:focus-within:border-blue-600",
    header: "bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/50",
    badge: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400",
    btn: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500",
    ghost: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40",
    error: "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30",
  },
  purple: {
    border: "border-purple-200 dark:border-purple-900/50 focus-within:border-purple-400 dark:focus-within:border-purple-600",
    header: "bg-purple-50 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-900/50",
    badge: "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400",
    btn: "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500",
    ghost: "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40",
    error: "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30",
  },
  amber: {
    border: "border-amber-200 dark:border-amber-900/50 focus-within:border-amber-400 dark:focus-within:border-amber-600",
    header: "bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50",
    badge: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
    btn: "bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500",
    ghost: "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40",
    error: "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30",
  },
} as const;

const convertMarkdownTableToHtml = (text: string): string => {
  if (!text) return '';
  
  const lines = text.split('\n').filter(line => line.includes('|') && !line.includes('---'));
  if (lines.length < 2) return '';
  
  let html = '<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">';
  let isHeader = true;
  
  for (const line of lines) {
    const cells = line.split('|').filter(cell => cell.trim() !== '');
    if (cells.length === 0) continue;
    
    const tag = isHeader ? 'th' : 'td';
    const cellClass = isHeader 
      ? 'px-3 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider bg-gray-50 dark:bg-gray-800'
      : 'px-3 py-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap';
    
    html += '<tr class="' + (isHeader ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors') + '">';
    cells.forEach((cell) => {
      const trimmed = cell.trim();
      html += `<${tag} class="${cellClass} border border-gray-200 dark:border-gray-700">${trimmed}</${tag}>`;
    });
    html += '</tr>';
    isHeader = false;
  }
  
  html += '</table>';
  return html;
};

const detectContent = (text: string): ContentAnalysis => {
  if (!text) {
    return {
      hasTables: false, hasCharts: false, hasImages: false, hasMath: false,
      hasCode: false, hasLists: false, tableCount: 0, chartCount: 0,
      imageCount: 0, totalQuestions: 0, detectedFormat: 'plain',
    };
  }

  let detectedFormat: 'markdown' | 'html' | 'plain' | 'mixed' = 'plain';
  if (text.includes('```') || text.includes('**') || text.includes('## ')) {
    detectedFormat = 'markdown';
  }
  if (text.includes('<table') || text.includes('<div') || text.includes('<p>')) {
    detectedFormat = detectedFormat === 'markdown' ? 'mixed' : 'html';
  }

  const tableCount = (
    (text.match(/\|.+\|/g)?.length || 0) +
    (text.match(/<table[\s\S]*?<\/table>/gi)?.length || 0) +
    (text.match(/\+--.*--\+/g)?.length || 0)
  );

  const chartKeywords = ['chart', 'graph', 'diagram', 'plot', 'bar chart', 'pie chart', 'line graph', 'histogram', 'scatter plot'];
  const chartCount = chartKeywords.reduce((count, kw) => {
    return count + (text.toLowerCase().match(new RegExp(kw, 'g'))?.length || 0);
  }, 0);

  const imageCount = (
    (text.match(/!\[.*?\]\(.*?\)/g)?.length || 0) +
    (text.match(/<img[^>]*>/gi)?.length || 0) +
    (text.match(/data:image[^,;]+[;,]?/g)?.length || 0)
  );

  const hasMath = (
    text.includes('∑') || text.includes('∫') || text.includes('√') ||
    text.includes('∂') || text.includes('∞') ||
    Boolean(text.match(/[a-z]=\d+/)) ||
    text.includes('frac{') || text.includes('sqrt{')
  );

  const hasCode = text.includes('```') || text.includes('`');
  const hasLists = Boolean(text.match(/^[\d]+\.\s/m)) || Boolean(text.match(/^[-*•]\s/m));
  const questionMatch = text.match(/\d+[\.\)]\s/g);
  const totalQuestions = questionMatch ? questionMatch.length : 0;

  return {
    hasTables: tableCount > 0,
    hasCharts: chartCount > 0,
    hasImages: imageCount > 0,
    hasMath, hasCode, hasLists,
    tableCount, chartCount, imageCount, totalQuestions, detectedFormat,
  };
};

const TablePreview = ({ text }: { text: string }) => {
  const tableHtml = convertMarkdownTableToHtml(text);
  
  if (!tableHtml) {
    return (
      <div className="text-xs text-gray-400 dark:text-gray-500 italic">
        Table detected but couldn't be rendered. Please ensure proper markdown table format.
      </div>
    );
  }
  
  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <div 
        className="w-full text-xs md:text-sm [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:border-gray-200 [&_td]:border-gray-200 dark:[&_th]:border-gray-700 dark:[&_td]:border-gray-700 [&_th]:px-3 [&_td]:px-3 [&_th]:py-2 [&_td]:py-2 [&_th]:bg-gray-50 dark:[&_th]:bg-gray-800 [&_th]:font-semibold [&_th]:text-left [&_td]:text-gray-700 dark:[&_td]:text-gray-300"
        dangerouslySetInnerHTML={{ __html: tableHtml }}
      />
    </div>
  );
};

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
  textareaClassName = "text-sm leading-relaxed",
  textareaRows = 14,
  defaultMark = 0.5,
  objectiveTotal = 0,
  theoryTotal = 0,
  isBalanced = true,
  showMarkInfo = false,
}: BulkImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showRenderedContent, setShowRenderedContent] = useState(false);
  
  const accent = ACCENT[accentColor];

  useEffect(() => {
    const result = detectContent(value);
    setAnalysis(result);
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileParse(file);
      e.target.value = "";
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'markdown': return '📝 Markdown';
      case 'html': return '🌐 HTML';
      case 'mixed': return '🔄 Mixed';
      default: return '📄 Plain Text';
    }
  };

  const getTableContent = (text: string): string => {
    const lines = text.split('\n');
    let tableLines: string[] = [];
    let inTable = false;
    
    for (const line of lines) {
      if (line.includes('|') && !line.includes('---')) {
        inTable = true;
        tableLines.push(line);
      } else if (inTable && !line.includes('|')) {
        break;
      }
    }
    
    return tableLines.join('\n');
  };

  const hasVisibleTable = analysis?.hasTables && value.includes('|');

  return (
    <div className={cn("rounded-xl border-2 overflow-hidden transition-colors", accent.border)}>

      {/* Toolbar */}
      <div className={cn("flex flex-wrap items-center justify-between gap-2 px-3 py-2", accent.header)}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full", accent.badge)}>
            Bulk Import
          </span>
          {value && analysis && (
            <>
              <span className="text-[10px] text-gray-500 dark:text-slate-400">
                {value.split("\n").length} lines
              </span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                {getFormatLabel(analysis.detectedFormat)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {showMarkInfo && (
            <Badge className={cn(
              "text-[10px] border-0",
              isBalanced 
                ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400" 
                : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
            )}>
              <Calculator className="h-2.5 w-2.5 mr-0.5" />
              {objectiveTotal} + {theoryTotal} = {objectiveTotal + theoryTotal}
              {!isBalanced && " ⚠️"}
            </Badge>
          )}

          {hasVisibleTable && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowRenderedContent(!showRenderedContent)}
              className={cn("h-6 text-[10px] px-2", accent.ghost)}
            >
              {showRenderedContent ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />Raw
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />Rendered
                </>
              )}
            </Button>
          )}

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

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              className="h-6 text-[10px] px-2 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Clear
            </Button>
          )}

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
            accept=".txt,.doc,.docx,.pdf,.md,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Analysis banner */}
      {value && analysis && (
        <div className="px-3 py-1.5 bg-blue-50/80 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/50 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
            <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300">Detected:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5">
            {analysis.hasTables && (
              <Badge variant="outline" className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                <Table className="h-2.5 w-2.5 mr-0.5" />
                {analysis.tableCount} Table{analysis.tableCount > 1 ? 's' : ''}
              </Badge>
            )}
            {analysis.hasCharts && (
              <Badge variant="outline" className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700">
                <BarChart3 className="h-2.5 w-2.5 mr-0.5" />
                {analysis.chartCount} Chart{analysis.chartCount > 1 ? 's' : ''}
              </Badge>
            )}
            {analysis.hasImages && (
              <Badge variant="outline" className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                <ImageIcon className="h-2.5 w-2.5 mr-0.5" />
                {analysis.imageCount} Image{analysis.imageCount > 1 ? 's' : ''}
              </Badge>
            )}
            {analysis.hasMath && (
              <Badge variant="outline" className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                <span className="font-mono text-[10px]">∑</span> Math
              </Badge>
            )}
            {analysis.totalQuestions > 0 && (
              <Badge variant="outline" className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                <FileText className="h-2.5 w-2.5 mr-0.5" />
                {analysis.totalQuestions} Qs
              </Badge>
            )}
          </div>
          
          <span className="text-[10px] text-gray-400 dark:text-slate-500 ml-auto hidden sm:inline">
            ✨ Formatting preserved
          </span>
        </div>
      )}

      {/* Rendered table preview */}
      {showRenderedContent && hasVisibleTable && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">📊 Table Preview</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">Rendered from markdown</span>
          </div>
          <TablePreview text={getTableContent(value)} />
        </div>
      )}

      {/* Textarea */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={textareaRows}
        placeholder={placeholder}
        className={cn(
          "w-full resize-none rounded-none border-0 ring-0 focus-visible:ring-0",
          "bg-white dark:bg-gray-950 placeholder:text-gray-300 dark:placeholder:text-gray-600",
          "text-slate-800 dark:text-slate-100",
          "font-mono",
          textareaClassName,
          parseError && accent.error
        )}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />

      {/* Error */}
      {parseError && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/20 border-t border-red-200 dark:border-red-800">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{parseError}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {value && analysis && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
              <Check className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
              <span>{analysis.totalQuestions || 0} questions</span>
              {analysis.hasTables && (
                <span className="text-blue-400 dark:text-blue-500">· {analysis.tableCount} tables</span>
              )}
            </div>
          )}
          {showMarkInfo && (
            <span className={cn(
              "text-[10px]",
              isBalanced 
                ? "text-emerald-600 dark:text-emerald-400" 
                : "text-amber-600 dark:text-amber-400"
            )}>
              {isBalanced ? "✅ " : "⚠️ "}
              {objectiveTotal + theoryTotal}/60
            </span>
          )}
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-snug hidden sm:block">
            {value && analysis && (analysis.hasTables || analysis.hasCharts || analysis.hasImages) 
              ? "✨ Tables, charts, and images will be preserved." 
              : "Paste questions above, then click parse."}
          </p>
        </div>
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