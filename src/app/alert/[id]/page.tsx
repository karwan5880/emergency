"use client";

import { useParams } from "next/navigation";
import { LiveStreamViewer } from "@/components/live-stream-viewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AlertDetailPage() {
  const params = useParams();
  const alertId = params.id as string;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation - Responsive */}
      <nav className="bg-slate-900/50 backdrop-blur p-3 sm:p-4 lg:p-6 sticky top-0 z-50">
        <div className="flex items-center gap-3 sm:gap-4 max-w-sm sm:max-w-2xl lg:max-w-4xl mx-auto">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 sm:w-10 sm:h-10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-red-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-5 h-5 sm:w-6 sm:h-6 border-2 border-red-500 rounded-full animate-ping" />
            </div>
            <span className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              AlertRun - Alert Details
            </span>
          </div>
        </div>
      </nav>

      {/* Content - Responsive */}
      <div className="max-w-sm sm:max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <LiveStreamViewer alertId={alertId as any} />
      </div>
    </main>
  );
}
