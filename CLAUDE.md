# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Emergency Management Application** - A real-time emergency management platform built with Next.js 16, React 19, TypeScript, and Convex. The app allows users to report, track, and manage emergency incidents with real-time notifications and priority-based categorization.

### Tech Stack
- **Frontend**: Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS v4
- **UI**: shadcn/ui components, Radix UI primitives, Lucide icons
- **Backend/Database**: Convex (real-time TypeScript backend)
- **Authentication**: Clerk (NextAuth replacement)
- **Hosting**: Vercel
- **Package Manager**: pnpm (preferred over npm for speed)

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Convex development (real-time sync with backend)
npx convex dev
```

## Architecture & Data Flow

### Core Integration Pattern
The app uses a **Clerk + Convex** authentication model:

1. **Clerk handles** - User sign-up/sign-in, JWT tokens, session management
2. **Convex handles** - Backend logic, database operations, real-time subscriptions
3. **ConvexProvider** (src/components/convex-provider.tsx) - Wraps Clerk auth tokens and passes them to Convex for secure backend communication

### Key Files Structure
- **src/app/layout.tsx** - Root layout with ClerkProvider + ConvexProvider setup
- **src/components/convex-provider.tsx** - Handles Clerk-to-Convex token passing
- **convex/schema.ts** - Database schema definition (users, emergencies, notifications tables)
- **src/app/page.tsx** - Landing page
- **src/app/dashboard/page.tsx** - Main authenticated dashboard
- **src/app/sign-in/[[...rest]]/page.tsx** - Clerk sign-in page
- **src/app/sign-up/[[...rest]]/page.tsx** - Clerk sign-up page

### Database Schema

**users table**
- clerkId (indexed)
- email (indexed)
- fullName
- profileImage (optional)
- createdAt

**emergencies table**
- userId (indexed)
- title, description
- priority: "low" | "medium" | "high" | "critical" (indexed)
- status: "pending" | "in-progress" | "resolved" | "cancelled" (indexed)
- location (optional)
- createdAt, updatedAt (indexed)

**notifications table**
- userId (indexed, composite with read)
- type: "emergency" | "alert" | "update" | "reminder"
- title, message
- read (boolean)
- createdAt

### Convex Backend Patterns
- Queries and mutations must be defined in convex/ directory
- Real-time subscriptions work automatically through ConvexProvider
- All backend functions have built-in Clerk token validation
- Use convex dev CLI during development for real-time backend sync

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CONVEX_URL=...
```

For Vercel deployments, set these in Vercel dashboard → Settings → Environment Variables.

**Note**: If Clerk requires phone number on sign-up/sign-in, disable it in Clerk Dashboard → User & Authentication → Sign-up.

## Common Development Tasks

### Adding a New Page
1. Create file in `src/app/your-page/page.tsx`
2. Use `"use client"` if it needs interactivity
3. Wrap with Clerk's `<SignedIn>` or `<SignedOut>` for auth-gated content

### Adding Database Operations
1. Define schema in `convex/schema.ts`
2. Create query/mutation functions in `convex/` directory (e.g., `convex/emergencies.ts`)
3. Export hooks from Convex
4. Use in React components with `useQuery()` or `useMutation()`

### Adding UI Components
- Use existing shadcn/ui components from `src/components/ui/`
- Import Radix UI primitives from @radix-ui packages
- Use Tailwind CSS v4 for styling
- Icons from lucide-react

### Styling Notes
- Tailwind CSS v4 is configured with @tailwindcss/postcss
- Utility-first approach with custom components
- Dark theme gradients used throughout (slate-900, slate-800)
- Primary action color: red-600 (customized in Clerk components)

## Deployment

### Vercel Deployment
```bash
# Install Vercel CLI (if needed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod --yes
```

**Pre-deployment checklist:**
1. Environment variables set in Vercel dashboard
2. Convex project linked and deployed
3. Clerk dashboard configured (phone number requirement disabled if needed)
4. Build succeeds locally: `npm run build`

## Important Notes

- **pnpm is preferred** over npm for faster installs (50%+ faster on CI)
- **Turbopack enabled** by default in Next.js 16 (faster local dev)
- **Type safety**: Full TypeScript throughout - leverage type inference from Convex and Clerk
- **Real-time updates**: Convex subscriptions automatically update UI when data changes
- **Authentication**: Protected routes should use Clerk's `<SignedIn>` wrapper
- **Convex indexing**: Database queries use defined indexes for performance

## Common Issues & Fixes

**Missing publishableKey error during build**: Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in Vercel environment variables.

**Phone number required on sign-up**: Disable in Clerk Dashboard → User & Authentication → Sign-up settings.

**Convex connection errors**: Verify `NEXT_PUBLIC_CONVEX_URL` is correct and development server is running (`npx convex dev`).

**Build slow on CI**: Use pnpm in package manager settings for 2-3x faster builds.
