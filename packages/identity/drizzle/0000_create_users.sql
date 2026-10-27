CREATE SCHEMA IF NOT EXISTS "identity";
--> statement-breakpoint
CREATE TABLE "identity"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"department" text,
	"support_level" text,
	"initials" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
