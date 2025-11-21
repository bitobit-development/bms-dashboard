CREATE TABLE "network_daily_aggregates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" integer NOT NULL,
	"date" date NOT NULL,
	"avg_upload_speed" real NOT NULL,
	"avg_download_speed" real NOT NULL,
	"max_upload_speed" real NOT NULL,
	"max_download_speed" real NOT NULL,
	"allocated_bandwidth" real NOT NULL,
	"avg_latency" real NOT NULL,
	"min_latency" real NOT NULL,
	"max_latency" real NOT NULL,
	"avg_jitter" real,
	"total_data_consumed" bigint NOT NULL,
	"data_allowance" bigint NOT NULL,
	"active_hours" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "network_monthly_aggregates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" integer NOT NULL,
	"month" varchar(7) NOT NULL,
	"avg_upload_speed" real NOT NULL,
	"avg_download_speed" real NOT NULL,
	"peak_upload_speed" real NOT NULL,
	"peak_download_speed" real NOT NULL,
	"allocated_bandwidth" real NOT NULL,
	"utilization_pct" real NOT NULL,
	"avg_latency" real NOT NULL,
	"p95_latency" real,
	"avg_jitter" real,
	"total_data_consumed" bigint NOT NULL,
	"monthly_allowance" bigint NOT NULL,
	"consumption_pct" real NOT NULL,
	"active_days" integer NOT NULL,
	"total_active_hours" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "network_telemetry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" integer NOT NULL,
	"timestamp" timestamp NOT NULL,
	"upload_speed" real NOT NULL,
	"download_speed" real NOT NULL,
	"allocated_bandwidth" real NOT NULL,
	"latency" real NOT NULL,
	"jitter" real,
	"packet_loss" real,
	"data_consumed" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "network_daily_aggregates" ADD CONSTRAINT "network_daily_aggregates_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_monthly_aggregates" ADD CONSTRAINT "network_monthly_aggregates_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_telemetry" ADD CONSTRAINT "network_telemetry_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "network_daily_site_date_idx" ON "network_daily_aggregates" USING btree ("site_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "network_monthly_site_month_idx" ON "network_monthly_aggregates" USING btree ("site_id","month");--> statement-breakpoint
CREATE INDEX "network_telemetry_site_timestamp_idx" ON "network_telemetry" USING btree ("site_id","timestamp");--> statement-breakpoint
CREATE INDEX "network_telemetry_timestamp_idx" ON "network_telemetry" USING btree ("timestamp");