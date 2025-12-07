# Production Deployment Verification Checklist

## ✅ Convex Deployment Verification

### 1. **Check in Convex Dashboard**

- Go to: https://dashboard.convex.dev
- Select your project
- Navigate to **"Functions"** tab
- Look for: `alerts.getNearbyActiveAlerts`
- Verify it shows the latest deployment timestamp

### 2. **Verify Server-Side Filter is Live**

The function should include this code (lines 340-360 in `convex/alerts.ts`):

```typescript
// Get user's login time (use account creation as baseline)
const user = await ctx.db
  .query("users")
  .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
  .first();

// Only show alerts created after user's account was created
q.gte(q.field("createdAt"), user.createdAt);
```

### 3. **Check Deployment Logs**

- In Convex Dashboard → **"Logs"** tab
- Look for recent deployments
- Check for any errors

### 4. **Test the Function**

- In Convex Dashboard → **"Functions"** → Click on `alerts.getNearbyActiveAlerts`
- You can see the function definition
- Check function logs to see recent queries

## ✅ Vercel Deployment Verification

### 1. **Build Check**

```bash
npm run build
```

Should complete without errors

### 2. **Deploy to Vercel**

```bash
vercel --prod
```

### 3. **Verify Environment Variables in Vercel**

- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Verify:
  - `NEXT_PUBLIC_CONVEX_URL` (your production Convex URL)
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - Any other required env vars

### 4. **Test Production App**

- Visit your production URL
- Sign in
- **Verify:** No old alerts show up in bell icon
- **Verify:** No incoming call popup appears on fresh login

## 🔍 How to Verify the Fix is Working

### Test Scenario 1: Fresh Login

1. **Clear session storage:**
   - Open DevTools (F12)
   - Application → Session Storage → Clear `alertrun_session_*`
2. **Sign out** (logout button)
3. **Sign back in**
4. **Expected Result:**
   - ✅ Bell icon shows **0** (no badge)
   - ✅ No incoming call popup
   - ✅ Bell dropdown is empty (or shows "No live streams nearby")

### Test Scenario 2: Create New Alert

1. **User A:** Create an alert and start streaming
2. **User B:** Sign in fresh
3. **Expected Result:**
   - ✅ User B receives incoming call popup
   - ✅ Bell icon shows 1 alert
   - ✅ Can view the alert

### Test Scenario 3: Old Alerts

1. **Pre-existing alerts** in database (created before User B's session)
2. **User B:** Sign in fresh
3. **Expected Result:**
   - ✅ Old alerts are filtered out (server-side + client-side)
   - ✅ Only new alerts (created after login) appear

## 🐛 Troubleshooting

### If old alerts still show:

1. **Check Convex deployment:**

   - Verify `getNearbyActiveAlerts` has the `user.createdAt` filter
   - Check deployment logs for errors

2. **Check client-side:**

   - Open DevTools Console
   - Look for session timestamp logs
   - Verify `sessionStorage` has `alertrun_session_*` key

3. **Check server-side:**
   - In Convex Dashboard → Logs
   - Look at function execution logs
   - Verify the filter is being applied

### If deployment didn't work:

```bash
# Try deploying again with verbose output
npx convex deploy --verbose

# Or check Convex status
npx convex status
```

---

**Quick Command Reference:**

- Deploy Convex: `npx convex deploy`
- Deploy Vercel: `vercel --prod`
- Build check: `npm run build`
- View Convex logs: https://dashboard.convex.dev → Logs
