# Last-Mile Delivery Tracker

A comprehensive delivery management platform focusing on top-tier engineering principles. Includes dynamic pricing, PostGIS geospatial assignment, database-level immutability, and deterministic routing.

## Features
- **Role-based Access:** Customer, Delivery Agent, Admin
- **Dynamic Pricing Engine:** Volumetric calculation, Zone pricing, COD surcharge.
- **Geospatial Assignment:** Hybrid zone-sharded, PostGIS nearest-neighbor agent ranking.
- **Order Lifecycle:** Status tracking with database-engine protected immutable history.
- **Clean Architecture:** Production-grade PostgreSQL schema with check constraints and triggers.

## Tech Stack
- **Database:** PostgreSQL + PostGIS, Prisma ORM
- **Backend:** Node.js, TypeScript
- **Frontend:** React, Vite (Upcoming)

---

# Running the Project From a Clean Machine

This project relies on **PostgreSQL with the PostGIS extension** to perform real-world distance calculations. We use Docker to guarantee a reproducible environment.

### Prerequisites
- [Docker & Docker Compose](https://docs.docker.com/get-docker/) installed and running.
- [Node.js](https://nodejs.org/) (v18+)

### Setup Instructions

Open your terminal and run the following exact commands in sequence:

**1. Clone the repository**
```bash
git clone https://github.com/rudran11/last-mile-delivery-tracker.git
cd "last-mile-delivery-tracker"
```

**2. Start the PostGIS Database**
```bash
docker compose up -d
```
*(Wait 5-10 seconds for the database to fully initialize).*

**3. Configure Environment**
Copy the example environment file:
```bash
cd backend
cp .env.example .env
```
*(Note: `.env.example` is preconfigured to match the Docker setup).*

**4. Install Dependencies**
```bash
npm install
```

**5. Apply Database Migrations**
This will push the schema, apply PostGIS extensions, and create constraints:
```bash
npx prisma migrate dev
```

**6. Seed the Database**
Populates the database with realistic agents, zones, and geographic locations:
```bash
npx prisma db seed
```

**7. Run Automated Tests**
Verifies constraint enforcement, PostGIS query plans, and triggers:
```bash
npm run test
```

### Shutdown/Reset

To stop the database and erase all volumes (clean slate):
```bash
docker compose down -v
```

### Troubleshooting
- **Migration fails with "extension postgis is not available"**: Ensure you started the database using `docker compose up -d` from step 2, rather than using a local Postgres installation. The project strictly requires the PostGIS image provided in the compose file.
