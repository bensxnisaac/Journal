import { pgTable, text, integer, real, boolean, serial, timestamp } from 'drizzle-orm/pg-core';

// ── USERS ─────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:           serial('id').primaryKey(),
  email:        text('email').notNull().unique(),
  username:     text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
});

// ── REFRESH TOKENS ────────────────────────────────────────────────────────────
export const refreshTokens = pgTable('refresh_tokens', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ── TRADES ────────────────────────────────────────────────────────────────────
export const trades = pgTable('trades', {
  id:     serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Timing
  tradeDate: text('trade_date').notNull(),   // YYYY-MM-DD
  tradeTime: text('trade_time'),             // HH:MM

  // Instrument & direction
  instrument: text('instrument').notNull().default(''),
  direction:  text('direction').notNull(),   // LONG | SHORT

  // Setup
  setupType:  text('setup_type'),            // free-text, user-defined
  session:    text('session'),               // free-text: London, NY, Asian, etc.

  // Price levels
  entryPrice:  real('entry_price'),
  stopLoss:    real('stop_loss'),
  takeProfit1: real('take_profit_1'),
  takeProfit2: real('take_profit_2'),
  exitPrice:   real('exit_price'),

  // Risk / result
  riskPercent: real('risk_percent').default(1.0),
  outcome:     text('outcome').notNull(),    // WIN | LOSS | BE | RUNNING
  rResult:     real('r_result'),
  pips:        real('pips'),
  pnlUsd:      real('pnl_usd'),

  // Journal
  preAnalysis:  text('pre_analysis'),
  postAnalysis: text('post_analysis'),
  mistakes:     text('mistakes'),

  // Psychology
  rating:        integer('rating'),          // 1–5
  emotionBefore: text('emotion_before'),
  emotionDuring: text('emotion_during'),
  emotionAfter:  text('emotion_after'),

  // Media
  screenshotUrl: text('screenshot_url'),

  // Meta
  isBacktest: boolean('is_backtest').default(false),
  createdAt:  timestamp('created_at').defaultNow(),
  updatedAt:  timestamp('updated_at').defaultNow(),
});

// ── TAGS ──────────────────────────────────────────────────────────────────────
export const tags = pgTable('tags', {
  id:     serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:   text('name').notNull(),
  color:  text('color').default('#3d9eff'),
});

export const tradeTags = pgTable('trade_tags', {
  tradeId: integer('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  tagId:   integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
});

// ── DAILY NOTES ───────────────────────────────────────────────────────────────
export const dailyNotes = pgTable('daily_notes', {
  id:         serial('id').primaryKey(),
  userId:     integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  noteDate:   text('note_date').notNull(),   // YYYY-MM-DD
  content:    text('content'),
  marketBias: text('market_bias'),
  createdAt:  timestamp('created_at').defaultNow(),
});

export type User      = typeof users.$inferSelect;
export type Trade     = typeof trades.$inferSelect;
export type Tag       = typeof tags.$inferSelect;
export type DailyNote = typeof dailyNotes.$inferSelect;
