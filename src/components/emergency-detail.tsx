"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, Clock, CheckCircle, MapPin, Calendar, Edit2, Trash2 } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface EmergencyDetailProps {
  id: Id<"emergencies">;
  onClose: () => void;
}

export function EmergencyDetail({ id, onClose }: EmergencyDetailProps) {
  const emergency = useQuery(api.emergencies.getEmergency, { id });
  const updateStatus = useMutation(api.emergencies.updateEmergencyStatus);
  const deleteEmergency = useMutation(api.emergencies.deleteEmergency);
  const [isDeleting, setIsDeleting] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-500 bg-red-500/20 border-red-500/30";
      case "high":
        return "text-orange-500 bg-orange-500/20 border-orange-500/30";
      case "medium":
        return "text-yellow-500 bg-yellow-500/20 border-yellow-500/30";
      case "low":
        return "text-green-500 bg-green-500/20 border-green-500/30";
      default:
        return "text-slate-400 bg-slate-500/20 border-slate-500/30";
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
    return date.toLocaleString();
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this emergency?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteEmergency({ id });
      onClose();
    } catch (error) {
      console.error("Error deleting emergency:", error);
      alert("Failed to delete emergency. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (emergency === undefined) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-center">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (emergency === null) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-center">Emergency not found</p>
            <Button onClick={onClose} className="mt-4 w-full">Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <CardTitle className="text-xl">Emergency Details</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {emergency.title}
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              {emergency.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`px-3 py-1 rounded-full border text-sm capitalize ${getPriorityColor(
                emergency.priority
              )}`}
            >
              {emergency.priority} Priority
            </span>
            <span
              className={`px-3 py-1 rounded-full border text-sm capitalize ${getStatusColor(
                emergency.status
              )}`}
            >
              {emergency.status.replace("-", " ")}
            </span>
          </div>

          {emergency.location && (
            <div className="flex items-start gap-2 text-slate-300">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{emergency.location}</span>
            </div>
          )}

          <div className="flex items-start gap-2 text-slate-400 text-sm">
            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p>Created: {formatDate(emergency.createdAt)}</p>
              {emergency.updatedAt !== emergency.createdAt && (
                <p>Updated: {formatDate(emergency.updatedAt)}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700 space-y-2">
            {emergency.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    updateStatus({ id: emergency._id, status: "in-progress" });
                  }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Start
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    updateStatus({ id: emergency._id, status: "resolved" });
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolve
                </Button>
              </div>
            )}
            {emergency.status === "in-progress" && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => {
                  updateStatus({ id: emergency._id, status: "resolved" });
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Resolved
              </Button>
            )}
            {emergency.status === "resolved" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  updateStatus({ id: emergency._id, status: "in-progress" });
                }}
              >
                Reopen
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full text-red-400 border-red-400/30 hover:bg-red-500/10"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete Emergency"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
