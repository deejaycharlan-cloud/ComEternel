CREATE TABLE "project_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"objective" text NOT NULL,
	"audience" text NOT NULL,
	"message" text NOT NULL,
	"resources" text DEFAULT '' NOT NULL,
	"useful_date" date,
	"decision_maker_id" uuid,
	"status" text DEFAULT 'received' NOT NULL,
	CONSTRAINT "project_briefs_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "liturgical_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"date" date NOT NULL,
	"tradition" text NOT NULL,
	"local_calendar" text NOT NULL,
	"source" text NOT NULL,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"revision" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"original_start_date" date NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"is_exception" boolean DEFAULT false NOT NULL,
	"change_reason" text,
	CONSTRAINT "occurrence_status" CHECK ("occurrences"."status" in ('scheduled','rescheduled','cancelled')),
	CONSTRAINT "occurrence_period" CHECK ("occurrences"."end_date" >= "occurrences"."start_date"),
	CONSTRAINT "occurrence_instants" CHECK (("occurrences"."start_at" is null and "occurrences"."end_at" is null) or ("occurrences"."start_at" is not null and "occurrences"."end_at" > "occurrences"."start_at"))
);
--> statement-breakpoint
CREATE TABLE "programme_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"occurrence_id" uuid,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" text NOT NULL,
	"creation_key" uuid NOT NULL,
	"input_hash" text NOT NULL,
	"title" text NOT NULL,
	"kind" text NOT NULL,
	"event_type" text NOT NULL,
	"ministry" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"practical_info" text DEFAULT '' NOT NULL,
	"owner_id" uuid,
	"validator_id" uuid,
	"deputy_id" uuid,
	"communication_level" text NOT NULL,
	"timezone" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"all_day" boolean NOT NULL,
	"start_time" text,
	"end_time" text,
	"cadence" text NOT NULL,
	"occurrence_count" integer NOT NULL,
	"status" text DEFAULT 'preparation' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_kind" CHECK ("projects"."kind" in ('event','campaign')),
	CONSTRAINT "project_status" CHECK ("projects"."status" in ('preparation','cancelled','archived')),
	CONSTRAINT "project_period" CHECK ("projects"."end_date" >= "projects"."start_date"),
	CONSTRAINT "project_cadence" CHECK ("projects"."cadence" in ('none','weekly','monthly')),
	CONSTRAINT "project_count" CHECK ("projects"."occurrence_count" between 1 and 104)
);
--> statement-breakpoint
ALTER TABLE "project_briefs" ADD CONSTRAINT "project_briefs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_briefs" ADD CONSTRAINT "project_briefs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_briefs" ADD CONSTRAINT "project_briefs_decision_maker_id_members_id_fk" FOREIGN KEY ("decision_maker_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liturgical_dates" ADD CONSTRAINT "liturgical_dates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liturgical_dates" ADD CONSTRAINT "liturgical_dates_verified_by_auth_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_changes" ADD CONSTRAINT "programme_changes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_changes" ADD CONSTRAINT "programme_changes_occurrence_id_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."occurrences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_changes" ADD CONSTRAINT "programme_changes_actor_id_auth_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_auth_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_members_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_validator_id_members_id_fk" FOREIGN KEY ("validator_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_deputy_id_members_id_fk" FOREIGN KEY ("deputy_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "occurrence_project_sequence" ON "occurrences" USING btree ("project_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "project_creation_key" ON "projects" USING btree ("organization_id","creation_key");