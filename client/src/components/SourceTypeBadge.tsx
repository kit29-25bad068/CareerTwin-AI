"use client";

import React, { useState } from "react";
import { QuestionSourceType } from "@/types";
import { getSourceBadgeInfo } from "@/lib/utils";
import { Info, HelpCircle } from "lucide-react";

interface SourceTypeBadgeProps {
  sourceType?: QuestionSourceType;
  whyThisQuestion?: string;
  sourceId?: string;
}

export function SourceTypeBadge({
  sourceType = "generic_role_based",
  whyThisQuestion,
  sourceId,
}: SourceTypeBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const info = getSourceBadgeInfo(sourceType);

  return (
    <div className="relative inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm transition-all ${info.badgeClass}`}
      >
        <span>{info.label}</span>
      </span>

      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-300 transition-colors"
        title="Why this question?"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Why this?</span>
      </button>

      {showTooltip && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs text-slate-200 shadow-2xl backdrop-blur-md transition-all">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-400 mb-1">
            <Info className="h-4 w-4" />
            <span>Question Grounding Rationale</span>
          </div>
          <p className="text-slate-300 leading-relaxed mb-2">{info.description}</p>
          {whyThisQuestion && (
            <div className="rounded-lg bg-slate-950/70 p-2 border border-slate-800 text-[11px] text-slate-400 italic">
              &quot;{whyThisQuestion}&quot;
            </div>
          )}
          {sourceId && (
            <div className="mt-1 text-[10px] text-slate-500 font-mono">
              Source ID: {sourceId}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
