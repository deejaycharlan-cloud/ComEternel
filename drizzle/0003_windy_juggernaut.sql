CREATE TABLE "availabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"capacity" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_dates" CHECK ("availabilities"."end_date">="availabilities"."start_date"),
	CONSTRAINT "availability_capacity" CHECK ("availabilities"."capacity" in ('available','limited','unavailable'))
);
--> statement-breakpoint
CREATE TABLE "pack_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"scope_key" text NOT NULL,
	"preview_id" uuid NOT NULL,
	"template" text NOT NULL,
	"version" integer NOT NULL,
	"input_hash" text NOT NULL,
	"plan" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pack_previews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"created_by" text NOT NULL,
	"plan" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"depends_on_id" uuid NOT NULL,
	CONSTRAINT "no_self_dependency" CHECK ("task_dependencies"."task_id"<>"task_dependencies"."depends_on_id")
);
--> statement-breakpoint
CREATE TABLE "work_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"occurrence_id" uuid,
	"scope_key" text NOT NULL,
	"task_key" text NOT NULL,
	"application_id" uuid,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"format" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"due_date" date NOT NULL,
	"original_due_date" date NOT NULL,
	"anchor_date" date NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"assignee_id" uuid,
	"deputy_id" uuid,
	"mission_status" text DEFAULT 'unassigned' NOT NULL,
	"accepted_at" timestamp with time zone,
	"revision" integer DEFAULT 1 NOT NULL,
	"resources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_task_status" CHECK ("work_tasks"."status" in ('todo','doing','blocked','review','done')),
	CONSTRAINT "work_mission_status" CHECK ("work_tasks"."mission_status" in ('unassigned','proposed','accepted','refused')),
	CONSTRAINT "work_priority" CHECK ("work_tasks"."priority" in ('normal','urgent')),
	CONSTRAINT "work_assignment_state" CHECK (("work_tasks"."assignee_id" is null and "work_tasks"."mission_status"='unassigned' and "work_tasks"."accepted_at" is null) or ("work_tasks"."assignee_id" is not null and "work_tasks"."mission_status" in ('proposed','refused') and "work_tasks"."accepted_at" is null) or ("work_tasks"."assignee_id" is not null and "work_tasks"."mission_status"='accepted' and "work_tasks"."accepted_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "project_briefs" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "project_briefs" ADD COLUMN "decision_reason" text;--> statement-breakpoint
ALTER TABLE "project_briefs" ADD COLUMN "decided_by" text;--> statement-breakpoint
ALTER TABLE "project_briefs" ADD COLUMN "decided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_applications" ADD CONSTRAINT "pack_applications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_applications" ADD CONSTRAINT "pack_applications_preview_id_pack_previews_id_fk" FOREIGN KEY ("preview_id") REFERENCES "public"."pack_previews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_applications" ADD CONSTRAINT "pack_applications_created_by_auth_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_previews" ADD CONSTRAINT "pack_previews_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_previews" ADD CONSTRAINT "pack_previews_created_by_auth_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_work_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."work_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_id_work_tasks_id_fk" FOREIGN KEY ("depends_on_id") REFERENCES "public"."work_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_history" ADD CONSTRAINT "work_history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_history" ADD CONSTRAINT "work_history_task_id_work_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."work_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_history" ADD CONSTRAINT "work_history_actor_id_auth_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_occurrence_id_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."occurrences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_application_id_pack_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."pack_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_assignee_id_members_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_deputy_id_members_id_fk" FOREIGN KEY ("deputy_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_created_by_auth_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_pack_per_scope" ON "pack_applications" USING btree ("project_id","scope_key");--> statement-breakpoint
CREATE UNIQUE INDEX "task_dependency_unique" ON "task_dependencies" USING btree ("task_id","depends_on_id");--> statement-breakpoint
CREATE UNIQUE INDEX "work_task_scope_key" ON "work_tasks" USING btree ("project_id","scope_key","task_key");--> statement-breakpoint
ALTER TABLE "project_briefs" ADD CONSTRAINT "project_briefs_decided_by_auth_user_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;