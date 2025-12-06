# Build Notes & Lessons Learned

This document captures common build issues encountered during development and their solutions.

---

## Issue 1: Convex Types Not Generated

**Error:**

```
Type error: Cannot find module '../../convex/_generated/dataModel' or its corresponding type declarations.
```

**Cause:**
The `convex/_generated/` folder is empty or doesn't exist. Convex needs to generate TypeScript types before the build.

**Solution:**

```bash
# Generate Convex types
npx convex codegen

# Then build
npm run build
```

**Prevention:**
Always run `npx convex dev` or `npx convex codegen` before building.

---

## Issue 2: Wrong Import Paths for Convex

**Error:**

```
Cannot find module '../../convex/_generated/dataModel'
```

**Cause:**
Using relative paths like `../../convex/_generated/api` instead of the tsconfig alias.

**Wrong:**

```typescript
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
```

**Correct:**

```typescript
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
```

**Why:**

- The `tsconfig.json` has a path alias for `convex/*`
- Relative paths work in dev but fail in production build
- Always use the alias: `convex/_generated/...`

**Files that needed fixing:**

- `src/app/dashboard/page.tsx`
- `src/app/history/page.tsx`
- `src/components/active-mode-screen.tsx`
- `src/components/passive-mode-screen.tsx`
- `src/components/notification-panel.tsx`
- `src/components/incoming-alert.tsx`
- `src/components/live-stream-recorder.tsx`
- `src/components/live-stream-viewer.tsx`
- `src/components/user-sync.tsx`

---

## Issue 3: Property Doesn't Exist on Query Result

**Error:**

```
Type error: Property 'distance' does not exist on type '{ ... }'
```

**Cause:**
Accessing a property that isn't returned by the Convex query.

**Example:**

- `getNearbyActiveAlerts` returns alerts WITH `distance` (calculated from user location)
- `getAlertDetails` returns alert details WITHOUT `distance`

**Solution:**
Either:

1. Remove the property access
2. Make it optional: `alert.distance?.toFixed(1) || "?"`
3. Add the property to the query return type

---

## Issue 4: Files Tracked by Git After Adding to .gitignore

**Problem:**
Files added to `.gitignore` are still being tracked.

**Cause:**
The file was already tracked before being added to `.gitignore`.

**Solution:**

```bash
# Remove from git tracking (keeps file locally)
git rm --cached <filename>

# Example
git rm --cached _errors.txt
```

---

## Build Checklist

Before running `npm run build`:

1. ✅ Run `npx convex codegen` to generate types
2. ✅ Check all Convex imports use `convex/_generated/...` (not relative paths)
3. ✅ Verify all properties accessed on query results actually exist
4. ✅ Run `npm run lint` to catch issues early

---

## Useful Commands

```bash
# Generate Convex types only
npx convex codegen

# Start Convex dev server (generates types + watches)
npx convex dev

# Build production
npm run build

# Run production
npm run start

# Check for linting errors
npm run lint
```

---

## Project Structure Notes

```
project/
├── src/
│   ├── app/           # Next.js pages
│   └── components/    # React components
├── convex/
│   ├── _generated/    # Auto-generated types (DO NOT EDIT)
│   │   ├── api.d.ts
│   │   ├── api.js
│   │   ├── dataModel.d.ts
│   │   ├── server.d.ts
│   │   └── server.js
│   ├── schema.ts      # Database schema
│   ├── alerts.ts      # Alert mutations/queries
│   └── users.ts       # User mutations/queries
└── tsconfig.json      # Has "convex/*" path alias
```

---

## Key Takeaways

1. **Convex types must be generated before build** - They're not committed to git
2. **Use path aliases, not relative paths** - `convex/_generated/...` not `../../convex/_generated/...`
3. **TypeScript catches issues at build time** - Dev mode is more forgiving
4. **Check query return types** - Not all queries return the same fields
