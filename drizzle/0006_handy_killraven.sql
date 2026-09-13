CREATE TABLE "drive_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"created_by" text NOT NULL,
	"folder_id" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lease_id" uuid,
	"lease_until" timestamp with time zone,
	"drive_file_id" text,
	"error_code" text,
	"receipt" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "drive_transfer_status" CHECK ("drive_transfers"."status" in ('queued','running','succeeded','failed','suspended')),
	CONSTRAINT "drive_transfer_attempts" CHECK ("drive_transfers"."attempts" >= 0)
);
--> statement-breakpoint
ALTER TABLE "drive_transfers" ADD CONSTRAINT "drive_transfers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_transfers" ADD CONSTRAINT "drive_transfers_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_transfers" ADD CONSTRAINT "drive_transfers_created_by_auth_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "drive_transfer_destination" ON "drive_transfers" USING btree ("organization_id","media_id","folder_id");