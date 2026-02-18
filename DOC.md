# Frontend Booking Logic (Client Dashboard)

This document explains how booking-related state flows through the client dashboard UI, how routes and markers are derived, and where the main logic lives.

## Scope

- App: `apps/client-dashboard`
- Focus: booking requests, ongoing bookings, routing, and map rendering
- Sources: WebSocket events + API queries + local UI state

## Primary Data Sources

1. WebSocket (dispatcher channel)
   - Connection and store: `apps/client-dashboard/src/hooks/use-socket-store.ts`
   - Events defined in: `apps/client-dashboard/src/lib/types.ts`

2. REST queries (non-booking)
   - Hospitals: `apps/client-dashboard/src/services/hospital.service.ts`
   - Map view state: `apps/client-dashboard/src/hooks/use-store.ts`

## Backend Responsibilities (High-Level)

Backend roles that drive the frontend booking flow:

- WebSocket dispatcher channel emits booking lifecycle events:
  - `booking:new`: new request for dispatcher approval
  - `booking:decision`: winner/loser result after approval
  - `booking:assigned`: creates/updates ongoing booking state
  - `booking:update`: status transitions (ARRIVED, PICKEDUP, COMPLETED, CANCELLED)
  - `booking:sync`: bulk sync of ongoing bookings on connect
  - `driver:update`: real-time driver location updates

- REST endpoints used by the dashboard:
  - Hospitals list (for map markers)
  - Drivers list (if enabled in the UI)

- Server formats payloads using the types mirrored in
  `apps/client-dashboard/src/lib/types.ts`:
  - `DispatcherBookingPayload`
  - `DispatcherBookingUpdatePayload`
  - `BookingNewPayload`
  - `DriverLocationUpdate`

The frontend assumes the backend sends coordinates in `Point` format where
`x = longitude` and `y = latitude`.

## Booking Types (Core Shapes)

All booking-related payloads are typed in:
- `apps/client-dashboard/src/lib/types.ts`

Key shapes used by the frontend:
- `BookingNewPayload` (incoming booking request)
- `BookingDecisionPayload` (who won the request)
- `DispatcherBookingPayload` (ongoing booking state)
- `DispatcherBookingUpdatePayload` (status updates)
- `DriverLocationUpdate` (driver movement)

Coordinates are represented as:
- `Point { x: number; y: number }`
- Convention: `x = longitude`, `y = latitude`

## State Management (Zustand)

Store file:
- `apps/client-dashboard/src/hooks/use-socket-store.ts`

State slices:
- `bookingRequests`: list of pending booking requests
- `bookingDecisions`: decision status per request
- `ongoingBookings`: map keyed by `bookingId`

Key mutations:
- `addBookingRequest` / `removeBookingRequest`
- `setBookingDecision` / `setBookingDecisionPending` / `clearBookingDecision`
- `syncOngoingBookings` (bulk replace)
- `upsertOngoingBooking` (merge by `bookingId`)
- `updateOngoingBooking` (status updates; removes when completed or cancelled)
- `updateDriverLocation` (patches driver location for matching driver id)

Connection:
- `connect()` opens socket at `${VITE_WS_SERVER_URL}/dispatcher`
- `disconnect()` closes it

## Main UI Orchestrator: Dashboard

File:
- `apps/client-dashboard/src/pages/dashboard.tsx`

Responsibilities:
1. Read booking state from the socket store:
   - `bookingRequests`
   - `ongoingBookings`

2. Derive `ongoingList` from `ongoingBookings`:
   - `Object.values(ongoingBookings)`

3. Fetch and cache OSRM routes:
   - `fetchRoute()` calls OSRM
   - `routeCache` is a global in-memory cache with 30s TTL
   - `routes` state is a Record keyed by `"${bookingId}:${phase}"`

4. Render the map:
   - Hospital markers
   - Patient request markers
   - Driver markers
   - Route overlays (MapRoute)

## Booking Request UI

File:
- `apps/client-dashboard/src/components/BookingRequestOverlay.tsx`

Behavior:
- Shows pending booking requests
- Allows accept/reject via callback from socket payload
- Tracks decision state in `bookingDecisions`
- Auto clears decisions after a short timeout

## Map Rendering Pipeline

### Components

- Map container and utilities:
  - `apps/client-dashboard/src/components/ui/map.tsx`

- Markers:
  - `apps/client-dashboard/src/components/map/PatientRequestMarker.tsx`
  - `apps/client-dashboard/src/components/map/DriverMarkers.tsx`
  - `apps/client-dashboard/src/components/map/DriverMarker.tsx`
  - `apps/client-dashboard/src/components/map/OngoingPatientMarker.tsx`
  - `apps/client-dashboard/src/components/map/HospitalMarkerLayer.tsx`

### Route Rendering (MapRoute)

Component:
- `apps/client-dashboard/src/components/ui/map.tsx`

Inputs:
- `coordinates: [number, number][]` (lon, lat)
- `color`, `width`, `opacity`

What it does:
- Creates a GeoJSON source and line layer
- Updates the layer when coordinates change
- Handles click and hover events

### Route Fetching (OSRM)

Defined in:
- `apps/client-dashboard/src/pages/dashboard.tsx`

Flow:
1. For each ongoing booking, compute the phase:
   - `ASSIGNED` -> `patient` phase
   - Other active states -> `hospital` phase

2. Pick target location:
   - `patient` phase -> patient pickup location
   - `hospital` phase -> hospital location

3. Validate coordinates (finite numbers)

4. Use cache key:
   - `"${bookingId}:${phase}"`

5. Fetch route from OSRM when not cached:
   - URL format: `/route/v1/driving/{lon},{lat};{lon},{lat}?overview=full&geometries=geojson`

6. Store route in state and cache

### Rendering Conditions

Routes render only when:
- booking is not `COMPLETED` or `CANCELLED`
- phase matches
- start and end locations exist
- route coordinates are available

## Booking Status and Phase Mapping

Status values:
- `ASSIGNED`, `ARRIVED`, `PICKEDUP`, `COMPLETED`, `CANCELLED`

Phase mapping used by routing:
- `ASSIGNED` -> route from driver to patient
- `ARRIVED` / `PICKEDUP` -> route from driver to hospital
- `COMPLETED` / `CANCELLED` -> no route

## Data Flow Summary

1. Backend emits socket events
2. `use-socket-store` updates booking state
3. `dashboard.tsx` derives lists and routes
4. Map renders markers and routes
5. Overlay displays booking requests and decisions

## Known Complexity Points

- Multiple sources of truth (requests, decisions, ongoing bookings)
- Derived state scattered across map and overlay components
- Route cache is local to the dashboard and global scope
- Location validation is repeated in multiple places

## Suggested Simplification Directions (Non-breaking)

- Build a single derived selector for booking view models
- Centralize coordinate validation helpers
- Encapsulate route fetching + caching into a custom hook
- Reduce prop drilling by passing normalized view models to map components
