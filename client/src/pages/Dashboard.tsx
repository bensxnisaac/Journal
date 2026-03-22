import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.js';
import Layout from '../components/Layout.js';
import { fmtR, fmtDate, outcomePill, directionIcon, rClass } from '../lib/constants.js';

interface StatCardProps { label: string; value: unknown; sub?: string; valueClass?: string; }
function StatCard({ label, value, sub, valueClass = 't-primary' }: StatCardProps) {
  return (
    <div className="stat-card anim-up">
      <div className="stat-lbl">{label}</div>
      <div className={`stat-val ${valueClass}`}>{value as React.ReactNode}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

interface TooltipPayload { payload: { date: string; r: number }; }
const TooltipContent = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg2 border border-border rounded-lg px-3 py-2 font-mono text-[12px] shadow-xl">
      <div className="t-muted mb-0.5">{d.date}</div>
      <div className={rClass(d.r) + ' font-semibold'}>{fmtR(d.r)} cumulative</div>
    </div>
  );
};

type Mode = 'all' | 'backtest' | 'live';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,   setStats]   = useState<Record<string, unknown> | null>(null);
  const [recent,  setRecent]  = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode,    setMode]    = useState<Mode>('all');

  useEffect(() => { loadData(); }, [mode]);

  async function loadData() {
    setLoading(true);
    try {
      const params = mode === 'all' ? {} : { isBacktest: mode === 'backtest' };
      const [statsRes, tradesRes] = await Promise.all([
        api.stats.get(params) as Promise<Record<string, unknown>>,
        api.trades.list({ limit: 8, sort: 'desc', ...params }) as Promise<{ trades: Record<string, unknown>[] }>,
      ]);
      setStats(statsRes);
      setRecent(tradesRes.trades || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const s = stats?.summary as Record<string, unknown> | undefined;
  const equityCurve = (stats?.equityCurve as { date: string; r: number; outcome: string }[]) || [];
  const curveColor = ((s?.totalR as number) ?? 0) >= 0 ? '#00d97e' : '#ff3d5a';

  return (
    <Layout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-end justify-between anim-up">
          <div>
            <div className="font-mono text-[11px] t-muted tracking-[3px] mb-1">TRADE JOURNAL</div>
            <h1 className="font-display text-4xl t-primary tracking-widest">DASHBOARD<span className="text-acc">.</span></h1>
            <div className="font-mono text-[11px] t-muted mt-1">Welcome back, {user?.username}</div>
          </div>
          <div className="flex gap-2">
            {(['all','backtest','live'] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`btn text-[11px] ${mode === m ? 'btn-primary' : 'btn-ghost'}`}>
                {m.toUpperCase()}
              </button>
            ))}
            <button onClick={() => navigate('/new-trade')} className="btn-bull">+ NEW TRADE</button>
          </div>
        </div>

        {loading ? (
          <div className="font-mono text-[12px] t-muted text-center py-20">Loading...</div>
        ) : (stats as { empty?: boolean })?.empty ? (
          <div className="card p-16 text-center space-y-4">
            <div className="font-display text-3xl t-muted tracking-widest">NO TRADES YET</div>
            <div className="font-mono text-[12px] t-muted">Start logging your trades to see statistics</div>
            <button onClick={() => navigate('/new-trade')} className="btn-bull mx-auto block">Log First Trade</button>
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-4 xl:grid-cols-7 gap-3">
              <StatCard label="Total Trades" value={s?.n as number ?? 0} sub="logged" valueClass="text-acc" />
              <StatCard label="Win Rate" value={`${s?.winRate ?? 0}%`} sub="of closed trades"
                valueClass={(s?.winRate as number ?? 0) >= 50 ? 'text-bull' : 'text-bear'} />
              <StatCard label="Avg R:R" value={s?.avgRR ?? '—'} sub="win / loss ratio"
                valueClass={(s?.avgRR as number ?? 0) >= 1.5 ? 'text-gold' : 'text-bear'} />
              <StatCard label="Expectancy"
                value={(s?.expectancy as number ?? 0) >= 0 ? `+${s?.expectancy}R` : `${s?.expectancy}R`}
                sub="per trade"
                valueClass={(s?.expectancy as number ?? 0) >= 0 ? 'text-bull' : 'text-bear'} />
              <StatCard label="Total R"
                value={(s?.totalR as number ?? 0) >= 0 ? `+${s?.totalR}R` : `${s?.totalR}R`}
                sub="net profit"
                valueClass={(s?.totalR as number ?? 0) >= 0 ? 'text-bull' : 'text-bear'} />
              <StatCard label="Max DD" value={`${s?.maxDrawdown ?? 0}R`} sub="drawdown" valueClass="text-bear" />
              <StatCard label="Profit Factor"
                value={(s?.profitFactor as number) >= 999 ? '∞' : s?.profitFactor ?? '—'}
                sub="gross win / loss"
                valueClass={(s?.profitFactor as number ?? 0) >= 1.5 ? 'text-bull' : 'text-bear'} />
            </div>

            {/* Equity curve + session breakdown */}
            <div className="grid grid-cols-3 gap-4 anim-up anim-up-2">
              <div className="col-span-2 card">
                <div className="card-header">
                  <div className="card-title">Equity Curve — Cumulative R</div>
                  <div className="badge-acc">{String(s?.n ?? 0)} TRADES</div>
                </div>
                <div className="p-4 h-56">
                  {equityCurve.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={equityCurve} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" hide />
                        <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 10 }} width={36} />
                        <Tooltip content={<TooltipContent />} />
                        <ReferenceLine y={0} stroke="var(--border2)" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="r" stroke={curveColor} strokeWidth={2}
                          dot={false} activeDot={{ r: 4, fill: curveColor }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center font-mono text-[12px] t-muted">
                      Need more trades for equity curve
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Session Breakdown</div></div>
                <div className="p-4 space-y-3">
                  {Object.entries((stats?.sessionStats as Record<string, { count: number; wins: number; totalR: number }>) || {}).map(([session, data]) => {
                    const wr = data.count > 0 ? ((data.wins / data.count) * 100).toFixed(0) : 0;
                    return (
                      <div key={session}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[12px] t-primary">{session}</span>
                          <span className={`font-mono text-[12px] ${rClass(data.totalR)}`}>
                            {fmtR(data.totalR)} · {wr}% WR
                          </span>
                        </div>
                        <div className="h-1.5 bg-bg4 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, (data.count / ((s?.n as number) || 1)) * 100)}%`, background: data.totalR >= 0 ? '#00d97e' : '#ff3d5a' }} />
                        </div>
                        <div className="font-mono text-[11px] t-muted mt-0.5">{data.count} trades</div>
                      </div>
                    );
                  })}
                  {!Object.keys((stats?.sessionStats as object) || {}).length && (
                    <div className="font-mono text-[12px] t-muted">No session data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-4 gap-4 anim-up anim-up-3">
              <div className="card p-4 space-y-2">
                <div className="card-title mb-2">Direction Split</div>
                <div className="flex items-center justify-between font-mono text-[12px]">
                  <span className="text-bull">▲ LONG</span><span className="text-bull">{String(s?.longWinRate ?? 0)}% WR</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[12px]">
                  <span className="text-bear">▼ SHORT</span><span className="text-bear">{String(s?.shortWinRate ?? 0)}% WR</span>
                </div>
              </div>
              <div className="card p-4 space-y-2">
                <div className="card-title mb-2">Avg R per Trade</div>
                <div className="flex items-center justify-between font-mono text-[12px]">
                  <span className="t-muted">Avg Win</span><span className="text-bull">+{String(s?.avgWinR ?? 0)}R</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[12px]">
                  <span className="t-muted">Avg Loss</span><span className="text-bear">-{String(s?.avgLossR ?? 0)}R</span>
                </div>
              </div>
              <div className="card p-4 space-y-2">
                <div className="card-title mb-2">Extremes</div>
                <div className="flex items-center justify-between font-mono text-[12px]">
                  <span className="t-muted">Best</span><span className="text-bull">+{String(s?.bestTrade ?? 0)}R</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[12px]">
                  <span className="t-muted">Worst</span><span className="text-bear">{String(s?.worstTrade ?? 0)}R</span>
                </div>
              </div>
              <div className="card p-4 space-y-2">
                <div className="card-title mb-2">Streaks</div>
                <div className="flex items-center justify-between font-mono text-[12px]">
                  <span className="t-muted">Win streak</span><span className="text-bull">{String(s?.maxWinStreak ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[12px]">
                  <span className="t-muted">Loss streak</span><span className="text-bear">{String(s?.maxLossStreak ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Recent trades */}
            <div className="card anim-up anim-up-4">
              <div className="card-header">
                <div className="card-title">Recent Trades</div>
                <button onClick={() => navigate('/trades')} className="btn-ghost text-[11px]">VIEW ALL →</button>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Date</th><th>Instrument</th><th>Dir</th><th>Setup</th><th>Session</th><th>Outcome</th><th>R Result</th></tr>
                  </thead>
                  <tbody>
                    {recent.map(t => (
                      <tr key={t.id as number} onClick={() => navigate(`/trades/${t.id}`)}>
                        <td>{fmtDate(t.tradeDate as string)}</td>
                        <td className="text-acc">{(t.instrument as string) || '—'}</td>
                        <td className={t.direction === 'LONG' ? 'text-bull' : 'text-bear'}>
                          {directionIcon(t.direction as string)} {t.direction as string}
                        </td>
                        <td className="t-muted">{(t.setupType as string) || '—'}</td>
                        <td className="t-muted">{(t.session as string) || '—'}</td>
                        <td><span className={`pill ${outcomePill(t.outcome as string)}`}>{t.outcome as string}</span></td>
                        <td className={rClass(t.rResult as number)}>{fmtR(t.rResult as number)}</td>
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
