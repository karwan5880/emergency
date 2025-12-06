"use client";

import { useState } from "react";
import { AlertTriangle, Radio, Lock } from "lucide-react";

interface BottomTabsProps {
  activeTab: "passive" | "active";
  onTabChange: (tab: "passive" | "active") => void;
  isStreaming?: boolean; // When true, lock tabs (user is actively streaming)
}

export function BottomTabs({
  activeTab,
  onTabChange,
  isStreaming = false,
}: BottomTabsProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (isStreaming) return; // Block swipe when streaming
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isStreaming) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (isStreaming) return;
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeTab === "passive") {
      onTabChange("active");
    }
    if (isRightSwipe && activeTab === "active") {
      onTabChange("passive");
    }
  };

  const handleTabClick = (tab: "passive" | "active") => {
    if (isStreaming) return; // Block click when streaming
    onTabChange(tab);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur border-t border-slate-700 z-50"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex max-w-lg mx-auto">
        {/* Passive Tab */}
        <button
          onClick={() => handleTabClick("passive")}
          disabled={isStreaming}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 sm:py-4 transition-colors ${
            activeTab === "passive"
              ? "text-red-500 bg-red-500/10"
              : isStreaming
              ? "text-slate-600 cursor-not-allowed"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xs sm:text-sm font-semibold">Passive</span>
        </button>

        {/* Active Tab */}
        <button
          onClick={() => handleTabClick("active")}
          disabled={isStreaming}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 sm:py-4 transition-colors ${
            activeTab === "active"
              ? "text-orange-500 bg-orange-500/10"
              : isStreaming
              ? "text-slate-600 cursor-not-allowed"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          {isStreaming && activeTab === "active" ? (
            <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
          <span className="text-xs sm:text-sm font-semibold">
            {isStreaming && activeTab === "active" ? "Streaming" : "Active"}
          </span>
        </button>
      </div>
    </div>
  );
}
