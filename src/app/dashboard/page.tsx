"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { AlertCircle, Bell, LogOut } from "lucide-react";
import { UserSync } from "@/components/user-sync";
import { NotificationPanel } from "@/components/notification-panel";
import { IncomingAlert } from "@/components/incoming-alert";
import { BottomTabs } from "@/components/bottom-tabs";
import { ActiveModeScreen } from "@/components/active-mode-screen";
import { PassiveModeScreen } from "@/components/passive-mode-screen";
import { useState, useEffect, useCallback } from "react";
import type { Id } from "convex/_generated/dataModel";

const DISMISSED_ALERTS_KEY = "alertrun_dismissed_alerts";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState<"passive" | "active">("passive");
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [currentStreamId, setCurrentStreamId] =
    useState<Id<"emergency_alerts"> | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set()
  );
  const [hasAcknowledged, setHasAcknowledged] = useState(false); // Once true, no more phone call popups
  const [isActiveStreaming, setIsActiveStreaming] = useState(false); // Track if user is actively streaming
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Load dismissed alerts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDismissedAlerts(new Set(parsed));
      }
    } catch (e) {
      console.error("Error loading dismissed alerts:", e);
    }
  }, []);

  // Dismiss an alert (saves to localStorage)
  const handleDismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts((prev) => {
      const newSet = new Set(prev);
      newSet.add(alertId);
      // Save to localStorage
      try {
        localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify([...newSet]));
      } catch (err) {
        console.error("Error saving dismissed alerts:", err);
      }
      return newSet;
    });
  }, []);

  // Get user location for nearby alerts
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
          radiusKm: 10,
        }
      : "skip"
  );

  const nearbyAlerts = nearbyAlertsQuery || [];

  // Filter out dismissed alerts for display
  const visibleAlerts = nearbyAlerts.filter(
    (alert) => !dismissedAlerts.has(alert._id)
  );

  // Get count for bell icon badge (only non-dismissed)
  const alertCount = visibleAlerts.length;

  // Find an alert to show as incoming (not dismissed, not currently watching)
  const incomingAlert = visibleAlerts.find(
    (alert) => currentStreamId !== alert._id && activeTab === "passive"
  );

  // Handle accepting incoming alert
  const handleAcceptAlert = (alertId: Id<"emergency_alerts">) => {
    setCurrentStreamId(alertId);
    setHasAcknowledged(true); // User is now aware, stop phone calls
  };

  // Handle declining incoming alert
  const handleDeclineAlert = (alertId: Id<"emergency_alerts">) => {
    handleDismissAlert(alertId);
    setHasAcknowledged(true); // User is now aware, stop phone calls
  };

  // Handle selecting stream from notification panel
  const handleSelectStream = (alertId: Id<"emergency_alerts">) => {
    setCurrentStreamId(alertId);
    setActiveTab("passive"); // Switch to passive to watch stream
  };

  // Handle leaving the stream room
  const handleLeaveRoom = () => {
    setCurrentStreamId(null);
  };

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pb-20 sm:pb-24">
      <UserSync />

      {/* Incoming Alert Notification (Phone Call Style) */}
      {/* Only show if user hasn't acknowledged any alert yet */}
      {incomingAlert && !currentStreamId && !hasAcknowledged && (
        <IncomingAlert
          alert={incomingAlert}
          onAccept={handleAcceptAlert}
          onDecline={handleDeclineAlert}
        />
      )}

      {/* Header */}
      <header className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between max-w-sm sm:max-w-lg lg:max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-500" />
            <span className="text-base sm:text-lg lg:text-xl font-semibold">
              AlertRun
            </span>
            {activeTab === "active" && (
              <span className="text-[10px] sm:text-xs lg:text-sm bg-orange-600 px-1.5 sm:px-2 lg:px-2.5 py-0.5 sm:py-1 rounded">
                ACTIVE
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Bell Icon with Notification Panel */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="relative text-slate-400 hover:text-white transition-colors p-1.5 sm:p-2"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-red-600 rounded-full text-[10px] sm:text-xs font-bold flex items-center justify-center">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </button>

              {/* Notification Panel Dropdown */}
              <NotificationPanel
                isOpen={showNotificationPanel}
                onClose={() => setShowNotificationPanel(false)}
                onSelectStream={handleSelectStream}
                currentStreamId={currentStreamId}
                dismissedAlerts={dismissedAlerts}
                onDismiss={handleDismissAlert}
              />
            </div>

            {/* Logout */}
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="text-slate-400 hover:text-white transition-colors p-1.5 sm:p-2"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      {activeTab === "passive" ? (
        <PassiveModeScreen
          currentStreamId={currentStreamId}
          onLeaveRoom={handleLeaveRoom}
        />
      ) : (
        <ActiveModeScreen onStreamingChange={setIsActiveStreaming} />
      )}

      {/* Bottom Tabs Navigation */}
      <BottomTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isStreaming={isActiveStreaming}
      />
    </main>
  );
}
