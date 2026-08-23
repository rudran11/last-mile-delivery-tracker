import { PricingService, PricingInput } from '../services/PricingService';
import { OrderType, PaymentType, ZoneRelationshipType } from '@prisma/client';

describe('Automated Regression Test - Pricing Calculation', () => {
  it('should deterministically calculate exact B2B INTRA_ZONE PREPAID pricing', () => {
    
    // 1. Setup deterministic rate configuration
    const mockRateConfig = {
      id: 'mock-rate-123',
      b2bIntraZoneRate: { toNumber: () => 50 } as any,
      b2bInterZoneRate: { toNumber: () => 80 } as any,
      b2cIntraZoneRate: { toNumber: () => 60 } as any,
      b2cInterZoneRate: { toNumber: () => 90 } as any,
      b2bCodSurcharge: { toNumber: () => 25 } as any,
      b2cCodSurcharge: { toNumber: () => 30 } as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 2. Setup deterministic input
    // Volumetric weight: (10 * 10 * 10) / 5000 = 1000 / 5000 = 0.2
    // Actual weight: 5
    // Billable weight: max(5, 0.2) = 5
    // Base Charge: 5 * 50 (B2B Intra-zone) = 250
    // Payment: PREPAID -> no surcharge -> Final Charge = 250
    const input: PricingInput = {
      length: 10,
      breadth: 10,
      height: 10,
      actualWeight: 5,
      orderType: OrderType.B2B,
      paymentType: PaymentType.PREPAID,
      zoneRelationship: ZoneRelationshipType.INTRA_ZONE,
    };

    // 3. Execute
    const result = PricingService.calculate(input, mockRateConfig);

    // 4. Assert correctness
    expect(result.billableWeight).toBe(5);
    expect(result.baseCharge).toBe(250);
    expect(result.appliedCodSurcharge).toBe(0);
    expect(result.finalCharge).toBe(250);
    expect(result.calculationBreakdown.formula).toBe('(L × B × H) / 5000');
  });

  it('should deterministically calculate exact B2C INTER_ZONE COD pricing', () => {
    const mockRateConfig = {
      id: 'mock-rate-123',
      b2bIntraZoneRate: { toNumber: () => 50 } as any,
      b2bInterZoneRate: { toNumber: () => 80 } as any,
      b2cIntraZoneRate: { toNumber: () => 60 } as any,
      b2cInterZoneRate: { toNumber: () => 90 } as any, // 90 used here
      b2bCodSurcharge: { toNumber: () => 25 } as any,
      b2cCodSurcharge: { toNumber: () => 30 } as any, // 30 used here
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Volumetric weight: (50 * 50 * 50) / 5000 = 125000 / 5000 = 25
    // Actual weight: 10
    // Billable weight = max(10, 25) = 25
    // Base Charge = 25 * 90 = 2250
    // COD Surcharge = 30
    // Final = 2280
    const input: PricingInput = {
      length: 50,
      breadth: 50,
      height: 50,
      actualWeight: 10,
      orderType: OrderType.B2C,
      paymentType: PaymentType.COD,
      zoneRelationship: ZoneRelationshipType.INTER_ZONE,
    };

    const result = PricingService.calculate(input, mockRateConfig);

    expect(result.billableWeight).toBe(25);
    expect(result.baseCharge).toBe(2250);
    expect(result.appliedCodSurcharge).toBe(30);
    expect(result.finalCharge).toBe(2280);
  });
});
