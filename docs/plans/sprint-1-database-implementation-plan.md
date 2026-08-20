# Sprint 1 — Database Schema & Data Modelling (Final Correction)

## Objective
Design a robust, production-oriented database schema that completely satisfies the Unthinkable Last-Mile Delivery Tracker requirements. The schema must enforce strict data integrity, maintain immutable tracking logs, preserve exactly explainable historical pricing, and support pragmatic zone-based assignment logic within the 3-day deadline.

## Current Repository State
- Phase 0 initialization complete. Basic monorepo structure exists. No database or ORM logic has been implemented.

## Proposed Database Architecture
We will use **PostgreSQL** via **Prisma ORM**. PostgreSQL guarantees ACID compliance and strict foreign key relations. Prisma provides rapid, type-safe schema modeling.

## Entity-by-Entity Design

| Entity | Purpose | Key Fields | Relationships | Important Constraints |
| ------ | ------- | ---------- | ------------- | --------------------- |
| **User** | Identity & Auth | `id`, `email`, `passwordHash`, `role` (ADMIN, AGENT, CUSTOMER), `isActive` | 1:N Orders | `email` UNIQUE. |
| **AgentProfile** | Agent state | `id`, `userId`, `isAvailable`, `currentZoneId`, `isActive` | 1:1 User, N:1 Zone, 1:N Attempts | `userId` UNIQUE. |
| **Zone** | Delivery Regions | `id`, `name`, `isActive` | 1:N Areas, 1:N Orders, 1:N AgentProfiles | `name` UNIQUE. |
| **ZoneAdjacency** | Proximity rank | `zoneId`, `adjacentZoneId`, `priority` | M:N Zones | Composite PK `(zoneId, adjacentZoneId)`. |
| **Area** | Specific locations | `id`, `name`, `pincode`, `zoneId`, `isActive` | N:1 Zone | Pincodes can span zones/areas; no global uniqueness. |
| **RateConfiguration** | Explicit Pricing | `id`, `b2bIntraZoneRate`, `b2bInterZoneRate`, `b2cIntraZoneRate`, `b2cInterZoneRate`, `codSurcharge`, `isActive` | None | One active configuration is used for new orders at a time (application rule). Historical configurations remain preserved for existing PricingSnapshots. |
| **Order** | Core transaction | `id`, `customerId`, `pickupAddress`, `dropAddress`, `pickupZoneId`, `dropZoneId`, `length`, `breadth`, `height`, `actualWeight`, `volumetricWeight`, `billableWeight`, `orderType` (B2B/B2C), `paymentType` (PREPAID/COD), `calculatedCharge`, `status`, `createdAt`, `updatedAt` | N:1 User, N:1 Zones, 1:N Attempts, 1:N History, 1:1 PricingSnapshot | Dimensions/Weights > 0. Valid FKs. |
| **PricingSnapshot** | Audit log | `id`, `orderId`, `rateConfigurationId`, `actualWeight`, `volumetricWeight`, `billableWeight`, `orderType`, `paymentType`, `zoneRelationship` (INTRA/INTER), `appliedRate`, `appliedCodSurcharge`, `baseCharge`, `finalCharge` | 1:1 Order | Cannot be mutated once created. |
| **DeliveryAttempt** | Assignment/Run | `id`, `orderId`, `agentId`, `attemptNumber`, `status` (ASSIGNED, IN_PROGRESS, SUCCESS, FAILED), `failureReason`, `scheduledDate`, `createdAt`, `resolvedAt` | N:1 Order, N:1 AgentProfile | Must reference valid agent/order. |
| **TrackingHistory** | Immutable Log | `id`, `orderId`, `status`, `actorId`, `timestamp`, `metadata` | N:1 Order, N:1 User | Append-only; enforced at the application level, with an optional PostgreSQL trigger if time permits. |
| **Notification** | Comms Log | `id`, `orderId`, `channel` (EMAIL/SMS), `event`, `status`, `failureReason`, `createdAt`, `sentAt` | N:1 Order | Lightweight tracking structure. |

## Relationship Map
```text
User (Customer) ── Orders (1:N)
User (Agent) ───── AgentProfile (1:1)

AgentProfile
 ├── Belongs to Zone (N:1)
 └── DeliveryAttempts (1:N)

Zone
 ├── Areas (1:N)
 ├── ZoneAdjacency (M:N)
 ├── Pickup Orders (1:N)
 └── Drop Orders (1:N)

Order
 ├── Pickup/Drop Zone (N:1)
 ├── PricingSnapshot (1:1)
 ├── DeliveryAttempts (1:N)
 ├── TrackingHistory (1:N)
 └── Notifications (1:N)
```

## Field-Level Schema Proposal & Major Decisions

### 1. Rate Card Modelling
**Explicit Config Structure:** The assignment explicitly requires differentiation. We reject the multiplier concept and model it exactly: `b2bIntraZoneRate`, `b2bInterZoneRate`, `b2cIntraZoneRate`, `b2cInterZoneRate`, and `codSurcharge`. This prevents calculation ambiguity and directly maps to the Admin UI constraints.

### 2. Pricing Snapshot Strategy & Historical Integrity
**Decision:** We will create a dedicated `PricingSnapshot` table (1:1 with `Order`).
To answer *"Why was this order charged this amount?"*, this snapshot captures the exact state at the moment of calculation:
- `billableWeight`, `orderType`, `paymentType`, `zoneRelationship` (Intra vs Inter)
- The exact `appliedRate` and `appliedCodSurcharge` pulled from the active RateConfiguration.
- The resulting `baseCharge` and `finalCharge`.
**Historical Integrity:** The `rateConfigurationId` is an audit/reference relationship only. The historical price MUST remain reproducible entirely from the frozen PricingSnapshot fields and must never depend on the current RateConfiguration values.

### 3. Delivery Agent Modelling
**Decision:** Dedicated `AgentProfile` (1:1 with `User`).
We considered adding agent fields directly to `User`, but rejected it to keep the core `User` auth table clean. `isAvailable` and `currentZoneId` strictly belong to an `AgentProfile`. Non-agent users simply will not have an associated profile record.

### 4. Nearest-Agent Logic & Zone Adjacency
**Decision:** Deterministic Zone Ranking (No PostGIS).
The Database provides a `ZoneAdjacency` mapping (`zoneId`, `adjacentZoneId`, `priority`).
The Assignment Engine will query available agents based on:
1. `currentZoneId == Order.pickupZoneId`
2. `currentZoneId` in `ZoneAdjacency` (ordered by `priority`)
3. Tie-breaker: Agent with least recent `DeliveryAttempt`.
This perfectly supports the assignment requirement deterministically.

### 5. Current Agent Assignment
**Decision:** `Order → active/current DeliveryAttempt → Agent`
We will **not** put an `assignedAgentId` on the `Order` table. Redundant fields risk consistency mismatch. To efficiently fetch the current agent, the API will use Prisma's nested relational querying targeting active statuses (`include: { deliveryAttempts: { where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } } } }`). The DeliveryAttempt follows the lifecycle: ASSIGNED → IN_PROGRESS → SUCCESS/FAILED. The active attempt is identified by this ASSIGNED or IN_PROGRESS state. An index on `DeliveryAttempt(orderId, status)` ensures blazing-fast retrieval.

### 6. Tracking History Immutability
**Decision:** Application-level protection (Prisma Middleware/Extensions) is our official recommendation for the 3-day constraint.
*Distinction:* The database guarantees foreign-key correctness and timestamping. The application guarantees that endpoints and Prisma queries physically block `UPDATE` and `DELETE` commands targeting `TrackingHistory`. (A lightweight Postgres trigger could optionally be added via a raw migration script if time permits, but application-level is the strict baseline).

### 7. Area / Pincode Constraint
**Decision:** Removed global `UNIQUE` constraint on Pincode. Pincodes frequently overlap multiple areas in real-world logistics. We will simply use `pincode` as a searchable attribute without strict database uniqueness, falling back to ID-based relations.

### 8. Soft Deactivation
**Decision:** `isActive` boolean flags on `Zone`, `Area`, `User`, `AgentProfile`, and `RateConfiguration`.
We will never physically `DELETE` these records, guaranteeing that historical orders and delivery attempts retain perfectly intact relational data.

## Indexes Strategy
Indexes are chosen specifically to support required queries without bloating write-times:
- **Orders:** `(customerId)` (Customer Dashboard), `(status)` (Admin filter), `(pickupZoneId)` (Assignment routing), `(createdAt)` (Sorting).
- **Delivery Attempts:** `(agentId)` (Agent Dashboard), `(orderId, status)` (Rapid active-agent lookup), `(scheduledDate)` (Filtering).
- **Tracking History:** `(orderId, timestamp)` (Sequential chronological timeline rendering).
- **Agents:** `(isAvailable, currentZoneId)` (Instant nearest-agent assignment lookup).

## Constraints Separation
**Database Guarantees:**
- PK/FK integrity (Orders cannot exist without Customers).
- Unique `User.email` and `Zone.name`.
- Check constraints: Length, breadth, height, weights, and charges > 0.
**Application Guarantees:**
- Only users with `role=AGENT` get an `AgentProfile`.
- Assigning an available agent makes them unavailable. While actively delivering, they remain unavailable. After SUCCESS or FAILED completion, they become available again. These state changes must be handled transactionally.
- Status transitions follow a strict state machine.
- `TrackingHistory` is strictly append-only.

## Transaction Design
The Application Layer will utilize Prisma `$transaction` for the following workflows:
1. **Status Transition:** `UPDATE Order.status` + `INSERT TrackingHistory`.
2. **Assignment:** `UPDATE AgentProfile.isAvailable` + `INSERT DeliveryAttempt` + `INSERT TrackingHistory (ASSIGNED)`.
3. **Failed Delivery:** `UPDATE DeliveryAttempt.status = FAILED` + `UPDATE Order.status = FAILED` + `INSERT TrackingHistory (FAILED)`. (Notification workflow triggered asynchronously outside the DB transaction).

## Seed Data Strategy (Planned, not executed)
- Users: 1 Admin, 2 Customers, 3 Agents (2 active, 1 inactive).
- Regions: 2 Zones (North, South) with `ZoneAdjacency` priorities, 4 Areas.
- Configs: 1 RateConfiguration with fully mapped B2B/B2C/COD rates.
- Orders: 1 Successful (PREPAID B2B), 1 Failed (COD B2C), 1 Rescheduled.

## Acceptance Criteria (Implementation-Ready)
- [ ] PostgreSQL connection works.
- [ ] Prisma schema successfully validates and migration succeeds.
- [ ] Explicit explicit pricing variables (B2B/B2C/COD) are verified in schema.
- [ ] `PricingSnapshot` exists and accurately maps calculation rationale.
- [ ] Active agent is deterministically linked via `DeliveryAttempt` with zero redundancy.
- [ ] Required indexes (`orderId+status`, `isAvailable+zoneId`) are applied.
- [ ] Database tests pass enforcing dimension/weight > 0 constraints.
- [ ] Seed data populates the structure without foreign key violations.

## Files Expected to Change
- `backend/package.json`
- `backend/prisma/schema.prisma` [NEW]
- `backend/prisma/seed.ts` [NEW]
- `backend/.env.example` (Database URL Placeholder)

## 3-Day Scope Check

| Feature | Scope Decision | Justification |
|---------|----------------|---------------|
| `Order`, `TrackingHistory`, `DeliveryAttempt`, `Zone` | **MUST HAVE** | Core assignment requirements. |
| `PricingSnapshot`, `RateConfiguration` | **MUST HAVE** | Essential for reliable billing and historical auditing. |
| `ZoneAdjacency` | **MUST HAVE** | Required for deterministic nearest-agent logic without GPS. |
| `Notification` Log | **SHOULD HAVE** | Good for tracing, but actual email delivery logic matters more. |
| Postgres Triggers for Immutability | **OPTIONAL** | App-level is sufficient for 3 days; triggers are bonus. |
| PostGIS / True Geospatial Distance | **EXCLUDED** | Too complex for 3-day deadline. |
| Event Sourcing architecture | **EXCLUDED** | Unnecessary over-engineering. |

## Final Plan Quality Check

| Assignment Requirement | Database Support | Where Represented |
|------------------------|------------------|-------------------|
| Roles (Admin/Agent/Cust) | Yes | `User.role` enum |
| Zone Management | Yes | `Zone`, `Area`, `ZoneAdjacency` |
| B2B/B2C & Intra/Inter | Yes | `RateConfiguration` explicit fields |
| COD Surcharge | Yes | `RateConfiguration.codSurcharge` |
| Order dims & weights | Yes | `Order` specific dimension/weight fields |
| Auto-calculated charge | Yes | `PricingSnapshot` explicitly tracking calculation |
| Nearest Agent Logic | Yes | `ZoneAdjacency` ranking + `AgentProfile.currentZoneId` |
| Order Status Lifecycle | Yes | `Order.status` + `TrackingHistory` |
| Immutable Tracking History | Yes | `TrackingHistory` + App/DB protections |
| Failed/Reschedule handling | Yes | `DeliveryAttempt` tracking discrete runs |
| Notifications | Yes | `Notification` log table |
