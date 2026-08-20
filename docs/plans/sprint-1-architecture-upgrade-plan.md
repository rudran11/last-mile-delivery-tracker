# Sprint 1 Architecture Upgrade Plan

## Executive Summary
The Sprint 1 implementation has successfully laid the relational foundation, satisfying all core data modeling requirements for users, zones, order lifecycles, and pricing snapshots. However, to elevate this submission into the top tier (Top 1%), we must evolve from a "functional" architecture to a "production-grade, geospatial" architecture. The most significant opportunity is replacing the simplistic zone-based assignment with real-world geospatial ranking (PostGIS) and introducing database-engine-level enforcement for immutable financial and tracking history.

## Top-600 Quality Principle
> The project should not choose a technically weaker implementation merely because it is simpler. Complexity should only be rejected when it does not create meaningful product or engineering value.

The objective is to maximize engineering quality within the remaining execution window.

## Current Architecture Assessment
The current architecture is a solid relational mapping using Prisma and PostgreSQL. It successfully decouples dynamic pricing from historical orders via `PricingSnapshot`. Agent lifecycles are modeled correctly. However, it relies heavily on application-level logic for critical enterprise constraints (e.g., tracking immutability, numeric validity, concurrency), which is a common weakness in standard submissions.

## Assignment Compliance Audit
| Requirement | Current Implementation | Quality | Gap | Recommended Improvement |
|---|---|---|---|---|
| Role Management | `User` enum `Role` | COMPLETE | None | None |
| Pricing Configuration | `RateConfiguration` | COMPLETE | None | Ensure active constraint |
| Order Creation | `Order` table | PARTIAL | Lacks geospatial context | Add coordinates / PostGIS |
| Price Freezing | `PricingSnapshot` | COMPLETE | Relies on app logic | DB trigger for immutability |
| Agent Proximity | `ZoneAdjacency` | WEAK | Not real distance | Implement PostGIS |
| Tracking Timeline | `TrackingHistory` | PARTIAL | Can be modified | DB Trigger-backed append-only |

## Database Quality Audit
- **Normalization**: High. Relationships are strictly defined.
- **Constraints**: Missing database-level constraints for positive numeric values (lengths, weights, charges). Prisma doesn't map these natively; raw SQL migrations are required.
- **Historical Integrity**: `PricingSnapshot` and `TrackingHistory` trust the application layer to block `UPDATE`/`DELETE` queries. This is a vulnerability.

## Geospatial / PostGIS Analysis
### Option A: Zone-based ranking (Current)
- **Pros**: Simple, fast, easy to test.
- **Cons**: Unrealistic. A driver 100m away in an adjacent zone is objectively better than a driver 5km away in the same zone.
### Option B: PostGIS real distance
- **Pros**: Demonstrates deep technical competence; highly realistic; immediately differentiates the submission.
- **Cons**: Higher setup complexity (requires PostGIS extension).
### Option C: Hybrid Approach (Recommended)
Zones are NOT a hard geographic filter. The future assignment engine will conceptually work as:
1. Identify eligible available agents.
2. Use zone information as a candidate-ranking/sharding optimization where useful.
3. Calculate actual geospatial distance using PostGIS.
4. Rank candidates primarily by actual distance.
5. Apply deterministic tie-breakers.
6. Select the best eligible agent.

An agent in an adjacent zone must be allowed to win if it is geographically closer. The final decision must be based on actual distance, not simply zone membership.

**Data Type**: We will use `geography(Point, 4326)` for real-world location/distance calculations wherever appropriate, because distance calculations should naturally operate in meters over Earth's surface. Generic `geometry` will not be used unless there is a specific technical reason.

### Explicit Geospatial Fields
The explicit geospatial model must support:
- `AgentProfile`: `currentLocation geography(Point, 4326)` - Represents the agent's current position.
- `Order`: `pickupLocation geography(Point, 4326)` - Represents the origin of the delivery.
- `Order`: `dropLocation geography(Point, 4326)` - Represents the destination.

PostGIS distance calculations will be performed using these locations. No unnecessary geospatial fields will be added.

## PostGIS Query Verification
We will not claim that a GIST index automatically guarantees optimal nearest-neighbor performance. We must verify the actual nearest-agent query using PostgreSQL/PostGIS query analysis. The implementation should verify:
- correct distance calculation
- correct nearest-agent ordering
- appropriate spatial index usage where applicable
- actual query plan using EXPLAIN / EXPLAIN ANALYZE where practical

## Pricing Architecture Review
The `PricingSnapshot` is structurally sound, but lacks diagnostic transparency.
**Recommendation**: Keep `calculationBreakdown` JSONB as a HIGH-VALUE improvement, but do not implement it merely for complexity or appearance. The implementation phase must first confirm that it provides meaningful audit/explanation value beyond the typed PricingSnapshot fields. If implemented:
- typed `PricingSnapshot` fields remain authoritative
- JSONB is explanatory/audit metadata
- structure must be deterministic
- formula version must be recorded
- JSONB must never be the only source of financial truth

If it does not provide meaningful additional value, it may be deferred.
Example concept:
```json
{
  "formulaVersion": "v1",
  "weightBasis": "VOLUMETRIC",
  "zoneRelationship": "INTER_ZONE",
  "baseRate": 50,
  "billableWeight": 2.5,
  "baseCharge": 125,
  "codSurcharge": 25,
  "finalCharge": 150
}
```

## Delivery Lifecycle Review
The `OrderStatus` enum allows arbitrary jumps (`PENDING -> DELIVERED`).
**Recommendation**: Introduce a formal state machine. We will enforce valid transition paths at the Prisma extension/middleware level to prevent regressions. Full state-machine enforcement at the database trigger level is deferred to later.

## Tracking & Audit Review
Append-only application logic is insufficient for a financial/logistics audit trail.
**Recommendation**: Use a PostgreSQL `BEFORE UPDATE OR DELETE` trigger on `TrackingHistory` and `PricingSnapshot` that throws an exception, guaranteeing immutability at the database engine level regardless of application bugs.

## Delivery Attempt Review
Current model uses `attemptNumber` and unique constraints effectively. 
**Recommendation**: Maintain deterministic tie-breakers and current assignment state. `proofOfDeliveryUrl` and similar fields are categorized as LATER to avoid unnecessary schema complexity solely for appearance.

## Testing Gap Analysis
Current tests cover basic Prisma schema validation. Missing critical coverage for:
- PostGIS nearest-neighbor query correctness.
- Concurrency: Database schema must be concurrency-ready (even if locks aren't applied yet).
- State transitions (verifying invalid paths throw errors).
- Complex pricing calculation permutations.

## Security Review
- Passwords hashed correctly.
- **RLS**: We will NOT introduce PostgreSQL Row-Level Security (RLS) in this database upgrade. Authorization and isolation will be handled in the application/API layer during the authentication and authorization sprint.

## Performance Review
- `TrackingHistory` will grow linearly; needs indexing on `(orderId, timestamp)`.
- PostGIS requires a `GIST` index on geographic columns for performant nearest-neighbor queries.

## Clean-Machine Reproducibility — MUST HAVE
The evaluator must be able to reproduce the database environment from the GitHub repository without relying on undocumented local configuration. The implementation must support this conceptual flow:

```text
git clone
    ↓
docker compose up
    ↓
install dependencies
    ↓
run migration
    ↓
run seed
    ↓
run automated tests
```

Document the exact commands. No local-only assumptions should be required.
The README must clearly explain:
- prerequisites
- Docker startup
- environment configuration
- migration
- seed
- tests
- shutdown/reset

## Recommended Improvements

### MUST UPGRADE
1. PostGIS geographic locations
2. GIST spatial indexing
3. Verified nearest-agent query
4. Database CHECK constraints
5. Database-level immutable history protection
6. Dockerized PostGIS environment
7. Clean-machine reproducibility

### HIGH-VALUE
8. Pricing calculationBreakdown JSONB
9. Expanded automated tests
10. Concurrency-ready schema/transaction design
11. EXPLAIN/EXPLAIN ANALYZE verification

### LATER
12. Actual assignment locking
13. API authorization
14. Proof of delivery
15. Database-trigger state-machine enforcement

### DO NOT DO
* CQRS
* Event sourcing
* microservices
* unnecessary infrastructure

## Implementation Sequence
1. Create `docker-compose.yml` for PostgreSQL + PostGIS.
2. Modify `schema.prisma` to include PostGIS extension and geography types.
3. Generate raw SQL migration to apply PostGIS, GIST indexes, check constraints, and immutability triggers.
4. Update `seed.ts` with realistic geographic coordinates.
5. Expand test suite to verify PostGIS queries and constraints.
6. Update README for clean-machine evaluator setup.

## Risk Analysis
- **PostGIS Setup Friction**: Evaluators might try to run it on a local Postgres lacking PostGIS. 
- **Mitigation**: The `docker-compose.yml` is mandatory. The README must prominently prioritize the clean-machine execution instructions.

## Expected Benefit
Transforms the project from a standard, easily-replicated CRUD app to a realistic, production-grade logistics engine capable of standing out in a pool of 600 candidates.

## Definition of Done
When this plan is approved: `docker-compose.yml` is created, Prisma schema is upgraded with PostGIS/JSONB, raw SQL migrations enforce engine-level constraints, automated tests validate the new architecture, and documentation ensures seamless clean-machine evaluator setup.
