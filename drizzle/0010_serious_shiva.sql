CREATE TABLE "account_deletions" (
	"user_id" text PRIMARY KEY NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erased_files" (
	"key" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_deletions" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"requested_by" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_deletions" ADD CONSTRAINT "account_deletions_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_deletions" ADD CONSTRAINT "organization_deletions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_deletions" ADD CONSTRAINT "organization_deletions_requested_by_auth_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE account_deletions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE organization_deletions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE erased_files ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON account_deletions,organization_deletions,erased_files FROM anon,authenticated; END IF; END $$;
