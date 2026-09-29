"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  Settings,
  Shield,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExportData = async () => {
    setExporting(true);
    setStatusMessage(null);
    try {
      const data = await api.get("/privacy/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `careertwin-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage("Career Twin data exported successfully.");
    } catch (err: any) {
      alert("Failed to export data: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      "Are you sure you want to permanently delete your account and all Career Twin evidence? This action cannot be undone."
    );
    if (!confirm) return;

    setDeleting(true);
    try {
      await api.delete("/privacy/account");
      logout();
      router.push("/");
    } catch (err: any) {
      alert("Failed to delete account: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
          <Shield className="h-4 w-4" />
          <span>User Preferences & Data Sovereignty</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Privacy & Data Control
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Full transparency and exportability. You own 100% of your career memory and interview recordings.
        </p>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white">Candidate Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <span className="text-slate-500 font-semibold uppercase text-[10px] block mb-0.5">
              Full Name
            </span>
            <p className="font-bold text-white">{user?.name || "Candidate"}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <span className="text-slate-500 font-semibold uppercase text-[10px] block mb-0.5">
              Email Address
            </span>
            <p className="font-bold text-white">{user?.email || "candidate@example.com"}</p>
          </div>
        </div>
      </div>

      {/* Export Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="h-4 w-4 text-indigo-400" />
            <span>Export Full Career Twin (JSON)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Download your verified skills, mock interview transcripts, question history, and readiness scores.
          </p>
        </div>

        <button
          onClick={handleExportData}
          disabled={exporting}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-all disabled:opacity-50 shrink-0"
        >
          {exporting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              <span>Download JSON</span>
            </>
          )}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-3xl border border-red-900/30 bg-red-950/10 p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Danger Zone</span>
        </h2>
        <p className="text-xs text-slate-400">
          Permanently delete your account, authentication tokens, and all mock interview history from MongoDB.
        </p>

        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="flex items-center gap-2 rounded-xl border border-red-800 bg-red-900/30 px-4 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-900/50 transition-all disabled:opacity-50"
        >
          {deleting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Deleting...</span>
            </>
          ) : (
            <>
              <Trash2 className="h-3.5 w-3.5" />
              <span>Permanently Delete Account</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
