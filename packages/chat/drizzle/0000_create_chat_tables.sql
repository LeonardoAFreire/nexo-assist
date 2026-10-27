CREATE SCHEMA IF NOT EXISTS "chat";
--> statement-breakpoint
CREATE SEQUENCE "chat"."pending_action_display_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 381 CACHE 1;--> statement-breakpoint
CREATE TABLE "chat"."conversations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"employee_id" uuid NOT NULL,
	"state" text NOT NULL,
	"resolution" text,
	"assigned_analyst_id" uuid,
	"handoff" jsonb,
	"last_message_at" timestamp with time zone NOT NULL,
	"analyst_read_at" timestamp with time zone,
	"turn_lock_until" timestamp with time zone,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "chat"."messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"author" text NOT NULL,
	"author_name" text,
	"author_level" text,
	"text" text NOT NULL,
	"parts" jsonb NOT NULL,
	"turn" jsonb,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat"."pending_actions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"display_number" text NOT NULL,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"payload" jsonb NOT NULL,
	"result_ticket_number" text,
	"confirmed_via" text,
	"created_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "chat"."session_usage" (
	"session_id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"employee_messages" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_active_employee_idx" ON "chat"."conversations" USING btree ("employee_id") WHERE "chat"."conversations"."state" <> 'closed';--> statement-breakpoint
CREATE INDEX "conversations_last_message_idx" ON "chat"."conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "messages_conversation_created_idx" ON "chat"."messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pending_actions_one_pending_idx" ON "chat"."pending_actions" USING btree ("conversation_id") WHERE "chat"."pending_actions"."status" = 'pending';