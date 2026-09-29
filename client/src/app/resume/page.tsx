"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { ScoreDial } from "@/components/ScoreDial";
import {
  FileText,
  Upload,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
} from "lucide-react";

export default function ResumePage() {
  const [activeTab, setActiveTab] = useState<"live" | "ats">("live");
  const [iframeLoading, setIframeLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // ATS Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("resume", selectedFile);

    try {
      const res = await api.post("/resume/upload", formData);
      if (res.success && res.resume) {
        setResumeData(res.resume);
      } else {
        setError(res.message || "Failed to parse resume.");
      }
    } catch (err: any) {
      setError(err.message || "Resume upload failed. Please ensure backend is running.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 ${isFullScreen ? "fixed inset-0 z-50 bg-slate-950 p-4 max-w-none" : ""}`}>
      {/* Top Header */}
      {!isFullScreen && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              <FileText className="h-4 w-4" />
              <span>Dual-Engine Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Resume & CV Analyzer
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Pairing the interactive Vercel CV Analyzer with CareerTwin&apos;s MongoDB ATS extraction engine.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950/80 p-1">
            <button
              onClick={() => setActiveTab("live")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "live"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Live CV Analyzer</span>
            </button>
            <button
              onClick={() => setActiveTab("ats")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "ats"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>CareerTwin ATS Synced</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 1: Live Embedded Vercel App */}
      {activeTab === "live" && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-md flex flex-col h-[75vh]">
          {/* Iframe Utility Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Engine: https://resume-cv-analyzer.vercel.app/</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIframeLoading(true)}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                title="Reload"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Reload</span>
              </button>

              <a
                href="https://resume-cv-analyzer.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">Open in New Tab</span>
              </a>

              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {isFullScreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                <span className="hidden sm:inline">{isFullScreen ? "Exit Fullscreen" : "Fullscreen"}</span>
              </button>
            </div>
          </div>

          {/* Iframe Frame */}
          <div className="relative flex-1 w-full bg-slate-950">
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 gap-3 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <p className="text-xs font-medium">Connecting to Resume & CV Analyzer engine...</p>
              </div>
            )}
            <iframe
              src="https://resume-cv-analyzer.vercel.app/"
              title="Resume & CV Analyzer"
              className="h-full w-full border-0"
              onLoad={() => setIframeLoading(false)}
              allow="clipboard-read; clipboard-write"
            />
          </div>
        </div>
      )}

      {/* Tab 2: CareerTwin Synced ATS Parser */}
      {activeTab === "ats" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: Upload Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
              <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Upload PDF Resume</span>
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Parse skills directly into your Digital Career Twin to calibrate your Career Readiness Index.
              </p>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/60 p-6 text-center transition-colors">
                  <FileText className="mx-auto h-10 w-10 text-slate-600 mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                      Choose PDF File
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      required
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {selectedFile ? selectedFile.name : "Maximum file size 10MB"}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Parsing ATS Keywords...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload & Extract Skills</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right 7 Cols: Extracted Results */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>Career Twin ATS Feedback</span>
              </h2>

              {resumeData ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <ScoreDial
                      score={resumeData.scores?.overall || 82}
                      label="ATS Score"
                      size={120}
                    />
                    <div className="space-y-1 text-xs">
                      <div className="text-slate-400">
                        Impact & Metrics: <strong className="text-white">{resumeData.scores?.quantifiableImpact || 80}%</strong>
                      </div>
                      <div className="text-slate-400">
                        Technical Skill Density: <strong className="text-white">{resumeData.scores?.keywordMatch || 85}%</strong>
                      </div>
                      <div className="text-slate-400">
                        Readability & Formatting: <strong className="text-white">{resumeData.scores?.formatting || 85}%</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white mb-2">Extracted Skills:</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {resumeData.skills?.map((sk: string, i: number) => (
                        <span
                          key={i}
                          className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/20"
                        >
                          {sk}
                        </span>
                      )) || <p className="text-xs text-slate-500">No skills parsed yet.</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center text-xs text-slate-500">
                  Upload your resume in PDF format to view ATS keyword matches, quantifiable impact scoring, and extracted skills.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
