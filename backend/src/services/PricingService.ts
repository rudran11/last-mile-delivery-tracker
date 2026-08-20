import { OrderType, PaymentType, RateConfiguration, ZoneRelationshipType } from '@prisma/client';
import { BadRequestError } from '../errors/DomainError';

export interface PricingInput {
  length: number;
  breadth: number;
  height: number;
  actualWeight: number;
  orderType: OrderType;
  paymentType: PaymentType;
  zoneRelationship: ZoneRelationshipType;
}

export class PricingService {
  static calculate(input: PricingInput, rateConfig: RateConfiguration) {
    if (input.length <= 0 || input.breadth <= 0 || input.height <= 0 || input.actualWeight <= 0) {
      throw new BadRequestError('Dimensions and weight must be strictly positive');
    }

    // Exact formula from assignment: (L * B * H) / 5000
    const volumetricWeight = (input.length * input.breadth * input.height) / 5000;
    
    // Exact rule: Max of actual vs volumetric
    const billableWeight = Math.max(input.actualWeight, volumetricWeight);

    let appliedRate: number;

    if (input.orderType === OrderType.B2B) {
      appliedRate = input.zoneRelationship === ZoneRelationshipType.INTRA_ZONE 
        ? rateConfig.b2bIntraZoneRate.toNumber() 
        : rateConfig.b2bInterZoneRate.toNumber();
    } else {
      appliedRate = input.zoneRelationship === ZoneRelationshipType.INTRA_ZONE 
        ? rateConfig.b2cIntraZoneRate.toNumber() 
        : rateConfig.b2cInterZoneRate.toNumber();
    }

    // Exact decimal values multiplied without arbitrary rounding blocks
    const baseCharge = billableWeight * appliedRate;
    const appliedCodSurcharge = input.paymentType === PaymentType.COD ? rateConfig.codSurcharge.toNumber() : 0;
    const finalCharge = baseCharge + appliedCodSurcharge;

    const calculationBreakdown = {
      formula: '(L × B × H) / 5000',
      length: input.length,
      breadth: input.breadth,
      height: input.height,
      actualWeight: input.actualWeight,
      volumetricWeight,
      billableWeight,
      orderType: input.orderType,
      paymentType: input.paymentType,
      zoneRelationship: input.zoneRelationship,
      appliedRate,
      appliedCodSurcharge,
      baseCharge,
      finalCharge
    };

    return {
      rateConfigurationId: rateConfig.id,
      actualWeight: input.actualWeight,
      volumetricWeight,
      billableWeight,
      orderType: input.orderType,
      paymentType: input.paymentType,
      zoneRelationship: input.zoneRelationship,
      appliedRate,
      appliedCodSurcharge,
      baseCharge,
      finalCharge,
      calculationBreakdown,
    };
  }
}
