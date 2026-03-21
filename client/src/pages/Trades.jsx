import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Layout from '../components/Layout.jsx';
import { fmtR, fmtDate, outcomePill, sessionColor, directionIcon, rClass, SESSIONS, DIRECTIONS, OUTCOMES, SETUP_TYPES } from '../lib/constants.js';

export default function Trades() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [total,  setTotal]  = useState(0);
  const [page,   setPage]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    session: '', direction: '', outcome: '', setupType: '',
    dateFrom: '', dateTo: '', isBacktest: '',
  });

  const LIMIT = 25;

  useEffect(() => { load(); }, [page, filters]);

  async function load() {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      Object.entries(filters).forEach(([k, v]) => { if (v !== '') params[k] = v; });
      const res = await api.trades.list(params);
      setTrades(res.trades || []);
      setTotal(res.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function setFilter(k, v) {
    setFilters(f => ({ ...f, [k]: v }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({ session:'', direction:'', outcome:'', setupType:'', dateFrom:'', dateTo:'', isBacktest:'' });
    setPage(1);
  }

  async function deleteTrade(e, id) {
    e.stopPropagation();
    if (!confirm('Delete this trade?')) return;
    await api.trades.delete(id);
    load();
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <Layout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-end justify-between anim-up">
          <div>
            <div className="font-mono text-[9px] text-slate-600 tracking-[3px] mb-1">JOURNAL</div>
            <h1 className="font-display text-4xl text-white tracking-widest">TRADE<span className="text-acc"> LOG</span></h1>
          </div>
          <button onClick={() => navigate('/new-trade')} className="btn-bull">+ NEW TRADE</button>
        </div>

        {/* Filters */}
        <div className="card p-4 anim-up anim-up-1">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 items-end">
            {[
              { k: 'session',   opts: SESSIONS,   label: 'Session' },
              { k: 'direction', opts: DIRECTIONS,  label: 'Direction' },
              { k: 'outcome',   opts: OUTCOMES,    label: 'Outcome' },
              { k: 'setupType', opts: SETUP_TYPES, label: 'Setup' },
            ].map(({ k, opts, label }) => (
              <div key={k} className="field">
                <label className="label">{label}</label>
                <select className="select" value={filters[k]} onChange={e => setFilter(k, e.target.value)}>
                  <option value="">All</option>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="field">
              <label className="label">From</label>
              <input type="date" className="input" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">To</label>
              <input type="date" className="input" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Type</label>
              <select className="select" value={filters.isBacktest} onChange={e => setFilter('isBacktest', e.target.value)}>
                <option value="">All</option>
                <option value="true">Backtest</option>
                <option value="false">Live</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="font-mono text-[10px] text-slate-600">{total} trades found</span>
            <button onClick={clearFilters} className="btn-ghost text-[9px]">CLEAR FILTERS</button>
          </div>
        </div>

        {/* Table */}
        <div className="card anim-up anim-up-2">
          {loading ? (
            <div className="py-16 text-center font-mono text-[11px] text-slate-600">Loading...</div>
          ) : trades.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="font-display text-2xl text-slate-600 tracking-widest">NO TRADES</div>
              <div className="font-mono text-[10px] text-slate-600">No trades match your filters</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Date</th><th>Session</th><th>Dir</th>
                    <th>Setup</th><th>H1</th><th>M15</th><th>M5</th>
                    <th>Entry</th><th>SL</th><th>Outcome</th>
                    <th>R Result</th><th>Rating</th><th>Type</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t, i) => (
                    <tr key={t.id} onClick={() => navigate(`/trades/${t.id}`)}>
                      <td className="text-slate-600">{(page-1)*LIMIT + i + 1}</td>
                      <td>{fmtDate(t.tradeDate)}</td>
                      <td className={sessionColor(t.session)}>{t.session}</td>
                      <td className={t.direction === 'LONG' ? 'text-bull' : 'text-bear'}>
                        {directionIcon(t.direction)} {t.direction}
                      </td>
                      <td>{t.setupType}</td>
                      <td className={t.biasH1 === 'BULL' ? 'text-bull' : t.biasH1 === 'BEAR' ? 'text-bear' : 'text-gold'}>
                        {t.biasH1}
                      </td>
                      <td className={t.biasM15 === 'BULL' ? 'text-bull' : t.biasM15 === 'BEAR' ? 'text-bear' : 'text-gold'}>
                        {t.biasM15}
                      </td>
                      <td className={t.biasM5 === 'BULL' ? 'text-bull' : t.biasM5 === 'BEAR' ? 'text-bear' : 'text-gold'}>
                        {t.biasM5}
                      </td>
                      <td className="text-slate-300">{t.entryPrice || '—'}</td>
                      <td className="text-bear">{t.stopLoss || '—'}</td>
                      <td><span className={`pill ${outcomePill(t.outcome)}`}>{t.outcome}</span></td>
                      <td className={rClass(t.rResult)}>{fmtR(t.rResult)}</td>
                      <td className="text-gold">{t.rating ? '★'.repeat(t.rating) : '—'}</td>
                      <td>
                        <span className={`badge ${t.isBacktest ? 'badge-neutral' : 'badge-acc'}`}>
                          {t.isBacktest ? 'BT' : 'LIVE'}
                        </span>
                      </td>
                      <td onClick={e => deleteTrade(e, t.id)} className="text-bear hover:text-bear/70 px-2 cursor-pointer">✕</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-border">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-ghost">←</button>
              <span className="font-mono text-[10px] text-slate-500">{page} / {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} className="btn-ghost">→</button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
