CREATE TABLE "google_calendars" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"connected_by" text NOT NULL,
	"google_email" text NOT NULL,
	"google_subject" text NOT NULL,
	"refresh_token" text NOT NULL,
	"calendar_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_synced_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "google_calendars" ADD CONSTRAINT "google_calendars_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_calendars" ADD CONSTRAINT "google_calendars_connected_by_auth_user_id_fk" FOREIGN KEY ("connected_by") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "google_calendars" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.google_calendars FROM anon; END IF;
IF EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.google_calendars FROM authenticated; END IF;
END $$;
