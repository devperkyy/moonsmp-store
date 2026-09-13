-- Orders created before this migration remain valid and use exact-name matching.
ALTER TABLE "Order" ADD COLUMN "playerUuid" TEXT;

ALTER TABLE "Delivery" ADD COLUMN "claimedBy" TEXT;
ALTER TABLE "Delivery" ADD COLUMN "claimToken" TEXT;

-- A claim from the old plugin cannot safely be replayed. Require an admin decision.
UPDATE "Delivery"
SET "status" = 'needs_review'
WHERE "status" = 'processing';

CREATE INDEX "Order_playerUuid_idx" ON "Order"("playerUuid");
CREATE INDEX "Delivery_claimToken_idx" ON "Delivery"("claimToken");
