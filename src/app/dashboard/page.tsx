"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bell, Plus } from "lucide-react";
import { EmergencyForm } from "@/components/emergency-form";
import { EmergencyList } from "@/components/emergency-list";
import { EmergencyDetail } from "@/components/emergency-detail";
import { UserSync } from "@/components/user-sync";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState<Id<"emergencies"> | null>(null);
  const stats = useQuery(api.emergencies.getEmergencyStats);
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount);

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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <UserSync />
      
      {/* Navigation */}
      <nav className="bg-slate-900/50 backdrop-blur p-4 sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span className="text-lg font-bold">Emergency App</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount !== undefined && unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Welcome Section */}
        <section>
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user.firstName || "User"}!
          </h1>
          <p className="text-slate-400 text-sm">
            Manage your emergencies and stay informed
          </p>
        </section>

        {/* Quick Actions */}
        <section>
          <Button
            size="lg"
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={() => setShowEmergencyForm(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Report Emergency
          </Button>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Active</CardDescription>
              <CardTitle className="text-2xl">
                {stats === undefined ? "..." : stats.active}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Resolved</CardDescription>
              <CardTitle className="text-2xl">
                {stats === undefined ? "..." : stats.resolved}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        {/* Recent Emergencies */}
        <section>
          <h2 className="text-xl font-bold mb-4">Recent Emergencies</h2>
          <EmergencyList
            onEmergencyClick={(id) => setSelectedEmergency(id)}
          />
        </section>
      </div>

      {/* Emergency Form Modal */}
      {showEmergencyForm && (
        <EmergencyForm
          onClose={() => setShowEmergencyForm(false)}
          onSuccess={() => {
            // Form will close automatically on success
          }}
        />
      )}

      {/* Emergency Detail Modal */}
      {selectedEmergency && (
        <EmergencyDetail
          id={selectedEmergency}
          onClose={() => setSelectedEmergency(null)}
        />
      )}
    </main>
  );
}
