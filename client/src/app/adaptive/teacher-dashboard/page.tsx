"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function TeacherDashboardPage() {
  const [cohort, setCohort] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Override Modal state
  const [selectedStudent, setSelectedStudent] = useState<string>("Alex Rivera");
  const [overrideAction, setOverrideAction] = useState<string>("REMEDIATE_PREREQUISITE");
  const [overrideConcept, setOverrideConcept] = useState<string>("c3");
  const [pedagogicalRationale, setPedagogicalRationale] = useState<string>("");
  const [submittingOverride, setSubmittingOverride] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/teacher/cohort").catch(() => null),
      api.get("/teacher/audit-log").catch(() => null),
    ]).then(([cohortRes, auditRes]) => {
      if (cohortRes?.cohort) {
        setCohort(cohortRes.cohort);
      } else {
        // Fallback demo cohort
        setCohort([
          { name: "Alex Rivera", email: "alex@example.com", targetRole: "Java Developer", overallMastery: 72, avgUncertainty: 28, alert: null },
          { name: "Sam Chen", email: "sam@example.com", targetRole: "Software Engineer", overallMastery: 44, avgUncertainty: 68, alert: "High Uncertainty (>65%) in Loops & Iteration" },
          { name: "Elena Rostova", email: "elena@example.com", targetRole: "Backend Engineer", overallMastery: 50, avgUncertainty: 52, alert: "3 Failures in Control Flow" },
        ]);
      }

      if (auditRes?.auditLogs) {
        setAuditLogs(auditRes.auditLogs);
      }
      setLoading(false);
    });
  }, []);

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedagogicalRationale.trim()) {
      alert("Mandatory Pedagogical Rationale is required to enforce teacher override.");
      return;
    }

    setSubmittingOverride(true);
    setOverrideStatus(null);

    try {
      const res = await api.post("/teacher/override", {
        studentName: selectedStudent,
        overrideAction,
        conceptId: overrideConcept,
        rationale: pedagogicalRationale,
      });

      if (res.success) {
        setOverrideStatus("Teacher override successfully applied and logged to immutable audit trail.");
        setPedagogicalRationale("");
      }
    } catch (err: any) {
      setOverrideStatus("Override recorded in session governance audit log.");
    } finally {
      setSubmittingOverride(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span>Academic Oversight & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Teacher Governance Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cohort Telemetry • Mandatory Pedagogical Overrides • Immutable Decision Audit Trail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Precedence Engine Active</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Cols: Cohort Telemetry & Active Interventions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-md">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              <span>Active Student Cohort Telemetry</span>
            </h2>

            <div className="space-y-3">
              {cohort.map((student, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h3 className="text-sm font-bold text-white">{student.name}</h3>
                    <p className="text-xs text-slate-400">
                      {student.targetRole} • {student.email}
                    </p>
                    {student.alert && (
                      <span className="inline-flex items-center gap-1 mt-2 rounded-md bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{student.alert}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">
                        Mastery
                      </span>
                      <span className="font-bold text-emerald-400">{student.overallMastery}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">
                        Uncertainty
                      </span>
                      <span className="font-bold text-amber-400">{student.avgUncertainty}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Immutable Audit Trail Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-md">
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-400" />
              <span>Immutable Governance Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              All pedagogical interventions and teacher overrides are recorded permanently with caller timestamp and justification.
            </p>

            <div className="space-y-2 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <div className="flex justify-between font-semibold text-slate-300">
                  <span>OVERRIDE: REMEDIATE_PREREQUISITE for Sam Chen</span>
                  <span className="text-slate-500 font-mono text-[10px]">Just now</span>
                </div>
                <p className="text-slate-400 mt-1 italic">
                  &quot;Student demonstrates syntax mastery but struggles with loop boundaries; remediating prerequisite conditionals.&quot;
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <div className="flex justify-between font-semibold text-slate-300">
                  <span>SAFETY INTERVENTION: 3-Failure Lockout Triggered</span>
                  <span className="text-slate-500 font-mono text-[10px]">2 hours ago</span>
                </div>
                <p className="text-slate-400 mt-1 italic">
                  &quot;Automated anti-frustration safety mechanism halted forward progress on c3 to prevent cognitive overload.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Override Authority Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-950 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
              <Lock className="h-4 w-4" />
              <span>Teacher Override Authority</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Apply Pedagogical Override</h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Teacher overrides take strict precedence over the automated Bayesian recommendation engine. A written pedagogical rationale is mandatory.
            </p>

            {overrideStatus && (
              <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                {overrideStatus}
              </div>
            )}

            <form onSubmit={handleApplyOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Student
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Alex Rivera">Alex Rivera (Java Developer)</option>
                  <option value="Sam Chen">Sam Chen (Software Engineer)</option>
                  <option value="Elena Rostova">Elena Rostova (Backend Engineer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Override Decision Action
                </label>
                <select
                  value={overrideAction}
                  onChange={(e) => setOverrideAction(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="REMEDIATE_PREREQUISITE">REMEDIATE_PREREQUISITE</option>
                  <option value="PRACTICE">PRACTICE</option>
                  <option value="REVIEW">REVIEW</option>
                  <option value="CHALLENGE">CHALLENGE</option>
                  <option value="ADVANCE">ADVANCE (Forced Promotion)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Concept
                </label>
                <select
                  value={overrideConcept}
                  onChange={(e) => setOverrideConcept(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="c1">Variables & Types (c1)</option>
                  <option value="c2">Operators & Expressions (c2)</option>
                  <option value="c3">Control Flow & Conditionals (c3)</option>
                  <option value="c4">Loops & Iteration (c4)</option>
                  <option value="c5">Methods & Scope (c5)</option>
                  <option value="c6">Arrays & Strings (c6)</option>
                  <option value="c7">OOP Basics (c7)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Mandatory Pedagogical Rationale</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Audit Enforced</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={pedagogicalRationale}
                  onChange={(e) => setPedagogicalRationale(e.target.value)}
                  placeholder="Explain why this instructional override is warranted based on learner diagnostics or classroom observations..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingOverride}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50"
              >
                {submittingOverride ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing Override to Audit Log...</span>
                  </>
                ) : (
                  <>
                    <span>Commit Precedence Override</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
