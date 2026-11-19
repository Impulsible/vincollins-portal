// src/components/shared/QuestionContent.tsx

"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Maximize2, X } from "lucide-react";

interface QuestionContentProps {
  text: string;
  imageUrl?: string;
  imageCaption?: string;
  className?: string;
}

export function hasTable(text: string): boolean {
  if (!text) return false;
  return /\|.+\|\n\|[-:\s|]+\|/g.test(text);
}

export function QuestionContent({
  text,
  imageUrl,
  imageCaption,
  className,
}: QuestionContentProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const segments = useMemo(() => {
    if (!text) return [];

    const lines = text.split("\n");
    const result: Array<{ type: "text" | "table"; content: string | string[][] }> = [];
    let currentTable: string[] = [];
    let currentText: string[] = [];

    const flushText = () => {
      if (currentText.length > 0) {
        result.push({ type: "text", content: currentText.join("\n") });
        currentText = [];
      }
    };

    const flushTable = () => {
      if (currentTable.length > 0) {
        const rows = currentTable
          .filter((l) => l.trim().startsWith("|") && l.trim().endsWith("|"))
          .map((l) =>
            l
              .split("|")
              .slice(1, -1)
              .map((c) => c.trim())
          );

        // Filter out separator lines (|---|---|)
        const validRows = rows.filter(
          (row) => !row.every((cell) => /^[-:\s]+$/.test(cell))
        );

        if (validRows.length > 0) {
          result.push({ type: "table", content: validRows });
        }
        currentTable = [];
      }
    };

    for (const line of lines) {
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        flushText();
        currentTable.push(line.trim());
      } else {
        if (currentTable.length > 0) flushTable();
        currentText.push(line);
      }
    }

    flushTable();
    flushText();

    return result;
  }, [text]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* 1. TEXT AND TABLES */}
      {segments.map((seg, idx) => {
        if (seg.type === "text") {
          return (
            <p
              key={idx}
              className="whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200"
            >
              {seg.content as string}
            </p>
          );
        }

        const tableData = seg.content as string[][];
        const headers = tableData[0] || [];
        const rows = tableData.slice(1);

        return (
          <div
            key={idx}
            className="my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm"
          >
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
                  {headers.map((h, hIdx) => (
                    <th
                      key={hIdx}
                      className="px-4 py-2.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                      dangerouslySetInnerHTML={{ __html: h }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="transition-colors hover:bg-purple-50/30 dark:hover:bg-purple-950/20"
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-4 py-2 text-slate-700 dark:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: cell }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* 2. DIAGRAM CONTAINER */}
      {imageUrl && (
        <div className="pt-2">
          <div className="relative inline-block group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <img
              src={imageUrl}
              alt={imageCaption || "Question Diagram"}
              className="max-h-64 sm:max-h-80 w-auto object-contain rounded-lg"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-black/80"
              title="Click to Zoom Diagram"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            {imageCaption && (
              <p className="p-2 text-center text-xs text-slate-500 dark:text-slate-400 font-medium italic border-t border-slate-200 dark:border-slate-800">
                {imageCaption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. LIGHTBOX DIALOG */}
      {isZoomed && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute -top-3 -right-3 p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={imageUrl}
              alt={imageCaption || "Diagram"}
              className="max-h-[80vh] w-auto object-contain rounded-xl mx-auto"
            />
            {imageCaption && (
              <p className="mt-2 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                {imageCaption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}