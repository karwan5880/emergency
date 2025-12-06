# AlertRun - Emergency Alert System

**Alert. Run. Survive.**

A life-saving emergency alert system that instantly notifies all users in nearby buildings when a disaster is detected. Built with Next.js, React, TypeScript, Convex, and Clerk.

## 🚨 Mission

When User A spots a fire at the bottom of a tall building, no matter how loud they shout, people inside can't hear them. **AlertRun** ensures that every citizen in nearby buildings receives instant notifications and loud alarms within split seconds, potentially saving millions of lives.

## 📱 How It Works

### Two Simple Modes

**Passive Mode (Default)** - Receive alerts

- View nearby emergency alerts
- Receive loud alarms when emergencies are detected
- Watch live streams from reporters

**Active Mode** - Report emergencies

- Tap 3 times to start reporting (prevents accidental activation)
- Live stream video of the incident
- Spam tap to increase severity (more taps = louder alarms for everyone)
- Multiple users reporting = higher severity

### The Flow

1. **User A** spots a fire → Swipes to Active mode → Taps 3 times → Starts streaming
2. **User A** keeps tapping the emergency button → Severity increases
3. **Users B, C, D** nearby → Can join the same alert → More users = critical severity
4. **All passive users** nearby → Receive loud alarm → See "RUN" instructions

## 🚀 Key Features

- **⚡ Instant Notifications**: All users within radius receive alerts within seconds
- **📹 Live Video Streaming**: Reporters can live stream when reporting incidents
- **🔊 Loud Alarm System**: Volume scales with severity (more users = louder)
- **📍 Location-Based**: Smart notification radius (3-15km based on severity)
- **🎯 Multi-User Severity**: Multiple reporters contribute to same incident
- **🛡️ 3-Tap Safety**: Prevents accidental alert triggers
- **📱 Bottom Tab Navigation**: Simple Passive/Active mode switching with swipe

## 🛠️ Tech Stack

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Styling
- **Convex** - Real-time backend & database
- **Clerk** - Authentication

## 📁 Project Structure

```
emergency/
├── src/
│   ├── app/
│   │   ├── dashboard/           # Main app (Passive/Active tabs)
│   │   ├── alert/[id]/          # Alert detail page
│   │   ├── sign-in/             # Authentication
│   │   └── page.tsx             # Landing page
│   ├── components/
│   │   ├── active-mode-screen.tsx    # Report emergencies
│   │   ├── passive-mode-screen.tsx   # View alerts
│   │   ├── passive-alert-screen.tsx  # Full-screen alarm
│   │   ├── bottom-tabs.tsx           # Tab navigation
│   │   ├── live-stream-recorder.tsx  # Camera streaming
│   │   └── alarm-notification.tsx    # Alert popup
├── convex/
│   ├── schema.ts                # Database schema
│   ├── alerts.ts                # Alert mutations/queries
│   ├── users.ts                 # User management
│   └── notifications.ts         # Notification system
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Clerk account (https://dashboard.clerk.com)
- Convex account (https://www.convex.dev)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables (.env.local)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# Start Convex (keep running in separate terminal)
npx convex dev

# Start Next.js
npm run dev
```

## 🎯 MVP Status

- ✅ Two-tab navigation (Passive/Active)
- ✅ 3-tap safety confirmation
- ✅ Live video streaming
- ✅ Multi-user severity system
- ✅ Location-based alerts
- ✅ Loud alarm with volume scaling
- ✅ Responsive design (mobile-first)

## 📈 Future (Native App)

- [ ] React Native mobile app
- [ ] Push notifications (FCM/APNS)
- [ ] Real WebRTC streaming
- [ ] Emergency services integration
- [ ] Offline mode

---

**AlertRun** - Because every second counts. 🚨
