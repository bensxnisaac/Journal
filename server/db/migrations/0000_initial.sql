CREATE TABLE IF NOT EXISTS `users` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL UNIQUE,
  `username` text NOT NULL UNIQUE,
  `password_hash` text NOT NULL,
  `created_at` text DEFAULT (datetime('now')),
  `updated_at` text DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `token` text NOT NULL UNIQUE,
  `expires_at` text NOT NULL,
  `created_at` text DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `trades` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `trade_date` text NOT NULL,
  `trade_time` text,
  `session` text NOT NULL,
  `pair` text NOT NULL DEFAULT 'EURUSD',
  `direction` text NOT NULL,
  `setup_type` text NOT NULL,
  `bias_h1` text NOT NULL,
  `bias_m15` text NOT NULL,
  `bias_m5` text NOT NULL,
  `has_swing_bos` integer DEFAULT false,
  `has_discount_zone` integer DEFAULT false,
  `has_order_block` integer DEFAULT false,
  `has_fvg` integer DEFAULT false,
  `has_choch` integer DEFAULT false,
  `has_ibos` integer DEFAULT false,
  `entry_price` real,
  `stop_loss` real,
  `take_profit_1` real,
  `take_profit_2` real,
  `exit_price` real,
  `risk_percent` real DEFAULT 1.0,
  `outcome` text NOT NULL,
  `r_result` real,
  `pips` real,
  `pnl_usd` real,
  `pre_analysis` text,
  `post_analysis` text,
  `mistakes` text,
  `rating` integer,
  `emotion_before` text,
  `emotion_during` text,
  `emotion_after` text,
  `screenshot_url` text,
  `is_backtest` integer DEFAULT false,
  `created_at` text DEFAULT (datetime('now')),
  `updated_at` text DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `tags` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `name` text NOT NULL,
  `color` text DEFAULT '#3d9eff'
);

CREATE TABLE IF NOT EXISTS `trade_tags` (
  `trade_id` integer NOT NULL REFERENCES `trades`(`id`) ON DELETE CASCADE,
  `tag_id` integer NOT NULL REFERENCES `tags`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `daily_notes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `note_date` text NOT NULL,
  `content` text,
  `market_bias` text,
  `created_at` text DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS `trades_user_id_idx` ON `trades` (`user_id`);
CREATE INDEX IF NOT EXISTS `trades_date_idx` ON `trades` (`trade_date`);
CREATE INDEX IF NOT EXISTS `trades_outcome_idx` ON `trades` (`outcome`);
CREATE INDEX IF NOT EXISTS `trades_session_idx` ON `trades` (`session`);
CREATE INDEX IF NOT EXISTS `refresh_tokens_user_id_idx` ON `refresh_tokens` (`user_id`);
CREATE INDEX IF NOT EXISTS `daily_notes_user_date_idx` ON `daily_notes` (`user_id`, `note_date`);
