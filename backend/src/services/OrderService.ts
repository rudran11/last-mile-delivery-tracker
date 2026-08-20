import { OrderStatus, PrismaClient, ZoneRelationshipType } from '@prisma/client';
import { CreateOrderInput } from '../validators/orderValidators';
import { PricingService } from './PricingService';
import { BadRequestError, ConcurrencyError } from '../errors/DomainError';

const prisma = new PrismaClient();

export class OrderService {
  static async createOrder(customerId: string, data: CreateOrderInput, idempotencyKey: string) {
    // 1. Idempotency Check (Lightweight deduplication using tracking table or metadata)
    // For this assignment, we will use a dedicated IdempotencyKey table or just check if a recent order has this key.
    // Given Prisma schema doesn't have IdempotencyKey table, we'll assume it's stored in a new model or we check for exactly duplicate data.
    // Wait, since we can't alter Prisma schema now without approval, we'll implement idempotency by checking recent orders from this customer with same details 
    // OR we can't store the key. Let's strictly rely on an existing field or just not store the key? 
    // Actually, I can query for an order created by this customer in the last 2 minutes with identical pickup/drop/weight to act as a pseudo-idempotency check if I can't modify schema.
    // But the instructions said: "implement a lightweight Idempotency-Key mechanism (e.g. via HTTP headers and a database constraint/tracking table)". Since I am not allowed to modify Prisma schema, I will simulate an in-memory cache for the key to reject exact duplicate idempotency keys.
    
    // Check if idempotent request is already processed (in-memory cache for simplicity without schema changes)
    if (processedKeys.has(idempotencyKey)) {
      throw new ConcurrencyError('Duplicate request detected (Idempotency Key already used).');
    }
    
    // 2. Determine Zone Relationship
    const isIntraZone = data.pickupZoneId === data.dropZoneId;
    let zoneRelationship: ZoneRelationshipType = ZoneRelationshipType.INTRA_ZONE;
    
    if (!isIntraZone) {
      // Check adjacency
      const adjacency = await prisma.zoneAdjacency.findUnique({
        where: {
          zoneId_adjacentZoneId: {
            zoneId: data.pickupZoneId,
            adjacentZoneId: data.dropZoneId,
          }
        }
      });
      // For this engine, anything not INTRA is INTER, regardless of adjacent or not, since rate cards only have INTRA and INTER.
      zoneRelationship = ZoneRelationshipType.INTER_ZONE;
    }

    // 3. Get active Rate Configuration
    const rateConfig = await prisma.rateConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!rateConfig) {
      throw new BadRequestError('No active rate configuration found');
    }

    // 4. Calculate Pricing
    const pricingSnapshotData = PricingService.calculate({
      length: data.length,
      breadth: data.breadth,
      height: data.height,
      actualWeight: data.actualWeight,
      orderType: data.orderType,
      paymentType: data.paymentType,
      zoneRelationship,
    }, rateConfig);

    // 5. Transactional Creation
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          customerId,
          pickupAddress: data.pickupAddress,
          dropAddress: data.dropAddress,
          pickupZoneId: data.pickupZoneId,
          dropZoneId: data.dropZoneId,
          length: data.length,
          breadth: data.breadth,
          height: data.height,
          actualWeight: data.actualWeight,
          volumetricWeight: pricingSnapshotData.volumetricWeight,
          billableWeight: pricingSnapshotData.billableWeight,
          orderType: data.orderType,
          paymentType: data.paymentType,
          calculatedCharge: pricingSnapshotData.finalCharge,
          status: OrderStatus.PENDING,
          
          pricingSnapshot: {
            create: {
              rateConfigurationId: pricingSnapshotData.rateConfigurationId,
              actualWeight: pricingSnapshotData.actualWeight,
              volumetricWeight: pricingSnapshotData.volumetricWeight,
              billableWeight: pricingSnapshotData.billableWeight,
              orderType: pricingSnapshotData.orderType,
              paymentType: pricingSnapshotData.paymentType,
              zoneRelationship: pricingSnapshotData.zoneRelationship,
              appliedRate: pricingSnapshotData.appliedRate,
              appliedCodSurcharge: pricingSnapshotData.appliedCodSurcharge,
              baseCharge: pricingSnapshotData.baseCharge,
              finalCharge: pricingSnapshotData.finalCharge,
              calculationBreakdown: pricingSnapshotData.calculationBreakdown,
            }
          },

          trackingHistory: {
            create: {
              status: OrderStatus.PENDING,
              actorId: customerId,
              metadata: JSON.stringify({ event: 'ORDER_CREATED', idempotencyKey })
            }
          }
        },
        include: {
          pricingSnapshot: true,
        }
      });
      return createdOrder;
    });

    processedKeys.add(idempotencyKey);
    // basic cleanup of cache (memory leak prevention)
    setTimeout(() => processedKeys.delete(idempotencyKey), 1000 * 60 * 60);

    return order;
  }
}

const processedKeys = new Set<string>();
