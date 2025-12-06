"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useEffect } from "react";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const syncUser = useMutation(api.users.syncUser);
  const updateUserLocation = useMutation(api.users.updateUserLocation);

  // Sync user data
  useEffect(() => {
    if (isLoaded && user) {
      syncUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        fullName:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.emailAddresses[0]?.emailAddress ||
          "User",
        profileImage: user.imageUrl,
      }).catch(console.error);
    }
  }, [user, isLoaded, syncUser]);

  // Update user location periodically
  useEffect(() => {
    if (!isLoaded || !user) return;

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }).catch(console.error);
          },
          (error) => {
            console.error("Geolocation error:", error);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    };

    // Update immediately
    updateLocation();

    // Update every 30 seconds
    const interval = setInterval(updateLocation, 30000);

    return () => clearInterval(interval);
  }, [isLoaded, user, updateUserLocation]);

  return null;
}
