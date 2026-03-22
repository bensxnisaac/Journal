import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { api } from '../lib/api.js';
import Layout from '../components/Layout.js';
import { fmtR, rClass } from '../lib/constants.js';

interface TooltipProps { active?: boolean; payload?: { value: number; payload: { month: string } }[]; }
const TT = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg2 border border-border rounded-lg px-3 py-2 font-mono text-[10px] shadow-xl">
      <div className="text-slate-500">{payload[0].payload.month}</div>
      <div className={rClass(payload[0].value)}>{fmtR(payload[0].value)}</div>
    </div>
  );
};

type Mode = 'all' | 'backtest' | 'live';
type BreakdownData = Record<string, { count: number; wins: number; totalR: number }>;

function BreakdownTable({ title, data }: { title: string; data: BreakdownData }) {
  const entries = Object.entries(data).filter(([, d]) => d.count > 0);
  if (!entries.length) return null;
  return (
    <div className="card">
      <div className="card-header"><div className="card-title">{title}</div></div>
      <div className="p-4">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Trades</th><th>Win%</th><th>Total R</th></tr></thead>
          <tbody>
            {entries.map(([name, d]) => (
              <tr key={name}>
                <td className="text-slate-300">{name}</td>
                <td>{d.count}</td>
                <td>{d.count > 0 ? Math.round((d.wins / d.count) * 100) : 0}%</td>
                <td className={rClass(d.totalR)}>{fmtR(d.totalR)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Stats() {
  const [stats,   setStats]   = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode,    setMode]    = useState<Mode>('all');

  useEffect(() => { loadStats(); }, [mode]);

  async function loadStats() {
    setLoading(true);
    try {
      const params = mode === 'all' ? {} : { isBacktest: mode === 'backtest' };
      setStats(await api.stats.get(params) as Record<string, unknown>);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const s = stats?.summary as Record<string, unknown> | undefined;
  const monthly = Object.entries((stats?.monthly as Record<string, { totalR: number; wins: number; count: number }>) || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({ month, r: parseFloat(d.totalR.toFixed(2)), wr: d.count > 0 ? Math.round((d.wins / d.count) * 100) : 0, count: d.count }));

  return (
    <Layout>
      <div className="p-6 space-y-5">

        <div className="flex items-end justify-between anim-up">
          <div>
            <div className="font-mono text-[9px] text-slate-600 tracking-[3px] mb-1">PERFORMANCE</div>
            <h1 className="font-display text-4xl text-white tracking-widest">STATISTICS<span className="text-acc">.</span></h1>
          </div>
          <div className="flex gap-2">
            {(['all', 'backtest', 'live'] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`btn text-[9px] ${mode === m ? 'btn-primary' : 'btn-ghost'}`}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center font-mono text-[11px] text-slate-600">Calculating...</div>
        ) : (stats as { empty?: boolean })?.empty ? (
          <div className="card p-16 text-center font-mono text-[11px] text-slate-600">No data yet. Log some trades.</div>
        ) : (
          <>
            {/* Core metrics */}
            <div className="grid grid-cols-4 gap-3 anim-up anim-up-1">
              {[
                { label: 'Trades',        val: s?.n,           cls: 'text-acc' },
                { label: 'Win Rate',      val: `${s?.winRate}%`, cls: (s?.winRate as number) >= 50 ? 'text-bull' : 'text-bear' },
                { label: 'Expectancy',    val: `${(s?.expectancy as number) >= 0 ? '+' : ''}${s?.expectancy}R`, cls: (s?.expectancy as number) >= 0 ? 'text-bull' : 'text-bear' },
                { label: 'Total R',       val: fmtR(s?.totalR as number), cls: rClass(s?.totalR as number) },
                { label: 'Profit Factor', val: (s?.profitFactor as number) >= 999 ? '∞' : s?.profitFactor, cls: (s?.profitFactor as number) >= 1.5 ? 'text-bull' : 'text-bear' },
                { label: 'Max Drawdown',  val: `${s?.maxDrawdown}R`, cls: 'text-bear' },
                { label: 'Avg Win R',     val: `+${s?.avgWinR}R`, cls: 'text-bull' },
                { label: 'Avg Loss R',    val: `-${s?.avgLossR}R`, cls: 'text-bear' },
              ].map(({ label, val, cls }) => (
                <div key={label} className="stat-card">
                  <div className="stat-lbl">{label}</div>
                  <div className={`stat-val ${cls}`}>{val as React.ReactNode}</div>
                </div>
              ))}
            </div>

            {/* Monthly chart */}
            {monthly.length > 0 && (
              <div className="card anim-up anim-up-2">
                <div className="card-header"><div className="card-title">Monthly R Performance</div></div>
                <div className="p-4 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: '#4a6070' }} />
                      <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 9, fill: '#4a6070' }} width={36} />
                      <Tooltip content={<TT />} />
                      <Bar dataKey="r" radius={[3, 3, 0, 0]}>
                        {monthly.map((m, i) => (
                          <Cell key={i} fill={m.r >= 0 ? '#00d97e' : '#ff3d5a'} fillOpacity={0.75} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Breakdown tables — dynamic */}
            <div className="grid grid-cols-2 gap-4 anim-up anim-up-3">
              <BreakdownTable title="Session Performance" data={(stats?.sessionStats as BreakdownData) || {}} />
              <BreakdownTable title="Setup Performance"   data={(stats?.setupStats as BreakdownData) || {}} />
            </div>

            {Object.keys((stats?.instrumentStats as object) || {}).length > 0 && (
              <div className="grid grid-cols-2 gap-4 anim-up anim-up-3">
                <BreakdownTable title="Instrument Performance" data={(stats?.instrumentStats as BreakdownData) || {}} />
                <div /> {/* spacer */}
              </div>
            )}

            {/* Direction + streaks + extremes */}
            <div className="grid grid-cols-3 gap-4 anim-up anim-up-4">
              <div className="card p-4 space-y-3">
                <div className="card-title">Direction Split</div>
                {([['LONG', 'text-bull', s?.longWinRate], ['SHORT', 'text-bear', s?.shortWinRate]] as [string, string, unknown][]).map(([d, cls, wr]) => (
                  <div key={d} className="flex items-center justify-between">
                    <span className={`font-mono text-[11px] ${cls}`}>{d}</span>
                    <span className={`font-mono text-[11px] ${cls}`}>{wr as number}% WR</span>
                  </div>
                ))}
              </div>
              <div className="card p-4 space-y-3">
                <div className="card-title">Streaks</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">Max win streak</span>
                  <span className="font-mono text-[11px] text-bull">{s?.maxWinStreak as number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">Max loss streak</span>
                  <span className="font-mono text-[11px] text-bear">{s?.maxLossStreak as number}</span>
                </div>
              </div>
              <div className="card p-4 space-y-3">
                <div className="card-title">Extremes</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">Best trade</span>
                  <span className="font-mono text-[11px] text-bull">+{s?.bestTrade as number}R</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">Worst trade</span>
                  <span className="font-mono text-[11px] text-bear">{s?.worstTrade as number}R</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
