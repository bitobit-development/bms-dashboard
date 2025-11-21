CREATE TABLE "pdf_export_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"total_sites" integer NOT NULL,
	"processed_sites" integer DEFAULT 0 NOT NULL,
	"date_range_start" timestamp NOT NULL,
	"date_range_end" timestamp NOT NULL,
	"site_ids" jsonb,
	"download_url" text,
	"file_size" bigint,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "pdf_export_jobs" ADD CONSTRAINT "pdf_export_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pdf_exports_user_created_idx" ON "pdf_export_jobs" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "pdf_exports_org_created_idx" ON "pdf_export_jobs" USING btree ("organization_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "pdf_exports_expires_at_idx" ON "pdf_export_jobs" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "pdf_exports_status_idx" ON "pdf_export_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pdf_exports_user_status_idx" ON "pdf_export_jobs" USING btree ("user_id","status");