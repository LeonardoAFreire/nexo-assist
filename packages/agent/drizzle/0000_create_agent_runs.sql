CREATE SCHEMA IF NOT EXISTS "agent";
--> statement-breakpoint
CREATE TABLE "agent"."runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"intent" text,
	"confidence" double precision,
	"action" text NOT NULL,
	"handoff_reason" text,
	"steps" jsonb NOT NULL,
	"models" text[] NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"cost_usd" double precision NOT NULL,
	"first_token_ms" integer,
	"duration_ms" integer NOT NULL,
	"outcome" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "runs_created_at_idx" ON "agent"."runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "runs_conversation_idx" ON "agent"."runs" USING btree ("conversation_id");