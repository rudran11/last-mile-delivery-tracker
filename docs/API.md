# Backend API Documentation

This document outlines the major REST endpoints exposed by the Last Mile Delivery Tracker backend.

## Base URL
All API endpoints are prefixed with: `/api/v1`

---

## 1. Authentication
*Base Path: `/auth`*

| Method | Endpoint | Auth Required | Role | Purpose |
|---|---|:---:|---|---|
| `POST` | `/register` | No | - | Register a new Customer account (initiates OTP flow if active). |
| `POST` | `/login` | No | - | Authenticate user and receive JWT. |
| `POST` | `/verify-otp` | No | - | Verify email/phone OTP for account confirmation. |
| `GET` | `/me` | Yes | Any | Retrieve the current authenticated user's profile. |

---

## 2. Customer & Orders
*Base Path: `/orders` and `/customer`*

| Method | Endpoint | Auth Required | Role | Purpose |
|---|---|:---:|---|---|
| `POST` | `/orders/quote` | Yes | Customer/Admin | Generate a dynamic pricing quote based on coordinates and dimensions. |
| `POST` | `/orders` | Yes | Customer/Admin | Create a new delivery order. Records a `PricingSnapshot`. |
| `GET` | `/orders` | Yes | Any | Retrieve a paginated list of orders associated with the user. |
| `GET` | `/orders/:id` | Yes | Any | Retrieve full order details including TrackingHistory and PricingSnapshot. |
| `GET` | `/customer/orders/:id/track` | Yes | Customer | Retrieve real-time tracking history for a specific order. |

---

## 3. Agent Operations
*Base Path: `/agents`*

| Method | Endpoint | Auth Required | Role | Purpose |
|---|---|:---:|---|---|
| `GET` | `/agents/assignments` | Yes | Agent | Fetch the current queue of active/pending delivery attempts for the authenticated agent. |
| `PUT` | `/agents/availability` | Yes | Agent | Toggle the agent's `isAvailable` status (starts/stops dispatch eligibility). |
| `POST` | `/agents/location` | Yes | Agent | Push real-time GPS coordinates to update the agent's PostGIS location. |
| `PUT` | `/agents/attempts/:id/status` | Yes | Agent | Progress an order lifecycle (e.g. `ASSIGNED` → `PICKED_UP` → `DELIVERED`). |

---

## 4. Admin Fleet Management
*Base Path: `/admin`*

| Method | Endpoint | Auth Required | Role | Purpose |
|---|---|:---:|---|---|
| `GET` | `/admin/agents` | Yes | Admin | Retrieve a global list of all agents, their status, zones, and current locations. |
| `POST` | `/admin/agents` | Yes | Admin | Create a new Agent profile and User account. |
| `PATCH` | `/admin/agents/:id/zone` | Yes | Admin | Reassign an agent to a different geographic zone. |
| `GET` | `/admin/agents/:id/performance` | Yes | Admin | Fetch aggregated performance metrics (completed orders, feedback rating). |
| `GET` | `/admin/dispatch/explain/:orderId` | Yes | Admin | Retrieve the explainable AI/Geospatial breakdown of why an agent was chosen. |
| `POST` | `/admin/dispatch/force` | Yes | Admin | Override normal algorithms and forcefully assign an order to a specific agent. |

---

## 5. Admin System Configuration
*Base Path: `/admin/config`*

| Method | Endpoint | Auth Required | Role | Purpose |
|---|---|:---:|---|---|
| `POST` | `/admin/config/rates` | Yes | Admin | Create a new Rate Configuration (B2B/B2C, intra/inter zone rates, COD surcharge). |
| `GET` | `/admin/config/rates/active` | Yes | Admin | Retrieve the currently active rate configuration. |
| `POST` | `/admin/config/zones` | Yes | Admin | Create a new operational Zone. |
| `POST` | `/admin/config/areas` | Yes | Admin | Associate a specific Pincode area with a Zone. |

---

## 6. Feedback
*Base Path: `/orders/:id/feedback`*

| Method | Endpoint | Auth Required | Role | Purpose |
|---|---|:---:|---|---|
| `POST` | `/orders/:id/feedback` | Yes | Customer | Submit a 1-5 star rating and comment for a delivered order. |
| `GET` | `/orders/:id/feedback` | Yes | Admin/Customer | Retrieve the feedback associated with a specific order. |

---

## Security Notes
- All endpoints marked `Auth Required: Yes` demand a valid `Bearer <token>` JWT in the `Authorization` header.
- The `Role` column indicates the RBAC checks enforced by the `authorizeRole` middleware.
- Input payloads are strictly validated using `Zod` schemas prior to controller execution.
