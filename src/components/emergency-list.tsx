"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, CheckCircle, XCircle, AlertTriangle, MapPin, Calendar } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface EmergencyListProps {
  onEmergencyClick?: (id: Id<"emergencies">) => void;
}

export function EmergencyList({ onEmergencyClick }: EmergencyListProps) {
  const emergencies = useQuery(api.emergencies.getUserEmergencies);
  const updateStatus = useMutation(api.emergencies.updateEmergencyStatus);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-500";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-slate-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-slate-500" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "cancelled":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      case "in-progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (emergencies === undefined) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <p className="text-slate-400 text-center text-sm">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (emergencies.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <p className="text-slate-400 text-center text-sm">
            No emergencies reported yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {emergencies.map((emergency) => (
        <Card
          key={emergency._id}
          className="bg-slate-800 border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
          onClick={() => onEmergencyClick?.(emergency._id)}
        >
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {emergency.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                    {emergency.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <AlertTriangle
                    className={`w-5 h-5 ${getPriorityColor(emergency.priority)}`}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`px-2 py-1 rounded-full border ${getStatusColor(
                    emergency.status
                  )} flex items-center gap-1`}
                >
                  {getStatusIcon(emergency.status)}
                  {emergency.status.replace("-", " ")}
                </span>
                <span
                  className={`px-2 py-1 rounded-full border border-slate-700 text-slate-300 capitalize ${getPriorityColor(
                    emergency.priority
                  )}`}
                >
                  {emergency.priority}
                </span>
                {emergency.location && (
                  <span className="px-2 py-1 rounded-full border border-slate-700 text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {emergency.location}
                  </span>
                )}
                <span className="px-2 py-1 rounded-full border border-slate-700 text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(emergency.createdAt)}
                </span>
              </div>

              {emergency.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus({
                        id: emergency._id,
                        status: "in-progress",
                      });
                    }}
                  >
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus({
                        id: emergency._id,
                        status: "resolved",
                      });
                    }}
                  >
                    Resolve
                  </Button>
                </div>
              )}
              {emergency.status === "in-progress" && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus({
                        id: emergency._id,
                        status: "resolved",
                      });
                    }}
                  >
                    Mark as Resolved
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
