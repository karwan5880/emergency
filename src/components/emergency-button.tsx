"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AlertTriangle } from "lucide-react";
import { getSeverityLevel } from "../utils/severity";
import type { Id } from "../../convex/_generated/dataModel";

interface EmergencyButtonProps {
  className?: string;
}

export function EmergencyButton({ className = "" }: EmergencyButtonProps) {
  const [isActive, setIsActive] = useState(false);
  const [alertId, setAlertId] = useState<Id<"emergency_alerts"> | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const [severityScore, setSeverityScore] = useState(0);
  const [tapFrequency, setTapFrequency] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const createAlertMutation = useMutation(api.alerts.createAlert);
  const recordTapMutation = useMutation(api.alerts.recordTap);

  // Get user's current location
  const getLocation = async (): Promise<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error("Geolocation not supported");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Use default location if permission denied
          resolve({ latitude: 0, longitude: 0 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleButtonPress = async () => {
    try {
      setIsLoading(true);

      // Get location
      const location = await getLocation();
      if (!location) {
        alert("Unable to get location");
        setIsLoading(false);
        return;
      }

      // First tap - create alert
      if (!isActive || !alertId) {
        const newAlertId = await createAlertMutation({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          title: "Emergency Alert",
        });

        setAlertId(newAlertId);
        setIsActive(true);
        setTapCount(1);
        setSeverityScore(0);

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
      } else {
        // Additional taps - record tap
        const result = await recordTapMutation({
          alertId: alertId,
          latitude: location.latitude,
          longitude: location.longitude,
        });

        setTapCount(result.tapCount);
        setSeverityScore(result.severityScore);
        setTapFrequency(result.tapFrequency);

        // Haptic feedback - stronger for more critical
        if (navigator.vibrate) {
          const intensity = Math.min(200, 100 + result.severityScore * 2);
          navigator.vibrate([intensity / 2, 50, intensity / 2]);
        }
      }
    } catch (error) {
      console.error("Error recording emergency:", error);
      alert("Failed to record emergency");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsActive(false);
    setAlertId(null);
    setTapCount(0);
    setSeverityScore(0);
    setTapFrequency(0);
  };

  const severityLevel = getSeverityLevel(severityScore);
  const severityColors = {
    low: "from-green-500 to-green-600",
    medium: "from-yellow-500 to-yellow-600",
    high: "from-orange-500 to-orange-600",
    critical: "from-red-500 to-red-600",
  };

  const baseColor = isActive
    ? severityColors[severityLevel]
    : "from-red-600 to-red-700";

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Main Emergency Button */}
      <div className="relative">
        {/* Pulsing ring animation */}
        {isActive && (
          <>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/40 to-red-600/40 animate-ping" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-red-500/20 to-red-600/20 animate-pulse" />
          </>
        )}

        {/* Main button */}
        <button
          onClick={handleButtonPress}
          disabled={isLoading}
          className={`
            relative z-10 w-24 h-24 rounded-full
            bg-gradient-to-br ${baseColor}
            hover:shadow-2xl hover:scale-105
            active:scale-95
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center
            text-white font-bold text-2xl
            shadow-lg
          `}
        >
          <div className="flex flex-col items-center gap-1">
            <AlertTriangle size={32} />
            <span className="text-xs font-semibold">TAP</span>
          </div>
        </button>
      </div>

      {/* Status Display */}
      {isActive && (
        <div className="text-center bg-slate-800 border border-slate-700 rounded-lg p-4 w-full max-w-xs">
          <div className="text-sm text-slate-400 mb-2">Emergency Active</div>

          {/* Tap Count */}
          <div className="text-3xl font-bold text-white mb-2">{tapCount}</div>
          <div className="text-xs text-slate-400 mb-4">Total Taps</div>

          {/* Severity Display */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Severity</span>
              <span
                className={`font-bold uppercase ${
                  severityLevel === "low"
                    ? "text-green-400"
                    : severityLevel === "medium"
                    ? "text-yellow-400"
                    : severityLevel === "high"
                    ? "text-orange-400"
                    : "text-red-400"
                }`}
              >
                {severityLevel}
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${baseColor} transition-all duration-300`}
                style={{ width: `${Math.min(severityScore, 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {severityScore}/100
            </div>
          </div>

          {/* Frequency Display */}
          <div className="text-xs text-slate-400 mb-4">
            {tapFrequency.toFixed(2)} taps/sec
          </div>

          {/* Stop Button */}
          <button
            onClick={handleStop}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 px-4 rounded transition-colors"
          >
            Stop Emergency
          </button>
        </div>
      )}

      {/* Idle State Message */}
      {!isActive && (
        <div className="text-center text-slate-400 text-sm">
          Tap to report emergency
        </div>
      )}
    </div>
  );
}
