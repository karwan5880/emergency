import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    fullName: v.string(),
    profileImage: v.optional(v.string()),
    createdAt: v.number(),
    notificationsEnabled: v.optional(v.boolean()),
    pushNotificationsEnabled: v.optional(v.boolean()),
    alarmSoundEnabled: v.optional(v.boolean()),
    lastKnownLatitude: v.optional(v.number()),
    lastKnownLongitude: v.optional(v.number()),
    locationPermissionGranted: v.optional(v.boolean()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  emergencies: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("in-progress"),
      v.literal("resolved"),
      v.literal("cancelled")
    ),
    location: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_createdAt", ["createdAt"]),

  notifications: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("emergency"),
      v.literal("alert"),
      v.literal("update"),
      v.literal("reminder")
    ),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_read", ["userId", "read"]),

  emergency_alerts: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    severityScore: v.number(),
    tapCount: v.number(),
    lastTapTimestamp: v.number(),
    tapFrequency: v.number(),
    latitude: v.number(),
    longitude: v.number(),
    address: v.optional(v.string()),
    accuracy: v.optional(v.number()),
    videoStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    isRecording: v.boolean(),
    isStreaming: v.boolean(),
    status: v.union(
      v.literal("active"),
      v.literal("escalated"),
      v.literal("resolved"),
      v.literal("false-alarm")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_severity", ["severityScore"]),

  emergency_taps: defineTable({
    alertId: v.id("emergency_alerts"),
    userId: v.string(),
    timestamp: v.number(),
    latitude: v.number(),
    longitude: v.number(),
  })
    .index("by_alertId", ["alertId"])
    .index("by_userId", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_alertId_timestamp", ["alertId", "timestamp"]),
});

