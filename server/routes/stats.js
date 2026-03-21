import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { trades } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  try {
    const { isBacktest } = req.query;
    const conditions = [eq(trades.userId, req.userId)];
    if (isBacktest !== undefined)
      conditions.push(eq(trades.isBacktest, isBacktest === 'true'));

    const all = db.select().from(trades).where(and(...conditions)).all();

    if (!all.length) return res.json({ empty: true });

    const n = all.length;
    const wins   = all.filter(t => t.outcome === 'WIN');
    const losses = all.filter(t => t.outcome === 'LOSS');
    const be     = all.filter(t => t.outcome === 'BE');
    const longs  = all.filter(t => t.direction === 'LONG');
    const shorts = all.filter(t => t.direction === 'SHORT');

    const wr = wins.length / n;
    const totalR = all.reduce((s, t) => s + (t.rResult || 0), 0);
    const avgWinR  = wins.length  ? wins.reduce((s,t)=>s+(t.rResult||0),0)/wins.length   : 0;
    const avgLossR = losses.length ? Math.abs(losses.reduce((s,t)=>s+(t.rResult||0),0)/losses.length) : 1;
    const avgRR    = avgLossR > 0 ? avgWinR / avgLossR : 0;
    const expectancy = (wr * avgWinR) - ((1 - wr) * avgLossR);

    const grossWin  = wins.reduce((s,t) => s+(t.rResult||0), 0);
    const grossLoss = Math.abs(losses.reduce((s,t) => s+(t.rResult||0), 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0;

    // Max drawdown
    let peak = 0, maxDD = 0, running = 0;
    all.forEach(t => {
      running += (t.rResult || 0);
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDD) maxDD = dd;
    });

    // Streaks
    let wStreak = 0, lStreak = 0, maxWStreak = 0, maxLStreak = 0;
    all.forEach(t => {
      if (t.outcome === 'WIN')  { wStreak++; lStreak = 0; if (wStreak > maxWStreak) maxWStreak = wStreak; }
      else if (t.outcome === 'LOSS') { lStreak++; wStreak = 0; if (lStreak > maxLStreak) maxLStreak = lStreak; }
      else { wStreak = 0; lStreak = 0; }
    });

    // By session
    const sessionStats = {};
    ['London','NY Overlap','Asian','Other'].forEach(s => {
      const st = all.filter(t => t.session === s);
      sessionStats[s] = {
        count: st.length,
        wins:  st.filter(t => t.outcome === 'WIN').length,
        totalR: st.reduce((a,t) => a+(t.rResult||0),0),
      };
    });

    // By setup type
    const setupStats = {};
    ['OB+BOS','OB+FVG','FVG+CHoCH','EQH/EQL','Other'].forEach(s => {
      const st = all.filter(t => t.setupType === s);
      setupStats[s] = {
        count: st.length,
        wins:  st.filter(t => t.outcome === 'WIN').length,
        totalR: st.reduce((a,t) => a+(t.rResult||0),0),
      };
    });

    // Equity curve (cumulative R)
    let cum = 0;
    const equityCurve = all.map(t => {
      cum += (t.rResult || 0);
      return { date: t.tradeDate, r: parseFloat(cum.toFixed(2)), outcome: t.outcome };
    });

    // Monthly performance
    const monthly = {};
    all.forEach(t => {
      const month = t.tradeDate?.slice(0, 7);
      if (!month) return;
      if (!monthly[month]) monthly[month] = { wins: 0, losses: 0, totalR: 0, count: 0 };
      monthly[month].count++;
      monthly[month].totalR += (t.rResult || 0);
      if (t.outcome === 'WIN') monthly[month].wins++;
      else if (t.outcome === 'LOSS') monthly[month].losses++;
    });

    res.json({
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
      sessionStats,
      setupStats,
      equityCurve,
      monthly,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stats calculation failed' });
  }
});

export default router;
