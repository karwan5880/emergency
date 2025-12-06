# Live Streaming Implementation Guide

## Current Status: Mockup

The current implementation uses a **mockup** for live streaming - it accesses the camera and displays it locally, but does not actually broadcast to other users.

---

## Can Convex Do Live Streaming?

**No.** Convex is a real-time database/backend, not a media server.

### What Convex CAN Do

| Capability          | Use Case                                      |
| ------------------- | --------------------------------------------- |
| Real-time data sync | Alert status, tap counts, locations           |
| File storage        | Store recorded video clips after incident     |
| Signaling           | Exchange WebRTC connection info between peers |
| Metadata            | Track who's streaming, viewer counts          |
| Chat/messages       | Text communication during streams             |

### What Convex CANNOT Do

| Limitation            | Reason                           |
| --------------------- | -------------------------------- |
| Video streaming       | Not a media server               |
| WebRTC relay/TURN     | Can't route video/audio packets  |
| Transcoding           | No video processing capabilities |
| Low-latency broadcast | Not designed for media delivery  |

---

## Recommended Solutions

### Option 1: LiveKit (Recommended)

**Best for AlertRun** - Low latency, WebRTC-based, emergency-ready.

- **Website:** https://livekit.io
- **Latency:** Sub-second (critical for emergencies)
- **Pricing:** Free tier available, then usage-based
- **React SDK:** `@livekit/components-react`

```bash
npm install @livekit/components-react livekit-client
```

**Pros:**

- Very low latency (<500ms)
- Works in browsers (WebRTC)
- Scales automatically
- Good documentation
- Can self-host or use cloud

**Cons:**

- Requires server-side token generation
- Learning curve for WebRTC concepts

---

### Option 2: Mux

**Professional video streaming API.**

- **Website:** https://mux.com
- **Latency:** ~10-15 seconds (standard) or ~3s (low-latency)
- **Pricing:** Pay per minute streamed/watched

**Pros:**

- Simple API
- Automatic transcoding
- Analytics built-in

**Cons:**

- Higher latency than WebRTC
- Can get expensive at scale

---

### Option 3: Agora

**Real-time video/voice SDK.**

- **Website:** https://agora.io
- **Latency:** Sub-second
- **Pricing:** Free 10,000 minutes/month

**Pros:**

- Generous free tier
- Low latency
- Global infrastructure

**Cons:**

- SDK can be complex
- Pricing unclear at scale

---

### Option 4: Daily.co

**Simple video call/streaming API.**

- **Website:** https://daily.co
- **Latency:** Sub-second
- **Pricing:** Free tier (2,000 minutes/month)

**Pros:**

- Very easy to integrate
- React components available
- Good for getting started

**Cons:**

- Less customizable
- Smaller free tier

---

### Option 5: Cloudflare Stream

**Video delivery and streaming.**

- **Website:** https://cloudflare.com/products/cloudflare-stream
- **Latency:** ~5-10 seconds
- **Pricing:** $1 per 1,000 minutes stored, $0.01 per 1,000 minutes delivered

**Pros:**

- Cloudflare's global network
- Simple pricing
- Good for VOD + live

**Cons:**

- Higher latency
- Less real-time features

---

### Option 6: Self-Hosted (Advanced)

**Roll your own with open-source tools.**

- **MediaSoup:** WebRTC SFU server
- **Janus:** General-purpose WebRTC server
- **Jitsi:** Complete video conferencing

**Pros:**

- Full control
- No per-minute costs
- Privacy

**Cons:**

- Complex setup
- Need to manage infrastructure
- Scaling is your problem

---

## Recommendation for AlertRun

### MVP Phase (Current)

Keep the **mockup** - it demonstrates the concept without infrastructure costs.

### Production Phase

Use **LiveKit** because:

1. **Sub-second latency** - In emergencies, every second matters
2. **WebRTC** - Works directly in browsers, no app install needed
3. **Scales** - Handles many viewers automatically
4. **Free tier** - Good for initial launch
5. **React SDK** - Easy integration with Next.js

---

## Integration Architecture

```
┌─────────────────┐
│  Active User    │
│  (Broadcaster)  │
└────────┬────────┘
         │ WebRTC
         ▼
┌─────────────────┐      ┌─────────────────┐
│    LiveKit      │◄────►│     Convex      │
│  (Video SFU)    │      │   (Metadata)    │
└────────┬────────┘      └─────────────────┘
         │ WebRTC              │
         ▼                     │ Real-time sync
┌─────────────────┐            │
│  Passive Users  │◄───────────┘
│   (Viewers)     │  (alert info, tap counts)
└─────────────────┘
```

### Data Flow

1. **Active user** starts emergency → Convex creates alert record
2. **Active user** connects to LiveKit → starts broadcasting
3. **Convex** stores LiveKit room ID in alert record
4. **Passive users** receive alert via Convex real-time subscription
5. **Passive users** join LiveKit room using room ID from Convex
6. **Video** flows through LiveKit, **metadata** flows through Convex

---

## Implementation Steps (When Ready)

### 1. Set up LiveKit

```bash
# Install packages
npm install @livekit/components-react livekit-client livekit-server-sdk
```

### 2. Create token endpoint (Convex HTTP action or separate API)

```typescript
// convex/livekit.ts
import { httpAction } from "./_generated/server";
import { AccessToken } from "livekit-server-sdk";

export const getToken = httpAction(async (ctx, request) => {
  const { roomName, participantName } = await request.json();

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: participantName }
  );

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return new Response(JSON.stringify({ token: token.toJwt() }));
});
```

### 3. Update alert schema

```typescript
// convex/schema.ts
emergency_alerts: defineTable({
  // ... existing fields
  livekitRoomId: v.optional(v.string()), // Add this
  livekitRoomName: v.optional(v.string()), // Add this
});
```

### 4. Create streaming components

```tsx
// components/live-stream-broadcaster.tsx
import { LiveKitRoom, VideoTrack } from "@livekit/components-react";

export function LiveStreamBroadcaster({ roomName, token }) {
  return (
    <LiveKitRoom
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
    >
      <VideoTrack />
    </LiveKitRoom>
  );
}
```

---

## Environment Variables Needed

```env
# .env.local
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
```

---

## Cost Estimation

### LiveKit Cloud Pricing (as of 2024)

| Usage      | Cost                           |
| ---------- | ------------------------------ |
| Free tier  | 50 participant-hours/month     |
| Video      | $0.004 per participant-minute  |
| Audio only | $0.0004 per participant-minute |

### Example: Single Emergency Incident

- 1 broadcaster streaming for 10 minutes
- 50 viewers watching for 5 minutes average
- Total: 10 + (50 × 5) = 260 participant-minutes
- Cost: 260 × $0.004 = **$1.04**

---

## Resources

- [LiveKit Documentation](https://docs.livekit.io)
- [LiveKit React Components](https://docs.livekit.io/realtime/client-sdks/react/)
- [Convex + LiveKit Tutorial](https://docs.convex.dev/integrations) (check for updates)
- [WebRTC Basics](https://webrtc.org/getting-started/overview)

---

## Decision Log

| Date    | Decision   | Reason                            |
| ------- | ---------- | --------------------------------- |
| Initial | Use mockup | MVP focus, no infrastructure cost |
| Future  | LiveKit    | Best latency for emergencies      |
