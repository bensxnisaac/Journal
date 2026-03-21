import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { api } from '../lib/api.js';
import Layout from '../components/Layout.jsx';
import { fmtR, rClass } from '../lib/constants.js';

const TT = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg2 border border-border rounded-lg px-3 py-2 font-mono text-[10px] shadow-xl">
      <div className="text-slate-500">{payload[0].payload.month}</div>
      <div className={rClass(payload[0].value)}>{fmtR(payload[0].value)}</div>
    </div>
  );
};

export default function Stats() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode]     = useState('all');

  useEffect(() => { loadStats(); }, [mode]);

  async function loadStats() {
    setLoading(true);
    try {
      const params = mode === 'all' ? {} : { isBacktest: mode === 'backtest' };
      const data = await api.stats.get(params);
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const s = stats?.summary;
  const monthly = Object.entries(stats?.monthly || {})
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, r: parseFloat(data.totalR.toFixed(2)), wr: data.count > 0 ? Math.round((data.wins/data.count)*100) : 0, count: data.count }));

  return (
    <Layout>
      <div className="p-6 space-y-5">
        <div className="flex items-end justify-between anim-up">
          <div>
            <div className="font-mono text-[9px] text-slate-600 tracking-[3px] mb-1">PERFORMANCE</div>
            <h1 className="font-display text-4xl text-white tracking-widest">STATISTICS<span className="text-acc">.</span></h1>
          </div>
          <div className="flex gap-2">
            {['all','backtest','live'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`btn text-[9px] ${mode === m ? 'btn-primary' : 'btn-ghost'}`}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center font-mono text-[11px] text-slate-600">Calculating...</div>
        ) : stats?.empty ? (
          <div className="card p-16 text-center font-mono text-[11px] text-slate-600">No data yet. Log some trades.</div>
        ) : (
          <>
            {/* Core metrics */}
            <div className="grid grid-cols-4 gap-3 anim-up anim-up-1">
              {[
                { label:'Trades', val: s?.n, cls:'text-acc' },
                { label:'Win Rate', val:`${s?.winRate}%`, cls: s?.winRate>=38?'text-bull':'text-bear' },
                { label:'Expectancy', val:`${s?.expectancy>=0?'+':''}${s?.expectancy}R`, cls: s?.expectancy>=0.3?'text-bull':s?.expectancy>=0?'text-gold':'text-bear' },
                { label:'Total R', val:fmtR(s?.totalR), cls: rClass(s?.totalR) },
                { label:'Profit Factor', val:s?.profitFactor>=999?'∞':s?.profitFactor, cls:s?.profitFactor>=1.5?'text-bull':'text-bear' },
                { label:'Max Drawdown', val:`${s?.maxDrawdown}R`, cls:'text-bear' },
                { label:'Avg Win R', val:`+${s?.avgWinR}R`, cls:'text-bull' },
                { label:'Avg Loss R', val:`-${s?.avgLossR}R`, cls:'text-bear' },
              ].map(({ label, val, cls }) => (
                <div key={label} className="stat-card">
                  <div className="stat-lbl">{label}</div>
                  <div className={`stat-val ${cls}`}>{val}</div>
                </div>
              ))}
            </div>

            {/* Monthly P&L */}
            {monthly.length > 0 && (
              <div className="card anim-up anim-up-2">
                <div className="card-header">
                  <div className="card-title">Monthly R Performance</div>
                </div>
                <div className="p-4 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly} margin={{ top:5, right:10, bottom:5, left:0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontFamily:'DM Mono', fontSize:9, fill:'#4a6070' }} />
                      <YAxis tick={{ fontFamily:'DM Mono', fontSize:9, fill:'#4a6070' }} width={36} />
                      <Tooltip content={<TT />} />
                      <Bar dataKey="r" radius={[3,3,0,0]}>
                        {monthly.map((m, i) => (
                          <Cell key={i} fill={m.r >= 0 ? '#00d97e' : '#ff3d5a'} fillOpacity={0.75} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Session & Setup breakdown */}
            <div className="grid grid-cols-2 gap-4 anim-up anim-up-3">
              <div className="card">
                <div className="card-header"><div className="card-title">Session Performance</div></div>
                <div className="p-4">
                  <table className="data-table">
                    <thead><tr><th>Session</th><th>Trades</th><th>Win%</th><th>Total R</th></tr></thead>
                    <tbody>
                      {Object.entries(stats?.sessionStats || {}).map(([sess, data]) => (
                        <tr key={sess}>
                          <td className="text-slate-300">{sess}</td>
                          <td>{data.count}</td>
                          <td>{data.count > 0 ? Math.round((data.wins/data.count)*100) : 0}%</td>
                          <td className={rClass(data.totalR)}>{fmtR(data.totalR)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Setup Type Performance</div></div>
                <div className="p-4">
                  <table className="data-table">
                    <thead><tr><th>Setup</th><th>Trades</th><th>Win%</th><th>Total R</th></tr></thead>
                    <tbody>
                      {Object.entries(stats?.setupStats || {}).filter(([,d])=>d.count>0).map(([setup, data]) => (
                        <tr key={setup}>
                          <td className="text-slate-300">{setup}</td>
                          <td>{data.count}</td>
                          <td>{data.count > 0 ? Math.round((data.wins/data.count)*100) : 0}%</td>
                          <td className={rClass(data.totalR)}>{fmtR(data.totalR)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Direction + streak */}
            <div className="grid grid-cols-3 gap-4 anim-up anim-up-4">
              <div className="card p-4 space-y-3">
                <div className="card-title">Direction Split</div>
                {[['LONG','text-bull',s?.longWinRate],['SHORT','text-bear',s?.shortWinRate]].map(([d,cls,wr])=>(
                  <div key={d} className="flex items-center justify-between">
                    <span className={`font-mono text-[11px] ${cls}`}>{d}</span>
                    <span className={`font-mono text-[11px] ${cls}`}>{wr}% WR</span>
                  </div>
                ))}
              </div>
              <div className="card p-4 space-y-3">
                <div className="card-title">Streaks</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">Max win streak</span>
                  <span className="font-mono text-[11px] text-bull">{s?.maxWinStreak}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">Max loss streak</span>
                  <span className="font-mono text-[11px] text-bear">{s?.maxLossStreak}</span>
                </div>
              </div>
              <div className="card p-4 space-y-3">
                <div className="card-title">Extremes</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">Best trade</span>
                  <span className="font-mono text-[11px] text-bull">+{s?.bestTrade}R</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">Worst trade</span>
                  <span className="font-mono text-[11px] text-bear">{s?.worstTrade}R</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
