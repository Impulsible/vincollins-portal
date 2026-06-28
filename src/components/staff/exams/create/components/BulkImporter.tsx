// src/components/staff/exams/create/components/BulkImporter.tsx

"use client";

import { useRef, useState, useEffect } from "react";
import { Upload, Loader2, AlertCircle, Table, BarChart3, Image as ImageIcon, FileText, Check, AlertTriangle, Sparkles, Eye, EyeOff } from "lucide-react";
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

// ── Convert markdown table to HTML ──────────────────────────────────────────
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

// ── Enhanced Content Detection ──────────────────────────────────────────────

const detectContent = (text: string): ContentAnalysis => {
  if (!text) {
    return {
      hasTables: false,
      hasCharts: false,
      hasImages: false,
      hasMath: false,
      hasCode: false,
      hasLists: false,
      tableCount: 0,
      chartCount: 0,
      imageCount: 0,
      totalQuestions: 0,
      detectedFormat: 'plain',
    };
  }

  // ── Detect format ──
  let detectedFormat: 'markdown' | 'html' | 'plain' | 'mixed' = 'plain';
  if (text.includes('```') || text.includes('**') || text.includes('## ')) {
    detectedFormat = 'markdown';
  }
  if (text.includes('<table') || text.includes('<div') || text.includes('<p>')) {
    detectedFormat = detectedFormat === 'markdown' ? 'mixed' : 'html';
  }

  // ── Count tables ──
  const tableCount = (
    (text.match(/\|.+\|/g)?.length || 0) +
    (text.match(/<table[\s\S]*?<\/table>/gi)?.length || 0) +
    (text.match(/\+--.*--\+/g)?.length || 0)
  );

  // ── Count charts ──
  const chartKeywords = ['chart', 'graph', 'diagram', 'plot', 'bar chart', 'pie chart', 'line graph', 'histogram', 'scatter plot'];
  const chartCount = chartKeywords.reduce((count, kw) => {
    return count + (text.toLowerCase().match(new RegExp(kw, 'g'))?.length || 0);
  }, 0);

  // ── Count images ──
  const imageCount = (
    (text.match(/!\[.*?\]\(.*?\)/g)?.length || 0) +
    (text.match(/<img[^>]*>/gi)?.length || 0) +
    (text.match(/data:image[^,;]+[;,]?/g)?.length || 0)
  );

  // ── Detect math ──
  const hasMath = (
    text.includes('∑') ||
    text.includes('∫') ||
    text.includes('√') ||
    text.includes('∂') ||
    text.includes('∞') ||
    Boolean(text.match(/[a-z]=\d+/)) ||
    text.includes('frac{') ||
    text.includes('sqrt{')
  );

  // ── Detect code ──
  const hasCode = text.includes('```') || text.includes('`');

  // ── Detect lists ──
  const hasLists = Boolean(text.match(/^[\d]+\.\s/m)) || Boolean(text.match(/^[-*•]\s/m));

  // ── Count questions ──
  const questionMatch = text.match(/\d+[\.\)]\s/g);
  const totalQuestions = questionMatch ? questionMatch.length : 0;

  return {
    hasTables: tableCount > 0,
    hasCharts: chartCount > 0,
    hasImages: imageCount > 0,
    hasMath,
    hasCode,
    hasLists,
    tableCount,
    chartCount,
    imageCount,
    totalQuestions,
    detectedFormat,
  };
};

// ── Render Table Preview ──────────────────────────────────────────────────────
const TablePreview = ({ text }: { text: string }) => {
  const tableHtml = convertMarkdownTableToHtml(text);
  
  if (!tableHtml) {
    return (
      <div className="text-xs text-gray-400 italic">
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
}: BulkImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showRenderedContent, setShowRenderedContent] = useState(false);
  
  const accent = ACCENT[accentColor];

  // ── Analyze content on change ──
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

  // ── Extract table content from text ──
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

      {/* ── Toolbar ── */}
      <div className={cn("flex flex-wrap items-center justify-between gap-2 px-3 py-2", accent.header)}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full", accent.badge)}>
            Bulk Import
          </span>
          {value && analysis && (
            <>
              <span className="text-[10px] text-gray-500">
                {value.split("\n").length} lines
              </span>
              <span className="text-[10px] text-gray-400">
                {getFormatLabel(analysis.detectedFormat)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {/* Toggle rendered view */}
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
                  <EyeOff className="h-3 w-3 mr-1" />
                  Raw
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Rendered
                </>
              )}
            </Button>
          )}

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
            accept=".txt,.doc,.docx,.pdf,.md,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* ── Content Analysis Banner ── */}
      {value && analysis && (
        <div className="px-3 py-1.5 bg-blue-50/80 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-800 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
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
          
          <span className="text-[10px] text-gray-400 ml-auto hidden sm:inline">
            ✨ Formatting preserved
          </span>
        </div>
      )}

      {/* ── Rendered Table Preview ── */}
      {showRenderedContent && hasVisibleTable && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">📊 Table Preview</span>
            <span className="text-[10px] text-gray-400">Rendered from markdown</span>
          </div>
          <TablePreview text={getTableContent(value)} />
        </div>
      )}

      {/* ── Paste textarea ── */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={textareaRows}
        placeholder={placeholder}
        className={cn(
          "w-full resize-none rounded-none border-0 ring-0 focus-visible:ring-0",
          "bg-white dark:bg-gray-950 placeholder:text-gray-300 dark:placeholder:text-gray-600",
          "font-mono",
          textareaClassName,
          parseError && accent.error
        )}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />

      {/* ── Error message ── */}
      {parseError && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/20 border-t border-red-200 dark:border-red-800">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{parseError}</p>
        </div>
      )}

      {/* ── Parse / submit button ── */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {value && analysis && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Check className="h-3 w-3 text-emerald-500" />
              <span>{analysis.totalQuestions || 0} questions</span>
              {analysis.hasTables && (
                <span className="text-blue-400">· {analysis.tableCount} tables</span>
              )}
            </div>
          )}
          <p className="text-[10px] text-gray-400 leading-snug hidden sm:block">
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