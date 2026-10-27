CREATE SCHEMA IF NOT EXISTS "knowledge";
--> statement-breakpoint
CREATE TABLE "knowledge"."articles" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"conditions" text,
	"category" text NOT NULL,
	"search_vector" tsvector GENERATED ALWAYS AS (
		setweight(to_tsvector('portuguese', translate("title", 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')), 'A') ||
		setweight(to_tsvector('portuguese', translate("body", 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')), 'B') ||
		setweight(to_tsvector('portuguese', translate(coalesce("conditions", ''), 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')), 'C')
	) STORED NOT NULL
);
--> statement-breakpoint
CREATE INDEX "articles_search_vector_idx" ON "knowledge"."articles" USING gin ("search_vector");
