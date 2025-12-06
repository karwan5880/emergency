import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper function to get authenticated user ID from Clerk
export async function getAuthUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return identity.subject;
  } catch (error) {
    return null;
  }
}

// Query: Get current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const clerkId = await getAuthUserId(ctx);
    if (!clerkId) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    return user;
  },
});

// Mutation: Sync user from Clerk
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    fullName: v.string(),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        fullName: args.fullName,
        profileImage: args.profileImage,
      });
      return existingUser._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        fullName: args.fullName,
        profileImage: args.profileImage,
        createdAt: Date.now(),
        notificationsEnabled: true,
        alarmSoundEnabled: true,
        locationPermissionGranted: false,
      });
      return userId;
    }
  },
});

// Mutation: Update user location
export const updateUserLocation = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const clerkId = await getAuthUserId(ctx);
    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      lastKnownLatitude: args.latitude,
      lastKnownLongitude: args.longitude,
      locationPermissionGranted: true,
    });

    return { success: true };
  },
});
