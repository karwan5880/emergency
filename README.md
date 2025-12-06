Team Name: BuddhaIsHere
App Name: AlertRun - Combining Live Stream & Phone Call (Siren)

## Introduction

**What is AlertRun?**

**AlertRun** is a life-saving emergency alert app that instantly notifies nearby users when a disaster is detected.

Imagine this: User A spots a fire at the bottom of a tall building. No matter how loud they shout, people inside can't hear them. With AlertRun, User A taps their phone 3 times, starts live streaming, and within seconds — everyone in nearby buildings receives a loud phone call-style alarm with the live video feed.

**The core idea**: Combine the urgency of a phone call (loud, immediate, hard to ignore) with the reach of live streaming (one-to-many broadcast). The more people tap the emergency button, the more serious the incident becomes, and the louder the alarm rings for everyone nearby.

## App Inspiration

[Show the video here]

## Challenges

### User Adoption Challenges

- People may be reluctant to install the app on their phone.
  - Solution 1: Keep the app lightweight.
  - Solution 2: Choose a meaningful app name. We suggest "BuddhaIsHere" — a small app (50-100MB) that could one day save your life. The app represents protection and safety.
- Users often have their phones on silent mode.
- No internet connectivity (rare but possible).

### Technical Challenges

- Server infrastructure with AI/LLM/vLLM to analyze video and live stream fragments requires significant computation.
- Speed is critical — every millisecond counts.
- The time from when a live stream starts until people believe it is real and begin evacuating must be minimized.
- Targeting users accurately is difficult; location data may be imprecise. (Consider a subscriber model based on address or community groups.)
- Live streaming is really hard to build — the networking, infrastructure, and latency requirements are complex.
- The backend infrastructure is expensive to maintain at scale.

### Misuse Concerns

- What if users abuse the emergency button as a prank? (Proposed solution: add penalties or legal consequences. Honestly, not sure how to enforce this.)
- This could create more chaos than safety, undermining the app's purpose.

### Current Communication Models

- Phone call: One-to-one
- Microsoft Teams / Zoom: Many-to-many (meetings)
- Twitch / YouTube livestream: One-to-many (broadcasting)

### Our Approach

- We need a one-to-many **force broadcasting** system at the app or OS level.
- Think of it as Twitch live streaming combined with an extremely loud notification, siren, or alarm.
- A phone call rings immediately, loud and clear. This app works the same way — but instead of calling one person, you alert thousands.
- Once the foundation is established, we can add additional features:
  - Location map
  - Chat system (for real-time communication)
  - Other enhancements as needed

### GOLDEN FEATURE

- TAP! TAP! TAP! THE MORE YOU TAP! THE LOUDER THE SIREN! THE MORE SERIOUS THE INCIDENT IS!

## Vision

- This is currently a web app demo.
- Ideally, we want to develop a native app — similar to WhatsApp, where incoming calls ring even when the app is in the background.

## Existing System Studies (didn't do enough sorry)

- Malaysia 999 emergency service
- Apple emergency call SOS feature

## Why This Matters

- It is 2025. We have the technology, AI, and internet speeds capable of live streaming.
- We have all the tools we need.
- An app like this has the potential to save hundreds of lives.

## Tech Stack / Tools Used

- Claude Code
- Cursor
- Clerk (authentication)
- Convex (backend/database)
- React / Next.js

## Features (Future)

- Subscribe mode (address-based notifications)
- Radius-based mode (km range alerts)

## Closing Thoughts

- 關心一下不認識的陌生人
- 看似沒用的 app，放在手機裏，也許能救你愛的人一命

(Care for strangers you don't know. A seemingly useless app sitting in your phone might one day save the life of someone you love.)

## Footnotes

- All of this is a mockup only. It can't function without a proper backend — especially the live streaming and AI components.
- As mentioned in the "Challenges" section, spending five or six figures to save a certain number of lives — is it really worth it? Unless we can drastically drive the cost down.
- Cool idea, but not realistic, in my opinion.
- Or, unless somebody takes this project as a startup idea and creates a new TikTok out of it?
