import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Layout from '../components/Layout.js';
import { fmtR, fmtDate, outcomePill, directionIcon, rClass, DIRECTIONS, OUTCOMES } from '../lib/constants.js';

type Trade = Record<string, unknown>;
type Filters = { direction: string; outcome: string; setupType: string; session: string; dateFrom: string; dateTo: string; isBacktest: string; };

const LIMIT = 25;

export default function Trades() {
  const navigate = useNavigate();
  const [trades,  setTrades]  = useState<Trade[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    direction: '', outcome: '', setupType: '', session: '',
    dateFrom: '', dateTo: '', isBacktest: '',
  });

  useEffect(() => { load(); }, [page, filters]);

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: LIMIT };
      Object.entries(filters).forEach(([k, v]) => { if (v !== '') params[k] = v; });
      const res = await api.trades.list(params) as { trades: Trade[]; total: number };
      setTrades(res.trades || []);
      setTotal(res.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function setFilter(k: keyof Filters, v: string) {
    setFilters(f => ({ ...f, [k]: v }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({ direction: '', outcome: '', setupType: '', session: '', dateFrom: '', dateTo: '', isBacktest: '' });
    setPage(1);
  }

  async function deleteTrade(e: React.MouseEvent, id: unknown) {
    e.stopPropagation();
    if (!confirm('Delete this trade?')) return;
    await api.trades.delete(id as number);
    load();
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <Layout>
      <div className="p-6 space-y-5">

        <div className="flex items-end justify-between anim-up">
          <div>
            <div className="font-mono text-[11px] t-muted tracking-[3px] mb-1">JOURNAL</div>
            <h1 className="font-display text-4xl t-primary tracking-widest">TRADE<span className="text-acc"> LOG</span></h1>
          </div>
          <button onClick={() => navigate('/new-trade')} className="btn-bull">+ NEW TRADE</button>
        </div>

        {/* Filters */}
        <div className="card p-4 anim-up anim-up-1">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 items-end">
            <div className="field">
              <label className="label">Direction</label>
              <select className="select" value={filters.direction} onChange={e => setFilter('direction', e.target.value)}>
                <option value="">All</option>
                {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Outcome</label>
              <select className="select" value={filters.outcome} onChange={e => setFilter('outcome', e.target.value)}>
                <option value="">All</option>
                {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Setup</label>
              <input className="input" placeholder="Filter by setup..." value={filters.setupType} onChange={e => setFilter('setupType', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Session</label>
              <input className="input" placeholder="Filter by session..." value={filters.session} onChange={e => setFilter('session', e.target.value)} />
            </div>
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
            <span className="font-mono text-[11px] t-muted">{total} trades found</span>
            <button onClick={clearFilters} className="btn-ghost text-[11px]">CLEAR FILTERS</button>
          </div>
        </div>

        {/* Table */}
        <div className="card anim-up anim-up-2">
          {loading ? (
            <div className="py-16 text-center font-mono text-[12px] t-muted">Loading...</div>
          ) : trades.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="font-display text-2xl t-muted tracking-widest">NO TRADES</div>
              <div className="font-mono text-[12px] t-muted">No trades match your filters</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Date</th><th>Instrument</th><th>Dir</th>
                    <th>Setup</th><th>Session</th><th>Entry</th><th>SL</th>
                    <th>Outcome</th><th>R Result</th><th>Rating</th><th>Type</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t, i) => (
                    <tr key={t.id as number} onClick={() => navigate(`/trades/${t.id}`)}>
                      <td className="t-muted">{(page - 1) * LIMIT + i + 1}</td>
                      <td>{fmtDate(t.tradeDate as string)}</td>
                      <td className="text-acc">{(t.instrument as string) || '—'}</td>
                      <td className={t.direction === 'LONG' ? 'text-bull' : 'text-bear'}>
                        {directionIcon(t.direction as string)} {t.direction as string}
                      </td>
                      <td className="t-muted">{(t.setupType as string) || '—'}</td>
                      <td className="t-muted">{(t.session as string) || '—'}</td>
                      <td>{(t.entryPrice as number) || '—'}</td>
                      <td className="text-bear">{(t.stopLoss as number) || '—'}</td>
                      <td><span className={`pill ${outcomePill(t.outcome as string)}`}>{t.outcome as string}</span></td>
                      <td className={rClass(t.rResult as number)}>{fmtR(t.rResult as number)}</td>
                      <td className="text-gold">{t.rating ? '★'.repeat(t.rating as number) : '—'}</td>
                      <td><span className={`badge ${t.isBacktest ? 'badge-neutral' : 'badge-acc'}`}>{t.isBacktest ? 'BT' : 'LIVE'}</span></td>
                      <td onClick={e => deleteTrade(e, t.id)} className="text-bear hover:opacity-70 px-2 cursor-pointer">✕</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-border">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost">←</button>
              <span className="font-mono text-[12px] t-muted">{page} / {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-ghost">→</button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
