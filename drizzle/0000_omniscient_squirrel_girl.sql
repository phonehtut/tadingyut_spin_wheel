CREATE TABLE "prizes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"total_qty" integer NOT NULL,
	"remaining_qty" integer NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"color" text NOT NULL,
	"is_winning" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spin_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"mac_address" text NOT NULL,
	"ip_address" text NOT NULL,
	"device_token" text NOT NULL,
	"prize_id" integer NOT NULL,
	"redeem_code" text NOT NULL,
	"is_redeemed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "spin_logs_mac_address_unique" UNIQUE("mac_address"),
	CONSTRAINT "spin_logs_redeem_code_unique" UNIQUE("redeem_code")
);
--> statement-breakpoint
ALTER TABLE "spin_logs" ADD CONSTRAINT "spin_logs_prize_id_prizes_id_fk" FOREIGN KEY ("prize_id") REFERENCES "public"."prizes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_spin_logs_mac" ON "spin_logs" USING btree ("mac_address");--> statement-breakpoint
CREATE INDEX "idx_spin_logs_device_token" ON "spin_logs" USING btree ("device_token");