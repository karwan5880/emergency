"use client";

import { getSeverityLevel } from "../utils/severity";

interface SeverityIndicatorProps {
  score: number;
  tapCount: number;
  frequency: number;
  compact?: boolean;
}

export function SeverityIndicator({
  score,
  tapCount,
  frequency,
  compact = false,
}: SeverityIndicatorProps) {
  const severityLevel = getSeverityLevel(score);

  const colors = {
    low: {
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      bar: "bg-gradient-to-r from-green-500 to-green-600",
      text: "text-green-400",
      label: "text-green-500",
    },
    medium: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      bar: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      text: "text-yellow-400",
      label: "text-yellow-500",
    },
    high: {
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      bar: "bg-gradient-to-r from-orange-500 to-orange-600",
      text: "text-orange-400",
      label: "text-orange-500",
    },
    critical: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      bar: "bg-gradient-to-r from-red-500 to-red-600",
      text: "text-red-400",
      label: "text-red-500",
    },
  };

  const colorScheme = colors[severityLevel];

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full ${colorScheme.bg} border ${colorScheme.border}`}
      >
        <div className={`w-2 h-2 rounded-full ${colorScheme.label}`} />
        <span className={`text-xs font-semibold uppercase ${colorScheme.text}`}>
          {severityLevel}
        </span>
        <span className="text-xs text-slate-400">{score}</span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg bg-slate-800 border ${colorScheme.border} space-y-3`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">Severity Level</span>
        <span
          className={`text-sm font-bold uppercase ${colorScheme.text}`}
        >
          {severityLevel}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${colorScheme.bar} transition-all duration-300`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">0</span>
          <span className={`font-bold ${colorScheme.text}`}>{score}</span>
          <span className="text-slate-500">100</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
        <div>
          <div className="text-xs text-slate-400 mb-1">Tap Count</div>
          <div className="text-lg font-bold text-white">{tapCount}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">Frequency</div>
          <div className="text-lg font-bold text-white">{frequency.toFixed(2)}/s</div>
        </div>
      </div>
    </div>
  );
}
