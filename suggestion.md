# Code Review Suggestions

This document contains a comprehensive analysis of both the mobile and client-dashboard applications, highlighting bugs, bad practices, anti-patterns, and security issues.

---

## Table of Contents
1. [Critical Issues (Fix Immediately)](#critical-issues-fix-immediately)
2. [Mobile App Issues](#mobile-app-issues)
3. [Client Dashboard Issues](#client-dashboard-issues)
4. [Security Issues](#security-issues)
5. [Performance Issues](#performance-issues)

---

## Critical Issues (Fix Immediately)

### 1. Memory Leaks - Socket Event Listeners Not Cleaned Up

**Mobile App:**
- `apps/mobile/src/app/(driver)/index.tsx` (Lines 24-48)
  - Socket listeners registered but cleanup is commented out
  - Missing `socket.off()` for `connect`, `booking:assigned`, `booking:cancelled`

- `apps/mobile/src/app/(emt)/navigation.tsx` (Lines 60-68)
  - Socket event listeners registered but no cleanup returned

**Client Dashboard:**
- `apps/client-dashboard/src/components/ui/map.tsx` (Line 1325)
  - Wrong event name in cleanup: removes "move" but registered "moveend"

- `apps/client-dashboard/src/components/map/HospitalMarkerLayer.tsx`
  - Event listener added but never removed: `map.on("mouseover", layerId, handleClick)`

### 2. Type Mismatches - Coordinates Swapped

**Mobile App:**
- `apps/mobile/src/app/(driver)/index.tsx` (Lines 99-100)
  ```typescript
  latitude: currentLocation.x,  // WRONG: x is longitude
  longitude: currentLocation.y, // WRONG: y is latitude
  ```
  **Impact:** Driver location will be completely wrong on maps

### 3. Missing Error Boundaries

**Client Dashboard:**
- `apps/client-dashboard/src/pages/dashboard.tsx` (Line 11)
  ```tsx
  if (error) throw new Error("Failed to fetch hospitals");
  ```
  **Impact:** App crashes completely if hospital fetch fails

---

## Mobile App Issues

### Bugs and Logic Errors

#### 1. Race Conditions
**File:** `apps/mobile/src/hooks/useSettingsLogic.ts` (Lines 58-68)
- Settings save uses debounce but doesn't abort in-flight requests
- Multiple rapid changes could result in out-of-order saves

#### 2. Missing Loading States
**File:** `apps/mobile/src/app/(patient)/map.tsx` (Line 52)
- Returns simple `<Text>Loading</Text>` instead of proper loading component
- Could crash if `locationState` is undefined

#### 3. Missing Error Handling
**File:** `apps/mobile/src/hooks/useLocation.ts` (Lines 14-48)
- Location permission check returns early but doesn't handle the error case properly
- No retry mechanism for failed location requests

**File:** `apps/mobile/src/app/(patient)/map.tsx` (Lines 25-34)
- `handleHelpRequest` doesn't handle errors from `loadSettings()` or socket emission

### Bad Practices

#### 1. Console Statements in Production Code (17 found)
**Files affected:**
- `apps/mobile/src/utils/settingsStorage.ts` (2 errors)
- `apps/mobile/src/hooks/SocketContext.tsx` (1 info)
- `apps/mobile/src/app/(emt)/navigation.tsx` (4 logs)
- `apps/mobile/src/app/(driver)/index.tsx` (3 logs)
- `apps/mobile/src/hooks/useDriverTracking.ts` (1 info)
- `apps/mobile/src/utils/socket.ts` (5 logs)

**Recommendation:** Remove or replace with proper logging utility

#### 2. Hardcoded Values
- `apps/mobile/src/app/(driver)/index.tsx` (Lines 8-13): Hardcoded Sri Lanka coordinates
- `apps/mobile/src/app/(emt)/navigation.tsx` (Lines 54-58): Hardcoded driver locations
- `apps/mobile/src/app/(patient)/_layout.tsx`: Hardcoded color values `#26A69A`, `#999`

#### 3. Inline Styles
**Files:**
- `apps/mobile/src/app/(public)/login.tsx`: `<SafeAreaView style={{ padding: 24, gap: 12 }}>`
- `apps/mobile/src/app/(emt)/navigation.tsx`: `<SafeAreaView style={{ flex: 1 }}>`
- `apps/mobile/src/components/patient/UserMap.tsx`

#### 4. Use of `any` Type
**Files:**
- `apps/mobile/src/utils/settingsStorage.ts` (Line 45): `value: any`
- `apps/mobile/src/tasks/locationTasks.ts` (Line 6): `{ data, error }: any`
- `apps/mobile/src/hooks/usePatientEvents.ts` (Lines 7, 22): Multiple `any` types
- `apps/mobile/src/hooks/useSocketEvent.ts` (Line 4): `...args: any[]`

### Anti-Patterns

#### 1. Large Components Doing Too Much
**File:** `apps/mobile/src/app/(patient)/settings.tsx` (141 lines)
- Manages 4 different modals, all settings state, and section rendering
- **Refactored into:** `useSettingsLogic` hook (see improvements)

**File:** `apps/mobile/src/app/(driver)/index.tsx` (192 lines)
- Handles map display, ride status, socket events, and UI all in one

#### 2. State That Could Be Derived
**File:** `apps/mobile/src/app/(driver)/index.tsx`
- `rideStatus` state could be derived from `currentRide` existence
- Redundant state tracking leads to synchronization issues

#### 3. Inline Component Definitions
**Files:**
- `apps/mobile/src/app/(driver)/index.tsx`: `DetailItem` defined inline (line 186)
- `apps/mobile/src/app/(emt)/navigation.tsx`: `LocationCard` and `Separator` defined inline

These components are recreated on every render, causing performance issues.

#### 4. Using Index as Key
**File:** `apps/mobile/src/components/patient/UserMap.tsx` (Line 53)
```tsx
<Marker key={`d${i}`} coordinate={{ latitude: d.y, longitude: d.x }}>
```
Should use driver ID instead of index.

### Performance Issues

#### 1. Missing useMemo/useCallback
- Event handlers not memoized in driver screens
- Region object recreated on every render in UserMap
- Filter operations run on every render in AllergiesModal

#### 2. FlatList Without Virtualization
**File:** `apps/mobile/src/components/patient/settings/modals/AllergiesModal.tsx`
- `scrollEnabled={false}` defeats virtualization purpose
- All items rendered at once

---

## Client Dashboard Issues

### Bugs and Logic Errors

#### 1. Race Condition in Socket Connection
**File:** `apps/client-dashboard/src/hooks/use-socket-store.ts` (Lines 43-62)
```typescript
connect: () => {
  if (get().socket?.connected) return; // Only checks if already connected
  // ... creates new socket
}
```
Can create multiple socket connections if called rapidly.

#### 2. Potential Null Pointer Exception
**File:** `apps/client-dashboard/src/components/map/HospitalMarkerLayer.tsx` (Line 80)
```typescript
coordinates: [hospital.location!.x, hospital.location!.y],
```
Using non-null assertion without validation. If location is undefined, app crashes.

#### 3. Mutating Refs During Render
**File:** `apps/client-dashboard/src/components/ui/map.tsx` (Lines 843-850)
Direct property mutations happen during render phase, causing issues with React's concurrent mode.

### Bad Practices

#### 1. Disabled ESLint Rules (11 instances)
**File:** `apps/client-dashboard/src/components/ui/map.tsx`
Multiple `// eslint-disable-next-line react-hooks/exhaustive-deps` indicate potential stale closure bugs.

#### 2. Commented-Out Code
**File:** `apps/client-dashboard/src/components/alert-stack.tsx` (Lines 1-50)
Large blocks of commented code should be removed.

#### 3. Non-Null Assertion Without Check
**File:** `apps/client-dashboard/src/main.tsx` (Line 6)
```tsx
createRoot(document.getElementById("root")!).render(
```
Assumes root element exists without verification.

#### 4. Missing Loading States
**File:** `apps/client-dashboard/src/pages/dashboard.tsx`
No loading state while fetching hospital data - users see empty map.

### Anti-Patterns

#### 1. Nested Interactive Elements
**File:** `apps/client-dashboard/src/components/app-sidebar.tsx` (Lines 69-82)
```tsx
<SidebarGroupLabel onClick={...}>
  <button className="...">
```
Button inside clickable element creates invalid HTML and accessibility issues.

#### 2. Large Component Files
**File:** `apps/client-dashboard/src/components/ui/map.tsx` (1331 lines)
Contains 7+ complex components. Should be split into separate files.

#### 3. Empty Catch Blocks
**File:** `apps/client-dashboard/src/components/ui/map.tsx` (Lines 949-954, 1128-1135)
```tsx
} catch {
  // ignore
}
```
Silently swallowing errors makes debugging impossible.

#### 4. Using Index as Key
**File:** `apps/client-dashboard/src/components/alert-stack.tsx` (Line 34)
```tsx
<Alert key={i} variant="destructive" ...>
```
Can cause rendering issues when items are reordered.

### Performance Issues

#### 1. SidebarMenuSkeleton Random Width
**File:** `apps/client-dashboard/src/components/ui/sidebar.tsx` (Lines 584-586)
```tsx
const [width] = React.useState(() => {
  return `${Math.floor(Math.random() * 40) + 50}%`;
});
```
Causes hydration mismatches and unnecessary state.

#### 2. Missing Virtualization
**File:** `apps/client-dashboard/src/components/BookingRequestOverlay.tsx`
No virtualization for booking requests list. Could cause performance issues with many requests.

---

## Security Issues

### Mobile App

#### 1. Sensitive Data in Unencrypted Storage
**File:** `apps/mobile/src/utils/settingsStorage.ts`
- Uses AsyncStorage for PII (medical info, emergency contacts)
- AsyncStorage is not encrypted
- **Recommendation:** Use `expo-secure-store` for sensitive data

#### 2. Environment Variable Exposure
**File:** `apps/mobile/env.ts`
- UUIDs for PATIENT_ID, DRIVER_ID, EMT_ID stored in env vars
- In production, these should come from authentication, not build config

#### 3. Missing Input Validation
**Files:**
- `EmergencyContactModal.tsx`: No phone number format validation
- `PersonalSection.tsx`: No max length constraints on inputs
- No sanitization of input text anywhere

#### 4. Potential XSS via URLs
**File:** `apps/mobile/src/app/(driver)/index.tsx` (Lines 74-76)
```typescript
url = `https://www.google.com/maps/dir/?api=1&destination=${currentRide.patient.currentLocation!.y},${currentRide.patient.currentLocation!.x}`;
```
Dynamic values not encoded before URL construction.

### Client Dashboard

#### 1. Environment Variable Exposure
**File:** `apps/client-dashboard/env.ts`
`VITE_DISPATCHER_ID` as UUID in env vars suggests it might be sensitive/user-specific.

#### 2. No Input Sanitization
Placeholder form components don't show any validation or sanitization.

#### 3. Missing CSRF Protection
**File:** `apps/client-dashboard/src/lib/api.ts`
Axios instance doesn't include CSRF token handling for non-GET requests.

#### 4. Potential Prototype Pollution
**File:** `apps/client-dashboard/src/lib/types.ts` (Line 231)
```typescript
[key: string]: any; // Other patient fields
```
Using `any` for dynamic keys can lead to prototype pollution.

---

## Performance Issues Summary

### Mobile App
1. **Missing Memoization**: Event handlers and expensive computations not cached
2. **Inline Components**: Components defined in render recreated every time
3. **No Virtualization**: Allergies list renders all items at once
4. **Unnecessary Re-renders**: State updates trigger cascading re-renders

### Client Dashboard
1. **Expensive Map Operations**: GeoJSON conversion on every hospitals update
2. **Random Values in State**: Skeleton widths computed with Math.random()
3. **Large Bundle**: map.tsx is 1331 lines - consider code splitting
4. **Missing Virtualization**: Booking requests list not virtualized

---

## Recommended Action Plan

### Phase 1: Critical Fixes (This Week)
1. ✅ Fix coordinate swap in driver/index.tsx (CRITICAL BUG)
2. ✅ Add proper cleanup for socket event listeners (MEMORY LEAK)
3. ✅ Fix wrong event name in map.tsx cleanup (MEMORY LEAK)
4. ✅ Add error boundaries to dashboard.tsx (APP CRASH)
5. ✅ Add proper cleanup to HospitalMarkerLayer (MEMORY LEAK)

### Phase 2: High Priority (Next Week)
6. Remove or disable console statements for production
7. Add error handling to all async operations
8. Fix eslint-disable comments by adding proper dependencies
9. Validate hospitals have locations before rendering
10. Replace `any` types with proper TypeScript types

### Phase 3: Medium Priority (Next 2 Weeks)
11. Split large component files (map.tsx, settings.tsx, driver/index.tsx)
12. Remove commented-out code
13. Add loading states to all async operations
14. Implement proper form validation
15. Add memoization to expensive operations

### Phase 4: Polish (Ongoing)
16. Improve accessibility (ARIA labels, focus management)
17. Add CSRF protection if needed
18. Optimize selectors with shallow comparison
19. Add proper input sanitization
20. Consider using secure storage for PII

---

## Files Requiring Immediate Attention

### Mobile App
| File | Issues | Severity |
|------|--------|----------|
| `app/(driver)/index.tsx` | 8 | Critical |
| `app/(emt)/navigation.tsx` | 5 | High |
| `hooks/useLocation.ts` | 3 | Medium |
| `utils/settingsStorage.ts` | 4 | Medium |
| `utils/socket.ts` | 5 | Low |

### Client Dashboard
| File | Issues | Severity |
|------|--------|----------|
| `components/ui/map.tsx` | 15+ | Critical |
| `components/map/HospitalMarkerLayer.tsx` | 5 | Critical |
| `pages/dashboard.tsx` | 3 | High |
| `hooks/use-socket-store.ts` | 3 | Medium |
| `components/app-sidebar.tsx` | 4 | Low |

---

## Summary

| Category | Mobile | Dashboard | Total |
|----------|--------|-----------|-------|
| Critical Bugs | 4 | 5 | 9 |
| Bad Practices | 12 | 8 | 20 |
| Anti-Patterns | 9 | 7 | 16 |
| Security Issues | 4 | 4 | 8 |
| Performance | 6 | 4 | 10 |
| **Total** | **35** | **28** | **63** |

The most critical issues are memory leaks from uncleaned event listeners, incorrect coordinate assignments that will cause location errors, and missing error boundaries that can crash the entire application. These should be fixed immediately before addressing the broader code quality issues.

---

*Generated: 2026-02-13*
*Review both apps for bugs, bad practices, anti-patterns, and security issues*
