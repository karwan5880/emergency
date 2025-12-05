import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./users";

// Query: Get all emergencies for the current user
export const getUserEmergencies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const emergencies = await ctx.db
      .query("emergencies")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return emergencies;
  },
});

// Query: Get emergency by ID
export const getEmergency = query({
  args: { id: v.id("emergencies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const emergency = await ctx.db.get(args.id);
    if (!emergency || emergency.userId !== userId) {
      return null;
    }

    return emergency;
  },
});

// Query: Get emergencies by status
export const getEmergenciesByStatus = query({
  args: { status: v.union(v.literal("pending"), v.literal("in-progress"), v.literal("resolved"), v.literal("cancelled")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const emergencies = await ctx.db
      .query("emergencies")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();

    return emergencies;
  },
});

// Query: Get emergency statistics
export const getEmergencyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { active: 0, resolved: 0, total: 0 };
    }

    const allEmergencies = await ctx.db
      .query("emergencies")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const active = allEmergencies.filter(
      (e) => e.status === "pending" || e.status === "in-progress"
    ).length;
    const resolved = allEmergencies.filter((e) => e.status === "resolved").length;

    return {
      active,
      resolved,
      total: allEmergencies.length,
    };
  },
});

// Mutation: Create a new emergency
export const createEmergency = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const emergencyId = await ctx.db.insert("emergencies", {
      userId,
      title: args.title,
      description: args.description,
      priority: args.priority,
      status: "pending",
      location: args.location,
      createdAt: now,
      updatedAt: now,
    });

    // Create a notification for the new emergency
    await ctx.db.insert("notifications", {
      userId,
      type: "emergency",
      title: "New Emergency Reported",
      message: `Emergency "${args.title}" has been reported and is pending review.`,
      read: false,
      createdAt: now,
    });

    return emergencyId;
  },
});

// Mutation: Update emergency status
export const updateEmergencyStatus = mutation({
  args: {
    id: v.id("emergencies"),
    status: v.union(
      v.literal("pending"),
      v.literal("in-progress"),
      v.literal("resolved"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const emergency = await ctx.db.get(args.id);
    if (!emergency || emergency.userId !== userId) {
      throw new Error("Emergency not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    // Create a notification for the status update
    await ctx.db.insert("notifications", {
      userId,
      type: "update",
      title: "Emergency Status Updated",
      message: `Emergency "${emergency.title}" status changed to ${args.status}.`,
      read: false,
      createdAt: Date.now(),
    });

    return args.id;
  },
});

// Mutation: Update emergency
export const updateEmergency = mutation({
  args: {
    id: v.id("emergencies"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )
    ),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const emergency = await ctx.db.get(args.id);
    if (!emergency || emergency.userId !== userId) {
      throw new Error("Emergency not found or unauthorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.location !== undefined) updates.location = args.location;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

// Mutation: Delete emergency
export const deleteEmergency = mutation({
  args: { id: v.id("emergencies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const emergency = await ctx.db.get(args.id);
    if (!emergency || emergency.userId !== userId) {
      throw new Error("Emergency not found or unauthorized");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
