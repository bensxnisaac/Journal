import { Router, Request, Response } from 'express';
import { eq, and, desc, asc, gte, lte, SQL } from 'drizzle-orm';
import { db } from '../db/client.js';
import { trades, tradeTags } from '../db/schema.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = 1, limit = 20,
      session, direction, outcome, setupType,
      dateFrom, dateTo, isBacktest,
      sort = 'desc',
    } = req.query as Record<string, string>;

    const userId = (req as AuthRequest).userId;
    const conditions: SQL[] = [eq(trades.userId, userId)];
    if (session)   conditions.push(eq(trades.session, session));
    if (direction) conditions.push(eq(trades.direction, direction));
    if (outcome)   conditions.push(eq(trades.outcome, outcome));
    if (setupType) conditions.push(eq(trades.setupType, setupType));
    if (dateFrom)  conditions.push(gte(trades.tradeDate, dateFrom));
    if (dateTo)    conditions.push(lte(trades.tradeDate, dateTo));
    if (isBacktest !== undefined)
      conditions.push(eq(trades.isBacktest, isBacktest === 'true'));

    const offset = (Number(page) - 1) * Number(limit);
    const orderFn = sort === 'asc' ? asc : desc;

    const [rows, countRows] = await Promise.all([
      db.select().from(trades)
        .where(and(...conditions))
        .orderBy(orderFn(trades.tradeDate), orderFn(trades.id))
        .limit(Number(limit))
        .offset(offset),
      db.select().from(trades).where(and(...conditions)),
    ]);

    return res.json({ trades: rows, total: countRows.length, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const [trade] = await db.select().from(trades)
    .where(and(eq(trades.id, Number(req.params.id)), eq(trades.userId, userId)));
  if (!trade) return res.status(404).json({ error: 'Trade not found' });
  return res.json({ trade });
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const {
      tradeDate, tradeTime, instrument, direction, setupType, session,
      entryPrice, stopLoss, takeProfit1, takeProfit2, exitPrice,
      riskPercent, outcome, rResult, pips, pnlUsd,
      preAnalysis, postAnalysis, mistakes, rating,
      emotionBefore, emotionDuring, emotionAfter,
      screenshotUrl, isBacktest, tagIds,
    } = req.body;

    if (!tradeDate || !direction || !outcome)
      return res.status(400).json({ error: 'Date, direction and outcome are required' });

    const [trade] = await db.insert(trades).values({
      userId, tradeDate, tradeTime,
      instrument: instrument || '',
      direction, setupType, session,
      entryPrice, stopLoss, takeProfit1, takeProfit2, exitPrice,
      riskPercent: riskPercent || 1.0,
      outcome, rResult, pips, pnlUsd,
      preAnalysis, postAnalysis, mistakes, rating,
      emotionBefore, emotionDuring, emotionAfter,
      screenshotUrl, isBacktest: isBacktest || false,
    }).returning();

    if (tagIds?.length) {
      await db.insert(tradeTags).values(tagIds.map((tid: number) => ({ tradeId: trade.id, tagId: tid })));
    }

    return res.status(201).json({ trade });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create trade' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId;
    const [existing] = await db.select().from(trades)
      .where(and(eq(trades.id, Number(req.params.id)), eq(trades.userId, userId)));
    if (!existing) return res.status(404).json({ error: 'Trade not found' });

    const updates = { ...req.body, updatedAt: new Date() };
    delete updates.id;
    delete updates.userId;
    delete updates.createdAt;
    delete updates.tagIds;

    const [updated] = await db.update(trades)
      .set(updates)
      .where(and(eq(trades.id, Number(req.params.id)), eq(trades.userId, userId)))
      .returning();

    if (req.body.tagIds !== undefined) {
      await db.delete(tradeTags).where(eq(tradeTags.tradeId, updated.id));
      if (req.body.tagIds?.length)
        await db.insert(tradeTags).values(req.body.tagIds.map((tid: number) => ({ tradeId: updated.id, tagId: tid })));
    }

    return res.json({ trade: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update trade' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const [existing] = await db.select().from(trades)
    .where(and(eq(trades.id, Number(req.params.id)), eq(trades.userId, userId)));
  if (!existing) return res.status(404).json({ error: 'Trade not found' });
  await db.delete(trades).where(eq(trades.id, Number(req.params.id)));
  return res.json({ ok: true });
});

export default router;
