import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import Layout from '../components/Layout.jsx';
import { fmtR, fmtDate, outcomeClass, outcomePill, sessionColor, directionIcon, rClass } from '../lib/constants.js';

function StatCard({ label, value, sub, valueClass = 'text-white' }) {
  return (
    <div className="stat-card anim-up">
      <div className="stat-lbl">{label}</div>
      <div className={`stat-val ${valueClass}`}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

const TooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg2 border border-border rounded-lg px-3 py-2 font-mono text-[10px] shadow-xl">
      <div className="text-slate-500 mb-0.5">{d.date}</div>
      <div className={rClass(d.r) + ' font-semibold'}>{fmtR(d.r)} cumulative</div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,  setStats]  = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('all'); // all | backtest | live

  useEffect(() => {
    loadData();
  }, [mode]);

  async function loadData() {
    setLoading(true);
    try {
      const params = mode === 'all' ? {} : { isBacktest: mode === 'backtest' };
      const [statsRes, tradesRes] = await Promise.all([
        api.stats.get(params),
        api.trades.list({ limit: 8, sort: 'desc', ...params }),
      ]);
      setStats(statsRes);
      setRecent(tradesRes.trades || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const s = stats?.summary;
  const equityCurve = stats?.equityCurve || [];
  const curveColor = (s?.totalR ?? 0) >= 0 ? '#00d97e' : '#ff3d5a';

  return (
    <Layout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-end justify-between anim-up">
          <div>
            <div className="font-mono text-[9px] text-slate-600 tracking-[3px] mb-1">SMC INTRADAY SYSTEM</div>
            <h1 className="font-display text-4xl text-white tracking-widest">
              DASHBOARD<span className="text-acc">.</span>
            </h1>
            <div className="font-mono text-[9px] text-slate-500 mt-1">
              Welcome back, {user?.username}
            </div>
          </div>
          <div className="flex gap-2">
            {['all','backtest','live'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`btn text-[9px] ${mode === m ? 'btn-primary' : 'btn-ghost'}`}>
                {m.toUpperCase()}
              </button>
            ))}
            <button onClick={() => navigate('/new-trade')} className="btn-bull">
              + NEW TRADE
            </button>
          </div>
        </div>

        {loading ? (
          <div className="font-mono text-[11px] text-slate-600 text-center py-20">Loading...</div>
        ) : stats?.empty ? (
          <div className="card p-16 text-center space-y-4">
            <div className="font-display text-3xl text-slate-600 tracking-widest">NO TRADES YET</div>
            <div className="font-mono text-[11px] text-slate-600">Start logging your SMC setups to see statistics</div>
            <button onClick={() => navigate('/new-trade')} className="btn-bull mx-auto block">
              Log First Trade
            </button>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-4 xl:grid-cols-7 gap-3">
              <StatCard label="Total Trades" value={s?.n ?? 0} sub="logged" valueClass="text-acc" />
              <StatCard label="Win Rate" value={`${s?.winRate ?? 0}%`}
                sub="target ≥ 40%"
                valueClass={(s?.winRate ?? 0) >= 38 ? 'text-bull' : 'text-bear'} />
              <StatCard label="Avg R:R" value={s?.avgRR ?? '—'}
                sub="target ≥ 2.0"
                valueClass={(s?.avgRR ?? 0) >= 2 ? 'text-gold' : 'text-bear'} />
              <StatCard label="Expectancy"
                value={(s?.expectancy ?? 0) >= 0 ? `+${s?.expectancy}R` : `${s?.expectancy}R`}
                sub="per trade"
                valueClass={(s?.expectancy ?? 0) >= 0.3 ? 'text-bull' : (s?.expectancy ?? 0) >= 0 ? 'text-gold' : 'text-bear'} />
              <StatCard label="Total R"
                value={(s?.totalR ?? 0) >= 0 ? `+${s?.totalR}R` : `${s?.totalR}R`}
                sub="net profit"
                valueClass={(s?.totalR ?? 0) >= 0 ? 'text-bull' : 'text-bear'} />
              <StatCard label="Max DD"
                value={`${s?.maxDrawdown ?? 0}R`}
                sub="drawdown"
                valueClass="text-bear" />
              <StatCard label="Profit Factor"
                value={s?.profitFactor >= 999 ? '∞' : s?.profitFactor ?? '—'}
                sub="target ≥ 1.5"
                valueClass={(s?.profitFactor ?? 0) >= 1.5 ? 'text-bull' : 'text-bear'} />
            </div>

            {/* Equity Curve + Session Breakdown */}
            <div className="grid grid-cols-3 gap-4 anim-up anim-up-2">

              {/* Equity Curve */}
              <div className="col-span-2 card">
                <div className="card-header">
                  <div className="card-title">Equity Curve — Cumulative R</div>
                  <div className="badge-acc">{s?.n} TRADES</div>
                </div>
                <div className="p-4 h-56">
                  {equityCurve.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={equityCurve} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" hide />
                        <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: '#4a6070' }} width={36} />
                        <Tooltip content={<TooltipContent />} />
                        <ReferenceLine y={0} stroke="#223040" strokeDasharray="4 4" />
                        <Line
                          type="monotone" dataKey="r"
                          stroke={curveColor} strokeWidth={2}
                          dot={false} activeDot={{ r: 4, fill: curveColor }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center font-mono text-[10px] text-slate-600">
                      Need more trades for equity curve
                    </div>
                  )}
                </div>
              </div>

              {/* Session Breakdown */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Session Breakdown</div>
                </div>
                <div className="p-4 space-y-3">
                  {Object.entries(stats?.sessionStats || {}).map(([session, data]) => {
                    const wr = data.count > 0 ? ((data.wins / data.count) * 100).toFixed(0) : 0;
                    return (
                      <div key={session}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-mono text-[10px] ${sessionColor(session)}`}>{session}</span>
                          <span className={`font-mono text-[10px] ${rClass(data.totalR)}`}>
                            {fmtR(data.totalR)} · {wr}% WR
                          </span>
                        </div>
                        <div className="h-1.5 bg-bg4 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (data.count / (s?.n || 1)) * 100)}%`,
                              background: data.totalR >= 0 ? '#00d97e' : '#ff3d5a',
                            }}
                          />
                        </div>
                        <div className="font-mono text-[8px] text-slate-600 mt-0.5">{data.count} trades</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-4 gap-4 anim-up anim-up-3">
              <div className="card p-4 space-y-2">
                <div className="card-title mb-2">Direction Split</div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-bull">▲ LONG</span>
                  <span className="text-bull">{s?.longWinRate ?? 0}% WR</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-bear">▼ SHORT</span>
                  <span className="text-bear">{s?.shortWinRate ?? 0}% WR</span>
                </div>
              </div>
              <div className="card p-4 space-y-2">
                <div className="card-title mb-2">Avg R per Trade</div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Avg Win</span>
                  <span className="text-bull">+{s?.avgWinR ?? 0}R</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Avg Loss</span>
                  <span className="text-bear">-{s?.avgLossR ?? 0}R</span>
                </div>
              </div>
              <div className="card p-4 space-y-2">
                <div className="card-title mb-2">Extremes</div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Best</span>
                  <span className="text-bull">+{s?.bestTrade ?? 0}R</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Worst</span>
                  <span className="text-bear">{s?.worstTrade ?? 0}R</span>
                </div>
              </div>
              <div className="card p-4 space-y-2">
                <div className="card-title mb-2">Streaks</div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Win streak</span>
                  <span className="text-bull">{s?.maxWinStreak ?? 0}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Loss streak</span>
                  <span className="text-bear">{s?.maxLossStreak ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Recent Trades */}
            <div className="card anim-up anim-up-4">
              <div className="card-header">
                <div className="card-title">Recent Trades</div>
                <button onClick={() => navigate('/trades')} className="btn-ghost text-[9px]">
                  VIEW ALL →
                </button>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Session</th><th>Dir</th>
                      <th>Setup</th><th>H1</th><th>M15</th><th>M5</th>
                      <th>Outcome</th><th>R Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(t => (
                      <tr key={t.id} onClick={() => navigate(`/trades/${t.id}`)}>
                        <td>{fmtDate(t.tradeDate)}</td>
                        <td className={sessionColor(t.session)}>{t.session}</td>
                        <td className={t.direction === 'LONG' ? 'text-bull' : 'text-bear'}>
                          {directionIcon(t.direction)} {t.direction}
                        </td>
                        <td className="text-slate-400">{t.setupType}</td>
                        <td className={t.biasH1 === 'BULL' ? 'text-bull' : t.biasH1 === 'BEAR' ? 'text-bear' : 'text-gold'}>
                          {t.biasH1}
                        </td>
                        <td className={t.biasM15 === 'BULL' ? 'text-bull' : t.biasM15 === 'BEAR' ? 'text-bear' : 'text-gold'}>
                          {t.biasM15}
                        </td>
                        <td className={t.biasM5 === 'BULL' ? 'text-bull' : t.biasM5 === 'BEAR' ? 'text-bear' : 'text-gold'}>
                          {t.biasM5}
                        </td>
                        <td><span className={`pill ${outcomePill(t.outcome)}`}>{t.outcome}</span></td>
                        <td className={rClass(t.rResult)}>{fmtR(t.rResult)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
