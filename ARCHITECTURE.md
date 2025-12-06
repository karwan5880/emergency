# Emergency Alert System - Architecture & Data Flow

## System Overview

The Emergency Management Application is a real-time emergency alert system built with Next.js, React, TypeScript, and Convex. It enables users to quickly report emergencies with automatic severity calculation based on tap frequency, and notifies nearby users in real-time.

---

## Core Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js 16 + React 19)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         Dashboard Page                               │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │  Emergency      │  │  Active Alerts   │  │  Floating        │   │   │
│  │  │  Button         │  │  List            │  │  Emergency       │   │   │
│  │  │  (Floating)     │  │                  │  │  Button          │   │   │
│  │  └─────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                   │                                           │
│                                   ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Convex React Hooks                               │   │
│  │  useQuery() / useMutation()                                          │   │
│  │  - api.alerts.createAlert()                                         │   │
│  │  - api.alerts.recordTap()                                           │   │
│  │  - api.alerts.getUserActiveAlerts()                                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                   │                                           │
│                    ┌──────────────┴──────────────┐                          │
│                    ▼                             ▼                          │
│          Browser Geolocation API        Clerk Authentication               │
│          navigator.geolocation             (JWT Tokens)                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (Convex Token + Lat/Lng)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONVEX BACKEND (TypeScript Runtime)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Authentication Layer                             │   │
│  │  getAuthUserId(ctx) → Validates Clerk JWT → Returns Clerk ID      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Mutations (Write Operations)                     │   │
│  │                                                                     │   │
│  │  ┌───────────────────────┐         ┌───────────────────────┐      │   │
│  │  │ createAlert()         │         │ recordTap()           │      │   │
│  │  ├───────────────────────┤         ├───────────────────────┤      │   │
│  │  │ 1. Get user ID        │         │ 1. Get user ID        │      │   │
│  │  │ 2. Create alert doc   │         │ 2. Insert tap record  │      │   │
│  │  │ 3. Insert first tap   │         │ 3. Query recent taps  │      │   │
│  │  │ 4. Return alertId     │         │ 4. Calculate metrics  │      │   │
│  │  └───────────────────────┘         │ 5. Update severity    │      │   │
│  │                                     │ 6. Return metrics     │      │   │
│  │  ┌───────────────────────┐         └───────────────────────┘      │   │
│  │  │ updateAlertStatus()   │                                         │   │
│  │  ├───────────────────────┤         ┌───────────────────────┐      │   │
│  │  │ 1. Verify ownership   │         │ updateRecordingStatus │      │   │
│  │  │ 2. Update status      │         ├───────────────────────┤      │   │
│  │  │ 3. Set resolvedAt ts  │         │ 1. Verify ownership   │      │   │
│  │  └───────────────────────┘         │ 2. Update recording   │      │   │
│  │                                     │    and streaming      │      │   │
│  │                                     └───────────────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Severity Calculation (severity.ts)              │   │
│  │                                                                     │   │
│  │  calculateSeverityScore(tapCount, tapFrequency, uniqueUsers)      │   │
│  │  ├─ Tap Count:      0-30 points (max 50 taps)                    │   │
│  │  ├─ Frequency:      0-40 points (max 5 taps/sec)                 │   │
│  │  └─ Unique Users:   0-30 points (max 10 users)                   │   │
│  │     ─────────────────────────────────────────                     │   │
│  │     Total Score:    0-100 points                                  │   │
│  │                                                                     │   │
│  │  Escalation Levels:                                               │   │
│  │  ├─ Score 0-29:   "low"       → 3km radius                       │   │
│  │  ├─ Score 30-49:  "medium"    → 5km radius                       │   │
│  │  ├─ Score 50-79:  "high"      → 10km radius                      │   │
│  │  └─ Score 80+:    "critical"  → 15km radius                      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Queries (Read Operations)                        │   │
│  │                                                                     │   │
│  │  getUserActiveAlerts()                                            │   │
│  │  └─ Returns user's active/escalated alerts, sorted by creation  │   │
│  │                                                                     │   │
│  │  getAlertDetails(alertId)                                        │   │
│  │  ├─ Get alert document                                          │   │
│  │  ├─ Get recent taps (last 60s)                                 │   │
│  │  ├─ Calculate unique users tapping                             │   │
│  │  └─ Return enriched alert with metrics                         │   │
│  │                                                                     │   │
│  │  getAlertMetrics(alertId)                                       │   │
│  │  ├─ Total tap count                                            │   │
│  │  ├─ Unique user count                                          │   │
│  │  ├─ Average tap frequency                                      │   │
│  │  └─ Last 10 taps timeline                                      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (Real-time subscription updates)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE (Convex Transactional DB)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌───────────────────────────────────┐  ┌───────────────────────────────┐  │
│  │      emergency_alerts table        │  │   emergency_taps table        │  │
│  ├───────────────────────────────────┤  ├───────────────────────────────┤  │
│  │ _id (primary)                     │  │ _id (primary)                 │  │
│  │ userId (indexed)                  │  │ alertId (indexed)             │  │
│  │ title, description                │  │ userId (indexed)              │  │
│  │ severityScore (indexed)            │  │ timestamp (indexed)           │  │
│  │ tapCount                           │  │ latitude, longitude           │  │
│  │ lastTapTimestamp                  │  │ composite: alertId+timestamp  │  │
│  │ tapFrequency                       │  │                               │  │
│  │ latitude, longitude                │  └───────────────────────────────┘  │
│  │ accuracy, address                  │                                     │
│  │ status: active|escalated|resolved  │  ┌───────────────────────────────┐  │
│  │ isRecording, isStreaming           │  │        users table            │  │
│  │ videoStorageId, videoUrl           │  ├───────────────────────────────┤  │
│  │ createdAt, updatedAt, resolvedAt   │  │ clerkId (indexed)             │  │
│  │                                     │  │ email (indexed)               │  │
│  │ Indexes:                            │  │ fullName, profileImage        │  │
│  │ - by_userId                         │  │ notificationsEnabled          │  │
│  │ - by_status                         │  │ locationPermissionGranted     │  │
│  │ - by_createdAt                      │  │ lastKnownLatitude/Longitude   │  │
│  │ - by_severity                       │  │ createdAt                     │  │
│  │                                     │  └───────────────────────────────┘  │
│  └───────────────────────────────────┘                                     │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Emergency Creation Flow

```
User Taps Emergency Button
        │
        ▼
Browser Requests Location (navigator.geolocation)
        │
        ├─ Success: Get lat/lng
        │         └─ ▼
        │    User clicks button first time
        │         │
        │         ▼
        │    Call createAlert(lat, lng)
        │         │
        │         ▼
        │    Convex Backend
        │    ├─ Validate user (getAuthUserId)
        │    ├─ Create emergency_alerts doc
        │    │  └─ Initialize: tapCount=1, severity=0
        │    │
        │    ├─ Insert into emergency_taps
        │    │  └─ Record first tap with timestamp
        │    │
        │    └─ Return alertId
        │         │
        │         ▼
        │    Frontend receives alertId
        │    ├─ setAlertId(alertId)
        │    ├─ setIsActive(true)
        │    ├─ setTapCount(1)
        │    └─ Haptic feedback (vibrate)
        │
        └─ Permission Denied: Use last known or 0,0
                └─ Alert user to enable location

Alert is now ACTIVE and ready for additional taps
```

### 2. Severity Escalation Flow

```
User Taps Button (while alert active)
        │
        ▼
Call recordTap(alertId, lat, lng)
        │
        ▼
Convex Backend
├─ Insert new tap into emergency_taps
│
├─ Query all taps for this alert (last 10 seconds)
│  └─ Calculate: tapFrequency = tapCount / 10
│
├─ Query all taps for this alert (all time)
│  └─ Calculate: uniqueUsers = count(distinct userId)
│
├─ Call calculateSeverityScore()
│  ├─ tapScore       = (totalTaps / 50) × 30
│  ├─ frequencyScore = (tapFreq / 5) × 40
│  ├─ userScore      = (uniqueUsers / 10) × 30
│  └─ TOTAL = tapScore + frequencyScore + userScore
│
├─ Check escalation thresholds
│  ├─ Score crossed 30? → Status: "active", Radius: 5km
│  ├─ Score crossed 50? → Status: "escalated", Radius: 10km
│  └─ Score crossed 80? → Status: "escalated", Radius: 15km
│
├─ Update alert document
│  ├─ severityScore = newScore
│  ├─ tapCount = newCount
│  ├─ tapFrequency = newFreq
│  └─ status = "active" or "escalated"
│
└─ Return metrics to frontend
   ├─ severityScore
   ├─ tapCount
   ├─ tapFrequency
   └─ escalationThreshold (if crossed)

Frontend updates UI
├─ setTapCount(newCount)
├─ setSeverityScore(newScore)
├─ setTapFrequency(newFreq)
├─ Color changes: green → yellow → orange → red
└─ Haptic feedback intensity increases
```

### 3. Real-time Alert Viewing Flow

```
Dashboard Queries getUserActiveAlerts()
        │
        ▼
Convex Backend
├─ Get userId from Clerk JWT
├─ Query emergency_alerts where userId=currentUser
│  AND status IN ("active", "escalated")
│
├─ Order by createdAt DESC (most recent first)
│
└─ Return array of active alerts
        │
        ▼
Frontend receives alerts
├─ useQuery() subscribes to real-time changes
├─ Display Active Alerts section
│  └─ For each alert:
│     ├─ Title + timestamp
│     └─ SeverityIndicator component
│        ├─ Progress bar (0-100)
│        ├─ Color: green/yellow/orange/red
│        ├─ Tap count
│        └─ Frequency display
│
When new tap recorded elsewhere:
├─ Convex pushes update to all subscribed clients
├─ Frontend re-renders with new metrics
└─ User sees severity increasing in real-time
```

---

## Component Hierarchy

```
Dashboard (src/app/dashboard/page.tsx)
│
├─ Navigation Bar
│  └─ Notification Bell
│
├─ Welcome Section
│
├─ Quick Actions
│  └─ "Report Emergency" Button (traditional form)
│
├─ Stats Cards
│  ├─ Active Count
│  └─ Resolved Count
│
├─ Active Alerts Section (NEW)
│  └─ For each alert:
│     └─ Card
│        └─ SeverityIndicator
│           ├─ Progress Bar
│           ├─ Severity Level Label
│           ├─ Tap Count
│           └─ Frequency Display
│
├─ Recent Emergencies Section
│  └─ EmergencyList (existing)
│
└─ Floating Emergency Button (NEW)
   └─ EmergencyButton
      ├─ Main circular button (pulsing)
      ├─ Status display (when active)
      │  ├─ Tap counter
      │  ├─ Severity indicator
      │  ├─ Frequency display
      │  └─ Stop button
      └─ Haptic feedback system
```

---

## State Management Flow

### EmergencyButton Component State

```
Component Mounts
    │
    ├─ isActive: false
    ├─ alertId: null
    ├─ tapCount: 0
    ├─ severityScore: 0
    ├─ tapFrequency: 0
    └─ isLoading: false

User clicks button FIRST TIME
    │
    ├─ Call createAlert()
    │
    ├─ Updates state:
    │  ├─ isActive = true
    │  ├─ alertId = newId
    │  ├─ tapCount = 1
    │  ├─ severityScore = 0
    │  └─ isLoading = false
    │
    └─ Renders: Pulsing button + Status box

User clicks button AGAIN (while active)
    │
    ├─ Call recordTap()
    │
    ├─ Updates state with returned metrics:
    │  ├─ tapCount = result.tapCount
    │  ├─ severityScore = result.severityScore
    │  ├─ tapFrequency = result.tapFrequency
    │  └─ isLoading = false
    │
    └─ Renders: Updated status with new values

User clicks "Stop Emergency"
    │
    └─ Updates state:
       ├─ isActive = false
       ├─ alertId = null
       ├─ tapCount = 0
       ├─ severityScore = 0
       └─ tapFrequency = 0
```

---

## Database Query Performance

### Indexes Used

| Table | Index | Purpose |
|-------|-------|---------|
| emergency_alerts | by_userId | Get user's alerts quickly |
| emergency_alerts | by_status | Filter active/escalated alerts |
| emergency_alerts | by_createdAt | Sort by creation time |
| emergency_alerts | by_severity | Find highest severity alerts |
| emergency_taps | by_alertId | Get all taps for an alert |
| emergency_taps | by_userId | Get user's tap history |
| emergency_taps | by_timestamp | Find taps in time window |
| emergency_taps | by_alertId_timestamp | Get recent taps (combined filter) |
| users | by_clerkId | Get user by clerk ID |
| users | by_email | Get user by email |

### Query Optimization

**getUserActiveAlerts() - O(log n)**
```typescript
.query("emergency_alerts")
.withIndex("by_userId", q => q.eq("userId", userId))  // Index lookup
.filter(q => q.or(...))  // In-memory filter
.collect()
```

**recordTap() - O(log n)**
```typescript
// Get recent taps (last 10 seconds)
.withIndex("by_alertId_timestamp", q =>
  q.eq("alertId", alertId).gt("timestamp", tenSecondsAgo)
)
// Get all taps
.withIndex("by_alertId", q => q.eq("alertId", alertId))
```

---

## Authentication Flow

```
User loads app (Client)
    │
    ├─ Clerk Provider checks authentication
    │
    ├─ If authenticated:
    │  └─ Call useAuth() → Get getToken() function
    │
    └─ ConvexProvider intercepts all requests
       │
       ├─ Get JWT token from Clerk
       ├─ Add to Authorization header
       └─ Send to Convex
           │
           ▼
       Convex Backend receives request
       │
       ├─ Extract JWT from header
       ├─ Validate signature (Clerk public key)
       ├─ Extract subject = Clerk ID
       └─ Call getAuthUserId() returns Clerk ID
           │
           └─ All mutations/queries use this ID
               (Only user can access their own data)
```

---

## Severity Score Algorithm (Detailed)

### Calculation Formula

```
tapScore = (tapCount / 50) × 30
  Example: 25 taps = 15 points

frequencyScore = (tapFrequency / 5) × 40
  Example: 2.5 taps/sec = 20 points

userScore = (uniqueUsers / 10) × 30
  Example: 5 different users = 15 points

───────────────────────────────────
TOTAL SEVERITY = 15 + 20 + 15 = 50 (HIGH)
```

### Severity Levels

| Score | Level | Notification Radius | Color |
|-------|-------|---------------------|-------|
| 0-29 | Low | 3km | Green |
| 30-49 | Medium | 5km | Yellow |
| 50-79 | High | 10km | Orange |
| 80+ | Critical | 15km | Red |

### Example Escalation Scenario

```
Time T=0: User taps button
  └─ tapCount=1, frequency=1, users=1
  └─ Score = (1/50)×30 + (1/5)×40 + (1/10)×30 = 0.6 + 8 + 3 = 11.6 → 12
  └─ Level: LOW, Radius: 3km

Time T=3s: Same user taps again (3 taps in 10 seconds)
  └─ tapCount=3, frequency=0.3/sec, users=1
  └─ Score = (3/50)×30 + (0.3/5)×40 + (1/10)×30 = 1.8 + 2.4 + 3 = 7.2 → 7
  └─ Level: LOW, Radius: 3km

Time T=6s: 2 different users tap (5 taps in 10 seconds)
  └─ tapCount=5, frequency=0.5/sec, users=2
  └─ Score = (5/50)×30 + (0.5/5)×40 + (2/10)×30 = 3 + 4 + 6 = 13 → 13
  └─ Level: LOW, Radius: 3km

Time T=2s rapid: User spams 10 taps in 5 seconds
  └─ tapCount=10, frequency=2/sec, users=1
  └─ Score = (10/50)×30 + (2/5)×40 + (1/10)×30 = 6 + 16 + 3 = 25 → 25
  └─ Level: LOW, Radius: 3km

Time T=1.5s rapid: User spams 20 taps in 2 seconds + 5 other users tap
  └─ tapCount=20, frequency=10/sec, users=6
  └─ Score = (20/50)×30 + (10/5)×40 + (6/10)×30 = 12 + 80* + 18
  └─ *Capped at 40
  └─ Score = 12 + 40 + 18 = 70 → HIGH SEVERITY
  └─ Level: HIGH, Radius: 10km
  └─ Status: ESCALATED ✓
```

---

## Real-time Capabilities

### Convex Subscription Model

```
Frontend useQuery(api.alerts.getUserActiveAlerts)
    │
    ├─ Initial request
    │  └─ Convex returns current data
    │
    ├─ Subscription created
    │  └─ Server watches database changes
    │
    ├─ When tap is recorded elsewhere:
    │  └─ Alert's severity/tapCount changes
    │  └─ Convex detects change
    │  └─ Sends update to all subscribers
    │
    └─ Frontend receives update
       └─ React re-renders with new data
       └─ User sees severity increase in real-time

No polling required!
No manual refresh needed!
Automatic real-time sync via WebSocket
```

---

## Current Implementation Status

### ✅ Phase 1 - COMPLETE

| Feature | Status | Files |
|---------|--------|-------|
| Database Schema | ✅ | convex/schema.ts |
| Severity Calculation | ✅ | convex/severity.ts |
| Alert Mutations | ✅ | convex/alerts.ts |
| Alert Queries | ✅ | convex/alerts.ts |
| Emergency Button UI | ✅ | src/components/emergency-button.tsx |
| Severity Indicator | ✅ | src/components/severity-indicator.tsx |
| Dashboard Integration | ✅ | src/app/dashboard/page.tsx |
| Real-time Subscriptions | ✅ | Convex built-in |

### 📋 Phase 2 - NOT STARTED

- Video Recording (MediaRecorder API)
- Video Upload to Convex Storage
- Video Playback Component

### 📋 Phase 3 - NOT STARTED

- Location Tracking (continuous geolocation)
- Location Subscriptions
- Radius-based Alert Discovery
- Haversine Distance Calculation

### 📋 Phase 4 - NOT STARTED

- Browser Push Notifications
- Service Worker Setup
- Alarm Sound Playback
- Notification Cascade Logic

---

## Key Design Decisions

### 1. Severity Formula Weighting
- **40% Frequency** (Primary indicator) - Most important signal that situation is critical NOW
- **30% Tap Count** (Volume indicator) - Shows sustained concern
- **30% Unique Users** (Confirmation indicator) - Multiple people validates the emergency

### 2. Escalation Thresholds
- **Score 30+**: Move from "active" to "escalated" status
- **Score 50+**: Expand notification radius to 10km
- **Score 80+**: Expand notification radius to 15km (system-wide)

### 3. Real-time Architecture
- Use Convex's built-in subscriptions (no external WebSocket library needed)
- Update propagates automatically when tap is recorded
- No polling, no stale data

### 4. Location Strategy (Phase 3)
- On-demand location capture on emergency button press (precise moment)
- Background continuous tracking for nearby user discovery
- Hybrid approach balances accuracy and battery life

### 5. Database Normalization
- `emergency_alerts` stores current state + computed metrics
- `emergency_taps` stores individual tap events (immutable)
- Allows fast queries and metrics computation

---

## Error Handling & Fallbacks

| Scenario | Handling |
|----------|----------|
| Location Permission Denied | Use last known location, or 0,0 |
| Geolocation Timeout | Proceed with fallback location |
| Network Offline | Queue taps locally (not yet implemented) |
| Camera Permission Denied | Allow text-only alerts (Phase 2) |
| Push Notification Blocked | Fall back to in-app alerts (Phase 4) |
| API Rate Limit | Debounce tap recording (50ms client-side) |

---

## Future Enhancements

### Immediate (Phase 2-4)
- [ ] Video recording and streaming
- [ ] Browser push notifications
- [ ] Geolocation tracking
- [ ] Alarm sound playback

### Medium-term (Phase 5-6)
- [ ] Live streaming via WebRTC
- [ ] Multi-user dashboard (responders)
- [ ] Alert lifecycle management
- [ ] Call emergency services integration

### Long-term (Phase 7+)
- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics and heatmaps
- [ ] Incident clustering (multiple alerts → single incident)
- [ ] Machine learning for false alarm detection
- [ ] Emergency responder network integration

