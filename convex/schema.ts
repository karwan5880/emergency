import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    fullName: v.string(),
    profileImage: v.optional(v.string()),
    createdAt: v.number(),
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
});

