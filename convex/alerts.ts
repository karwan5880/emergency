import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./users";
import {
  calculateSeverityScore,
  getNotificationRadius,
  getSeverityLevel,
  getEscalationThreshold,
} from "./severity";

/**
 * Mutation: Create a new emergency alert with initial tap
 */
export const createAlert = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.optional(v.number()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    // Create alert with initial tap (count = 1)
    const alertId = await ctx.db.insert("emergency_alerts", {
      userId,
      title: args.title,
      description: args.description,
      severityScore: 0,
      tapCount: 1,
      lastTapTimestamp: now,
      tapFrequency: 0,
      latitude: args.latitude,
      longitude: args.longitude,
      accuracy: args.accuracy,
      videoStorageId: undefined,
      videoUrl: undefined,
      isRecording: false,
      isStreaming: false,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Record the initial tap
    await ctx.db.insert("emergency_taps", {
      alertId,
      userId,
      timestamp: now,
      latitude: args.latitude,
      longitude: args.longitude,
    });

    return alertId;
  },
});

/**
 * Mutation: Record an additional tap on an existing alert
 * Updates severity score and frequency
 */
export const recordTap = mutation({
  args: {
    alertId: v.id("emergency_alerts"),
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    // Verify user can tap this alert (can be any user, not just creator)
    const now = Date.now();

    // Record the tap
    await ctx.db.insert("emergency_taps", {
      alertId: args.alertId,
      userId,
      timestamp: now,
      latitude: args.latitude,
      longitude: args.longitude,
    });

    // Get all taps from last 10 seconds
    const tenSecondsAgo = now - 10000;
    const recentTaps = await ctx.db
      .query("emergency_taps")
      .withIndex("by_alertId_timestamp", (q) =>
        q.eq("alertId", args.alertId).gt("timestamp", tenSecondsAgo)
      )
      .collect();

    // Calculate metrics
    const totalTaps = await ctx.db
      .query("emergency_taps")
      .withIndex("by_alertId", (q) => q.eq("alertId", args.alertId))
      .collect();

    const uniqueUsers = new Set(totalTaps.map((t) => t.userId)).size;
    const newTapCount = totalTaps.length;
    const tapFrequency = recentTaps.length / 10; // taps per second

    // Calculate new severity score
    const oldSeverity = alert.severityScore;
    const newSeverity = calculateSeverityScore(
      newTapCount,
      tapFrequency,
      uniqueUsers
    );

    // Check if we've crossed an escalation threshold
    const escalationThreshold = getEscalationThreshold(
      oldSeverity,
      newSeverity
    );
    const newStatus =
      escalationThreshold && escalationThreshold >= 50 ? "escalated" : "active";

    // Update alert
    await ctx.db.patch(args.alertId, {
      tapCount: newTapCount,
      lastTapTimestamp: now,
      tapFrequency,
      severityScore: newSeverity,
      status: newStatus,
      updatedAt: now,
    });

    return {
      alertId: args.alertId,
      severityScore: newSeverity,
      tapCount: newTapCount,
      tapFrequency,
      escalated: escalationThreshold !== null,
      escalationThreshold,
    };
  },
});

/**
 * Mutation: Update alert status
 */
export const updateAlertStatus = mutation({
  args: {
    alertId: v.id("emergency_alerts"),
    status: v.union(
      v.literal("active"),
      v.literal("escalated"),
      v.literal("resolved"),
      v.literal("false-alarm")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    // Only creator can update status
    if (alert.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    const updates: any = {
      status: args.status,
      updatedAt: now,
    };

    if (args.status === "resolved" || args.status === "false-alarm") {
      updates.resolvedAt = now;
    }

    await ctx.db.patch(args.alertId, updates);

    return { success: true };
  },
});

/**
 * Query: Get user's active alerts
 */
export const getUserActiveAlerts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const alerts = await ctx.db
      .query("emergency_alerts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "escalated")
        )
      )
      .collect();

    // Sort by createdAt descending (most recent first)
    return alerts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Query: Get specific alert details with real-time metrics
 */
export const getAlertDetails = query({
  args: {
    alertId: v.id("emergency_alerts"),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      return null;
    }

    // Get recent taps (last 60 seconds)
    const sixtySecondsAgo = Date.now() - 60000;
    const recentTaps = await ctx.db
      .query("emergency_taps")
      .withIndex("by_alertId_timestamp", (q) =>
        q.eq("alertId", args.alertId).gt("timestamp", sixtySecondsAgo)
      )
      .collect();

    // Get all taps for unique user count
    const allTaps = await ctx.db
      .query("emergency_taps")
      .withIndex("by_alertId", (q) => q.eq("alertId", args.alertId))
      .collect();

    const uniqueUsers = new Set(allTaps.map((t) => t.userId)).size;

    return {
      ...alert,
      recentTapCount: recentTaps.length,
      uniqueUsers,
      notificationRadius: getNotificationRadius(alert.severityScore),
      severityLevel: getSeverityLevel(alert.severityScore),
    };
  },
});

/**
 * Query: Get alert metrics (for dashboard displays)
 */
export const getAlertMetrics = query({
  args: {
    alertId: v.id("emergency_alerts"),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      return null;
    }

    const allTaps = await ctx.db
      .query("emergency_taps")
      .withIndex("by_alertId_timestamp", (q) => q.eq("alertId", args.alertId))
      .order("desc")
      .collect();

    const uniqueUsers = new Set(allTaps.map((t) => t.userId)).size;

    // Get last 10 taps for timeline
    const lastTenTaps = allTaps.slice(0, 10);

    return {
      totalTaps: allTaps.length,
      uniqueUsers,
      averageTapFrequency: alert.tapFrequency,
      severityScore: alert.severityScore,
      severityLevel: getSeverityLevel(alert.severityScore),
      status: alert.status,
      lastTapTimestamp: alert.lastTapTimestamp,
      recentTaps: lastTenTaps,
    };
  },
});

/**
 * Query: Get all active alerts (not filtered by user)
 */
export const getActiveAlerts = query({
  args: {},
  handler: async (ctx) => {
    const alerts = await ctx.db
      .query("emergency_alerts")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Sort by createdAt descending (most recent first)
    return alerts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Mutation: Update recording status
 */
export const updateRecordingStatus = mutation({
  args: {
    alertId: v.id("emergency_alerts"),
    isRecording: v.boolean(),
    isStreaming: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    // Only alert creator can update recording status
    if (alert.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const updates: any = {
      isRecording: args.isRecording,
      updatedAt: Date.now(),
    };

    if (args.isStreaming !== undefined) {
      updates.isStreaming = args.isStreaming;
    }

    await ctx.db.patch(args.alertId, updates);

    return { success: true };
  },
});

/**
 * Mutation: Save video to alert
 */
export const saveVideoToAlert = mutation({
  args: {
    alertId: v.id("emergency_alerts"),
    storageId: v.id("_storage"),
    videoUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    // Only alert creator can save video
    if (alert.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.alertId, {
      videoStorageId: args.storageId,
      videoUrl: args.videoUrl,
      isRecording: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
