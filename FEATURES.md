# AlertRun - Feature Summary

## 📱 Two-Tab System

### Passive Mode (Left Tab - Default)

- View nearby emergency alerts
- Receive loud alarms when emergencies detected
- Watch live streams from reporters
- Full-screen alarm with "RUN" instructions

### Active Mode (Right Tab)

- **3-Tap Safety**: Must tap 3 times to start reporting (prevents accidental activation)
- **Live Streaming**: Camera activates, start streaming video
- **Spam Tapping**: Keep tapping emergency button to increase severity
- **Join Existing**: Can join nearby emergencies instead of creating new

## 🎯 Core Features

### 1. **Multi-User Severity System**

- Multiple users tapping same alert = higher severity
- Severity formula: 20% tap count + 30% frequency + **50% unique users**
- More users reporting = critical emergency = louder alarms

### 2. **Dynamic Alarm Volume**

- Volume scales with severity (30% → 80%)
- More severe = louder alarm for passive users
- Continuous siren until acknowledged

### 3. **Location-Based Notifications**

- Radius expands based on severity (3km → 5km → 10km → 15km)
- Haversine formula for accurate distance
- Real-time Convex subscriptions

### 4. **Live Video Streaming**

- MediaRecorder API for camera access
- Back camera on mobile (facingMode: "environment")
- Stream status tracked in database

### 5. **Swipe Navigation**

- Swipe left/right to switch tabs
- 50px minimum swipe distance
- Smooth tab transitions

## 🏗️ Components

### Frontend

- `active-mode-screen.tsx` - Big circle + streaming UI
- `passive-mode-screen.tsx` - Alert list
- `passive-alert-screen.tsx` - Full-screen alarm
- `bottom-tabs.tsx` - Tab navigation with swipe
- `live-stream-recorder.tsx` - Camera and recording
- `alarm-notification.tsx` - Alert popup

### Backend (Convex)

- `alerts.createAlert` - Create emergency
- `alerts.recordTap` - Record taps, update severity
- `alerts.getNearbyActiveAlerts` - Query alerts within radius
- `users.updateUserLocation` - Update GPS

## 🚀 User Flow

### Reporting an Emergency

1. Swipe right → Active tab
2. Tap circle 3 times
3. Camera starts
4. Tap "Start Live Stream"
5. Keep tapping emergency button
6. Severity increases, alarms get louder

### Receiving an Emergency

1. Stay in Passive tab (default)
2. Alert nearby → Full-screen alarm
3. Tap "ACKNOWLEDGE"
4. See "RUN" instructions
5. Optional: Watch live stream

## 🎨 Design

- **Dark theme**: Slate-900 background
- **Red accents**: Emergency context
- **Big buttons**: Easy to tap in panic
- **Responsive**: Mobile-first, works on all devices
- **Haptic feedback**: Vibration on mobile

---

**Status**: ✅ MVP Ready for Demo
