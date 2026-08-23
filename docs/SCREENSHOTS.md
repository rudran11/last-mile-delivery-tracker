# Demonstration Workflow & Screenshots

This document outlines the recommended 5-10 minute end-to-end demonstration flow for evaluating the platform. It also serves as a placeholder for where UI screenshots should be injected before final submission.

## Demonstration Flow

To thoroughly evaluate the technical depth of the Last Mile Delivery Tracker, follow this exact sequence:

1. **Customer Order Creation**
   - **Action:** Login as a Customer. Navigate to "Create Order". 
   - **Details:** Enter a Pickup and Drop address. Observe how the system dynamically converts the addresses via Nominatim into coordinates, computes the Zone Relationship, and returns an instant B2C quote incorporating volumetric weight logic.
   - **Submit:** Finalize the order creation.

2. **Admin Control Tower**
   - **Action:** Login as Admin. Navigate to the "Control Tower".
   - **Details:** Locate the newly created order in the `PENDING` state. Observe the map interface or grid details.

3. **Intelligent Dispatch**
   - **Action:** Initiate the Dispatch sequence for the pending order.
   - **Details:** If "Explainable Dispatch" is triggered, observe the backend logic detailing how the nearest available Agent was queried via PostGIS `ST_Distance`. 
   - **Result:** The Order transitions to `ASSIGNED`.

4. **Agent Delivery Lifecycle**
   - **Action:** Login as the assigned Agent. Navigate to "Delivery Queue".
   - **Details:** Accept the order and click to update status to `PICKED_UP`, then `IN_TRANSIT`, then `DELIVERED`.
   - **Note:** Notice that invalid state jumps are prevented by the backend.

5. **Customer Tracking & Feedback**
   - **Action:** Login as the Customer again.
   - **Details:** View the Order Ledger and open the tracking timeline. Notice the immutable `TrackingHistory` timestamps. Submit a 5-star rating and comment for the delivery.

6. **Admin Performance Review**
   - **Action:** Login as Admin. Navigate to "Fleet & Agents".
   - **Details:** Open the specific Agent's profile and view their Performance metrics. Observe the aggregated successful deliveries and the newly submitted 5-star rating factoring into their KPI.

---

## Screenshot Repository

*(Note: Currently waiting on final UI confirmation. Replace the placeholders below with actual imagery before presentation).*

### 1. Landing Page
*Demonstrating unauthenticated marketing/informational portal.*
`[Placeholder: landing_page.png]`

### 2. Customer Dashboard & Order Creation
*Demonstrating dynamic quoting and volumetric input.*
`[Placeholder: customer_create_order.png]`

### 3. Order Tracking Ledger
*Demonstrating the immutable TrackingHistory timeline.*
`[Placeholder: customer_tracking.png]`

### 4. Admin Control Tower
*Demonstrating the high-density operational view of pending/active orders.*
`[Placeholder: admin_control_tower.png]`

### 5. Fleet Command (Agents)
*Demonstrating the KPI strip and agent list.*
`[Placeholder: admin_fleet.png]`

### 6. Explainable Dispatch Modal
*Demonstrating the PostGIS distance ranking output.*
`[Placeholder: admin_dispatch_explanation.png]`

### 7. Agent Delivery Queue
*Demonstrating the mobile-friendly Agent UI for lifecycle updates.*
`[Placeholder: agent_queue.png]`
