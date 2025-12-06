# AlertRun - App Behavior Documentation

## Overview

AlertRun combines **live streaming** with **phone call-style notifications** to alert nearby users of emergencies. Think of it as Twitch + WhatsApp call for disasters.

---

## User Modes

### Passive Mode (Default)

- **Purpose**: Receive alerts, watch live streams
- **UI**: Empty "room" when no stream selected, or live stream viewer when watching
- **Tab**: Left tab (default)

### Active Mode

- **Purpose**: Report emergencies via live streaming
- **UI**: Big red circle (tap 3 times to start streaming)
- **Tab**: Right tab

---

## Core Flows

### 1. Receiving an Emergency Alert (Passive User)

```
User opens app
    ↓
Emergency detected nearby
    ↓
📞 Phone call notification appears (with ringtone)
    ↓
User taps "View" or "Dismiss"
    ↓
✅ User is now "acknowledged" — NO MORE PHONE CALLS
    ↓
Bell icon still shows badge with count of active emergencies
```

### 2. Reporting an Emergency (Active User)

```
User swipes to Active tab
    ↓
Sees big red circle
    ↓
Taps 3 times (safety confirmation)
    ↓
📹 Live streaming starts
    ↓
🔒 Tabs are LOCKED (can't switch while streaming)
    ↓
User keeps tapping "INCREASE SEVERITY" button
    ↓
More taps = Higher severity = Louder alarms for nearby users
    ↓
User stops stream → Tabs unlock
```

### 3. Watching a Live Stream (Passive User)

```
User accepts phone call OR selects from bell icon
    ↓
Enters stream "room"
    ↓
Sees live video, distance, tap count, severity
    ↓
Can tap X to leave room → Goes back to empty state
    ↓
Can select another stream from bell icon
```

---

## Key Behaviors

### Phone Call Notification

| Behavior          | Description                                       |
| ----------------- | ------------------------------------------------- |
| **Trigger**       | New emergency detected within 10km                |
| **Sound**         | Phone ringtone pattern (ring-ring, pause, repeat) |
| **Actions**       | "View" (enter stream) or "Dismiss" (ignore)       |
| **One-time only** | After ANY acknowledgment, no more calls           |
| **Bell icon**     | Still shows badge count after acknowledgment      |

### Tab Locking (Active Mode)

| Behavior   | Description                                  |
| ---------- | -------------------------------------------- |
| **When**   | User is actively streaming                   |
| **Effect** | Passive tab grayed out, can't click or swipe |
| **Label**  | Shows "Streaming" with lock icon             |
| **Unlock** | Stop the stream                              |

### Severity System

| Factor        | Weight | Description                             |
| ------------- | ------ | --------------------------------------- |
| Tap count     | 20%    | Total taps on emergency button          |
| Tap frequency | 30%    | Taps per minute (recent activity)       |
| Unique users  | 50%    | Number of different people contributing |

### Notification Radius

| Severity | Radius |
| -------- | ------ |
| < 30     | 3km    |
| 30-59    | 5km    |
| 60-79    | 10km   |
| ≥ 80     | 15km   |

---

## State Management

### Dashboard State

```typescript
activeTab: "passive" | "active"; // Current tab
currentStreamId: Id | null; // Stream being watched (passive)
hasAcknowledged: boolean; // True = no more phone calls
isActiveStreaming: boolean; // True = tabs locked
dismissedAlerts: Set<string>; // Alert IDs user dismissed
showNotificationPanel: boolean; // Bell dropdown open/closed
```

### What Resets on Page Refresh

- `hasAcknowledged` → false (user may get a call again)
- `currentStreamId` → null (back to empty room)
- `dismissedAlerts` → empty (alerts can call again)

---

## Component Responsibilities

| Component            | Purpose                               |
| -------------------- | ------------------------------------- |
| `Dashboard`          | Main orchestrator, manages all state  |
| `IncomingAlert`      | Phone call popup with ringtone        |
| `NotificationPanel`  | Bell icon dropdown, shows all streams |
| `PassiveModeScreen`  | Empty room OR live stream viewer      |
| `ActiveModeScreen`   | Big circle + streaming UI             |
| `BottomTabs`         | Tab navigation, locks when streaming  |
| `LiveStreamRecorder` | Camera access, mock recording         |

---

## Design Principles

1. **Simple over complex** — Life-saving app, must be intuitive
2. **No spam** — One call is enough, user can check bell for more
3. **Clear feedback** — Visual + haptic + audio cues
4. **Mobile-first** — Big tap targets, responsive design
5. **Real-time** — Convex subscriptions for instant updates

---

## Future Considerations

- [ ] Alert history (streams stay for X minutes, then archive)
- [ ] Real WebRTC video streaming
- [ ] Push notifications (native app)
- [ ] Emergency services integration
- [ ] Offline mode / low connectivity handling
