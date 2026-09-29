"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { CompanySummary, InterviewSession } from "@/types";
import { CompanyKnowledgeCard } from "@/components/CompanyKnowledgeCard";
import { SourceTypeBadge } from "@/components/SourceTypeBadge";
import { EyeTrackingHUD } from "@/components/EyeTrackingHUD";
import {
  Video,
  Mic,
  MicOff,
  Send,
  Sparkles,
  ArrowRight,
  StopCircle,
  HelpCircle,
  Building2,
  Briefcase,
  Layers,
  CheckCircle2,
  Loader2,
  Award,
} from "lucide-react";

export default function MockInterviewPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Setup state
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("Amazon");
  const [targetRole, setTargetRole] = useState<string>("Software Engineer");
  const [recruiterPersona, setRecruiterPersona] = useState<string>("Technical Lead");
  const [difficulty, setDifficulty] = useState<string>("intermediate");
  const [companySummary, setCompanySummary] = useState<CompanySummary | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(true);

  // Active room state
  const [interview, setInterview] = useState<InterviewSession | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [candidateAnswer, setCandidateAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"text" | "speech">("text");

  // Telemetry metrics
  const [visionMetrics, setVisionMetrics] = useState({
    eyeContactPercentage: 88,
    facePresencePercentage: 100,
    lookAwayCount: 0,
  });

  // Load companies from /api/company-interviews
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.targetRole) {
      setTargetRole(user.targetRole);
    }

    api
      .get("/company-interviews")
      .then((res) => {
        if (res.success && Array.isArray(res.companies)) {
          setCompanies(res.companies);
          const initial = res.companies.find((c: any) => c.company === "Amazon") || res.companies[0];
          if (initial) {
            setSelectedCompany(initial.company);
            setCompanySummary(initial);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load companies:", err);
      })
      .finally(() => {
        setLoadingCompanies(false);
      });
  }, [authLoading, isAuthenticated, router, user]);

  const handleCompanyChange = (comp: string) => {
    setSelectedCompany(comp);
    const found = companies.find((c) => c.company.toLowerCase() === comp.toLowerCase());
    setCompanySummary(found || null);
  };

  const handleStartInterview = async () => {
    setIsStarting(true);
    try {
      const res = await api.post("/interviews", {
        companyTwin: selectedCompany,
        targetRole,
        recruiterPersona,
        difficulty,
      });

      if (res.success && res.interview) {
        setInterview(res.interview);
      }
    } catch (err: any) {
      alert(err.message || "Failed to start interview. Please ensure backend is running.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!interview || !candidateAnswer.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await api.post(`/interviews/${interview._id || interview.id}/answer`, {
        answer: candidateAnswer,
        visionMetrics,
      });

      if (res.success && res.interview) {
        setInterview(res.interview);
        setCandidateAnswer("");

        if (res.interview.isComplete) {
          router.push(`/interview/report/${res.interview._id || res.interview.id}`);
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishEarly = async () => {
    if (!interview) return;
    try {
      const res = await api.post(`/interviews/${interview._id || interview.id}/end`);
      const interviewId = res.interview?._id || res.interview?.id || interview._id || interview.id;
      router.push(`/interview/report/${interviewId}`);
    } catch (err: any) {
      alert(err.message || "Failed to finish interview.");
    }
  };

  const currentQIndex = interview?.currentQuestionIndex ?? 0;
  const currentQ = interview?.questions?.[currentQIndex];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* View 1: Setup Mode */}
      {!interview && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Setup Options */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                <Video className="h-4 w-4" />
                <span>AI Mock Interview Configuration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Company Twin & Dual-Source Grounding
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                Choose a company to ground your interview in verified question patterns, or input a custom company. Gemini AI personalizes questions for your target role.
              </p>

              <div className="mt-8 space-y-5">
                {/* Company Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Select Target Company</span>
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {companies.map((c) => (
                      <option key={c.company} value={c.company}>
                        {c.company} ({c.totalQuestions} Questions)
                      </option>
                    ))}
                    <option value="Custom Company">Custom Company / Startup</option>
                  </select>
                </div>

                {/* Target Role & Recruiter Persona */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Target Role (Independent Context)</span>
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Java Developer, Data Analyst"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Recruiter Persona</span>
                    </label>
                    <select
                      value={recruiterPersona}
                      onChange={(e) => setRecruiterPersona(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Technical Lead">Technical Lead (Architecture & Depth)</option>
                      <option value="Bar Raiser / Senior Engineer">Bar Raiser (Scalability & Principles)</option>
                      <option value="Hiring Manager">Hiring Manager (Impact & Collaboration)</option>
                      <option value="HR Recruiter">HR Recruiter (Culture & Motivation)</option>
                    </select>
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["beginner", "intermediate", "advanced"].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`rounded-xl border py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                          difficulty === lvl
                            ? "border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-md"
                            : "border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  type="button"
                  onClick={handleStartInterview}
                  disabled={isStarting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-600/30 hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 mt-6"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Initializing Dual-Source Grounding...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Interview Room</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Col: Company Knowledge Card & Vision Setup */}
          <div className="space-y-6">
            <CompanyKnowledgeCard
              companyName={selectedCompany}
              summary={companySummary}
              isLoading={loadingCompanies}
            />

            {/* Camera Preview HUD */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-indigo-400" />
                <span>Webcam & Eye-Tracking HUD Preview</span>
              </h3>
              <EyeTrackingHUD onMetricsUpdate={setVisionMetrics} />
              <p className="mt-2 text-[11px] text-slate-500 text-center">
                MediaPipe face mesh tracks your gaze alignment and eye contact in real time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Active Interview Room Mode */}
      {interview && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Question Prompt & Answer Area */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
              {/* Question Header & Source Attribution Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-bold text-indigo-400">
                    Q{currentQIndex + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Question {currentQIndex + 1} of {interview.totalQuestions}
                  </span>
                </div>

                {/* Grounding Source Badge */}
                <SourceTypeBadge
                  sourceType={currentQ?.sourceType}
                  whyThisQuestion={currentQ?.whyThisQuestion}
                  sourceId={currentQ?.sourceId}
                />
              </div>

              {/* Current Question Text */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 mb-6">
                <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
                  {currentQ?.question || "Tell me about yourself and your background."}
                </p>
                {currentQ?.category && (
                  <span className="inline-block mt-3 rounded-md bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-indigo-300 border border-slate-700">
                    Category: {currentQ.category}
                  </span>
                )}
              </div>

              {/* Input Area */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Your Response
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRecording(!isRecording)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                        isRecording
                          ? "bg-rose-500 text-white animate-pulse"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {isRecording ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                      <span>{isRecording ? "Listening..." : "Speech Mode"}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  placeholder="Structure your response clearly using the STAR method (Situation, Task, Action, Result) or discuss architectural trade-offs..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                />

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleFinishEarly}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
                  >
                    <StopCircle className="h-4 w-4" />
                    <span>Conclude & Generate Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={isSubmitting || !candidateAnswer.trim()}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Evaluating Depth...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Answer</span>
                        <Send className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Camera HUD & Real-Time Interview Context */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Camera Feed with HUD */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-indigo-400" />
                  <span>Real-Time Vision & Eye-Tracking HUD</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Live
                </span>
              </div>

              <EyeTrackingHUD onMetricsUpdate={setVisionMetrics} />
            </div>

            {/* Session Context Summary */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 text-xs">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>Session Context</span>
              </h4>

              <div className="flex justify-between py-1 border-b border-slate-800/80 text-slate-400">
                <span>Target Company:</span>
                <strong className="text-white">{interview.companyTwin}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80 text-slate-400">
                <span>Role:</span>
                <strong className="text-white">{interview.targetRole}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80 text-slate-400">
                <span>Interviewer Persona:</span>
                <strong className="text-white">{interview.recruiterPersona}</strong>
              </div>
              <div className="flex justify-between py-1 text-slate-400">
                <span>Grounding Architecture:</span>
                <strong className="text-indigo-300">Dual-Source AI</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
