CREATE SCHEMA IF NOT EXISTS "tickets";
--> statement-breakpoint
CREATE TABLE "tickets"."tickets" (
	"number" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"requester_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"priority" text NOT NULL,
	"affected" text NOT NULL,
	"status" text NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"last_updated_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tickets"."ticket_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" text NOT NULL,
	"kind" text NOT NULL,
	"body" text NOT NULL,
	"idempotency_key" text,
	"actor" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets"."ticket_sequences" (
	"type" text PRIMARY KEY NOT NULL,
	"next_value" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tickets"."ticket_events" ADD CONSTRAINT "ticket_events_ticket_number_tickets_number_fk" FOREIGN KEY ("ticket_number") REFERENCES "tickets"."tickets"("number") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "tickets_requester_status_idx" ON "tickets"."tickets" USING btree ("requester_id","status");
--> statement-breakpoint
CREATE INDEX "tickets_search_idx" ON "tickets"."tickets" USING gin (to_tsvector('portuguese', translate("title" || ' ' || "description", 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')));
--> statement-breakpoint
CREATE INDEX "ticket_events_ticket_idx" ON "tickets"."ticket_events" USING btree ("ticket_number","occurred_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_events_idempotency_key_idx" ON "tickets"."ticket_events" USING btree ("idempotency_key") WHERE "tickets"."ticket_events"."idempotency_key" is not null;
