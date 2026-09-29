"use client";

import React from "react";
import { CompanySummary } from "@/types";
import { Database, ShieldCheck, Sparkles, Layers } from "lucide-react";

interface CompanyKnowledgeCardProps {
  companyName: string;
  summary?: CompanySummary | null;
  isLoading?: boolean;
}

export function CompanyKnowledgeCard({
  companyName,
  summary,
  isLoading = false,
}: CompanyKnowledgeCardProps) {
  if (!companyName) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-center text-xs text-slate-500">
        Select a target company to load its verified interview question dataset.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 animate-pulse flex items-center justify-center gap-2">
        <Database className="h-4 w-4 animate-spin text-indigo-400" />
        <span>Loading company interview knowledge base...</span>
      </div>
    );
  }

  if (summary) {
    const categories = Array.isArray(summary.availableCategories)
      ? summary.availableCategories
      : typeof summary.availableCategories === "string"
      ? (summary.availableCategories as string).split(" ")
      : [];

    return (
      <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-slate-900/80 to-slate-950 p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{summary.company}</span>
                <span className="text-[10px] font-medium text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Verified Dataset
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Grounding Source: {summary.metadata?.source || "Company Knowledge Base"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">Total Questions:</span>
            <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              {summary.totalQuestions} Questions
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-2">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>Available Normalized Domains:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 10).map((cat) => (
              <span
                key={cat}
                className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60"
              >
                {cat}
              </span>
            ))}
            {categories.length > 10 && (
              <span className="rounded-md bg-slate-800/40 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                +{categories.length - 10} more
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-indigo-300/80 bg-indigo-950/40 rounded-lg p-2 border border-indigo-900/40">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span>Dual-source grounding active: verified company questions are personalized using Gemini AI for your target role.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
      <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
        <Sparkles className="h-4 w-4" />
        <span>Custom Company Pattern Simulation</span>
      </div>
      <p className="text-slate-400 text-[11px] leading-relaxed">
        &quot;{companyName}&quot; is not in the curated 11-company dataset. CareerTwin will use role-based pattern derivation without fabricating data.
      </p>
    </div>
  );
}
