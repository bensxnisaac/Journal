import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import Layout from '../components/Layout.js';
import { fmtR, fmtDate, outcomePill, rClass, directionIcon } from '../lib/constants.js';

type Trade = Record<string, unknown>;

function DetailRow({ label, value, valueClass = 'text-slate-300' }: { label: string; value: unknown; valueClass?: string }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-b-0">
      <span className="font-mono text-[9px] text-slate-500 tracking-[1px] uppercase shrink-0 w-36">{label}</span>
      <span className={`font-mono text-[11px] ${valueClass} text-right ml-4`}>{String(value)}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card">
      <div className="card-header"><div className="card-title">{title}</div></div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade]   = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.trades.get(id!)
      .then((res) => { setTrade((res as { trade: Trade }).trade); setLoading(false); })
      .catch(() => navigate('/trades'));
  }, [id]);

  async function handleDelete() {
    if (!confirm('Delete this trade permanently?')) return;
    await api.trades.delete(id!);
    navigate('/trades');
  }

  if (loading) return <Layout><div className="p-6 font-mono text-[11px] text-slate-600">Loading...</div></Layout>;
  if (!trade)  return null;

  return (
    <Layout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between anim-up">
          <div>
            <button onClick={() => navigate('/trades')} className="font-mono text-[9px] text-slate-600 hover:text-slate-400 mb-3 flex items-center gap-1 transition-colors">
              ← BACK TO LOG
            </button>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-4xl text-white tracking-widest">{fmtDate(trade.tradeDate as string)}</h1>
              <span className={`pill ${outcomePill(trade.outcome as string)} text-sm`}>{trade.outcome as string}</span>
              <span className={`font-display text-3xl ${rClass(trade.rResult as number)}`}>{fmtR(trade.rResult as number)}</span>
              {!!trade.isBacktest && <span className="badge-neutral">BACKTEST</span>}
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {!!(trade.instrument) && <span className="font-mono text-[11px] text-acc">{trade.instrument as string}</span>}
              {!!(trade.instrument) && <span className="text-slate-600">·</span>}
              <span className={`font-mono text-[11px] ${trade.direction === 'LONG' ? 'text-bull' : 'text-bear'}`}>
                {directionIcon(trade.direction as string)} {trade.direction as string}
              </span>
              {!!(trade.setupType) && <><span className="text-slate-600">·</span><span className="font-mono text-[11px] text-slate-400">{trade.setupType as string}</span></>}
              {!!(trade.session) && <><span className="text-slate-600">·</span><span className="font-mono text-[11px] text-slate-500">{trade.session as string}</span></>}
              {!!(trade.tradeTime) && <><span className="text-slate-600">·</span><span className="font-mono text-[11px] text-slate-500">{trade.tradeTime as string}</span></>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/trades/${id}/edit`)} className="btn-primary">EDIT</button>
            <button onClick={handleDelete} className="btn-danger">DELETE</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">

          {/* Left col */}
          <div className="col-span-2 space-y-4">

            {/* Journal */}
            {!!(trade.preAnalysis || trade.postAnalysis || trade.mistakes) && (
              <div className="card">
                <div className="card-header"><div className="card-title">Trade Journal</div></div>
                <div className="p-5 space-y-5">
                  {!!trade.preAnalysis && (
                    <div>
                      <div className="font-mono text-[9px] text-acc tracking-[2px] mb-2">PRE-TRADE ANALYSIS</div>
                      <p className="font-mono text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{trade.preAnalysis as string}</p>
                    </div>
                  )}
                  {!!trade.postAnalysis && (
                    <div>
                      <div className="font-mono text-[9px] text-bull tracking-[2px] mb-2">POST-TRADE ANALYSIS</div>
                      <p className="font-mono text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{trade.postAnalysis as string}</p>
                    </div>
                  )}
                  {!!trade.mistakes && (
                    <div>
                      <div className="font-mono text-[9px] text-bear tracking-[2px] mb-2">MISTAKES & RULE VIOLATIONS</div>
                      <p className="font-mono text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{trade.mistakes as string}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Screenshot */}
            {!!trade.screenshotUrl && (
              <div className="card">
                <div className="card-header"><div className="card-title">Chart Screenshot</div></div>
                <div className="p-4">
                  <img src={trade.screenshotUrl as string} alt="Trade chart" className="rounded-lg w-full object-contain max-h-96 border border-border" />
                </div>
              </div>
            )}
          </div>

          {/* Right col */}
          <div className="space-y-4">

            <Section title="Price Levels">
              <DetailRow label="Entry"     value={trade.entryPrice}  valueClass="text-slate-200" />
              <DetailRow label="Stop Loss" value={trade.stopLoss}    valueClass="text-bear" />
              <DetailRow label="TP 1"      value={trade.takeProfit1} valueClass="text-bull" />
              <DetailRow label="TP 2"      value={trade.takeProfit2} valueClass="text-bull" />
              <DetailRow label="Exit"      value={trade.exitPrice}   valueClass="text-slate-200" />
            </Section>

            <Section title="Result">
              <DetailRow label="Outcome"  value={trade.outcome as string}
                valueClass={trade.outcome==='WIN'?'text-bull':trade.outcome==='LOSS'?'text-bear':'text-gold'} />
              <DetailRow label="R Result" value={fmtR(trade.rResult as number)} valueClass={rClass(trade.rResult as number)} />
              <DetailRow label="Pips / Pts" value={trade.pips} />
              <DetailRow label="P&L (USD)" value={trade.pnlUsd ? `$${trade.pnlUsd}` : null} />
              <DetailRow label="Risk %"   value={`${trade.riskPercent}%`} />
            </Section>

            {!!(trade.emotionBefore || trade.emotionDuring || trade.emotionAfter || trade.rating) && (
              <Section title="Psychology">
                <DetailRow label="Before" value={trade.emotionBefore} />
                <DetailRow label="During" value={trade.emotionDuring} />
                <DetailRow label="After"  value={trade.emotionAfter} />
                {(trade.rating as number) > 0 && (
                  <DetailRow label="Quality" value={'★'.repeat(trade.rating as number) + '☆'.repeat(5 - (trade.rating as number))} valueClass="text-gold" />
                )}
              </Section>
            )}

            <Section title="Metadata">
              <DetailRow label="Logged"  value={new Date(trade.createdAt as string).toLocaleDateString()} />
              <DetailRow label="Updated" value={new Date(trade.updatedAt as string).toLocaleDateString()} />
              <DetailRow label="Type"    value={trade.isBacktest ? 'Backtest' : 'Live'} />
            </Section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
