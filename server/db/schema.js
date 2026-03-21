import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ── USERS ─────────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  email:        text('email').notNull().unique(),
  username:     text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt:    text('created_at').default(sql`(datetime('now'))`),
  updatedAt:    text('updated_at').default(sql`(datetime('now'))`),
});

// ── REFRESH TOKENS ────────────────────────────────────────────────────────────
export const refreshTokens = sqliteTable('refresh_tokens', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ── TRADES ────────────────────────────────────────────────────────────────────
export const trades = sqliteTable('trades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Timing
  tradeDate:  text('trade_date').notNull(),       // YYYY-MM-DD
  tradeTime:  text('trade_time'),                  // HH:MM
  session:    text('session').notNull(),            // London | NY Overlap | Asian | Other

  // Direction & Setup
  pair:       text('pair').notNull().default('EURUSD'),
  direction:  text('direction').notNull(),          // LONG | SHORT
  setupType:  text('setup_type').notNull(),         // OB+BOS | OB+FVG | FVG+CHoCH | EQH/EQL | Other

  // Multi-TF Bias
  biasH1:     text('bias_h1').notNull(),            // BULL | BEAR | NEUTRAL
  biasM15:    text('bias_m15').notNull(),
  biasM5:     text('bias_m5').notNull(),

  // SMC Confluence flags (0/1)
  hasSwingBos:    integer('has_swing_bos', { mode: 'boolean' }).default(false),
  hasDiscountZone: integer('has_discount_zone', { mode: 'boolean' }).default(false),
  hasOrderBlock:  integer('has_order_block', { mode: 'boolean' }).default(false),
  hasFvg:         integer('has_fvg', { mode: 'boolean' }).default(false),
  hasChoch:       integer('has_choch', { mode: 'boolean' }).default(false),
  hasIbos:        integer('has_ibos', { mode: 'boolean' }).default(false),

  // Price Levels
  entryPrice: real('entry_price'),
  stopLoss:   real('stop_loss'),
  takeProfit1: real('take_profit_1'),
  takeProfit2: real('take_profit_2'),
  exitPrice:  real('exit_price'),

  // Risk / Result
  riskPercent: real('risk_percent').default(1.0),
  outcome:    text('outcome').notNull(),            // WIN | LOSS | BE | RUNNING
  rResult:    real('r_result'),                     // e.g. 2.1 or -1.0
  pips:       real('pips'),
  pnlUsd:     real('pnl_usd'),

  // Qualitative
  preAnalysis:  text('pre_analysis'),               // plan before entry
  postAnalysis: text('post_analysis'),              // what happened, lessons
  mistakes:     text('mistakes'),                   // rule violations
  rating:       integer('rating'),                  // 1-5 trade quality score
  emotionBefore: text('emotion_before'),            // calm | anxious | fomo | revenge
  emotionDuring: text('emotion_during'),
  emotionAfter:  text('emotion_after'),

  // Image URLs / screenshot paths
  screenshotUrl: text('screenshot_url'),

  // Metadata
  isBacktest: integer('is_backtest', { mode: 'boolean' }).default(false),
  createdAt:  text('created_at').default(sql`(datetime('now'))`),
  updatedAt:  text('updated_at').default(sql`(datetime('now'))`),
});

// ── TAGS ──────────────────────────────────────────────────────────────────────
export const tags = sqliteTable('tags', {
  id:     integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:   text('name').notNull(),
  color:  text('color').default('#3d9eff'),
});

export const tradeTags = sqliteTable('trade_tags', {
  tradeId: integer('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  tagId:   integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
});

// ── DAILY NOTES ───────────────────────────────────────────────────────────────
export const dailyNotes = sqliteTable('daily_notes', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  noteDate:  text('note_date').notNull(),           // YYYY-MM-DD
  content:   text('content'),
  marketBias: text('market_bias'),                  // pre-session macro bias
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});
