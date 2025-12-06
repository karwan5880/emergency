"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, MapPin, Users, Activity } from "lucide-react";
import type { Id } from "convex/_generated/dataModel";

interface LiveStreamViewerProps {
  alertId: Id<"emergency_alerts">;
}

export function LiveStreamViewer({ alertId }: LiveStreamViewerProps) {
  const alert = useQuery(api.alerts.getAlertDetails, { alertId });

  if (!alert) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-400">Loading alert details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5">
      {/* Video Player - Responsive */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
            <Video className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-500" />
            Live Stream
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {alert.isStreaming ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900/20 to-orange-900/20">
                  <div className="text-center text-white">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 border-3 sm:border-4 border-red-500 rounded-full animate-ping mb-3 sm:mb-4 mx-auto" />
                    <p className="text-base sm:text-lg lg:text-xl font-semibold mb-2">
                      🔴 LIVE STREAMING
                    </p>
                    <p className="text-xs sm:text-sm lg:text-base opacity-75">
                      {alert.title || "Emergency Incident"}
                    </p>
                  </div>
                </div>
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1.5 sm:gap-2 bg-red-600 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 rounded-full">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-white">
                    LIVE
                  </span>
                </div>
              </>
            ) : alert.videoUrl ? (
              <video
                src={alert.videoUrl}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="text-center text-slate-400">
                  <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No video available</p>
                  <p className="text-xs mt-1">Stream not started yet</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Details */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>{alert.title || "Emergency Alert"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alert.description && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Description</p>
              <p className="text-white">{alert.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Location</p>
                <p className="text-sm font-semibold">
                  {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">People Alerted</p>
                <p className="text-sm font-semibold">{alert.uniqueUsers}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Severity</span>
              <span
                className={`text-sm font-bold ${
                  alert.severityLevel === "critical"
                    ? "text-red-400"
                    : alert.severityLevel === "high"
                    ? "text-orange-400"
                    : alert.severityLevel === "medium"
                    ? "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                {alert.severityLevel.toUpperCase()} ({alert.severityScore}/100)
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  alert.severityLevel === "critical"
                    ? "bg-red-500"
                    : alert.severityLevel === "high"
                    ? "bg-orange-500"
                    : alert.severityLevel === "medium"
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(alert.severityScore, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Activity className="w-4 h-4" />
            <span>
              {alert.tapCount} taps • {alert.tapFrequency.toFixed(2)} taps/sec •{" "}
              {alert.notificationRadius}km radius
            </span>
          </div>

          <div className="pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              Alert created {new Date(alert.createdAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
