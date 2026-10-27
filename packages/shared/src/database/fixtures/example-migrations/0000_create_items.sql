CREATE SCHEMA IF NOT EXISTS "example";
--> statement-breakpoint
CREATE TABLE "example"."items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
