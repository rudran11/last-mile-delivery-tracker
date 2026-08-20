-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geographic columns
ALTER TABLE "AgentProfile" ADD COLUMN "currentLocation" geography(Point, 4326);
ALTER TABLE "Order" ADD COLUMN "pickupLocation" geography(Point, 4326);
ALTER TABLE "Order" ADD COLUMN "dropLocation" geography(Point, 4326);

-- Add JSONB column
ALTER TABLE "PricingSnapshot" ADD COLUMN "calculationBreakdown" JSONB;

-- Add GIST indexes
CREATE INDEX "AgentProfile_currentLocation_idx" ON "AgentProfile" USING GIST ("currentLocation");
CREATE INDEX "Order_pickupLocation_idx" ON "Order" USING GIST ("pickupLocation");
CREATE INDEX "Order_dropLocation_idx" ON "Order" USING GIST ("dropLocation");

-- Add CHECK constraints
ALTER TABLE "Order" ADD CONSTRAINT "Order_length_check" CHECK ("length" > 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_breadth_check" CHECK ("breadth" > 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_height_check" CHECK ("height" > 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_actualWeight_check" CHECK ("actualWeight" > 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_volumetricWeight_check" CHECK ("volumetricWeight" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_billableWeight_check" CHECK ("billableWeight" > 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_calculatedCharge_check" CHECK ("calculatedCharge" >= 0);

ALTER TABLE "PricingSnapshot" ADD CONSTRAINT "PricingSnapshot_actualWeight_check" CHECK ("actualWeight" > 0);
ALTER TABLE "PricingSnapshot" ADD CONSTRAINT "PricingSnapshot_volumetricWeight_check" CHECK ("volumetricWeight" >= 0);
ALTER TABLE "PricingSnapshot" ADD CONSTRAINT "PricingSnapshot_billableWeight_check" CHECK ("billableWeight" > 0);
ALTER TABLE "PricingSnapshot" ADD CONSTRAINT "PricingSnapshot_baseCharge_check" CHECK ("baseCharge" >= 0);
ALTER TABLE "PricingSnapshot" ADD CONSTRAINT "PricingSnapshot_finalCharge_check" CHECK ("finalCharge" >= 0);
ALTER TABLE "PricingSnapshot" ADD CONSTRAINT "PricingSnapshot_appliedCodSurcharge_check" CHECK ("appliedCodSurcharge" >= 0);
ALTER TABLE "PricingSnapshot" ADD CONSTRAINT "PricingSnapshot_appliedRate_check" CHECK ("appliedRate" >= 0);

ALTER TABLE "RateConfiguration" ADD CONSTRAINT "RateConfiguration_b2bIntraZoneRate_check" CHECK ("b2bIntraZoneRate" >= 0);
ALTER TABLE "RateConfiguration" ADD CONSTRAINT "RateConfiguration_b2bInterZoneRate_check" CHECK ("b2bInterZoneRate" >= 0);
ALTER TABLE "RateConfiguration" ADD CONSTRAINT "RateConfiguration_b2cIntraZoneRate_check" CHECK ("b2cIntraZoneRate" >= 0);
ALTER TABLE "RateConfiguration" ADD CONSTRAINT "RateConfiguration_b2cInterZoneRate_check" CHECK ("b2cInterZoneRate" >= 0);
ALTER TABLE "RateConfiguration" ADD CONSTRAINT "RateConfiguration_codSurcharge_check" CHECK ("codSurcharge" >= 0);

-- Create triggers for immutable tables
CREATE OR REPLACE FUNCTION prevent_update_or_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Updates and deletions are not allowed on this table.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER make_TrackingHistory_immutable
BEFORE UPDATE OR DELETE ON "TrackingHistory"
FOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();

CREATE TRIGGER make_PricingSnapshot_immutable
BEFORE UPDATE OR DELETE ON "PricingSnapshot"
FOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();
