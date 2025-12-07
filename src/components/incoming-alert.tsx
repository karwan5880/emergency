"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff } from "lucide-react";
import type { Id } from "convex/_generated/dataModel";

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
  const alertRef = useRef(alert); // Keep latest alert for audio generation
  const [isVisible, setIsVisible] = useState(true);

  // Update alert ref when it changes
  useEffect(() => {
    alertRef.current = alert;
  }, [alert]);

  // Play terrifying siren
  useEffect(() => {
    startSiren();

    return () => {
      stopSiren();
    };
  }, []);

  const startSiren = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create a TERRIFYING emergency siren
      // Uses multiple oscillators for a rich, menacing, PANIC-INDUCING sound
      const playSirenCycle = () => {
        if (
          !audioContextRef.current ||
          audioContextRef.current.state === "closed"
        )
          return;

        const now = audioContextRef.current.currentTime;

        // Scale volume based on severity - MORE TAPS = LOUDER SIREN!
        const baseVolume = 0.6; // Already loud base
        const severityMultiplier = Math.min(
          alertRef.current.severityScore / 100,
          1
        );
        const volume = baseVolume + severityMultiplier * 0.25; // 0.6 to 0.85 (VERY LOUD!)

        // Create multiple oscillators for a more complex, scary sound
        // Layer 1: Deep, menacing base siren (very low frequency)
        const osc1 = audioContextRef.current.createOscillator();
        const gain1 = audioContextRef.current.createGain();
        osc1.type = "sawtooth";
        osc1.connect(gain1);
        gain1.connect(audioContextRef.current.destination);

        // Very low, menacing frequency (200Hz - 400Hz sweep)
        osc1.frequency.setValueAtTime(200, now);
        osc1.frequency.exponentialRampToValueAtTime(400, now + 0.8);
        osc1.frequency.exponentialRampToValueAtTime(200, now + 1.6);

        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(volume * 0.7, now + 0.1);
        gain1.gain.setValueAtTime(volume * 0.7, now + 1.5);
        gain1.gain.linearRampToValueAtTime(0, now + 1.6);
        osc1.start(now);
        osc1.stop(now + 1.6);

        // Layer 2: Mid-range wailing siren (more piercing)
        const osc2 = audioContextRef.current.createOscillator();
        const gain2 = audioContextRef.current.createGain();
        osc2.type = "sawtooth";
        osc2.connect(gain2);
        gain2.connect(audioContextRef.current.destination);

        osc2.frequency.setValueAtTime(400, now);
        osc2.frequency.exponentialRampToValueAtTime(800, now + 0.8);
        osc2.frequency.exponentialRampToValueAtTime(400, now + 1.6);

        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(volume * 0.6, now + 0.1);
        gain2.gain.setValueAtTime(volume * 0.6, now + 1.5);
        gain2.gain.linearRampToValueAtTime(0, now + 1.6);
        osc2.start(now);
        osc2.stop(now + 1.6);

        // Layer 3: High-pitched alert tone (gets attention)
        const osc3 = audioContextRef.current.createOscillator();
        const gain3 = audioContextRef.current.createGain();
        osc3.type = "square"; // Harsher sound
        osc3.connect(gain3);
        gain3.connect(audioContextRef.current.destination);

        osc3.frequency.setValueAtTime(600, now);
        osc3.frequency.exponentialRampToValueAtTime(1200, now + 0.8);
        osc3.frequency.exponentialRampToValueAtTime(600, now + 1.6);

        // Pulsing pattern for urgency
        gain3.gain.setValueAtTime(0, now);
        gain3.gain.linearRampToValueAtTime(volume * 0.4, now + 0.05);
        gain3.gain.setValueAtTime(volume * 0.4, now + 0.4);
        gain3.gain.setValueAtTime(0, now + 0.45);
        gain3.gain.setValueAtTime(volume * 0.4, now + 0.5);
        gain3.gain.setValueAtTime(volume * 0.4, now + 0.9);
        gain3.gain.setValueAtTime(0, now + 0.95);
        gain3.gain.setValueAtTime(volume * 0.4, now + 1.0);
        gain3.gain.setValueAtTime(volume * 0.4, now + 1.5);
        gain3.gain.linearRampToValueAtTime(0, now + 1.6);
        osc3.start(now);
        osc3.stop(now + 1.6);
      };

      // Play immediately and repeat every 1.6 seconds (continuous, overlapping wails)
      playSirenCycle();
      intervalRef.current = setInterval(() => {
        playSirenCycle();
      }, 1600); // Continuous, panic-inducing wails
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  const stopSiren = () => {
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
    stopSiren();
    setIsVisible(false);
    onAccept(alert._id);
  };

  const handleDecline = () => {
    stopSiren();
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
