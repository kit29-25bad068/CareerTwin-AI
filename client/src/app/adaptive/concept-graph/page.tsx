"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  ArrowRight,
  Play,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
} from "lucide-react";

interface ConceptNode {
  id: string;
  title: string;
  domain: string;
  difficulty: string;
  mastery: number;
  uncertainty: number;
  status: "MASTERED" | "IN_PROGRESS" | "READY" | "LOCKED";
  x: number;
  y: number;
  prereqs: string[];
}

const NODES: ConceptNode[] = [
  { id: "c1", title: "Variables & Types", domain: "Syntax", difficulty: "beginner", mastery: 95, uncertainty: 12, status: "MASTERED", x: 100, y: 150, prereqs: [] },
  { id: "c2", title: "Operators & Expressions", domain: "Syntax", difficulty: "beginner", mastery: 90, uncertainty: 15, status: "MASTERED", x: 260, y: 150, prereqs: ["c1"] },
  { id: "c3", title: "Control Flow & Conditionals", domain: "Logic", difficulty: "beginner", mastery: 65, uncertainty: 32, status: "IN_PROGRESS", x: 420, y: 100, prereqs: ["c2"] },
  { id: "c4", title: "Loops & Iteration", domain: "Logic", difficulty: "beginner", mastery: 58, uncertainty: 38, status: "IN_PROGRESS", x: 420, y: 220, prereqs: ["c2"] },
  { id: "c5", title: "Methods & Scope", domain: "Modular", difficulty: "intermediate", mastery: 40, uncertainty: 55, status: "READY", x: 580, y: 160, prereqs: ["c3", "c4"] },
  { id: "c6", title: "Arrays & Strings", domain: "Data", difficulty: "intermediate", mastery: 30, uncertainty: 62, status: "READY", x: 740, y: 100, prereqs: ["c4", "c5"] },
  { id: "c7", title: "OOP Basics & Classes", domain: "OOP", difficulty: "intermediate", mastery: 25, uncertainty: 70, status: "READY", x: 740, y: 220, prereqs: ["c5"] },
  { id: "c8", title: "Inheritance & Super", domain: "OOP", difficulty: "intermediate", mastery: 0, uncertainty: 85, status: "LOCKED", x: 900, y: 160, prereqs: ["c7"] },
  { id: "c9", title: "Polymorphism & Overriding", domain: "OOP", difficulty: "advanced", mastery: 0, uncertainty: 90, status: "LOCKED", x: 1060, y: 100, prereqs: ["c8"] },
  { id: "c10", title: "Interfaces & Abstraction", domain: "OOP", difficulty: "advanced", mastery: 0, uncertainty: 90, status: "LOCKED", x: 1060, y: 220, prereqs: ["c8"] },
  { id: "c11", title: "Exception Handling", domain: "Reliability", difficulty: "advanced", mastery: 0, uncertainty: 95, status: "LOCKED", x: 1220, y: 100, prereqs: ["c9"] },
  { id: "c12", title: "Collections Framework", domain: "Data", difficulty: "advanced", mastery: 0, uncertainty: 95, status: "LOCKED", x: 1220, y: 220, prereqs: ["c6", "c10"] },
];

export default function ConceptGraphPage() {
  const [selectedNode, setSelectedNode] = useState<ConceptNode>(NODES[2]); // c3 Control Flow

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <GitBranch className="h-4 w-4" />
            <span>Bounded Knowledge Graph</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Java Programming Fundamentals
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            12 Structured Concepts • 15 Directed Prerequisite Edges • Recursive Blocker Tracing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/adaptive/mastery"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all"
          >
            <span>Mastery & Uncertainty</span>
          </Link>
          <Link
            href="/adaptive/teacher-dashboard"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-all"
          >
            <span>Teacher Governance</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Interactive SVG Dependency Graph */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-6 shadow-2xl overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-indigo-400" />
              <span>Interactive Prerequisite Graph Canvas</span>
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Mastered
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-400" /> In Progress
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Ready
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-600" /> Locked
              </span>
            </div>
          </div>

          <svg width={1350} height={340} className="w-full h-auto min-w-[900px]">
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
              </marker>
            </defs>

            {/* Directed Prerequisite Connections */}
            {NODES.map((node) =>
              node.prereqs.map((prereqId) => {
                const target = NODES.find((n) => n.id === prereqId);
                if (!target) return null;
                return (
                  <line
                    key={`${target.id}-${node.id}`}
                    x1={target.x}
                    y1={target.y}
                    x2={node.x}
                    y2={node.y}
                    stroke="#334155"
                    strokeWidth={2}
                    markerEnd="url(#arrow)"
                  />
                );
              })
            )}

            {/* Concept Nodes */}
            {NODES.map((node) => {
              const isSelected = selectedNode.id === node.id;
              let fill = "#0f172a";
              let stroke = "#334155";
              let textColor = "#94a3b8";

              if (node.status === "MASTERED") {
                stroke = "#10b981";
                textColor = "#34d399";
              } else if (node.status === "IN_PROGRESS") {
                stroke = "#6366f1";
                textColor = "#a5b4fc";
              } else if (node.status === "READY") {
                stroke = "#f59e0b";
                textColor = "#fcd34d";
              }

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 28 : 24}
                    fill={fill}
                    stroke={isSelected ? "#ffffff" : stroke}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all"
                  />
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={10}
                    fontWeight="bold"
                  >
                    {node.mastery}%
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 42}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize={11}
                    fontWeight="600"
                    className="pointer-events-none"
                  >
                    {node.title.length > 18 ? node.title.slice(0, 16) + "…" : node.title}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right 4 Cols: Concept Inspector Side Drawer */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Concept Inspector
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  selectedNode.status === "MASTERED"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : selectedNode.status === "IN_PROGRESS"
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {selectedNode.status}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{selectedNode.title}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Domain: <strong className="text-slate-300">{selectedNode.domain}</strong> • Difficulty: <strong className="text-indigo-300 capitalize">{selectedNode.difficulty}</strong>
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  Mastery Level
                </span>
                <p className="text-2xl font-black text-indigo-400 mt-0.5">
                  {selectedNode.mastery}%
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  Epistemic Uncertainty
                </span>
                <p className="text-2xl font-black text-amber-400 mt-0.5">
                  {selectedNode.uncertainty}%
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Prerequisite Ancestors:
              </span>
              {selectedNode.prereqs.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.prereqs.map((prereq) => {
                    const match = NODES.find((n) => n.id === prereq);
                    return (
                      <span
                        key={prereq}
                        className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300 border border-slate-700"
                      >
                        {match?.title || prereq}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500">None (Foundational Entrypoint)</p>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 mt-6">
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Launch Practice on {selectedNode.title}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
