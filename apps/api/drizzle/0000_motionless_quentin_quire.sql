CREATE TYPE "public"."source_kind" AS ENUM('xlsx', 'csv', 'generated');--> statement-breakpoint
CREATE TYPE "public"."widget_type" AS ENUM('line', 'bar', 'stacked_bar', 'pie', 'text');--> statement-breakpoint
CREATE TABLE "datasets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"source_filename" text NOT NULL,
	"sheet_name" text,
	"source_kind" "source_kind" NOT NULL,
	"columns" text[] NOT NULL,
	"row_count" integer NOT NULL,
	"rows" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "widget_type" NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL,
	"dataset_id" uuid,
	"chart_config" jsonb,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "widgets" ADD CONSTRAINT "widgets_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE set null ON UPDATE no action;