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
  const audioElementRef = useRef<HTMLAudioElement | null>(null); // For iOS HTML5 Audio
  const audioBlobUrlRef = useRef<string | null>(null); // Store blob URL for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertRef = useRef(alert);
  const [isVisible, setIsVisible] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);

  // Update alert ref when it changes
  useEffect(() => {
    alertRef.current = alert;
  }, [alert]);

  // Detect iOS
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Generate WAV audio blob for iOS (HTML5 Audio is more reliable on iOS)
  const generateSirenWAV = (duration: number = 1.6): Blob => {
    const sampleRate = 44100;
    const numSamples = duration * sampleRate;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(0, "RIFF");
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, numSamples * 2, true);

    // Generate siren sound (sweep from 300Hz to 800Hz and back)
    let phase = 0;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Frequency sweep: 300Hz -> 800Hz -> 300Hz over 1.6 seconds
      const freq = 300 + 500 * Math.sin((Math.PI * t) / 0.8);
      phase += (2 * Math.PI * freq) / sampleRate;
      if (phase > 2 * Math.PI) phase -= 2 * Math.PI;

      // Sawtooth wave for harsh siren sound
      const sample = (2 * (phase / (2 * Math.PI)) - 1) * 0.4;
      view.setInt16(44 + i * 2, sample * 32767, true);
    }

    return new Blob([buffer], { type: "audio/wav" });
  };

  // Pre-create and pre-load audio for iOS (critical - must be ready BEFORE tap)
  useEffect(() => {
    if (isIOS && !audioElementRef.current) {
      try {
        // Generate blob once
        const blob = generateSirenWAV(1.6);
        const blobUrl = URL.createObjectURL(blob);
        audioBlobUrlRef.current = blobUrl;

        // Create audio element
        const audio = document.createElement("audio");
        audio.src = blobUrl;
        audio.volume = 0.8;
        audio.loop = true;
        audio.preload = "auto";
        audio.style.display = "none";

        // Add to DOM (iOS sometimes needs this)
        document.body.appendChild(audio);

        // Load the audio
        audio.load();

        audioElementRef.current = audio;
        console.log("✅ iOS audio element pre-created and ready");
      } catch (error) {
        console.error("❌ Failed to pre-create iOS audio:", error);
      }
    }

    return () => {
      // Cleanup
      if (audioElementRef.current) {
        document.body.removeChild(audioElementRef.current);
        audioElementRef.current = null;
      }
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
    };
  }, [isIOS]);

  const stopSiren = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop HTML5 Audio (iOS)
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      // Remove from DOM if it's there
      if (audioElementRef.current.parentNode) {
        audioElementRef.current.parentNode.removeChild(audioElementRef.current);
      }
      audioElementRef.current = null;
    }

    // Cleanup blob URL
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }

    // Stop Web Audio API (Desktop/Android)
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // Ignore
      }
    }
    audioContextRef.current = null;
    setAudioStarted(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSiren();
    };
  }, []);

  const playSirenCycle = () => {
    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed" ||
      audioContextRef.current.state === "suspended"
    ) {
      return;
    }

    const now = audioContextRef.current.currentTime;

    // Scale volume based on severity
    const baseVolume = 0.6;
    const severityMultiplier = Math.min(
      alertRef.current.severityScore / 100,
      1
    );
    const volume = baseVolume + severityMultiplier * 0.25; // 0.6 to 0.85

    // iOS: Use simpler single oscillator
    if (isIOS) {
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();

      osc.type = "sawtooth";
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);

      // Emergency siren pattern: low to high sweep
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.8);
      osc.frequency.exponentialRampToValueAtTime(300, now + 1.6);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.05);
      gain.gain.setValueAtTime(volume, now + 1.5);
      gain.gain.linearRampToValueAtTime(0, now + 1.6);

      osc.start(now);
      osc.stop(now + 1.6);
      return;
    }

    // Desktop/Android: Multi-layered siren
    // Layer 1: Deep base
    const osc1 = audioContextRef.current.createOscillator();
    const gain1 = audioContextRef.current.createGain();
    osc1.type = "sawtooth";
    osc1.connect(gain1);
    gain1.connect(audioContextRef.current.destination);

    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + 0.8);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 1.6);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(volume * 0.7, now + 0.1);
    gain1.gain.setValueAtTime(volume * 0.7, now + 1.5);
    gain1.gain.linearRampToValueAtTime(0, now + 1.6);
    osc1.start(now);
    osc1.stop(now + 1.6);

    // Layer 2: Mid-range
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

    // Layer 3: High-pitched
    const osc3 = audioContextRef.current.createOscillator();
    const gain3 = audioContextRef.current.createGain();
    osc3.type = "square";
    osc3.connect(gain3);
    gain3.connect(audioContextRef.current.destination);

    osc3.frequency.setValueAtTime(600, now);
    osc3.frequency.exponentialRampToValueAtTime(1200, now + 0.8);
    osc3.frequency.exponentialRampToValueAtTime(600, now + 1.6);

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

  // Start siren SYNCHRONOUSLY during user interaction (critical for iOS)
  const handleUserInteraction = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (audioStarted) return;

    // iOS: Also vibrate as haptic feedback
    if (isIOS && "vibrate" in navigator) {
      try {
        (navigator as any).vibrate([200, 100, 200, 100, 200]);
      } catch (vibrateError) {
        // Ignore vibration errors
      }
    }

    setAudioStarted(true);

    // iOS: Use pre-created HTML5 Audio element (must be ready before tap)
    if (isIOS) {
      const audio = audioElementRef.current;
      if (audio) {
        // CRITICAL: Call play() IMMEDIATELY and synchronously during tap
        // Don't wait for anything, just play!
        audio.currentTime = 0;

        // Play synchronously - the promise resolves later but play() is called NOW
        const playPromise = audio.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("✅ iOS audio playing successfully!");
            })
            .catch((error) => {
              console.error("❌ Failed to play iOS audio:", error);
              console.error("Audio element state:", {
                paused: audio.paused,
                readyState: audio.readyState,
                networkState: audio.networkState,
                error: audio.error,
              });
              setAudioStarted(false);
            });
        }
      } else {
        console.warn("⚠️ iOS audio element not ready, creating on the fly...");
        // Fallback: create audio on the fly (less reliable)
        try {
          const blob = generateSirenWAV(1.6);
          const blobUrl = URL.createObjectURL(blob);
          audioBlobUrlRef.current = blobUrl;
          const newAudio = new Audio(blobUrl);
          newAudio.volume = 0.8;
          newAudio.loop = true;
          const playPromise = newAudio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("✅ iOS audio playing (fallback)");
              })
              .catch((error) => {
                console.error("❌ Failed to play iOS audio (fallback):", error);
                setAudioStarted(false);
              });
          }
          audioElementRef.current = newAudio;
        } catch (error) {
          console.error("❌ iOS audio initialization error:", error);
          setAudioStarted(false);
        }
      }
      return;
    }

    // Desktop/Android: Use Web Audio API (more flexible)
    try {
      // Create AudioContext SYNCHRONOUSLY during user interaction
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Resume if suspended
      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
      }

      // Start playing immediately
      playSirenCycle();

      // Start interval for continuous playing
      intervalRef.current = setInterval(() => {
        if (audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume().catch(() => {});
        }
        playSirenCycle();
      }, 1600);
    } catch (error) {
      console.error("Audio initialization error:", error);
      setAudioStarted(false);
    }
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
      <div
        onClick={handleUserInteraction}
        onTouchStart={handleUserInteraction}
        className="max-w-sm mx-auto bg-slate-800/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden animate-pulse-slow"
      >
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
          {isIOS && !audioStarted && (
            <p className="text-yellow-400 text-xs mt-2 animate-pulse">
              👆 Tap to enable emergency siren 🔊
            </p>
          )}
        </div>

        {/* Bottom Section - Accept/Decline Buttons */}
        <div className="flex border-t border-slate-700/50">
          {/* Decline Button */}
          <button
            onClick={(e) => {
              handleUserInteraction(e);
              setTimeout(() => handleDecline(), 100);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 text-red-400 hover:bg-red-500/10 transition-colors border-r border-slate-700/50"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-base font-medium">Dismiss</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={(e) => {
              handleUserInteraction(e);
              setTimeout(() => handleAccept(), 100);
            }}
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
