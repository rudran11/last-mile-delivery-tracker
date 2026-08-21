import { OrderStatus, PrismaClient, ZoneRelationshipType } from '@prisma/client';
import { CreateOrderInput } from '../validators/orderValidators';
import { PricingService } from './PricingService';
import { AssignmentService } from './AssignmentService';
import { BadRequestError, ConcurrencyError } from '../errors/DomainError';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

const STATE_TO_ZONE_MAP: Record<string, string> = {
  // NORTH
  'delhi': 'North Zone',
  'haryana': 'North Zone',
  'punjab': 'North Zone',
  'uttar pradesh': 'North Zone',
  'himachal pradesh': 'North Zone',
  'uttarakhand': 'North Zone',
  'chandigarh': 'North Zone',
  'jammu and kashmir': 'North Zone',
  'ladakh': 'North Zone',
  'rajasthan': 'North Zone',

  // WEST
  'maharashtra': 'West Zone',
  'gujarat': 'West Zone',
  'goa': 'West Zone',
  'dadra and nagar haveli and daman and diu': 'West Zone',
  'madhya pradesh': 'West Zone',
  'chhattisgarh': 'West Zone',

  // SOUTH
  'tamil nadu': 'South Zone',
  'karnataka': 'South Zone',
  'kerala': 'South Zone',
  'andhra pradesh': 'South Zone',
  'telangana': 'South Zone',
  'puducherry': 'South Zone',
  'andaman and nicobar islands': 'South Zone',
  'lakshadweep': 'South Zone',

  // EAST
  'west bengal': 'East Zone',
  'odisha': 'East Zone',
  'bihar': 'East Zone',
  'jharkhand': 'East Zone',
  'sikkim': 'East Zone',
  'assam': 'East Zone',
  'arunachal pradesh': 'East Zone',
  'meghalaya': 'East Zone',
  'manipur': 'East Zone',
  'mizoram': 'East Zone',
  'nagaland': 'East Zone',
  'tripura': 'East Zone'
};

export class OrderService {
  private static async resolveLocation(lat: number, lng: number, fallbackPincode?: string) {
    let resolvedState = '';
    let resolvedCountryCode = '';
    let resolvedPincode = fallbackPincode;
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`, {
        headers: {
          'User-Agent': 'LastMileDeliveryTracker/1.0',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        signal: AbortSignal.timeout(3000)
      });
      const data: any = await response.json();
      
      if (data && data.address) {
        resolvedCountryCode = data.address.country_code?.toLowerCase();
        resolvedState = data.address.state?.toLowerCase();
        if (data.address.postcode) {
          resolvedPincode = data.address.postcode;
        }
      }
    } catch (error: any) {
      logger.warn('Nominatim reverse geocode failed', { error: error.message });
      throw new BadRequestError('Could not verify location geography. Please try again.');
    }

    if (resolvedCountryCode !== 'in') {
      throw new BadRequestError('Location is outside the supported India service network.');
    }

    if (!resolvedState) {
      throw new BadRequestError('Could not determine the geographic state for this location within India.');
    }

    const zoneName = STATE_TO_ZONE_MAP[resolvedState];
    if (!zoneName) {
      throw new BadRequestError(`State '${resolvedState}' is not currently mapped to a service zone.`);
    }

    // Resolve the Zone from the DB
    const zone = await prisma.zone.findUnique({ where: { name: zoneName } });
    if (!zone || !zone.isActive) {
      throw new BadRequestError(`The resolved zone (${zoneName}) is currently inactive or not configured.`);
    }

    // Optional Area resolution
    let area = null;
    if (resolvedPincode) {
      area = await prisma.area.findFirst({
        where: { pincode: resolvedPincode, zoneId: zone.id, isActive: true }
      });
    }

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      areaId: area?.id,
      areaName: area?.name,
      pincode: resolvedPincode || 'Unknown'
    };
  }

  static async createOrder(customerId: string, data: CreateOrderInput, idempotencyKey: string) {
    if (processedKeys.has(idempotencyKey)) {
      throw new ConcurrencyError('Duplicate request detected (Idempotency Key already used).');
    }
    
    // Resolve Area and Zone for Pickup
    const pickupLocation = await this.resolveLocation(data.pickupLat, data.pickupLng, data.pickupPincode);
    // Resolve Area and Zone for Drop
    const dropLocation = await this.resolveLocation(data.dropLat, data.dropLng, data.dropPincode);

    const isIntraZone = pickupLocation.zoneId === dropLocation.zoneId;
    let zoneRelationship: ZoneRelationshipType = isIntraZone ? ZoneRelationshipType.INTRA_ZONE : ZoneRelationshipType.INTER_ZONE;

    const rateConfig = await prisma.rateConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!rateConfig) {
      throw new BadRequestError('No active rate configuration found');
    }

    const pricingSnapshotData = PricingService.calculate({
      length: data.length,
      breadth: data.breadth,
      height: data.height,
      actualWeight: data.actualWeight,
      orderType: data.orderType,
      paymentType: data.paymentType,
      zoneRelationship,
    }, rateConfig);

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          customerId,
          pickupAddress: data.pickupAddress,
          dropAddress: data.dropAddress,
          pickupZoneId: pickupLocation.zoneId,
          dropZoneId: dropLocation.zoneId,
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
      
      await tx.$executeRaw`
        UPDATE "Order" 
        SET "pickupLocation" = ST_SetSRID(ST_MakePoint(${data.pickupLng}, ${data.pickupLat}), 4326), 
            "dropLocation" = ST_SetSRID(ST_MakePoint(${data.dropLng}, ${data.dropLat}), 4326) 
        WHERE id = ${createdOrder.id}
      `;

      return createdOrder;
    });

    processedKeys.add(idempotencyKey);
    setTimeout(() => processedKeys.delete(idempotencyKey), 1000 * 60 * 60);

    let autoAssigned = false;
    let assignmentDetails = null;
    try {
      const assignmentResult = await AssignmentService.assignAgent(order.id, customerId);
      autoAssigned = true;
      assignmentDetails = assignmentResult.assignmentDetails;
      logger.info('Auto-assignment successful', { orderId: order.id, agentId: assignmentDetails.agentId });
    } catch (error: any) {
      if (error instanceof BadRequestError && error.message === 'No eligible available agent found') {
        logger.info('Auto-assignment pending: No eligible available agent found', { orderId: order.id });
      } else {
        logger.error('Unexpected error during auto-assignment', { error: error.message, stack: error.stack, orderId: order.id });
      }
    }

    return { ...order, autoAssigned, assignmentDetails };
  }

  static async getQuote(data: CreateOrderInput) {
    // Resolve Area and Zone for Pickup
    const pickupLocation = await this.resolveLocation(data.pickupLat, data.pickupLng, data.pickupPincode);
    // Resolve Area and Zone for Drop
    const dropLocation = await this.resolveLocation(data.dropLat, data.dropLng, data.dropPincode);

    const isIntraZone = pickupLocation.zoneId === dropLocation.zoneId;
    let zoneRelationship: ZoneRelationshipType = isIntraZone ? ZoneRelationshipType.INTRA_ZONE : ZoneRelationshipType.INTER_ZONE;
    
    const rateConfig = await prisma.rateConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!rateConfig) {
      throw new BadRequestError('No active rate configuration found');
    }

    const pricingSnapshotData = PricingService.calculate({
      length: data.length,
      breadth: data.breadth,
      height: data.height,
      actualWeight: data.actualWeight,
      orderType: data.orderType,
      paymentType: data.paymentType,
      zoneRelationship,
    }, rateConfig);

    return {
      ...pricingSnapshotData,
      pickupArea: { name: pickupLocation.areaName || data.pickupAddress.split(',')[0], pincode: pickupLocation.pincode },
      pickupZone: { name: pickupLocation.zoneName },
      dropArea: { name: dropLocation.areaName || data.dropAddress.split(',')[0], pincode: dropLocation.pincode },
      dropZone: { name: dropLocation.zoneName },
    };
  }
}

const processedKeys = new Set<string>();
