/**
 * Severity calculation helpers for emergency alerts
 * Formula: 20% tap count + 30% frequency + 50% active users (whistleblowers)
 * More active users = higher severity (critical for life-saving)
 * Returns 0-100 score
 */

export function calculateSeverityScore(
  tapCount: number,
  tapFrequency: number, // taps per second
  uniqueUserCount: number // number of active whistleblowers
): number {
  // Normalize each metric to 0-1, then apply weights
  // Tap count: max at 50 taps (normalization)
  const tapScore = Math.min((tapCount / 50) * 20, 20);

  // Tap frequency: max at 5 taps per second (normalization)
  const frequencyScore = Math.min((tapFrequency / 5) * 30, 30);

  // Active users (whistleblowers): max at 10 users (normalization)
  // HEAVILY WEIGHTED - more whistleblowers = more critical
  const userScore = Math.min((uniqueUserCount / 10) * 50, 50);

  const total = tapScore + frequencyScore + userScore;
  return Math.round(total);
}

/**
 * Determine notification radius (in km) based on severity score
 */
export function getNotificationRadius(severityScore: number): number {
  if (severityScore >= 80) return 15; // System-wide (15km)
  if (severityScore >= 50) return 10; // High severity (10km)
  if (severityScore >= 30) return 5; // Medium severity (5km)
  return 3; // Low severity (3km)
}

/**
 * Determine severity level label
 */
export function getSeverityLevel(
  severityScore: number
): "low" | "medium" | "high" | "critical" {
  if (severityScore >= 80) return "critical";
  if (severityScore >= 50) return "high";
  if (severityScore >= 30) return "medium";
  return "low";
}

/**
 * Check if severity has crossed an escalation threshold
 * Returns the threshold that was crossed, or null if none
 */
export function getEscalationThreshold(
  oldSeverity: number,
  newSeverity: number
): number | null {
  const thresholds = [30, 50, 80];

  for (const threshold of thresholds) {
    if (oldSeverity < threshold && newSeverity >= threshold) {
      return threshold;
    }
  }

  return null;
}
