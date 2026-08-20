# Sprint 2 — Backend Core Platform & Business Engine

## Executive Summary
This sprint will transform the database foundation laid in Sprint 1 into a fully functional, production-grade business engine. It will establish secure JWT authentication, deterministic pricing generation, PostGIS-backed assignment, transactional state machine logic for order lifecycle, and database-enforced immutable tracking history using a modular service-oriented backend architecture.

## Sprint Objective
Build the strongest technically credible backend/logistics engine possible. Maximize engineering depth rather than basic CRUD capabilities. The core objective is establishing the domain-specific business rules (pricing, PostGIS assignment, transactional lifecycle) and an extensible API platform with comprehensive automated testing.

## Assignment Requirements Covered
| Requirement | Current State | Sprint 2 Need | Priority | Notes |
| ----------- | ------------- | ------------- | -------- | ----- |
| Multi-role Auth (Admin/Agent/Customer) | Schema only | Implement JWT Auth | P0 | |
| Order Creation (B2B/B2C, COD/Prepaid) | Schema only | Implement API & Validation | P0 | Calculate pricing on creation |
| Dynamic Pricing Engine (Volumetric, Zone, COD) | DB schema | Implement Engine | P0 | Deterministic formula implementation |
| Smart Agent Assignment (Geospatial) | Schema (PostGIS) | Implement Engine | P0 | Nearest eligible available agent |
| Delivery Lifecycle Management | Schema | Implement State Machine | P0 | Transactional status transitions |
| Tracking & Event History | Schema | Implement Tracking API | P1 | Immutable history append on transitions |
| Failed Delivery & Rescheduling | Schema | Implement Reschedule Flow | P1 | Create new `DeliveryAttempt` transactionally |

## Current Repository Audit
- **Files**: The backend is primarily a Prisma project right now (`package.json`, `tsconfig.json`, `schema.prisma`, `seed.ts`, `test.ts`).
- **Dependencies**: Prisma, TypeScript, TS-Node. Express and other runtime dependencies are currently absent.
- **Database Access**: Direct script-based access. No repositories or services exist yet.
- **Frontend**: Empty/non-existent.

## Proposed Backend Architecture
We will use a modular service-oriented backend architecture tailored for Node.js/Express, balancing maintainability and execution speed.

**Conceptual Flow**:
```text
HTTP Request
    ↓
Route
    ↓
Middleware
    ↓
Controller (Thin)
    ↓
Domain Service (Business Logic)
    ↓
Prisma / Database
```

**Directory Structure**:
```text
backend/src/
├── config/        # Environment and DB config
├── controllers/   # Request handling, parsing, and delegating to services (Thin layer)
├── services/      # Core domain logic (Pricing, Assignment, Lifecycle)
├── routes/        # Express routers
├── middlewares/   # Auth, validation, error handling
├── validators/    # Zod schemas for request validation
├── errors/        # Custom domain error classes
├── utils/         # Helper functions (Geo, Math)
└── types/         # TypeScript interfaces and Express overrides
```

## Technology Decisions
- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Validation**: Zod (End-to-end type safety, declarative schema validation)
- **Authentication**: `jsonwebtoken` (Stateless, scalable)
- **Password Hashing**: `bcrypt` (Industry standard, easy to configure)
- **Logging**: `winston` or simple structured `console` output

## Resource Ownership & Authorization
Explicitly required security boundaries enforced at the service/query layer:
* Customers can access only their own orders.
* Customers cannot access another customer's order by UUID.
* Customers cannot view another customer's tracking history.
* Agents can access only operations permitted for their assigned deliveries.
* Admins have administrative access.
* Authorization must be enforced server-side.
* Frontend restrictions are NOT security boundaries.

## Authorization Matrix
Derived from the Unthinkable assignment / logistics domain rules:

| Operation              | ADMIN | AGENT | CUSTOMER | Note / Origin |
| ---------------------- | ----: | ----: | -------: | :------------ |
| Login                  |   YES |   YES |      YES | Standard auth requirement |
| Create order           |    NO |    NO |      YES | Customers initiate shipments |
| View own orders        |   YES |   YES |      YES | Customers see theirs, Agents see assigned |
| View all orders        |   YES |    NO |       NO | Admin dashboard requirement |
| Assign agent           |   YES |    NO |       NO | Assignment is automatic or Admin override |
| Update delivery status |   YES |   YES |       NO | Agents must mark delivered/failed |
| Reschedule delivery    |   YES |    NO |      YES | Customers initiate rescheduling |
| Manage rates           |   YES |    NO |       NO | Admin configuration |
| Manage zones           |   YES |    NO |       NO | Admin configuration |

*(Note: Any unlisted permissions require explicit implementation decisions).*

## API Architecture
RESTful JSON APIs over HTTP, mounted under `/api/v1`.

## Endpoint Inventory
- `POST /api/v1/auth/login`
- `POST /api/v1/orders`
- `GET /api/v1/orders/:id`
- `GET /api/v1/orders`
- `GET /api/v1/orders/:id/tracking`
- `POST /api/v1/orders/:id/assign`
- `PATCH /api/v1/orders/:id/status`
- `POST /api/v1/orders/:id/reschedule`

## Validation Strategy
Using Zod to parse all `req.body`, `req.query`, and `req.params`. Invalid data will be caught by a generic validation middleware, immediately returning a structured 400 Bad Request error.

## Error Handling Strategy
Centralized error handling middleware using domain-specific error classes (`BadRequestError`, `UnauthorizedError`, `NotFoundError`).
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid actual weight"
  }
}
```

## Pricing Engine Design
A deterministic service `PricingService.calculate(orderData, rateConfig)`.
The pricing rules have been explicitly resolved against the Unthinkable assignment PDF:
- **Exact volumetric-weight formula**: `(L × B × H) / 5000`. The divisor `5000` is explicitly mandated by the assignment.
- **Exact rounding behavior**: The assignment does not specify rounding (e.g., ceil to next 0.5kg). **Assumption**: The exact decimal value of `max(actual, volumetric)` will be multiplied by the rate. No arbitrary rounding brackets will be applied.
- **Exact billable-weight rule**: `max(actualWeight, volumetricWeight)`
- **Exact B2B/B2C & Intra/Inter-zone rule**: Look up exact active RateConfiguration fields.
- **Exact COD surcharge rule**: Add fixed COD surcharge if PaymentType is COD.

The engine will return frozen snapshot data to be inserted atomically during Order creation.

## Pricing Explainability
The API response for Order Details will include the exact parameters used during creation via the `calculationBreakdown` JSONB field saved in `PricingSnapshot`, guaranteeing auditable transparency. The typed `PricingSnapshot` fields remain authoritative.

## PostGIS Assignment Engine
A specialized `AssignmentService`.
1. Query available agents via `isAvailable = true`.
2. Apply `ST_Distance(currentLocation, ST_SetSRID(ST_MakePoint(lon, lat), 4326))` against the order pickup location.
3. Order candidates by actual geospatial distance.
4. Select the nearest eligible agent, applying deterministic tie-breaking.
5. Atomically attempt to claim the agent (Concurrency enforcement).
6. Create `DeliveryAttempt`, Update `Order.status`, Insert `TrackingHistory`.

## Concurrency Strategy
Two concurrent assignment requests cannot both successfully claim the same delivery agent.
The implementation will use strict conditional database updates:
```typescript
const updatedAgent = await prisma.agentProfile.updateMany({
  where: { id: agentId, isAvailable: true },
  data: { isAvailable: false }
});
if (updatedAgent.count === 0) {
  // The agent was claimed by another transaction and must not be assigned again.
  throw new ConcurrencyError("Agent claimed by another process.");
}
```
An automated concurrency test is REQUIRED to prove this behavior.

## Idempotency & Duplicate Requests
Analyze duplicate requests for critical operations:
- `POST /api/v1/orders`: Prone to double-clicking. Do NOT use arbitrary time-window deduplication (it creates false positives and is unreliable). **Decision**: Implement a lightweight **Idempotency-Key** mechanism (e.g., via HTTP headers and a database constraint/tracking table) to explicitly reject duplicate order creation requests safely. Duplicate requests using the same valid Idempotency-Key must not create duplicate orders.
- `POST /api/v1/orders/:id/assign`: DB state transitions inherently block duplicate assignment if the order is no longer `PENDING`.
- `PATCH /api/v1/orders/:id/status`: DB state transitions block jumping from `DELIVERED` to `DELIVERED`.
- **Decision**: DB state transitions and conditional updates are sufficient for assignment/status. Order creation MUST use a lightweight Idempotency-Key mechanism. Do NOT build a distributed idempotency infrastructure.

## Order State Machine
```text
PENDING -> ASSIGNED -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED
                              \-> FAILED -> (Rescheduled) -> ASSIGNED
```
The `OrderService` validates transitions explicitly. Arbitrary jumps are rejected.

## Delivery Lifecycle
The Agent uses `PATCH /api/v1/orders/:id/status` to traverse the states. Each successful state change atomically logs a `TrackingHistory` event.

## Failed Delivery & Rescheduling
Upon failure, the agent patches status to `FAILED`, requiring a `failureReason`.
- The current `DeliveryAttempt` is marked `FAILED` with the reason.
- The Agent becomes `isAvailable = true`.
- The Order status becomes `FAILED`.
- The Customer can call `POST /api/v1/orders/:id/reschedule`, spawning a new `DeliveryAttempt` with attempt number `N+1` and placing the order back into `PENDING` or `ASSIGNED`.

## Tracking Architecture
The `TrackingService.logEvent` is strictly invoked within the transaction of any status change. Direct manipulation of the table is prevented by DB triggers.

## Notification Strategy
For Sprint 2, this will merely write to the `Notification` database table and output a structured console log. Actual SMS/Email integrations are excluded from Sprint 2 scope.

## Transaction Boundaries
1. **Order Creation**: `Order` + `PricingSnapshot` + `TrackingHistory`
2. **Assignment**: **Agent claim + DeliveryAttempt creation + Order assignment/status + TrackingHistory must succeed or fail as one transaction.**
3. **Status Update**: `Order` status + `TrackingHistory` (+ `DeliveryAttempt` resolution)

## Security
- **JWT Architecture**: Decide between an access-token-only architecture vs. a refresh-token architecture based on the assignment scope and 3-day delivery constraint. (A short-lived access JWT + no refresh token may be the optimal trade-off).
- Strict Zod validation to prevent injection.
- Passwords never returned in API responses.
- Explicit `actorId` extraction from validated JWT token enforcing Resource Ownership.

## Performance
- Leverage Sprint 1 GIST indexes for the PostGIS query.
- Controllers remain thin; no excessive abstractions.

## API Documentation
A simple OpenAPI 3.0 JSON or YAML file placed in `docs/api-spec.yaml`.

## Automated Test Strategy
A comprehensive suite utilizing Jest + Supertest testing against a seeded test database to verify the REST API functionality.
- **Testing Policy**: Unit tests that do not require PostGIS may run locally. PostGIS-dependent integration tests MUST run against the Dockerized PostGIS database. They must NOT silently skip. If PostGIS is unavailable locally, they must explicitly fail or be reported as `BLOCKED — ENVIRONMENT`.

## Top-600 Differentiation
- **Explainable PostGIS Geospatial Assignment**: Beats simple zone-matching.
- **Deterministic Explaining Pricing Engine**: Proves financial auditability.
- **Transaction-Safe Lifecycle**: Proves senior-level data integrity understanding.
- **Database-enforced immutable tracking history**: Prevents timeline tampering.

## Prioritization

### P0 — MUST BE EXCELLENT
1. API foundation
2. Authentication
3. RBAC + ownership
4. Order creation
5. Correct pricing engine
6. Order lifecycle/state machine
7. PostGIS assignment
8. Transaction/concurrency correctness

### P1 — HIGH VALUE
9. Tracking API
10. Failed delivery
11. Rescheduling
12. Integration tests
13. API documentation

### P2 — ONLY IF TIME REMAINS
14. Notification abstraction
15. Advanced logging
16. Swagger UI
17. Additional developer-experience improvements

*Note: P2 work will not compromise P0.*

## Implementation Sequence
1. API Foundation (Express, Error handling, Zod)
2. Authentication (Login, JWT Middlewares)
3. Pricing Service
4. Order Service (Creation)
5. PostGIS Assignment Service
6. Delivery Lifecycle & State Machine
7. API Routes & Controllers
8. Integration Tests

## Acceptance Criteria
### Security
* Unauthorized users rejected.
* Customer ownership enforced at the service layer.
* Role restrictions enforced.

### Pricing
* Exact assignment formula implemented (no invented divisors).
* Deterministic results.
* Snapshot frozen atomically.
* Breakdown matches authoritative values.

### Assignment
* Actual PostGIS distance utilized.
* Nearest eligible agent selected.
* Deterministic tie-breaking applied.
* Concurrent claim protection verified via automated tests.
* Explicit rollback test required: If any step after agent claiming fails, the agent must become available again and no partial DeliveryAttempt/Order/TrackingHistory state may remain.

### Lifecycle
* Invalid transitions rejected.
* Status + tracking update atomically.

### Rescheduling
* Previous attempt preserved.
* New attempt created transactionally.
* Failure reason preserved.

### Testing
* PostGIS tests execute against Docker.
* Concurrency test exists.
* Authorization tests exist.
* Pricing edge cases exist.
* Lifecycle tests exist.

## Definition of Done
Code is written, fully typed, integrated with Express, transactional boundaries respected, APIs documented, and test suite successfully runs against the API endpoints with clear PASS/FAIL/BLOCKED results.

## Risks & Mitigations
- **Incorrect interpretation of pricing formula**: Explicitly audit assignment rules; mark unknowns as `REQUIRES DECISION` to prevent silent inventions.
- **PostGIS runtime dependency**: Test suite will require the Docker environment. Tests must fail/block if run locally without PostGIS, protecting deployment integrity.
- **Concurrent agent assignment**: Enforce atomic `updateMany` conditional checks and require a simulated race-condition test.
- **Duplicate requests**: DB state machine transitions reject duplicate assignments/statuses inherently.
- **Authorization/ownership leakage**: Service layer must consistently apply `where: { customerId }` filters. Test suite must include explicit impersonation attempts.
- **Insufficient test environment**: Maintain Docker Compose as the definitive test environment.
