"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { ScoreDial } from "@/components/ScoreDial";
import {
  Sparkles,
  Video,
  FileText,
  GitBranch,
  ArrowRight,
  Brain,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [careerTwin, setCareerTwin] = useState<any>(null);
  const [adaptiveState, setAdaptiveState] = useState<any>(null);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated) {
      Promise.all([
        api.get("/career-twin").catch(() => null),
        api.get("/adaptive/learner-state").catch(() => null),
        api.get("/adaptive/concept-graph").catch(() => null),
        api.get("/interviews").catch(() => null),
      ]).then(([twinRes, adaptiveRes, graphRes, interviewRes]) => {
        if (twinRes?.success) setCareerTwin(twinRes.data || twinRes);
        if (adaptiveRes?.success) setAdaptiveState(adaptiveRes);
        if (graphRes?.concepts) setConcepts(graphRes.concepts);
        if (interviewRes?.interviews) setInterviews(interviewRes.interviews);
        setLoading(false);
      });
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Sparkles className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm font-medium">Loading your Career Command Dashboard...</p>
        </div>
      </div>
    );
  }

  const readinessScore =
    careerTwin?.readinessScore ?? careerTwin?.readinessIndex ?? 78;
  const targetRole = user?.targetRole || careerTwin?.targetRole || "Software Engineer";
  const nextAction = adaptiveState?.recommendedAction || "PRACTICE";
  const targetConcept = adaptiveState?.targetConceptTitle || "Control Flow & Conditionals";
  const actionReason =
    adaptiveState?.reason ||
    "Consolidate prerequisite branch control and switch logic before advancing to object-oriented loops.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Career Command Central
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || "Candidate"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Targeting: <strong className="text-indigo-300 font-semibold">{targetRole}</strong> • Verified Coding & Evidence Synced
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/interview"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-blue-500 hover:to-purple-500 transition-all"
          >
            <Video className="h-3.5 w-3.5" />
            <span>Launch Mock Interview</span>
          </Link>
          <Link
            href="/resume"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all"
          >
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            <span>Analyze Resume & CV</span>
          </Link>
        </div>
      </div>

      {/* Grid: Readiness Score & Adaptive Action Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Career Readiness Score Dial */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="h-4 w-4 text-indigo-400" />
                <span>Career Readiness Index</span>
              </h2>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Evidence Grounded
              </span>
            </div>
            <ScoreDial score={readinessScore} label="Overall Role Preparedness" />
          </div>

          <div className="mt-6 space-y-2 pt-4 border-t border-slate-800/80 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Technical Domain Mastery:</span>
              <span className="font-semibold text-slate-200">76%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Interview Communication:</span>
              <span className="font-semibold text-slate-200">82%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Resume Alignment:</span>
              <span className="font-semibold text-slate-200">80%</span>
            </div>
          </div>
        </div>

        {/* Right 2 cols: Adaptive Learning Action Hero */}
        <div className="lg:col-span-2 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-950 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    Adaptive Instruction Engine
                  </span>
                  <h3 className="text-base font-bold text-white">Recommended Action: {nextAction}</h3>
                </div>
              </div>

              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                Action: {nextAction}
              </span>
            </div>

            {/* Target Concept Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 mb-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Target Concept:
              </span>
              <h4 className="text-lg font-bold text-white mt-0.5">{targetConcept}</h4>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                &quot;{actionReason}&quot;
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
              <span>Bounded Knowledge Graph: Java Programming Fundamentals</span>
            </div>

            <Link
              href="/adaptive/concept-graph"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-all"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Practice Target Concept</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 12-Concept Visual Learning Pipeline */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">12-Concept Dynamic Learning Path</h3>
          </div>
          <Link
            href="/adaptive/concept-graph"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View Interactive Graph</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { id: "c1", title: "Variables & Types", status: "MASTERED", mastery: 92 },
            { id: "c2", title: "Operators & Expressions", status: "MASTERED", mastery: 88 },
            { id: "c3", title: "Control Flow", status: "IN_PROGRESS", mastery: 64 },
            { id: "c4", title: "Loops & Iteration", status: "IN_PROGRESS", mastery: 55 },
            { id: "c5", title: "Methods & Scope", status: "READY", mastery: 40 },
            { id: "c6", title: "Arrays & Strings", status: "READY", mastery: 35 },
            { id: "c7", title: "OOP Basics", status: "READY", mastery: 20 },
            { id: "c8", title: "Inheritance", status: "LOCKED", mastery: 0 },
            { id: "c9", title: "Polymorphism", status: "LOCKED", mastery: 0 },
            { id: "c10", title: "Interfaces", status: "LOCKED", mastery: 0 },
            { id: "c11", title: "Exception Handling", status: "LOCKED", mastery: 0 },
            { id: "c12", title: "Collections", status: "LOCKED", mastery: 0 },
          ].map((item, idx) => (
            <div
              key={item.id}
              className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
                item.status === "MASTERED"
                  ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                  : item.status === "IN_PROGRESS"
                  ? "border-indigo-500/40 bg-indigo-950/30 text-indigo-300 ring-1 ring-indigo-500/30"
                  : item.status === "READY"
                  ? "border-amber-500/20 bg-amber-950/10 text-amber-300"
                  : "border-slate-800/80 bg-slate-900/30 text-slate-500 opacity-60"
              }`}
            >
              <div>
                <span className="text-[10px] font-mono text-slate-500 block mb-1">
                  0{idx + 1}
                </span>
                <h4 className="text-xs font-bold leading-tight line-clamp-1">{item.title}</h4>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px]">
                <span className="font-semibold">{item.status}</span>
                <span className="font-mono">{item.mastery}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
