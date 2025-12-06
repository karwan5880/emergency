"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Radio, Users, MapPin, X } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface PassiveModeScreenProps {
  currentStreamId?: Id<"emergency_alerts"> | null;
  onLeaveRoom?: () => void;
}

export function PassiveModeScreen({
  currentStreamId,
  onLeaveRoom,
}: PassiveModeScreenProps) {
  // Query the specific alert if we have one selected
  const alertQuery = useQuery(
    api.alerts.getAlertDetails,
    currentStreamId ? { alertId: currentStreamId } : "skip"
  );

  const alert = alertQuery;

  // Empty state - no stream selected
  if (!currentStreamId || !alert) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="text-center space-y-4 sm:space-y-6 max-w-sm">
          {/* Empty room icon */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full bg-slate-800/50 flex items-center justify-center">
            <Radio className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600" />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              No Active Stream
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              You're not watching any emergency broadcast right now.
            </p>
          </div>

          {/* Hint */}
          <p className="text-xs sm:text-sm text-slate-500">
            When an emergency is detected nearby, you'll receive a notification.
            Check the bell icon for active streams.
          </p>
        </div>
      </div>
    );
  }

  // Stream room - showing the live stream
  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col">
      {/* Live Stream Video Area */}
      <div className="flex-1 bg-black relative">
        {/* Mock video player - In real app, this would be actual WebRTC stream */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
          {alert.isStreaming ? (
            <div className="text-center space-y-4">
              {/* Live indicator */}
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-500 font-semibold text-sm sm:text-base">
                  LIVE
                </span>
              </div>

              {/* Placeholder for actual video */}
              <div className="w-full max-w-md aspect-video bg-slate-800/50 rounded-lg flex items-center justify-center mx-4">
                <div className="text-center p-4">
                  <Radio className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 text-slate-500 animate-pulse" />
                  <p className="text-slate-400 text-sm sm:text-base">
                    Live stream from emergency reporter
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    (Mock video - real WebRTC in production)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <Radio className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-slate-400">Stream ended or not available</p>
            </div>
          )}
        </div>

        {/* Overlay info */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          {/* Alert badge */}
          <div className="bg-red-600/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs sm:text-sm font-medium">
              Emergency Alert
            </span>
          </div>

          {/* Leave Room Button */}
          {onLeaveRoom && (
            <button
              onClick={onLeaveRoom}
              className="bg-slate-800/90 backdrop-blur p-2 rounded-full hover:bg-slate-700 transition-colors"
              title="Leave stream"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Info Panel at Bottom */}
      <div className="bg-slate-800/50 backdrop-blur p-4 sm:p-5 border-t border-slate-700/50">
        <div className="max-w-lg mx-auto space-y-3">
          {/* Stats row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {/* Distance */}
              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-4 h-4" />
                <span>{alert.distance?.toFixed(1) || "?"}km away</span>
              </div>

              {/* Tap count */}
              <div className="flex items-center gap-1.5 text-slate-400">
                <Users className="w-4 h-4" />
                <span>{alert.tapCount} taps</span>
              </div>
            </div>

            {/* Severity */}
            <div
              className={`px-2 py-1 rounded text-xs font-semibold ${
                alert.severityScore >= 70
                  ? "bg-red-600 text-white"
                  : alert.severityScore >= 40
                  ? "bg-orange-600 text-white"
                  : "bg-yellow-600 text-black"
              }`}
            >
              Severity: {alert.severityScore}/100
            </div>
          </div>

          {/* Time */}
          <p className="text-xs text-slate-500">
            Started {new Date(alert.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
