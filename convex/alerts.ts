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
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Notify all users within radius of an alert location
 */
async function notifyNearbyUsers(
  ctx: any,
  alertLatitude: number,
  alertLongitude: number,
  radiusKm: number,
  alertId: any,
  title: string
) {
  // Get all users with location data
  const allUsers = await ctx.db.query("users").collect();

  const notifiedUsers: string[] = [];

  for (const user of allUsers) {
    // Skip if user doesn't have location
    if (
      user.lastKnownLatitude === undefined ||
      user.lastKnownLongitude === undefined
    ) {
      continue;
    }

    // Calculate distance
    const distance = calculateDistance(
      alertLatitude,
      alertLongitude,
      user.lastKnownLatitude,
      user.lastKnownLongitude
    );

    // Notify if within radius
    if (distance <= radiusKm) {
      await ctx.db.insert("notifications", {
        userId: user.clerkId,
        type: "emergency",
        title: "🚨 EMERGENCY ALERT - AlertRun",
        message: `${title || "Emergency incident"} detected ${distance.toFixed(
          1
        )}km away. Tap to view live stream.`,
        read: false,
        createdAt: Date.now(),
      });
      notifiedUsers.push(user.clerkId);
    }
  }

  return notifiedUsers;
}

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

    // Notify nearby users immediately (initial radius: 3km for any alert)
    const initialRadius = 3; // Start with 3km radius
    await notifyNearbyUsers(
      ctx,
      args.latitude,
      args.longitude,
      initialRadius,
      alertId,
      args.title || "Emergency Alert"
    );

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

    // If severity increased significantly, notify more users with expanded radius
    if (escalationThreshold !== null && newSeverity >= 50) {
      const expandedRadius = getNotificationRadius(newSeverity);
      await notifyNearbyUsers(
        ctx,
        alert.latitude,
        alert.longitude,
        expandedRadius,
        args.alertId,
        alert.title || "Emergency Alert"
      );
    }

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
 * Query: Get nearby active alerts for current user
 */
export const getNearbyActiveAlerts = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get user's login time (use account creation as baseline)
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
      .first();

    if (!user) {
      return [];
    }

    const radius = args.radiusKm || 10; // Default 10km radius
    const allAlerts = await ctx.db
      .query("emergency_alerts")
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("status"), "active"),
            q.eq(q.field("status"), "escalated")
          ),
          // Only show alerts created after user's account was created
          q.gte(q.field("createdAt"), user.createdAt)
        )
      )
      .collect();

    // Filter alerts by distance
    const nearbyAlerts = allAlerts
      .map((alert) => {
        const distance = calculateDistance(
          args.latitude,
          args.longitude,
          alert.latitude,
          alert.longitude
        );
        return { ...alert, distance };
      })
      .filter((alert) => alert.distance <= radius)
      .sort((a, b) => a.distance - b.distance); // Closest first

    return nearbyAlerts;
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

/**
 * Query: Get alert history (all statuses, for history page)
 */
export const getAlertHistory = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const radiusKm = args.radiusKm || 50;

    // Get all alerts (not just active) from last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const allAlerts = await ctx.db
      .query("emergency_alerts")
      .withIndex("by_createdAt")
      .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
      .order("desc")
      .collect();

    // Filter by distance and add distance to each alert
    const alertsWithDistance = allAlerts
      .map((alert) => {
        const distance = calculateDistance(
          args.latitude,
          args.longitude,
          alert.latitude,
          alert.longitude
        );
        return {
          ...alert,
          distance,
        };
      })
      .filter((alert) => alert.distance <= radiusKm);

    return alertsWithDistance;
  },
});
