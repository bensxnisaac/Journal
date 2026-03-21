import { Router } from 'express';
import { eq, and, desc, asc, gte, lte, like } from 'drizzle-orm';
import { db } from '../db/client.js';
import { trades, tags, tradeTags } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// ── LIST TRADES ───────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const {
      page = 1, limit = 20,
      session, direction, outcome, setupType,
      dateFrom, dateTo,
      isBacktest,
      sort = 'desc',
    } = req.query;

    const conditions = [eq(trades.userId, req.userId)];
    if (session)    conditions.push(eq(trades.session, session));
    if (direction)  conditions.push(eq(trades.direction, direction));
    if (outcome)    conditions.push(eq(trades.outcome, outcome));
    if (setupType)  conditions.push(eq(trades.setupType, setupType));
    if (dateFrom)   conditions.push(gte(trades.tradeDate, dateFrom));
    if (dateTo)     conditions.push(lte(trades.tradeDate, dateTo));
    if (isBacktest !== undefined)
      conditions.push(eq(trades.isBacktest, isBacktest === 'true'));

    const offset = (Number(page) - 1) * Number(limit);
    const orderFn = sort === 'asc' ? asc : desc;

    const rows = db.select().from(trades)
      .where(and(...conditions))
      .orderBy(orderFn(trades.tradeDate), orderFn(trades.id))
      .limit(Number(limit))
      .offset(offset)
      .all();

    // Total count
    const total = db.select().from(trades).where(and(...conditions)).all().length;

    res.json({ trades: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// ── GET ONE TRADE ─────────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const trade = db.select().from(trades)
    .where(and(eq(trades.id, Number(req.params.id)), eq(trades.userId, req.userId)))
    .get();
  if (!trade) return res.status(404).json({ error: 'Trade not found' });
  res.json({ trade });
});

// ── CREATE TRADE ──────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const {
      tradeDate, tradeTime, session, pair, direction, setupType,
      biasH1, biasM15, biasM5,
      hasSwingBos, hasDiscountZone, hasOrderBlock, hasFvg, hasChoch, hasIbos,
      entryPrice, stopLoss, takeProfit1, takeProfit2, exitPrice,
      riskPercent, outcome, rResult, pips, pnlUsd,
      preAnalysis, postAnalysis, mistakes, rating,
      emotionBefore, emotionDuring, emotionAfter,
      screenshotUrl, isBacktest, tagIds,
    } = req.body;

    if (!tradeDate || !session || !direction || !setupType || !biasH1 || !biasM15 || !biasM5 || !outcome)
      return res.status(400).json({ error: 'Missing required fields' });

    const [trade] = db.insert(trades).values({
      userId: req.userId,
      tradeDate, tradeTime, session,
      pair: pair || 'EURUSD',
      direction, setupType,
      biasH1, biasM15, biasM5,
      hasSwingBos, hasDiscountZone, hasOrderBlock, hasFvg, hasChoch, hasIbos,
      entryPrice, stopLoss, takeProfit1, takeProfit2, exitPrice,
      riskPercent: riskPercent || 1.0,
      outcome, rResult, pips, pnlUsd,
      preAnalysis, postAnalysis, mistakes, rating,
      emotionBefore, emotionDuring, emotionAfter,
      screenshotUrl,
      isBacktest: isBacktest || false,
    }).returning().all();

    // Associate tags
    if (tagIds?.length) {
      db.insert(tradeTags).values(tagIds.map(tid => ({ tradeId: trade.id, tagId: tid }))).run();
    }

    res.status(201).json({ trade });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create trade' });
  }
});

// ── UPDATE TRADE ──────────────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const existing = db.select().from(trades)
      .where(and(eq(trades.id, Number(req.params.id)), eq(trades.userId, req.userId)))
      .get();
    if (!existing) return res.status(404).json({ error: 'Trade not found' });

    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    delete updates.id;
    delete updates.userId;
    delete updates.createdAt;
    delete updates.tagIds;

    const [updated] = db.update(trades)
      .set(updates)
      .where(and(eq(trades.id, Number(req.params.id)), eq(trades.userId, req.userId)))
      .returning().all();

    // Refresh tags if provided
    if (req.body.tagIds !== undefined) {
      db.delete(tradeTags).where(eq(tradeTags.tradeId, updated.id)).run();
      if (req.body.tagIds?.length)
        db.insert(tradeTags).values(req.body.tagIds.map(tid => ({ tradeId: updated.id, tagId: tid }))).run();
    }

    res.json({ trade: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update trade' });
  }
});

// ── DELETE TRADE ──────────────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const existing = db.select().from(trades)
    .where(and(eq(trades.id, Number(req.params.id)), eq(trades.userId, req.userId)))
    .get();
  if (!existing) return res.status(404).json({ error: 'Trade not found' });
  db.delete(trades).where(eq(trades.id, Number(req.params.id))).run();
  res.json({ ok: true });
});

export default router;
