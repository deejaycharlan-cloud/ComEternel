CREATE TABLE "direct_drive_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"drive_file_id" text NOT NULL,
	"session_uri" text,
	"session_expires_at" timestamp with time zone,
	"status" text DEFAULT 'uploading' NOT NULL,
	"lease_id" uuid,
	"lease_until" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error_code" text,
	"folder_id" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drive_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"connected_by" text NOT NULL,
	"google_subject" text NOT NULL,
	"google_email" text NOT NULL,
	"refresh_token" text NOT NULL,
	"root_id" text NOT NULL,
	"inbox_id" text NOT NULL,
	"status" text DEFAULT 'connected' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "direct_drive_uploads" ADD CONSTRAINT "direct_drive_uploads_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_drive_uploads" ADD CONSTRAINT "direct_drive_uploads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_drive_uploads" ADD CONSTRAINT "direct_drive_uploads_connection_id_drive_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."drive_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_connections" ADD CONSTRAINT "drive_connections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_connections" ADD CONSTRAINT "drive_connections_connected_by_auth_user_id_fk" FOREIGN KEY ("connected_by") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "direct_upload_media" ON "direct_drive_uploads" USING btree ("media_id");--> statement-breakpoint
CREATE UNIQUE INDEX "direct_upload_file" ON "direct_drive_uploads" USING btree ("drive_file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "drive_connection_org" ON "drive_connections" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "direct_drive_uploads" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "drive_connections" ENABLE ROW LEVEL SECURITY;
