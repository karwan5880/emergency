"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Video, Square, Radio } from "lucide-react";
import type { Id } from "convex/_generated/dataModel";

interface LiveStreamRecorderProps {
  alertId: Id<"emergency_alerts">;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
}

export function LiveStreamRecorder({
  alertId,
  onStreamStart,
  onStreamStop,
}: LiveStreamRecorderProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const updateRecordingStatus = useMutation(api.alerts.updateRecordingStatus);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startStreaming = async () => {
    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment", // Use back camera on mobile
        },
        audio: true,
      });

      streamRef.current = stream;

      // Display stream in video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start MediaRecorder for recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Create blob from chunks
        const blob = new Blob(chunksRef.current, { type: "video/webm" });

        // In a real app, you would upload this to storage
        // For MVP, we'll just mark it as recorded
        console.log("Recording stopped, blob size:", blob.size);
      };

      mediaRecorder.start(1000); // Collect data every second

      setIsStreaming(true);
      setIsRecording(true);

      // Update backend
      await updateRecordingStatus({
        alertId,
        isRecording: true,
        isStreaming: true,
      });

      onStreamStart?.();
    } catch (error) {
      console.error("Error starting stream:", error);
      alert("Failed to access camera. Please check permissions.");
    }
  };

  const stopStreaming = async () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setIsRecording(false);

    // Update backend
    await updateRecordingStatus({
      alertId,
      isRecording: false,
      isStreaming: false,
    });

    onStreamStop?.();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Video Preview - Full Screen */}
      <div className="flex-1 relative bg-black min-h-[400px] sm:min-h-[500px]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <div className="text-center text-white space-y-4">
              <Video className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto opacity-50" />
              <p className="text-base sm:text-lg lg:text-xl">Camera ready</p>
              <Button
                onClick={startStreaming}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="lg"
              >
                <Radio className="w-5 h-5 mr-2" />
                Start Live Stream
              </Button>
            </div>
          </div>
        )}
        {isStreaming && (
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 sm:gap-3 bg-red-600 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-full">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full animate-pulse" />
            <span className="text-sm sm:text-base lg:text-lg font-bold text-white">
              🔴 LIVE
            </span>
          </div>
        )}
      </div>

      {/* Stop Button - Only show when streaming */}
      {isStreaming && (
        <div className="p-4 sm:p-6">
          <Button
            onClick={stopStreaming}
            className="w-full bg-slate-700 hover:bg-slate-600 text-sm sm:text-base lg:text-lg"
            size="lg"
          >
            <Square className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
            Stop Streaming
          </Button>
        </div>
      )}
    </div>
  );
}
