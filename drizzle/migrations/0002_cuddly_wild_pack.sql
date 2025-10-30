CREATE TABLE "user_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" text NOT NULL,
	"performed_by" text NOT NULL,
	"performed_by_name" text,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_users" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "user_audit_log" ADD CONSTRAINT "user_audit_log_user_id_organization_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."organization_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_audit_log_user_id_idx" ON "user_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_audit_log_action_idx" ON "user_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "user_audit_log_created_at_idx" ON "user_audit_log" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "user_audit_log_performed_by_idx" ON "user_audit_log" USING btree ("performed_by");