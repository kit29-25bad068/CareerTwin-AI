"use client";

import React from "react";

interface ScoreDialProps {
  score: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
}

export function ScoreDial({
  score,
  label = "Readiness Score",
  size = 140,
  strokeWidth = 10,
}: ScoreDialProps) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score || 0)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let strokeColor = "#10b981"; // emerald
  let bgColor = "from-emerald-500/10 to-teal-500/5";
  let textColor = "text-emerald-400";

  if (normalizedScore < 50) {
    strokeColor = "#f43f5e"; // rose
    bgColor = "from-rose-500/10 to-red-500/5";
    textColor = "text-rose-400";
  } else if (normalizedScore < 75) {
    strokeColor = "#f59e0b"; // amber
    bgColor = "from-amber-500/10 to-orange-500/5";
    textColor = "text-amber-400";
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-gradient-to-b ${bgColor} p-4 text-center shadow-lg`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold tracking-tight ${textColor}`}>
            {normalizedScore}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Out of 100
          </span>
        </div>
      </div>

      {label && (
        <span className="mt-2 text-xs font-semibold text-slate-300">{label}</span>
      )}
    </div>
  );
}
