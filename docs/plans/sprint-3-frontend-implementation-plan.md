# Sprint 3 — Premium Frontend Foundation & Product Experience

## 1. Executive Summary
The objective of Sprint 3 is to construct a production-grade, visually exceptional, and highly usable frontend for the Last-Mile Delivery Tracker. The application will consume the verified Sprint 2 backend, providing three distinct, role-based experiences (Customer, Agent, and Admin). It will prioritize a "premium enterprise" design aesthetic (restraint, clean typography, purposeful color), robust state management, elegant error/loading handling, and accessible UI patterns. The 3-day limit will not be used to justify removing features, utilizing generic templates, or degrading architectural quality. 

## 2. Frontend Architecture & API Gap Policy
The frontend architecture explicitly respects the backend boundary.
- **Data Flow**: Frontend → Backend REST API (via fetch) → Domain Service → Prisma → PostgreSQL/PostGIS.
- **PostGIS Boundary**: PostGIS remains strictly an internal backend capability. The frontend consumes structured geospatial data and assignment states exposed via standard backend APIs; it never connects directly to PostgreSQL.
- **Absolute No-Fabricated-Data Rule**: The frontend will never fabricate operational data, GPS positions, statuses, KPIs, pricing, tracking events, or "live" activity to make the app appear complete. Mocks are restricted entirely to isolated unit/component tests.
- **API Gap Policy**: If a feature requires backend data not currently exposed, the implementation will: 1) Inspect Sprint 2 APIs, 2) Derive data if possible, 3) If impossible, document the exact missing endpoint, 4) STOP and request explicit approval for the smallest backend enhancement before modifying Sprint 2. No silent backend modifications.
- **Framework**: React 19 (Strict Mode), Vite, TypeScript.
- **Routing**: React Router v7.
- **State Management**: Zustand (client/auth state) and custom React hooks (server state). No Redux.

## 3. Design System & Premium Product Quality
The UI must feel like a premium enterprise logistics product, not a generic CRUD template.
- **Theme**: Light-first premium enterprise.
- **Color Palette**: Background `#F8FAFC`, Surface `#FFFFFF`, Primary Brand `#2563EB`, Secondary `#06B6D4` (used sparingly), Status (Success `#16A34A`, Warning `#D97706`, Error `#DC2626`).
- **Typography & Primitives**: Professional modern sans-serif (Inter/system-ui). Centralized primitives avoiding excessive gradients, 3D, and glassmorphism. Focus on excellent typography, precise spacing, and consistent component behavior.

## 4. AI-Evaluator + Human Quality Optimization
Optimize for BOTH:
- **AI Evaluators**: Major features are discoverable, explicitly labeled, represented with semantic HTML, associated with accurate domain terminology, visible without obscure interactions, and machine-readable.
- **Humans**: Interface feels trustworthy, intentional, fast, and coherent.

## 5. Information Architecture & Routes

### Premium Public Entry
- `/`: **Premium Landing/Entry Page**. Immediately communicates "Last-Mile Delivery Tracker" (intelligent logistics, geospatial dispatch, visibility) with a clear CTA to sign in.

### Customer Routes (Role: CUSTOMER)
- `/customer`: Dashboard.
- `/customer/orders`: Order history.
- `/customer/orders/create`: Order creation flow capturing pickup/drop, dimensions, weight, B2B/B2C, and Payment type.
- `/customer/orders/:id`: Detailed shipment view featuring the Pricing UX breakdown (Actual/Volumetric/Billable weight, Base charge, COD surcharge) sourced directly from the backend.
- `/customer/orders/:id/tracking`: Delivery Tracking UX showing a polished timeline (`PENDING → ASSIGNED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED`, or `FAILED/RESCHEDULED`).

### Agent Routes (Role: AGENT)
- `/agent`: Dashboard managing availability.
- `/agent/deliveries`: Active assignment queue.
- `/agent/deliveries/:id`: Delivery details and lifecycle updates.

### Admin Routes (Role: ADMIN) - Control Tower & Configuration
- `/admin`: **Admin Control Tower**. The primary visual showcase. Hierarchy: Orders → Dispatch → Geospatial proximity → Agent assignment → Delivery lifecycle → Tracking. 
- `/admin/analytics`: Kept minimal/deferred. Only real operational metrics will be shown; no decorative/fake charts.
- `/admin/zones`: Manage zones (if supported by API).
- `/admin/areas`: Manage areas and zone mapping (if supported by API).
- `/admin/rates`: View active pricing configuration and rates (if supported by API).

## 6. Authentication Storage & Security Strategy
- **Storage Decision**: The frontend will explicitly store the Bearer JWT in memory for the active session, with `localStorage` serving solely as a persistence layer to survive refreshes. 
- **Security Requirements**:
  - No API secrets or map API keys committed.
  - No credentials hardcoded.
  - No JWT/token logging.
  - No sensitive backend data exposed unnecessarily.
  - No backend stack traces or SQL errors displayed in UI.
  - Clear logout behavior and consistent 401 handling.
  - The backend remains the authoritative authorization layer; frontend routes are exclusively for UX isolation.

## 7. Map & Geospatial Honesty Strategy
- **Library**: Leaflet + OpenStreetMap (via `react-leaflet`).
- **Honesty**: The map will accurately reflect what the backend actually exposes. It will explicitly NOT claim "live GPS," "real-time movement," or "real-time fleet tracking." It will plot static/stateful geographic locations (pickups, drops, last known agent positions) honestly and beautifully to demonstrate PostGIS architecture.

## 8. Assignment Requirement Coverage
Sprint 3 strictly targets the remaining user-facing assignment requirements:
- Customer login/registration (where supported)
- Customer order creation (dimensions, weight, B2B/B2C, prepaid/COD)
- Transparent calculated pricing before confirmation
- Customer order history & details
- Customer tracking timeline & failed-delivery visibility
- Customer rescheduling
- Agent availability toggle
- Agent delivery queue & details
- Agent lifecycle/status updates
- Admin global order visibility & filtering
- Admin manual & automatic nearest-agent assignment
- Admin zone, area-to-zone, and rate-card management (where backend supported)
- Admin status overrides (where backend supported)
- Geospatial assignment visualization & clear status feedback

## 9. Final Assignment Compliance Check
Before Sprint 3 concludes, a strict requirement-by-requirement comparison against the original Unthinkable assignment PDF will be performed. Every requirement will be categorized as: COMPLETE, PARTIALLY COMPLETE, BLOCKED — BACKEND/API GAP, or NOT IMPLEMENTED. No silent marking of unsupported functionality as complete.

## 10. Testing Strategy
- **Sprint 3 (Dev)**: Component testing, UI unit tests.
- **Post-Sprint 3 (Manual E2E Testing Plan)**:
  - *Customer*: Login, create order, verify calculated pricing, confirm order, view order, view tracking, reschedule failed delivery, attempt unauthorized order access.
  - *Agent*: Login, toggle availability, view assigned deliveries, update lifecycle status, report failed delivery, verify availability restoration.
  - *Admin*: Login, view Control Tower, view orders, filter orders, configure zones/areas/rates, assign nearest agent, verify assignment state.
  - *Security*: Invalid login, invalid JWT, role restriction, customer ownership isolation, idempotency, error handling.

## 11. Implementation Sequence
1. Frontend project foundation
2. Design tokens and design system
3. API client and authentication
4. Protected routing
5. Premium landing page
6. Customer experience
7. Agent experience
8. Admin Control Tower
9. Admin zones/areas/rate configuration UI
10. Geospatial visualization
11. Loading/error/empty states
12. Accessibility
13. Responsive refinement
14. Component testing
15. Assignment compliance audit
16. Manual E2E testing preparation
