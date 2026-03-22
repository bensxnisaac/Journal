import { Router, Request, Response } from 'express';
import { eq, and, SQL } from 'drizzle-orm';
import { db } from '../db/client.js';
import { trades } from '../db/schema.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { isBacktest } = req.query as Record<string, string>;
    const userId = (req as AuthRequest).userId;
    const conditions: SQL[] = [eq(trades.userId, userId)];
    if (isBacktest !== undefined)
      conditions.push(eq(trades.isBacktest, isBacktest === 'true'));

    const all = await db.select().from(trades).where(and(...conditions));
    if (!all.length) return res.json({ empty: true });

    const n = all.length;
    const wins   = all.filter(t => t.outcome === 'WIN');
    const losses = all.filter(t => t.outcome === 'LOSS');
    const be     = all.filter(t => t.outcome === 'BE');
    const longs  = all.filter(t => t.direction === 'LONG');
    const shorts = all.filter(t => t.direction === 'SHORT');

    const wr = wins.length / n;
    const totalR   = all.reduce((s, t) => s + (t.rResult || 0), 0);
    const avgWinR  = wins.length   ? wins.reduce((s,t)=>s+(t.rResult||0),0)/wins.length : 0;
    const avgLossR = losses.length ? Math.abs(losses.reduce((s,t)=>s+(t.rResult||0),0)/losses.length) : 1;
    const avgRR    = avgLossR > 0 ? avgWinR / avgLossR : 0;
    const expectancy = (wr * avgWinR) - ((1 - wr) * avgLossR);

    const grossWin  = wins.reduce((s,t) => s+(t.rResult||0), 0);
    const grossLoss = Math.abs(losses.reduce((s,t) => s+(t.rResult||0), 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0;

    let peak = 0, maxDD = 0, running = 0;
    all.forEach(t => {
      running += (t.rResult || 0);
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDD) maxDD = dd;
    });

    let wStreak = 0, lStreak = 0, maxWStreak = 0, maxLStreak = 0;
    all.forEach(t => {
      if (t.outcome === 'WIN')       { wStreak++; lStreak = 0; if (wStreak > maxWStreak) maxWStreak = wStreak; }
      else if (t.outcome === 'LOSS') { lStreak++; wStreak = 0; if (lStreak > maxLStreak) maxLStreak = lStreak; }
      else { wStreak = 0; lStreak = 0; }
    });

    // Dynamic session breakdown — only sessions that exist in data
    const sessionKeys = [...new Set(all.map(t => t.session).filter(Boolean))] as string[];
    const sessionStats: Record<string, { count: number; wins: number; totalR: number }> = {};
    sessionKeys.forEach(s => {
      const st = all.filter(t => t.session === s);
      sessionStats[s] = { count: st.length, wins: st.filter(t=>t.outcome==='WIN').length, totalR: st.reduce((a,t)=>a+(t.rResult||0),0) };
    });

    // Dynamic setup breakdown — only setups that exist in data
    const setupKeys = [...new Set(all.map(t => t.setupType).filter(Boolean))] as string[];
    const setupStats: Record<string, { count: number; wins: number; totalR: number }> = {};
    setupKeys.forEach(s => {
      const st = all.filter(t => t.setupType === s);
      setupStats[s] = { count: st.length, wins: st.filter(t=>t.outcome==='WIN').length, totalR: st.reduce((a,t)=>a+(t.rResult||0),0) };
    });

    // Dynamic instrument breakdown
    const instrumentKeys = [...new Set(all.map(t => t.instrument).filter(Boolean))] as string[];
    const instrumentStats: Record<string, { count: number; wins: number; totalR: number }> = {};
    instrumentKeys.forEach(i => {
      const st = all.filter(t => t.instrument === i);
      instrumentStats[i] = { count: st.length, wins: st.filter(t=>t.outcome==='WIN').length, totalR: st.reduce((a,t)=>a+(t.rResult||0),0) };
    });

    let cum = 0;
    const equityCurve = all.map(t => {
      cum += (t.rResult || 0);
      return { date: t.tradeDate, r: parseFloat(cum.toFixed(2)), outcome: t.outcome };
    });

    const monthly: Record<string, { wins: number; losses: number; totalR: number; count: number }> = {};
    all.forEach(t => {
      const month = t.tradeDate?.slice(0, 7);
      if (!month) return;
      if (!monthly[month]) monthly[month] = { wins: 0, losses: 0, totalR: 0, count: 0 };
      monthly[month].count++;
      monthly[month].totalR += (t.rResult || 0);
      if (t.outcome === 'WIN') monthly[month].wins++;
      else if (t.outcome === 'LOSS') monthly[month].losses++;
    });

    return res.json({
      summary: {
        n, wins: wins.length, losses: losses.length, be: be.length,
        winRate: parseFloat((wr * 100).toFixed(1)),
        avgRR: parseFloat(avgRR.toFixed(2)),
        expectancy: parseFloat(expectancy.toFixed(2)),
        totalR: parseFloat(totalR.toFixed(2)),
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        maxDrawdown: parseFloat(maxDD.toFixed(2)),
        maxWinStreak: maxWStreak,
        maxLossStreak: maxLStreak,
        avgWinR: parseFloat(avgWinR.toFixed(2)),
        avgLossR: parseFloat(avgLossR.toFixed(2)),
        bestTrade: parseFloat(Math.max(...all.map(t=>t.rResult||0)).toFixed(2)),
        worstTrade: parseFloat(Math.min(...all.map(t=>t.rResult||0)).toFixed(2)),
        longWinRate: longs.length ? parseFloat(((longs.filter(t=>t.outcome==='WIN').length/longs.length)*100).toFixed(1)) : 0,
        shortWinRate: shorts.length ? parseFloat(((shorts.filter(t=>t.outcome==='WIN').length/shorts.length)*100).toFixed(1)) : 0,
      },
      sessionStats, setupStats, instrumentStats, equityCurve, monthly,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Stats calculation failed' });
  }
});

export default router;
