"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { Radio, X, Users, Clock } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../convex/_generated/dataModel";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStream: (alertId: Id<"emergency_alerts">) => void;
  currentStreamId?: Id<"emergency_alerts"> | null;
  dismissedAlerts: Set<string>;
  onDismiss: (alertId: string) => void;
}

export function NotificationPanel({
  isOpen,
  onClose,
  onSelectStream,
  currentStreamId,
  dismissedAlerts,
  onDismiss,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Handle dismiss with event stop propagation
  const handleDismiss = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the select action
    onDismiss(alertId);
  };

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

  // Query nearby alerts
  const nearbyAlertsQuery = useQuery(
    api.alerts.getNearbyActiveAlerts,
    userLocation
      ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radiusKm: 15,
        }
      : "skip"
  );

  // Filter out dismissed alerts
  const nearbyAlerts = (nearbyAlertsQuery || []).filter(
    (alert) => !dismissedAlerts.has(alert._id)
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-slate-800/95 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <h3 className="text-sm sm:text-base font-semibold text-white">
          Live Streams Nearby
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {nearbyAlerts.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Radio className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 text-sm">No live streams nearby</p>
            <p className="text-slate-500 text-xs mt-1">
              You'll be notified when someone starts streaming
            </p>
          </div>
        ) : (
          <div className="p-2">
            {nearbyAlerts.map((alert) => (
              <div
                key={alert._id}
                className={`relative p-3 rounded-lg transition-colors mb-1 last:mb-0 ${
                  currentStreamId === alert._id
                    ? "bg-red-600/30 border border-red-500/50"
                    : "hover:bg-slate-700/50"
                }`}
              >
                {/* Dismiss button */}
                <button
                  onClick={(e) => handleDismiss(alert._id, e)}
                  className="absolute top-2 right-2 p-1 text-slate-500 hover:text-white hover:bg-slate-600/50 rounded transition-colors z-10"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Main clickable area */}
                <button
                  onClick={() => {
                    onSelectStream(alert._id);
                    onClose();
                  }}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3 pr-6">
                    {/* Live indicator */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium truncate">
                          Emergency Alert
                        </span>
                        {alert.isStreaming && (
                          <span className="text-[10px] bg-red-600 px-1.5 py-0.5 rounded font-semibold">
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {alert.distance?.toFixed(1)}km away
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-slate-500 text-xs">
                        <Users className="w-3 h-3" />
                        <span>Severity: {alert.severityScore}/100</span>
                      </div>
                    </div>

                    {/* Watch indicator */}
                    {currentStreamId === alert._id && (
                      <div className="text-xs text-red-400 font-medium">
                        Watching
                      </div>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - View History Link */}
      <Link
        href="/history"
        onClick={onClose}
        className="flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
      >
        <Clock className="w-4 h-4" />
        <span className="text-sm">View History</span>
      </Link>
    </div>
  );
}
