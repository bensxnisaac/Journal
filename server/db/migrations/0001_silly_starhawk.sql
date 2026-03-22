ALTER TABLE "trades" ALTER COLUMN "session" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "setup_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "instrument" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN IF EXISTS "pair";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN IF EXISTS "bias_h1";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN IF EXISTS "bias_m15";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN IF EXISTS "bias_m5";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN IF EXISTS "has_swing_bos";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN IF EXISTS "has_discount_zone";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN IF EXISTS "has_order_block";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN IF EXISTS "has_fvg";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN IF EXISTS "has_choch";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN IF EXISTS "has_ibos";