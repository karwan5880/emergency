# Convex Setup Guide for AlertRun

## Quick Setup (First Time)

### Step 1: Install Convex CLI (if not already installed)

```bash
npm install -g convex
```

### Step 2: Start Convex Development Server

```bash
npx convex dev
```

**What happens:**

- If this is your first time, Convex will:
  1. Ask you to log in (opens browser)
  2. Ask if you want to create a new project or use existing
  3. Generate a `NEXT_PUBLIC_CONVEX_URL` for you
  4. Create a `.env.local` file automatically (or update existing)

### Step 3: Copy the Convex URL

After running `npx convex dev`, you'll see something like:

```
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

**Make sure this is in your `.env.local` file!**

### Step 4: Keep `npx convex dev` Running

- **Keep this terminal window open** - it syncs your functions in real-time
- It watches for changes in the `convex/` folder
- When you save changes, it automatically deploys them

### Step 5: In a NEW Terminal, Start Next.js

```bash
npm run dev
```

Now both servers are running:

- `npx convex dev` - Convex backend (watches `convex/` folder)
- `npm run dev` - Next.js frontend (watches `src/` folder)

## What `npx convex dev` Does

1. **Syncs your schema** (`convex/schema.ts`) to Convex database
2. **Deploys your functions** (all files in `convex/` folder)
3. **Generates TypeScript types** (in `convex/_generated/`)
4. **Provides real-time updates** - changes deploy instantly

## Important Notes

- ✅ **Development**: Use `npx convex dev` (auto-syncs on save)
- 🚀 **Production**: Use `npx convex deploy` (one-time deploy)
- 🔄 **Keep it running**: Don't close the `npx convex dev` terminal during development

## Troubleshooting

### Error: "Could not find public function"

**Solution**: Make sure `npx convex dev` is running!

### Error: "NEXT_PUBLIC_CONVEX_URL is missing"

**Solution**:

1. Check `.env.local` exists
2. Make sure it has `NEXT_PUBLIC_CONVEX_URL=...`
3. Restart `npm run dev` after adding it

### Error: "Authentication failed"

**Solution**:

1. Make sure you're logged in: `npx convex login`
2. Check your Clerk keys are in `.env.local`

## Current Functions That Need Syncing

After running `npx convex dev`, these new functions will be available:

- ✅ `alerts.getNearbyActiveAlerts` - Get alerts within radius
- ✅ `alerts.createAlert` - Create emergency alert
- ✅ `alerts.recordTap` - Record tap to increase severity
- ✅ `users.updateUserLocation` - Update user GPS location
- ✅ All other existing functions

## Quick Commands Reference

```bash
# Start Convex dev server (keep running)
npx convex dev

# Deploy to production (one-time)
npx convex deploy

# Login to Convex
npx convex login

# Check Convex status
npx convex status
```

---

**TL;DR**: Run `npx convex dev` in one terminal, keep it running, then run `npm run dev` in another terminal! 🚀
