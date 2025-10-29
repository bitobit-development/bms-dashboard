CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"country" text DEFAULT 'US' NOT NULL,
	"postal_code" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"subscription_tier" text DEFAULT 'trial',
	"subscription_ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"manufacturer" text,
	"model" text,
	"serial_number" text,
	"capacity" real,
	"voltage" real,
	"specs" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'operational' NOT NULL,
	"health_score" real,
	"installed_at" timestamp,
	"last_maintenance_at" timestamp,
	"next_maintenance_at" timestamp,
	"warranty_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"address" text,
	"city" text,
	"state" text,
	"country" text DEFAULT 'US' NOT NULL,
	"postal_code" text,
	"latitude" real,
	"longitude" real,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"nominal_voltage" real DEFAULT 500 NOT NULL,
	"daily_consumption_kwh" real DEFAULT 65,
	"battery_capacity_kwh" real,
	"solar_capacity_kw" real,
	"config" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"installed_at" timestamp,
	"last_seen_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telemetry_daily" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"total_solar_energy_kwh" real,
	"total_grid_energy_kwh" real,
	"total_load_energy_kwh" real,
	"avg_battery_charge_level" real,
	"min_battery_charge_level" real,
	"max_battery_charge_level" real,
	"avg_battery_temperature" real,
	"max_battery_temperature" real,
	"avg_solar_efficiency" real,
	"uptime_minutes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telemetry_hourly" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"timestamp" timestamp NOT NULL,
	"avg_battery_voltage" real,
	"avg_battery_current" real,
	"avg_battery_charge_level" real,
	"avg_battery_temperature" real,
	"min_battery_charge_level" real,
	"max_battery_charge_level" real,
	"total_solar_energy_kwh" real,
	"avg_solar_power_kw" real,
	"avg_solar_efficiency" real,
	"total_grid_energy_kwh" real,
	"avg_grid_power_kw" real,
	"total_load_energy_kwh" real,
	"avg_load_power_kw" real,
	"reading_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telemetry_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"timestamp" timestamp NOT NULL,
	"battery_voltage" real,
	"battery_current" real,
	"battery_charge_level" real,
	"battery_temperature" real,
	"battery_soh" real,
	"battery_power_kw" real,
	"solar_power_kw" real,
	"solar_energy_kwh" real,
	"solar_efficiency" real,
	"inverter1_power_kw" real,
	"inverter1_efficiency" real,
	"inverter1_temperature" real,
	"inverter2_power_kw" real,
	"inverter2_efficiency" real,
	"inverter2_temperature" real,
	"grid_voltage" real,
	"grid_frequency" real,
	"grid_power_kw" real,
	"grid_energy_kwh" real,
	"load_power_kw" real,
	"load_energy_kwh" real,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"equipment_id" integer,
	"severity" text NOT NULL,
	"category" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"context" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"acknowledged_at" timestamp,
	"acknowledged_by" text,
	"resolved_at" timestamp,
	"resolved_by" text,
	"notifications_sent" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"context" jsonb,
	"actor_type" text NOT NULL,
	"actor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"equipment_id" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"work_performed" text,
	"parts_replaced" jsonb,
	"performed_by" text,
	"supervised_by" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"stack_user_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"avatar" text,
	"role" text DEFAULT 'viewer' NOT NULL,
	"permissions" jsonb,
	"site_access" jsonb DEFAULT '{"allSites":true}'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"invited_by" text,
	"invited_at" timestamp,
	"accepted_at" timestamp,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"last_login_at" timestamp,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "org_user_unique" UNIQUE("organization_id","stack_user_id")
);
--> statement-breakpoint
CREATE TABLE "user_activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"stack_user_id" text NOT NULL,
	"action" text NOT NULL,
	"resource" text,
	"resource_id" integer,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetry_daily" ADD CONSTRAINT "telemetry_daily_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetry_hourly" ADD CONSTRAINT "telemetry_hourly_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetry_readings" ADD CONSTRAINT "telemetry_readings_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_log" ADD CONSTRAINT "user_activity_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "equipment_site_id_idx" ON "equipment" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "equipment_type_idx" ON "equipment" USING btree ("type");--> statement-breakpoint
CREATE INDEX "equipment_site_type_idx" ON "equipment" USING btree ("site_id","type");--> statement-breakpoint
CREATE INDEX "equipment_maintenance_idx" ON "equipment" USING btree ("next_maintenance_at");--> statement-breakpoint
CREATE INDEX "sites_org_id_idx" ON "sites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sites_status_idx" ON "sites" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sites_org_status_idx" ON "sites" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "sites_location_idx" ON "sites" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "telemetry_daily_site_date_idx" ON "telemetry_daily" USING btree ("site_id","date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "telemetry_daily_date_idx" ON "telemetry_daily" USING btree ("date" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "telemetry_daily_site_date_unique" ON "telemetry_daily" USING btree ("site_id","date");--> statement-breakpoint
CREATE INDEX "telemetry_hourly_site_timestamp_idx" ON "telemetry_hourly" USING btree ("site_id","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "telemetry_hourly_timestamp_idx" ON "telemetry_hourly" USING btree ("timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "telemetry_hourly_site_timestamp_unique" ON "telemetry_hourly" USING btree ("site_id","timestamp");--> statement-breakpoint
CREATE INDEX "telemetry_site_timestamp_idx" ON "telemetry_readings" USING btree ("site_id","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "telemetry_timestamp_idx" ON "telemetry_readings" USING btree ("timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "telemetry_site_timestamp_unique" ON "telemetry_readings" USING btree ("site_id","timestamp");--> statement-breakpoint
CREATE INDEX "alerts_site_status_idx" ON "alerts" USING btree ("site_id","status");--> statement-breakpoint
CREATE INDEX "alerts_severity_idx" ON "alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "alerts_category_idx" ON "alerts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "alerts_created_at_idx" ON "alerts" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "alerts_site_active_idx" ON "alerts" USING btree ("site_id","status","severity");--> statement-breakpoint
CREATE INDEX "events_site_created_idx" ON "events" USING btree ("site_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_type_idx" ON "events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "maintenance_site_idx" ON "maintenance_records" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "maintenance_equipment_idx" ON "maintenance_records" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "maintenance_scheduled_idx" ON "maintenance_records" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "maintenance_status_idx" ON "maintenance_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "org_users_org_id_idx" ON "organization_users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_users_stack_user_idx" ON "organization_users" USING btree ("stack_user_id");--> statement-breakpoint
CREATE INDEX "org_users_email_idx" ON "organization_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "org_users_role_idx" ON "organization_users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_activity_user_created_idx" ON "user_activity_log" USING btree ("stack_user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "user_activity_org_created_idx" ON "user_activity_log" USING btree ("organization_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "user_activity_created_at_idx" ON "user_activity_log" USING btree ("created_at" DESC NULLS LAST);