# Bug Fixes & Improvements

This document tracks bugs found during testing and their fixes.

---

## Bug 1: Immediate Emergency Call on Login

**Issue:**
Right after logging in, users immediately receive an emergency call notification even if:

- There are no active emergencies
- The alert is old/inactive
- The user just opened the app

**Root Cause:**

1. No delay after login before showing alerts
2. Showing ALL alerts (including non-streaming ones)
3. Showing old alerts that were created days ago

**Fix Applied:**

1. **Added 2-second grace period after login:**

   ```typescript
   const [showIncomingAlerts, setShowIncomingAlerts] = useState(false);

   useEffect(() => {
     if (isLoaded && user) {
       const timer = setTimeout(() => {
         setShowIncomingAlerts(true);
       }, 2000); // 2 second delay
       return () => clearTimeout(timer);
     }
   }, [isLoaded, user]);
   ```

2. **Only show actively streaming alerts:**

   ```typescript
   const incomingAlert = visibleAlerts.find(
     (alert) =>
       alert.isStreaming && // Only show if actively streaming
       currentStreamId !== alert._id &&
       activeTab === "passive" &&
       // Only show alerts created in the last 10 minutes
       Date.now() - alert.createdAt < 10 * 60 * 1000
   );
   ```

3. **Added condition to render:**
   ```typescript
   {incomingAlert &&
     !currentStreamId &&
     !hasAcknowledged &&
     showIncomingAlerts && // Wait for grace period
     isLoaded && (
       <IncomingAlert ... />
     )}
   ```

**Result:**

- No immediate calls on login ✅
- Only shows active, recent, streaming alerts ✅
- 2-second grace period to let the app load ✅

---

## Bug 2: Receiving Alerts Created Before Login

**Issue:**
New users who just logged in receive emergency alerts that were created BEFORE they logged in. This doesn't make sense - alerts should only be broadcasted to users who were online at the time.

**Root Cause:**
No check to filter out alerts created before the user's login timestamp. The query returns all active alerts nearby, regardless of when they were created or when the user logged in.

**Fix Applied:**

1. **Track login timestamp:**

   ```typescript
   const [loginTimestamp, setLoginTimestamp] = useState<number | null>(null);

   useEffect(() => {
     if (isLoaded && user && loginTimestamp === null) {
       setLoginTimestamp(Date.now());
     }
   }, [isLoaded, user, loginTimestamp]);
   ```

2. **Filter alerts to only show post-login alerts:**

   ```typescript
   const visibleAlerts = nearbyAlerts.filter(
     (alert) =>
       !dismissedAlerts.has(alert._id) &&
       (loginTimestamp === null || alert.createdAt >= loginTimestamp)
   );
   ```

3. **Update incoming alert check:**
   ```typescript
   const incomingAlert = visibleAlerts.find(
     (alert) =>
       alert.isStreaming &&
       currentStreamId !== alert._id &&
       activeTab === "passive" &&
       loginTimestamp !== null &&
       alert.createdAt >= loginTimestamp // ONLY alerts after login
   );
   ```

**Result:**

- New users don't see historical alerts ✅
- Only alerts created AFTER login trigger notifications ✅
- Bell icon count only shows relevant alerts ✅
- Makes logical sense - you only get notified about emergencies while you're online ✅

---

## Bug 3: NotificationPanel (Bell Icon) Showing Old Alerts

**Issue:**
Even after fixing the incoming alert popup, old alerts were STILL showing in the bell icon dropdown! Users were seeing alerts created before they logged in.

**Root Cause:**
The `NotificationPanel` component had its OWN separate query and filtering logic that did NOT check `loginTimestamp`. It only filtered by `dismissedAlerts`:

```typescript
// OLD - BAD - in NotificationPanel
const nearbyAlerts = (nearbyAlertsQuery || []).filter(
  (alert) => !dismissedAlerts.has(alert._id) // No loginTimestamp check!
);
```

**Fix Applied:**

1. **Added `loginTimestamp` prop to NotificationPanel:**

   ```typescript
   interface NotificationPanelProps {
     // ... other props
     loginTimestamp: number; // When user opened the app
   }
   ```

2. **Updated filter to check loginTimestamp:**

   ```typescript
   const nearbyAlerts = (nearbyAlertsQuery || []).filter(
     (alert) =>
       !dismissedAlerts.has(alert._id) && alert.createdAt >= loginTimestamp // Only post-login alerts!
   );
   ```

3. **Pass loginTimestamp from Dashboard:**
   ```typescript
   <NotificationPanel
     // ... other props
     loginTimestamp={loginTimestamp}
   />
   ```

**Result:**

- Bell icon only shows alerts created after login ✅
- Bell badge count only counts post-login alerts ✅
- Dropdown is empty if no new alerts since login ✅

**Lesson Learned:**
When filtering data in multiple components, make sure ALL components apply the same filters! The Dashboard and NotificationPanel were both querying alerts but applying different filters.

---

## Bug 4: Component Mount vs User Login Timing (CRITICAL!)

**Issue:**
Even after all previous fixes, old alerts STILL showed up! The timestamp was being set when the component mounted, not when the user actually logged in.

**Root Cause:**

```typescript
// WRONG - sets timestamp when COMPONENT mounts, not when USER logs in!
const [loginTimestamp] = useState(() => Date.now());
```

The problem is that `useState(() => Date.now())` runs when the **component first mounts**, which might be BEFORE the user is authenticated (e.g., during SSR, cached render, or if the component stays mounted across auth state changes).

**Fix Applied:**

1. **Use sessionStorage tied to user ID:**

   ```typescript
   const [loginTimestamp, setLoginTimestamp] = useState<number | null>(null);

   useEffect(() => {
     if (isLoaded && user) {
       const sessionKey = `alertrun_session_${user.id}`;
       const existingTimestamp = sessionStorage.getItem(sessionKey);

       if (existingTimestamp) {
         setLoginTimestamp(parseInt(existingTimestamp, 10));
       } else {
         const ts = Date.now();
         sessionStorage.setItem(sessionKey, ts.toString());
         setLoginTimestamp(ts);
       }
     }
   }, [isLoaded, user]);
   ```

2. **Show NO alerts until timestamp is set:**

   ```typescript
   const visibleAlerts =
     loginTimestamp === null
       ? [] // Show nothing until we have a valid timestamp
       : nearbyAlerts.filter((alert) => alert.createdAt >= loginTimestamp);
   ```

3. **Clear session on logout:**
   ```typescript
   onClick={() => {
     if (user?.id) {
       sessionStorage.removeItem(`alertrun_session_${user.id}`);
     }
     signOut({ redirectUrl: "/" });
   }}
   ```

**Why sessionStorage:**

- Cleared when browser tab/window closes = fresh timestamp on new session
- Persists across page navigation within same tab = consistent filtering
- Per-user key = handles multiple users on same browser

**Result:**

- New login = fresh timestamp = no old alerts ✅
- Page refresh = same timestamp = consistent filtering ✅
- Sign out + sign in = fresh timestamp = no old alerts ✅
- Different browser tab = fresh timestamp = no old alerts ✅

---

## Potential Issues to Watch

### Issue 2: Multiple Alerts Simultaneously

**Status:** Not implemented yet  
**Behavior:** Currently only shows the first matching alert  
**Future Fix:** Queue system or show most severe first

### Issue 3: Location Permission Denied

**Status:** Handles gracefully  
**Behavior:** Alerts query skips if location unavailable  
**Note:** User won't see nearby alerts, but app still works

### Issue 4: Old Dismissed Alerts in localStorage

**Status:** Works but could be improved  
**Behavior:** Dismissed alerts stay in localStorage forever  
**Future Fix:** Clean up dismissed alerts older than 24 hours

---

## Testing Checklist

Before deploying, verify:

- [ ] Login → No immediate emergency call
- [ ] Login → Wait 2 seconds → Only active streaming alerts show
- [ ] Old alerts (10+ minutes) don't trigger calls
- [ ] Non-streaming alerts don't trigger calls
- [ ] Dismissing alert stops future calls for that alert
- [ ] Accepting alert switches to stream view
- [ ] Logging out and back in resets state correctly
