import { PrismaClient, OrderStatus } from '@prisma/client';
import { NotFoundError } from '../errors/DomainError';

const prisma = new PrismaClient();

export class AdminDispatchService {
  static async getDispatchExplanation(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        deliveryAttempts: {
          include: {
            agent: {
              include: { user: true, currentZone: true }
            }
          },
          orderBy: { attemptNumber: 'desc' }
        },
        trackingHistory: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Historical Assignment Record (if already assigned/delivered)
    const currentAttempt = order.deliveryAttempts.length > 0 ? order.deliveryAttempts[0] : null;

    // Timeline Construction
    const timeline = order.trackingHistory.map(th => {
      let parsedMetadata: any = {};
      try {
        parsedMetadata = th.metadata ? JSON.parse(th.metadata as string) : {};
      } catch (e) {
        // ignore JSON parse error
      }
      return {
        id: th.id,
        timestamp: th.timestamp,
        status: th.status,
        event: parsedMetadata.event || th.status,
        agentId: parsedMetadata.agentId,
        metadata: parsedMetadata
      };
    });

    // Extract Pickup Coordinates
    // Since prisma does not return PostGIS geometry fields as JSON natively using standard findUnique,
    // we fetch it via raw query
    const orderGeo = await prisma.$queryRaw<
      Array<{ pickupLng: number | null; pickupLat: number | null; dropLng: number | null; dropLat: number | null }>
    >`
      SELECT 
        ST_X("pickupLocation"::geometry) as "pickupLng",
        ST_Y("pickupLocation"::geometry) as "pickupLat",
        ST_X("dropLocation"::geometry) as "dropLng",
        ST_Y("dropLocation"::geometry) as "dropLat"
      FROM "Order"
      WHERE id = ${orderId}
    `;

    const geoData = orderGeo[0] || { pickupLng: null, pickupLat: null, dropLng: null, dropLat: null };

    // Live Fleet Analysis
    // We only compute distances if pickupLocation exists
    let liveCandidates: any[] = [];
    if (geoData.pickupLng && geoData.pickupLat) {
      liveCandidates = await prisma.$queryRaw<any[]>`
        SELECT 
          a.id, 
          u.name, 
          a."isAvailable", 
          a."isActive", 
          ST_Distance(a."currentLocation", o."pickupLocation") as distance,
          ST_X(a."currentLocation"::geometry) as lng, 
          ST_Y(a."currentLocation"::geometry) as lat,
          z.name as "zoneName"
        FROM "AgentProfile" a
        JOIN "User" u ON a."userId" = u.id
        LEFT JOIN "Zone" z ON a."currentZoneId" = z.id
        CROSS JOIN "Order" o
        WHERE o.id = ${orderId} 
          AND a."currentLocation" IS NOT NULL
        ORDER BY distance ASC
      `;
    }

    // Process Live Candidates
    const candidates = liveCandidates.map(c => {
      let eligibilityStatus = 'EXCLUDED';
      let reason = '';

      if (!c.isActive) {
        eligibilityStatus = 'EXCLUDED';
        reason = 'Inactive';
      } else if (!c.isAvailable) {
        eligibilityStatus = 'EXCLUDED';
        reason = 'Busy / Offline';
      } else {
        eligibilityStatus = 'ELIGIBLE';
      }

      return {
        id: c.id,
        name: c.name,
        zone: c.zoneName,
        isAvailable: c.isAvailable,
        isActive: c.isActive,
        distance: c.distance,
        lat: c.lat,
        lng: c.lng,
        status: eligibilityStatus,
        reason: reason,
        isNearest: false
      };
    });

    // Mark the nearest eligible in Live Analysis
    const nearestEligible = candidates.find(c => c.status === 'ELIGIBLE');
    if (nearestEligible) {
      nearestEligible.isNearest = true;
    }

    // Reconstruct Historical Assignment data
    let historicalAssignment = null;
    if (currentAttempt) {
      // Find the assignment tracking event for this attempt
      const assignmentEvent = timeline.find(
        t => (t.event === 'AGENT_ASSIGNED' || t.event === 'MANUAL_REASSIGNMENT') && t.agentId === currentAttempt.agentId
      );
      
      historicalAssignment = {
        agentId: currentAttempt.agentId,
        agentName: currentAttempt.agent.user.name,
        agentZone: currentAttempt.agent.currentZone?.name || null,
        status: currentAttempt.status,
        timestamp: currentAttempt.createdAt,
        method: assignmentEvent?.event || 'UNKNOWN',
        distanceAtTime: assignmentEvent?.metadata?.distance || null
      };
    }

    return {
      order: {
        id: order.id,
        status: order.status,
        pickupAddress: order.pickupAddress,
        dropAddress: order.dropAddress,
        pickupLat: geoData.pickupLat,
        pickupLng: geoData.pickupLng,
        dropLat: geoData.dropLat,
        dropLng: geoData.dropLng
      },
      historicalAssignment,
      liveAnalysis: {
        candidates,
        explanation: order.status === 'PENDING' 
          ? "This order is pending. The live analysis shows how the PostGIS engine evaluates current agents." 
          : "These distances reflect the CURRENT locations of agents, NOT their locations at the time of historical assignment."
      },
      timeline
    };
  }
}
