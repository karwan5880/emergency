/**
 * Client-side severity utilities (mirrored from Convex backend)
 */

export function getSeverityLevel(
  severityScore: number
): "low" | "medium" | "high" | "critical" {
  if (severityScore >= 80) return "critical";
  if (severityScore >= 50) return "high";
  if (severityScore >= 30) return "medium";
  return "low";
}

export function getNotificationRadius(severityScore: number): number {
  if (severityScore >= 80) return 15; // System-wide (15km)
  if (severityScore >= 50) return 10; // High severity (10km)
  if (severityScore >= 30) return 5; // Medium severity (5km)
  return 3; // Low severity (3km)
}
