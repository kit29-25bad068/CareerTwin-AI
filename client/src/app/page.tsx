import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Video,
  GitBranch,
  FileText,
  Brain,
  Code2,
  Eye,
  Building2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-blue-600/20 blur-[120px]" />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 shadow-inner mb-6 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Evidence-Driven Adaptive Career Intelligence</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="block text-white">Don&apos;t just prepare for interviews.</span>
          <span className="block bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent mt-2">
            Build your career with an AI that grows with you.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
          CareerTwin AI constructs an evolving <strong>Digital Career Twin</strong> by synthesizing
          verified coding mastery, real company interview datasets (985 questions), MediaPipe eyeball & gaze tracking, and ATS resume intelligence.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/interview"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-600/25 hover:from-blue-500 hover:to-purple-500 transition-all transform hover:-translate-y-0.5"
          >
            <Video className="h-4 w-4" />
            <span>Start AI Mock Interview</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/adaptive/concept-graph"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all"
          >
            <GitBranch className="h-4 w-4 text-indigo-400" />
            <span>Explore Adaptive Graph</span>
          </Link>

          <Link
            href="/resume"
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-5 py-3.5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
          >
            <FileText className="h-4 w-4" />
            <span>Resume & CV Analyzer</span>
          </Link>
        </div>

        {/* Live Feature Highlights */}
        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 text-left">
          {/* Card 1 */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-xl backdrop-blur-sm hover:border-indigo-500/40 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">985 Company Questions Grounding</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Curated questions across Amazon, Google, Microsoft, Zoho, Apple, Meta, TCS, Infosys, Adobe, and Startups. Dual-source grounding combines verified datasets with Gemini personalization.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-xl backdrop-blur-sm hover:border-indigo-500/40 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-4">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Vision & Eyeball Gaze Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time camera overlay tracks eye contact percentage, face presence, and posture stability while analyzing speech cadence, WPM, and filler words.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-xl backdrop-blur-sm hover:border-indigo-500/40 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <GitBranch className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Adaptive Learning System</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              12-concept Java Knowledge Graph with 15 prerequisite edges, anti-gaming heuristics, 14-day decay tracking, and 6 pedagogical actions (Advance, Practice, Remediate).
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-xl backdrop-blur-sm hover:border-indigo-500/40 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Codolio & GitHub Cross-Platform</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synchronize competitive coding stats from LeetCode, CodeChef, and Codeforces via Codolio, verified alongside GitHub repos with one-account anti-sharing constraints.
            </p>
          </div>

          {/* Card 5 */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-xl backdrop-blur-sm hover:border-indigo-500/40 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Dual-Engine Resume & CV Analyzer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrated live Vercel analyzer paired with CareerTwin&apos;s MongoDB ATS skills extractor to compute resume quality and skill coverage.
            </p>
          </div>

          {/* Card 6 */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-xl backdrop-blur-sm hover:border-indigo-500/40 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Teacher Governance & Audit Log</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cohort tracking with intervention triggers, mandatory pedagogical override rationales, and an immutable audit trail for transparent academic oversight.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
