"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GitBranch, BarChart3, HelpCircle, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

export default function MasteryPage() {
  const [concepts] = useState([
    { id: "c1", title: "Variables & Types", domain: "Syntax", mastery: 95, uncertainty: 12 },
    { id: "c2", title: "Operators & Expressions", domain: "Syntax", mastery: 90, uncertainty: 15 },
    { id: "c3", title: "Control Flow & Conditionals", domain: "Logic", mastery: 65, uncertainty: 32 },
    { id: "c4", title: "Loops & Iteration", domain: "Logic", mastery: 58, uncertainty: 38 },
    { id: "c5", title: "Methods & Scope", domain: "Modular", mastery: 40, uncertainty: 55 },
    { id: "c6", title: "Arrays & Strings", domain: "Data", mastery: 30, uncertainty: 62 },
    { id: "c7", title: "OOP Basics & Classes", domain: "OOP", mastery: 25, uncertainty: 70 },
    { id: "c8", title: "Inheritance & Super", domain: "OOP", mastery: 0, uncertainty: 85 },
    { id: "c9", title: "Polymorphism & Overriding", domain: "OOP", mastery: 0, uncertainty: 90 },
    { id: "c10", title: "Interfaces & Abstraction", domain: "OOP", mastery: 0, uncertainty: 90 },
    { id: "c11", title: "Exception Handling", domain: "Reliability", mastery: 0, uncertainty: 95 },
    { id: "c12", title: "Collections Framework", domain: "Data", mastery: 0, uncertainty: 95 },
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <BarChart3 className="h-4 w-4" />
            <span>Epistemic State Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Mastery & Epistemic Uncertainty
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Independent tracking: Mastery represents demonstrated skill, Uncertainty measures epistemic confidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/adaptive/concept-graph"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all"
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>View Dependency Graph</span>
          </Link>
        </div>
      </div>

      {/* Concept Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {concepts.map((concept, idx) => (
          <div
            key={concept.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 hover:border-indigo-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">
                0{idx + 1} • {concept.domain}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  concept.mastery >= 80
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : concept.mastery >= 50
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {concept.mastery >= 80 ? "Mastered" : concept.mastery >= 50 ? "Proficient" : "Learning"}
              </span>
            </div>

            <h3 className="text-sm font-bold text-white line-clamp-1">{concept.title}</h3>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Mastery Level:</span>
                  <span className="font-bold text-emerald-400">{concept.mastery}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${concept.mastery}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Epistemic Uncertainty:</span>
                  <span className="font-bold text-amber-400">{concept.uncertainty}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${concept.uncertainty}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
