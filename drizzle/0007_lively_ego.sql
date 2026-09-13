ALTER TABLE "drive_transfers" ADD COLUMN "request_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "drive_claim_request" ON "drive_transfers" USING btree ("organization_id","request_id");