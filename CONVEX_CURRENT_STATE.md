# 🚀 Convex Backend - Current State

**AlertRun's real-time backend architecture using Convex**

---

## 📊 Overview

AlertRun uses **Convex** as its real-time backend and database. Convex provides:

- ✅ Real-time reactive queries (no WebSocket setup needed)
- ✅ Type-safe TypeScript functions
- ✅ Automatic database indexing
- ✅ Serverless functions that scale automatically
- ✅ Clerk authentication integration

**Current Status**: **Fully Functional** ✅

All core features are implemented and working:

- User management with location tracking
- Emergency alert creation and real-time updates
- Radius-based proximity filtering (Haversine formula)
- Dynamic severity scoring system
- Real-time notifications
- Alert history tracking

---

## 🗄️ Database Schema

### 1. **Users Table** (`users`)

Stores user profiles synced from Clerk authentication.

```typescript
users: {
  clerkId: string,                    // Clerk user ID (primary identifier)
  email: string,
  fullName: string,
  profileImage?: string,
  createdAt: number,                  // Account creation timestamp

  // Location tracking
  lastKnownLatitude?: number,         // Updated every 30 seconds
  lastKnownLongitude?: number,        // Updated every 30 seconds
  locationPermissionGranted?: boolean,

  // Settings
  notificationsEnabled?: boolean,
  pushNotificationsEnabled?: boolean,
  alarmSoundEnabled?: boolean,
}

Indexes:
- by_clerkId: ["clerkId"]  // Fast user lookup
- by_email: ["email"]      // Email search
```

**Status**: ✅ Fully implemented and working

---

### 2. **Emergency Alerts Table** (`emergency_alerts`)

Main table for emergency incidents - the core of AlertRun.

```typescript
emergency_alerts: {
  _id: Id<"emergency_alerts">,
  userId: string,                     // Creator's Clerk ID

  // Alert details
  title?: string,
  description?: string,

  // Location
  latitude: number,                   // GPS coordinates
  longitude: number,                  // GPS coordinates
  address?: string,                   // Optional address string
  accuracy?: number,                  // GPS accuracy in meters

  // Severity system
  severityScore: number,              // 0-100 calculated score
  tapCount: number,                   // Total taps on alert
  lastTapTimestamp: number,           // Last tap time
  tapFrequency: number,               // Taps per second

  // Media (future - currently mockup)
  videoStorageId?: Id<"_storage">,    // Convex file storage
  videoUrl?: string,                  // Video URL
  isRecording: boolean,               // Currently recording?
  isStreaming: boolean,               // Currently streaming?

  // Status
  status: "active" | "escalated" | "resolved" | "false-alarm",
  createdAt: number,
  updatedAt: number,
  resolvedAt?: number,
}

Indexes:
- by_userId: ["userId"]              // User's alerts
- by_status: ["status"]               // Filter by status
- by_createdAt: ["createdAt"]         // Time-based queries
- by_severity: ["severityScore"]      // Sort by severity
```

**Status**: ✅ Fully implemented and working

---

### 3. **Emergency Taps Table** (`emergency_taps`)

Tracks every tap/button press on an alert. Used for severity calculation.

```typescript
emergency_taps: {
  _id: Id<"emergency_taps">,
  alertId: Id<"emergency_alerts">,   // Which alert was tapped
  userId: string,                     // Who tapped
  timestamp: number,                  // When tapped (ms)
  latitude: number,                   // User's location when tapped
  longitude: number,                  // User's location when tapped
}

Indexes:
- by_alertId: ["alertId"]             // All taps for an alert
- by_userId: ["userId"]               // User's taps
- by_timestamp: ["timestamp"]         // Time-based queries
- by_alertId_timestamp: ["alertId", "timestamp"]  // Recent taps query
```

**Status**: ✅ Fully implemented and working

---

### 4. **Notifications Table** (`notifications`)

In-app notifications for users (currently used for emergency alerts).

```typescript
notifications: {
  _id: Id<"notifications">,
  userId: string,                     // Recipient
  type: "emergency" | "alert" | "update" | "reminder",
  title: string,
  message: string,
  read: boolean,
  createdAt: number,
}

Indexes:
- by_userId: ["userId"]               // User's notifications
- by_userId_read: ["userId", "read"]  // Unread notifications
```

**Status**: ✅ Implemented (but currently unused in UI - bell icon uses direct queries)

---

### 5. **Emergencies Table** (`emergencies`)

Legacy table - appears to be from earlier prototype. Currently **not actively used** by the app.

```typescript
emergencies: {
  _id: Id<"emergencies">,
  userId: string,
  title: string,
  description: string,
  priority: "low" | "medium" | "high" | "critical",
  status: "pending" | "in-progress" | "resolved" | "cancelled",
  location?: string,
  createdAt: number,
  updatedAt: number,
}

Indexes:
- by_userId: ["userId"]
- by_status: ["status"]
- by_priority: ["priority"]
- by_createdAt: ["createdAt"]
```

**Status**: ⚠️ **Not actively used** - App uses `emergency_alerts` instead

**Note**: This table and its functions exist but are not called from the frontend. Consider removing in cleanup.

---

## 🔧 Convex Functions

### **Module: `users.ts`**

#### Helper Functions

- **`getAuthUserId(ctx)`** - Extracts Clerk user ID from auth context
  - Returns: `string | null`
  - Used by: All authenticated functions

#### Queries

- **`getCurrentUser`** - Get current authenticated user's profile
  - Args: `{}`
  - Returns: User object or `null`
  - Status: ✅ Working

#### Mutations

- **`syncUser`** - Sync/update user profile from Clerk

  - Args: `clerkId`, `email`, `fullName`, `profileImage?`
  - Creates user if doesn't exist, updates if exists
  - Called: On app load via `UserSync` component
  - Status: ✅ Working

- **`updateUserLocation`** - Update user's GPS coordinates
  - Args: `latitude`, `longitude`, `accuracy?`
  - Called: Every 30 seconds automatically
  - Status: ✅ Working

---

### **Module: `alerts.ts`** ⭐ Core Module

#### Helper Functions

- **`calculateDistance(lat1, lon1, lat2, lon2)`** - Haversine formula

  - Returns: Distance in kilometers
  - Status: ✅ Working perfectly

- **`notifyNearbyUsers(...)`** - Send notifications to users within radius
  - Calculates distances and creates notification entries
  - Called: When alert created or severity increases
  - Status: ✅ Working

#### Mutations

- **`createAlert`** ⭐ Core Function

  - Args: `latitude`, `longitude`, `accuracy?`, `title?`, `description?`
  - Creates alert with initial tap (tapCount = 1)
  - Immediately notifies users within 3km radius
  - Returns: Alert ID
  - Status: ✅ Working

- **`recordTap`** ⭐ Core Function

  - Args: `alertId`, `latitude`, `longitude`
  - Records tap and recalculates severity score
  - Expands notification radius if severity threshold crossed
  - Returns: Updated severity metrics
  - Status: ✅ Working

- **`updateAlertStatus`**

  - Args: `alertId`, `status`
  - Only alert creator can update status
  - Status: ✅ Working

- **`updateRecordingStatus`**

  - Args: `alertId`, `isRecording`, `isStreaming?`
  - Updates streaming/recording flags (currently mockup)
  - Status: ✅ Working (but video streaming not implemented)

- **`saveVideoToAlert`**
  - Args: `alertId`, `storageId`, `videoUrl`
  - Saves video file reference (future feature)
  - Status: ✅ Structure ready, not actively used

#### Queries

- **`getNearbyActiveAlerts`** ⭐ Core Query

  - Args: `latitude`, `longitude`, `radiusKm?` (default: 10km)
  - Gets all active/escalated alerts within radius
  - Calculates distance for each alert
  - Returns: Sorted by distance (closest first)
  - Called: Dashboard bell icon, notification panel
  - Status: ✅ Working perfectly

- **`getUserActiveAlerts`**

  - Args: `{}`
  - Gets current user's active alerts
  - Status: ✅ Working

- **`getAlertDetails`**

  - Args: `alertId`
  - Gets full alert with real-time metrics (recent taps, unique users)
  - Called: When viewing alert details
  - Status: ✅ Working

- **`getAlertMetrics`**

  - Args: `alertId`
  - Gets tap statistics and timeline
  - Status: ✅ Working

- **`getActiveAlerts`**

  - Args: `{}`
  - Gets all active alerts (not filtered by user/location)
  - Status: ✅ Working

- **`getAlertHistory`**
  - Args: `latitude`, `longitude`, `radiusKm?` (default: 50km)
  - Gets all alerts (all statuses) from last 7 days within radius
  - Used: History page
  - Status: ✅ Working

---

### **Module: `severity.ts`**

Helper functions for severity calculation.

- **`calculateSeverityScore(tapCount, tapFrequency, uniqueUserCount)`**

  - Formula: `20% tap count + 30% frequency + 50% active users`
  - Returns: 0-100 score
  - Status: ✅ Working

- **`getNotificationRadius(severityScore)`**

  - Returns: Radius in km based on severity
  - Thresholds: 3km (low), 5km (medium), 10km (high), 15km (critical)
  - Status: ✅ Working

- **`getSeverityLevel(severityScore)`**

  - Returns: `"low" | "medium" | "high" | "critical"`
  - Status: ✅ Working

- **`getEscalationThreshold(oldSeverity, newSeverity)`**
  - Detects when severity crosses threshold (30, 50, 80)
  - Used to trigger expanded notifications
  - Status: ✅ Working

---

### **Module: `notifications.ts`**

Notification management functions (currently less used).

#### Queries

- **`getUserNotifications`** - Get all user notifications
- **`getUnreadNotifications`** - Get unread notifications
- **`getUnreadNotificationCount`** - Count unread

#### Mutations

- **`markNotificationAsRead`** - Mark single notification as read
- **`markAllNotificationsAsRead`** - Mark all as read
- **`deleteNotification`** - Delete notification

**Status**: ✅ Implemented but **not actively used** in UI

- Bell icon uses `getNearbyActiveAlerts` directly
- Notifications table entries are created but not displayed

---

### **Module: `emergencies.ts`**

Legacy functions from earlier prototype.

**Status**: ⚠️ **Not actively used** by the app

- Functions exist but are not called from frontend
- App uses `emergency_alerts` table instead

---

## 🔐 Authentication

### Clerk Integration

**File**: `convex/auth.config.ts`

```typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

**How it works**:

1. User signs in via Clerk (frontend)
2. Clerk JWT token passed to Convex via `ConvexProvider`
3. Convex validates token and extracts `subject` (Clerk user ID)
4. All functions use `getAuthUserId(ctx)` for authentication

**Status**: ✅ Working perfectly

---

## 📈 Current Features

### ✅ Implemented & Working

1. **User Management**

   - ✅ Automatic user sync from Clerk
   - ✅ Profile updates
   - ✅ Location tracking (every 30 seconds)

2. **Emergency Alerts**

   - ✅ Create alert with GPS coordinates
   - ✅ Real-time alert queries
   - ✅ Radius-based filtering (Haversine formula)
   - ✅ Alert status management

3. **Severity System**

   - ✅ Tap tracking and counting
   - ✅ Dynamic severity score calculation
   - ✅ Automatic radius expansion
   - ✅ Escalation detection

4. **Notifications**

   - ✅ Automatic notification creation
   - ✅ Distance-based filtering
   - ✅ Real-time updates

5. **History**
   - ✅ Alert history page
   - ✅ 7-day lookback window
   - ✅ Distance calculation

### ⚠️ Partially Implemented

1. **Video/Streaming**

   - ⚠️ Database fields exist (`videoStorageId`, `videoUrl`, `isStreaming`)
   - ⚠️ Functions exist (`updateRecordingStatus`, `saveVideoToAlert`)
   - ❌ **Actual streaming not implemented** (currently mockup)
   - 📝 See `LIVE_STREAMING.md` for future implementation

2. **Notifications UI**
   - ✅ Notification entries are created in database
   - ⚠️ Not displayed in UI (bell icon uses direct queries)
   - 📝 Could be refactored to use notification table

### ❌ Not Implemented

1. **Push Notifications**

   - Database field exists (`pushNotificationsEnabled`)
   - No actual push notification implementation
   - Would require service worker + notification API

2. **Address Geocoding**
   - `address` field exists but not populated
   - Could add reverse geocoding (lat/lng → address)

---

## 🎯 Architecture Decisions

### Why This Structure?

1. **Separate Tables for Alerts vs Taps**

   - Alerts table stores alert metadata
   - Taps table stores individual interactions
   - Allows complex queries (tap frequency, unique users, etc.)

2. **Severity Scoring Formula**

   - 50% weight on active users (whistleblowers)
   - 20% tap count, 30% frequency
   - Prioritizes multiple witnesses over spam taps

3. **Radius-Based Filtering**

   - Server-side filtering (secure, efficient)
   - Haversine formula (accurate distance)
   - Dynamic radius (scales with severity)

4. **Real-Time Queries**
   - Convex reactive queries update automatically
   - No manual polling or WebSocket setup needed
   - UI stays in sync with database changes

---

## 📊 Data Flow Examples

### Example 1: Creating an Alert

```
1. User A creates alert (Active Mode)
   ↓
2. Frontend calls: createAlert(lat, lng, ...)
   ↓
3. Convex:
   - Inserts into emergency_alerts table
   - Records initial tap in emergency_taps
   - Calls notifyNearbyUsers(3km radius)
   ↓
4. notifyNearbyUsers:
   - Queries all users
   - Calculates distances (Haversine)
   - Creates notifications for users within 3km
   ↓
5. Users within 3km:
   - Receive notification entry
   - getNearbyActiveAlerts query updates (real-time)
   - Bell icon shows new alert
```

### Example 2: Tapping Alert Button

```
1. User B taps alert button (during streaming)
   ↓
2. Frontend calls: recordTap(alertId, lat, lng)
   ↓
3. Convex:
   - Inserts tap into emergency_taps
   - Queries all taps for alert
   - Calculates new severity score
   ↓
4. If severity crosses threshold:
   - Calls notifyNearbyUsers with expanded radius
   - More users receive alerts
   ↓
5. All queries update in real-time:
   - Severity score changes
   - Radius expands
   - More users see alert
```

---

## 🔄 Real-Time Updates

Convex's reactive queries mean:

```typescript
// In Dashboard component
const nearbyAlertsQuery = useQuery(
  api.alerts.getNearbyActiveAlerts,
  userLocation ? { latitude, longitude, radiusKm: 10 } : "skip"
);
```

**Automatically updates when**:

- ✅ New alert created nearby
- ✅ Alert status changes
- ✅ Alert severity increases
- ✅ Alert resolved/closed
- ✅ User location changes

**No manual refresh needed!** 🎉

---

## 🚧 Known Issues / Limitations

### 1. **Performance at Scale**

**Current**: All alerts queried, then filtered in-memory

- Works great for <1000 alerts
- May need optimization for large scale

**Potential Fix**: Add geographic indexes or use Convex vector search

### 2. **Notification System**

**Current**: Notifications created but UI doesn't use them

- Bell icon queries `getNearbyActiveAlerts` directly
- Notification table entries exist but unused

**Potential Fix**: Refactor UI to use notification table

### 3. **Video Streaming**

**Current**: Database fields ready, but no actual streaming

- Mockup only
- See `LIVE_STREAMING.md` for implementation plan

### 4. **Location Updates**

**Current**: Every 30 seconds (may be too frequent)

- Battery impact on mobile
- Could be configurable per user

---

## 📝 Future Improvements

### High Priority

1. **Geographic Indexing**

   - Optimize distance queries at scale
   - Consider geohash or PostGIS-like indexing

2. **Notification UI Integration**

   - Use notification table in UI
   - Unified notification center

3. **Live Streaming Integration**
   - Implement actual video streaming
   - See `LIVE_STREAMING.md`

### Medium Priority

1. **Push Notifications**

   - Browser push notifications
   - Mobile app notifications

2. **Address Geocoding**

   - Reverse geocoding (lat/lng → address)
   - Display human-readable locations

3. **Alert Expiration**
   - Auto-resolve old alerts
   - Cleanup inactive alerts

### Low Priority

1. **Cleanup Legacy Code**

   - Remove `emergencies` table (unused)
   - Remove unused notification functions (or integrate)

2. **Analytics**
   - Alert statistics
   - User engagement metrics
   - Response time tracking

---

## 📦 File Structure

```
convex/
├── schema.ts           # Database schema definition
├── auth.config.ts      # Clerk authentication config
├── users.ts           # User management functions
├── alerts.ts          # ⭐ Core emergency alert functions
├── severity.ts        # Severity calculation helpers
├── notifications.ts   # Notification management (unused)
├── emergencies.ts     # Legacy functions (unused)
└── README.md          # Basic setup guide
```

---

## ✅ Summary

### What's Working

- ✅ **Core Functionality**: Alert creation, tapping, severity system
- ✅ **Real-Time Updates**: Convex reactive queries
- ✅ **Location System**: GPS tracking, radius filtering
- ✅ **User Management**: Clerk sync, location updates
- ✅ **History**: Alert history page

### What Needs Work

- ⚠️ **Video Streaming**: Not implemented (mockup only)
- ⚠️ **Notifications UI**: Created but not displayed
- ⚠️ **Scale Optimization**: May need indexing improvements

### Overall Status

**🚀 Production Ready** for MVP/Prototype

The core emergency alert system is fully functional and working well. The radius-based filtering is working perfectly, and real-time updates make the app feel instant and responsive.

---

**Last Updated**: Based on current codebase state
**Convex Version**: v1.30.0
**Status**: ✅ Fully Functional
