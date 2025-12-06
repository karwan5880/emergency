"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { AlertTriangle, Zap } from "lucide-react";
import { LiveStreamRecorder } from "./live-stream-recorder";
import type { Id } from "convex/_generated/dataModel";

interface ActiveModeScreenProps {
  onStreamingChange?: (isStreaming: boolean) => void;
}

export function ActiveModeScreen({ onStreamingChange }: ActiveModeScreenProps) {
  const [tapCount, setTapCount] = useState(0);
  const [streamingTapCount, setStreamingTapCount] = useState(0); // Tap count during streaming
  const [isStreaming, setIsStreamingState] = useState(false);
  const [isTapping, setIsTapping] = useState(false); // For tap animation
  const [ripples, setRipples] = useState<number[]>([]); // For ripple effects

  // Wrapper to also notify parent of streaming changes
  const setIsStreaming = (value: boolean) => {
    setIsStreamingState(value);
    onStreamingChange?.(value);
  };
  const [alertId, setAlertId] = useState<Id<"emergency_alerts"> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showStreamRecorder, setShowStreamRecorder] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rippleIdRef = useRef(0);

  const createAlertMutation = useMutation(api.alerts.createAlert);
  const recordTapMutation = useMutation(api.alerts.recordTap);

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

  // Reset tap count after 2 seconds of no taps
  useEffect(() => {
    if (tapCount > 0 && !isStreaming) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      tapTimeoutRef.current = setTimeout(() => {
        setTapCount(0);
      }, 2000);
    }

    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, [tapCount, isStreaming]);

  // Get user's current location
  const getLocation = async (): Promise<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
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
          resolve({ latitude: 0, longitude: 0 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleBigCircleTap = async () => {
    if (isStreaming) return; // Already streaming, ignore

    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // After 3 taps, enter streaming mode
    if (newTapCount >= 3) {
      try {
        setIsLoading(true);

        // Get location
        const location = await getLocation();
        if (
          !location ||
          (location.latitude === 0 && location.longitude === 0)
        ) {
          alert("Location needed to report emergency");
          setTapCount(0);
          setIsLoading(false);
          return;
        }

        // Create alert
        const newAlertId = await createAlertMutation({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          title: "Emergency Alert",
        });

        setAlertId(newAlertId);
        setIsStreaming(true);
        setShowStreamRecorder(true);
        setTapCount(0);

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      } catch (error) {
        console.error("Error creating alert:", error);
        alert("Failed to start emergency alert");
        setTapCount(0);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEmergencyButtonTap = async () => {
    if (!alertId || !isStreaming) return;

    // Increment local tap count immediately for responsive UI
    setStreamingTapCount((prev) => prev + 1);

    // Trigger tap animation
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 150);

    // Add ripple effect
    const rippleId = rippleIdRef.current++;
    setRipples((prev) => [...prev, rippleId]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((id) => id !== rippleId));
    }, 600);

    // Haptic feedback - stronger for more taps
    if (navigator.vibrate) {
      const intensity = Math.min(50 + streamingTapCount * 2, 100);
      navigator.vibrate(intensity);
    }

    try {
      const location = await getLocation();
      if (!location || (location.latitude === 0 && location.longitude === 0)) {
        return;
      }

      // Record tap to increase severity
      await recordTapMutation({
        alertId: alertId,
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.error("Error recording tap:", error);
    }
  };

  // If streaming, show streaming UI
  if (isStreaming && showStreamRecorder && alertId) {
    return (
      <div className="flex flex-col h-full min-h-[calc(100vh-140px)]">
        {/* Live Stream */}
        <div className="relative">
          <LiveStreamRecorder
            alertId={alertId}
            onStreamStop={() => {
              setIsStreaming(false);
              setShowStreamRecorder(false);
              setAlertId(null);
            }}
          />
        </div>

        {/* Coming Soon Features */}
        <div className="px-4 sm:px-6 py-3 space-y-2">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span className="w-2 h-2 bg-slate-600 rounded-full"></span>
            <span>Google Map Live - coming soon</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span className="w-2 h-2 bg-slate-600 rounded-full"></span>
            <span>Chat System - coming soon</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span className="w-2 h-2 bg-slate-600 rounded-full"></span>
            <span>More - coming soon</span>
          </div>
        </div>

        {/* Emergency Button at Bottom - EPIC TAP BUTTON */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 pb-20 sm:pb-24">
          {/* Tap Counter */}
          <div className="mb-4 text-center">
            <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-red-500 tabular-nums">
              {streamingTapCount}
            </div>
            <div className="text-xs sm:text-sm text-slate-400 uppercase tracking-wider">
              Taps
            </div>
          </div>

          {/* The Epic Button */}
          <div className="relative">
            {/* Pulsing outer glow */}
            <div
              className={`absolute inset-0 rounded-full bg-red-500 blur-xl transition-all duration-300 ${
                streamingTapCount > 0
                  ? "opacity-60 scale-125"
                  : "opacity-30 scale-110"
              } ${isTapping ? "scale-150 opacity-80" : ""}`}
              style={{
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />

            {/* Ripple effects */}
            {ripples.map((id) => (
              <div
                key={id}
                className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping-once pointer-events-none"
              />
            ))}

            {/* Outer ring - pulses */}
            <div
              className={`absolute -inset-3 rounded-full border-4 transition-all duration-150 ${
                isTapping
                  ? "border-red-400 scale-110"
                  : "border-red-600/50 scale-100"
              }`}
              style={{
                animation: !isTapping
                  ? "pulse 2s ease-in-out infinite"
                  : "none",
              }}
            />

            {/* Main button */}
            <button
              onClick={handleEmergencyButtonTap}
              className={`
                relative z-10
                w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44
                rounded-full
                bg-gradient-to-br from-red-500 via-red-600 to-red-700
                text-white
                shadow-[0_0_40px_rgba(239,68,68,0.5)]
                flex flex-col items-center justify-center
                transition-all duration-100
                ${
                  isTapping
                    ? "scale-90 shadow-[0_0_60px_rgba(239,68,68,0.8)]"
                    : "scale-100 hover:scale-105"
                }
                active:scale-90
              `}
              style={{
                boxShadow: isTapping
                  ? "0 0 80px rgba(239,68,68,0.9), inset 0 0 30px rgba(0,0,0,0.3)"
                  : "0 0 40px rgba(239,68,68,0.5), inset 0 0 20px rgba(0,0,0,0.2)",
              }}
            >
              {/* Inner glow on tap */}
              <div
                className={`absolute inset-2 rounded-full bg-gradient-to-br from-red-400 to-transparent transition-opacity duration-100 ${
                  isTapping ? "opacity-60" : "opacity-0"
                }`}
              />

              {/* Icon */}
              <Zap
                className={`relative z-10 w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 transition-transform duration-100 ${
                  isTapping ? "scale-125" : "scale-100"
                }`}
                fill="currentColor"
              />

              {/* Text */}
              <span
                className={`relative z-10 text-sm sm:text-base lg:text-lg font-black mt-1 transition-all duration-100 ${
                  isTapping ? "scale-110" : "scale-100"
                }`}
              >
                TAP!
              </span>
            </button>
          </div>

          {/* Encouragement text */}
          <p className="mt-4 text-xs sm:text-sm text-slate-500 text-center animate-pulse">
            {streamingTapCount === 0 && "Tap to increase severity!"}
            {streamingTapCount > 0 && streamingTapCount < 10 && "Keep going!"}
            {streamingTapCount >= 10 &&
              streamingTapCount < 30 &&
              "More! More! More!"}
            {streamingTapCount >= 30 &&
              streamingTapCount < 50 &&
              "🔥 ON FIRE! 🔥"}
            {streamingTapCount >= 50 && "⚡ MAXIMUM ALERT ⚡"}
          </p>
        </div>
      </div>
    );
  }

  // Pre-streaming: Big circle, tap 3 times
  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] px-4 py-6 sm:py-8">
      {/* Big Circle - 80% of screen */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center space-y-6 sm:space-y-8">
          <button
            onClick={handleBigCircleTap}
            disabled={isLoading}
            className={`
              relative
              w-[80vw] h-[80vw] sm:w-[70vw] sm:h-[70vw] lg:w-[60vh] lg:h-[60vh] lg:max-w-[500px] lg:max-h-[500px]
              rounded-full
              bg-gradient-to-br from-red-600 to-red-700
              active:scale-95
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center
              text-white
              shadow-2xl
            `}
          >
            <div className="text-center">
              <AlertTriangle className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto mb-2 sm:mb-4" />
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                Tap 3 Times
              </p>
              <p className="text-sm sm:text-base lg:text-lg mt-2">
                {tapCount}/3
              </p>
            </div>
          </button>

          {/* Instructions */}
          <div className="space-y-2">
            <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">
              Report New Emergency?
            </p>
            <p className="text-sm sm:text-base lg:text-lg text-slate-400">
              Tap the circle above 3 times to start live streaming
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
