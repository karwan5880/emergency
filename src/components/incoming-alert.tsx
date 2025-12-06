"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface IncomingAlertProps {
  alert: {
    _id: Id<"emergency_alerts">;
    distance?: number;
    severityScore: number;
    tapCount: number;
  };
  onAccept: (alertId: Id<"emergency_alerts">) => void;
  onDecline: (alertId: Id<"emergency_alerts">) => void;
}

export function IncomingAlert({
  alert,
  onAccept,
  onDecline,
}: IncomingAlertProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Play ringtone
  useEffect(() => {
    startRingtone();

    return () => {
      stopRingtone();
    };
  }, []);

  const startRingtone = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const playTone = () => {
        if (
          !audioContextRef.current ||
          audioContextRef.current.state === "closed"
        )
          return;

        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();

        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);

        // Phone ring tone
        osc.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
        osc.frequency.setValueAtTime(
          480,
          audioContextRef.current.currentTime + 0.2
        );

        gain.gain.setValueAtTime(0.15, audioContextRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          audioContextRef.current.currentTime + 0.4
        );

        osc.start(audioContextRef.current.currentTime);
        osc.stop(audioContextRef.current.currentTime + 0.4);
      };

      // Ring pattern
      playTone();
      setTimeout(playTone, 200);

      intervalRef.current = setInterval(() => {
        playTone();
        setTimeout(playTone, 200);
      }, 2000);
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  const stopRingtone = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // Ignore
      }
    }
    audioContextRef.current = null;
  };

  const handleAccept = () => {
    stopRingtone();
    setIsVisible(false);
    onAccept(alert._id);
  };

  const handleDecline = () => {
    stopRingtone();
    setIsVisible(false);
    onDecline(alert._id);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] p-3 sm:p-4">
      {/* Incoming Call Style Notification */}
      <div className="max-w-sm mx-auto bg-slate-800/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden animate-pulse-slow">
        {/* Top Section - Alert Info */}
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 text-center">
          {/* Pulsing Icon */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500 flex items-center justify-center animate-ping-slow">
              <span className="text-xl sm:text-2xl">🚨</span>
            </div>
          </div>

          {/* Alert Title */}
          <h3 className="text-white text-base sm:text-lg font-semibold mb-1">
            Emergency Alert
          </h3>

          {/* Info */}
          <p className="text-slate-400 text-xs sm:text-sm">
            {alert.distance?.toFixed(1)}km away • {alert.tapCount} taps
          </p>
        </div>

        {/* Bottom Section - Accept/Decline Buttons */}
        <div className="flex border-t border-slate-700/50">
          {/* Decline Button */}
          <button
            onClick={handleDecline}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 text-red-400 hover:bg-red-500/10 transition-colors border-r border-slate-700/50"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-base font-medium">Dismiss</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 text-green-400 hover:bg-green-500/10 transition-colors"
          >
            <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-base font-medium">View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
