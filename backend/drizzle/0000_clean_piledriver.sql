CREATE TYPE "public"."ambulance_status" AS ENUM('available', 'in_transit', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('requested', 'accepted', 'in_transit', 'arrived', 'completed');--> statement-breakpoint
CREATE TABLE "ambulance" (
	"id" serial PRIMARY KEY NOT NULL,
	"plate" varchar(20) NOT NULL,
	"service_id" integer NOT NULL,
	"status" "ambulance_status" DEFAULT 'available' NOT NULL,
	"driver_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "ambulance_plate_unique" UNIQUE("plate")
);
--> statement-breakpoint
CREATE TABLE "ambulance_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ambulance_id" integer NOT NULL,
	"hospital_id" integer,
	"dispatcher_id" integer,
	"pickup_location" text NOT NULL,
	"dropoff_location" text NOT NULL,
	"status" "request_status" DEFAULT 'requested' NOT NULL,
	"rating" integer,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "driver" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"service_id" integer NOT NULL,
	"phone" varchar(20) NOT NULL,
	"license" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "emt" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"service_id" integer NOT NULL,
	"phone" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"address" text
);
--> statement-breakpoint
ALTER TABLE "ambulance" ADD CONSTRAINT "ambulance_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ambulance" ADD CONSTRAINT "ambulance_driver_id_driver_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ambulance_request" ADD CONSTRAINT "ambulance_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ambulance_request" ADD CONSTRAINT "ambulance_request_ambulance_id_ambulance_id_fk" FOREIGN KEY ("ambulance_id") REFERENCES "public"."ambulance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ambulance_request" ADD CONSTRAINT "ambulance_request_dispatcher_id_driver_id_fk" FOREIGN KEY ("dispatcher_id") REFERENCES "public"."driver"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver" ADD CONSTRAINT "driver_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emt" ADD CONSTRAINT "emt_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;