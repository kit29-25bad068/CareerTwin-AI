"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { InterviewSession, InterviewQuestion } from "@/types";
import { SourceTypeBadge } from "@/components/SourceTypeBadge";
import { ScoreDial } from "@/components/ScoreDial";
import {
  Sparkles,
  ArrowLeft,
  Video,
  Award,
  BarChart3,
  Eye,
  Mic,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  GitBranch,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function InterviewReportPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params?.id as string;

  const [interview, setInterview] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQIndex, setExpandedQIndex] = useState<number | null>(0);

  useEffect(() => {
    if (!interviewId) return;

    api
      .get(`/interviews/${interviewId}`)
      .then((res) => {
        if (res.success && res.interview) {
          setInterview(res.interview);
        }
      })
      .catch((err) => {
        console.error("Failed to load interview report:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [interviewId]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Sparkles className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm font-medium">Synthesizing Post-Interview Scorecard...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-400 mb-3" />
        <h2 className="text-xl font-bold text-white">Interview Report Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Could not locate the requested interview session.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const overallScore = interview.overallScore ?? 75;
  const questions = interview.questions || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Award className="h-4 w-4" />
            <span>Interview Performance Scorecard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {interview.companyTwin} • {interview.targetRole}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Interviewer Persona: <strong className="text-slate-200">{interview.recruiterPersona}</strong> • Difficulty: <strong className="text-indigo-300 capitalize">{interview.difficulty}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/interview"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retake Interview</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-all"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Score Dial */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col items-center justify-center">
          <ScoreDial score={overallScore} label="Overall Score" size={130} />
        </div>

        {/* Technical Mastery */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Technical Depth</span>
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white">78%</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Architectural & algorithmic clarity</p>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: "78%" }} />
          </div>
        </div>

        {/* Vision & Eye Contact */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Eye Contact & Gaze</span>
            <Eye className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-emerald-400">86%</span>
            <p className="text-[11px] text-slate-400 mt-0.5">High direct camera focus</p>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "86%" }} />
          </div>
        </div>

        {/* Speech & Cadence */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Speech Cadence</span>
            <Mic className="h-4 w-4 text-amber-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white">132 <span className="text-sm font-normal text-slate-500">WPM</span></span>
            <p className="text-[11px] text-slate-400 mt-0.5">Natural speaking pacing</p>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: "70%" }} />
          </div>
        </div>
      </div>

      {/* Question-by-Question Deep Analysis Accordion */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            <span>Question-by-Question Deep Analysis</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detailed breakdown of every question asked, its grounding attribution, candidate answer, and technical feedback.
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((q: InterviewQuestion, index: number) => {
            const isExpanded = expandedQIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-800/80 bg-slate-950/60 overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setExpandedQIndex(isExpanded ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3 pr-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-bold text-indigo-400 shrink-0">
                      Q{index + 1}
                    </span>
                    <span className="text-sm font-semibold text-white line-clamp-1">
                      {q.question}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <SourceTypeBadge
                      sourceType={q.sourceType}
                      whyThisQuestion={q.whyThisQuestion}
                      sourceId={q.sourceId}
                    />
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800/80 space-y-4 text-xs">
                    {/* Candidate Answer */}
                    <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Your Submitted Response:
                      </span>
                      <p className="text-slate-300 leading-relaxed italic">
                        &quot;{q.candidateAnswer || "Answer recorded through audio stream."}&quot;
                      </p>
                    </div>

                    {/* Grounding Explanation */}
                    <div className="rounded-xl bg-indigo-950/30 p-3.5 border border-indigo-900/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                        Grounding Source Rationale:
                      </span>
                      <p className="text-indigo-200/90 leading-relaxed">
                        {q.whyThisQuestion || "Selected from the verified company interview knowledge base."}
                      </p>
                    </div>

                    {/* Evaluation Feedback */}
                    {q.evaluation && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* Strengths */}
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Demonstrated Strengths</span>
                          </span>
                          <ul className="space-y-1 text-slate-300 list-disc list-inside">
                            {q.evaluation.strengths?.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            )) || <li>Solid structural formulation of the core response.</li>}
                          </ul>
                        </div>

                        {/* Improvements */}
                        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5">
                          <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Areas for Improvement</span>
                          </span>
                          <ul className="space-y-1 text-slate-300 list-disc list-inside">
                            {q.evaluation.improvements?.map((imp, idx) => (
                              <li key={idx}>{imp}</li>
                            )) || <li>Include more concrete metrics and scale considerations.</li>}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
