CREATE TABLE "weather" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"temperature" real NOT NULL,
	"feels_like" real,
	"temp_min" real,
	"temp_max" real,
	"condition" varchar(100) NOT NULL,
	"condition_code" integer,
	"description" text,
	"humidity" integer,
	"pressure" integer,
	"cloud_cover" integer,
	"uv_index" real,
	"wind_speed" real,
	"wind_direction" integer,
	"sunrise" timestamp,
	"sunset" timestamp,
	"solar_radiation" real,
	"data_source" varchar(50) DEFAULT 'open-meteo',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weather" ADD CONSTRAINT "weather_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "weather_site_id_idx" ON "weather" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "weather_timestamp_idx" ON "weather" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "weather_site_timestamp_idx" ON "weather" USING btree ("site_id","timestamp");