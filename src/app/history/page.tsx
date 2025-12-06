"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { AlertCircle, ArrowLeft, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function HistoryPage() {
  const { user, isLoaded } = useUser();
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Query all alerts (including resolved) - for history
  const alertsQuery = useQuery(
    api.alerts.getAlertHistory,
    userLocation
      ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radiusKm: 50, // Wider radius for history
        }
      : "skip"
  );

  const alerts = alertsQuery || [];

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // Group alerts by date
  const groupedAlerts: Record<string, typeof alerts> = {};
  alerts.forEach((alert) => {
    const date = new Date(alert.createdAt).toLocaleDateString();
    if (!groupedAlerts[date]) {
      groupedAlerts[date] = [];
    }
    groupedAlerts[date].push(alert);
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-slate-700/50">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Alert History</h1>
            <p className="text-sm text-slate-400">
              Past emergencies in your area
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        {alerts.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 text-lg">No past alerts</p>
            <p className="text-slate-500 text-sm mt-2">
              When emergencies are resolved, they'll appear here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAlerts).map(([date, dateAlerts]) => (
              <div key={date}>
                {/* Date header */}
                <h2 className="text-sm font-semibold text-slate-400 mb-3 sticky top-0 bg-slate-900/90 backdrop-blur py-2">
                  {date === new Date().toLocaleDateString() ? "Today" : date}
                </h2>

                {/* Alerts for this date */}
                <div className="space-y-3">
                  {dateAlerts.map((alert) => (
                    <div
                      key={alert._id}
                      className={`p-4 rounded-xl border ${
                        alert.status === "active"
                          ? "bg-red-600/20 border-red-500/50"
                          : alert.status === "resolved"
                          ? "bg-slate-800/50 border-slate-700/50"
                          : "bg-yellow-600/20 border-yellow-500/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Status badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                alert.status === "active"
                                  ? "bg-red-600 text-white"
                                  : alert.status === "resolved"
                                  ? "bg-green-600 text-white"
                                  : "bg-yellow-600 text-black"
                              }`}
                            >
                              {alert.status.toUpperCase()}
                            </span>
                            {alert.status === "active" && (
                              <span className="flex items-center gap-1 text-xs text-red-400">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                LIVE
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="font-semibold text-white mb-1">
                            {alert.title || "Emergency Alert"}
                          </h3>

                          {/* Meta info */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(alert.createdAt).toLocaleTimeString()}
                            </span>
                            {alert.distance && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {alert.distance.toFixed(1)}km away
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {alert.tapCount} taps
                            </span>
                          </div>
                        </div>

                        {/* Severity */}
                        <div
                          className={`text-center px-3 py-2 rounded-lg ${
                            alert.severityScore >= 70
                              ? "bg-red-600/30"
                              : alert.severityScore >= 40
                              ? "bg-orange-600/30"
                              : "bg-yellow-600/30"
                          }`}
                        >
                          <div className="text-lg font-bold">
                            {alert.severityScore}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Severity
                          </div>
                        </div>
                      </div>

                      {/* Duration if resolved */}
                      {alert.resolvedAt && (
                        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700/50">
                          Duration:{" "}
                          {Math.round(
                            (alert.resolvedAt - alert.createdAt) / 60000
                          )}{" "}
                          minutes
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
