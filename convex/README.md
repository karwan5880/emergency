# Convex Backend

This directory contains the Convex backend functions and schema for the Emergency App.

## Setup

1. Install Convex CLI:
```bash
npm install -g convex
```

2. Login to Convex:
```bash
npx convex dev
```

3. Follow the prompts to create a new Convex project or link to an existing one.

## Schema

The schema defines the database tables:
- `users`: User profiles synced from Clerk
- `emergencies`: Emergency reports and incidents
- `notifications`: User notifications and alerts

## Environment Variables

Add your Convex deployment URL to `.env.local`:
```
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
```

