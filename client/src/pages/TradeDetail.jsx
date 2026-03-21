import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import Layout from '../components/Layout.jsx';
import { fmtR, fmtDate, outcomePill, sessionColor, directionIcon, rClass, biasClass } from '../lib/constants.js';

function DetailRow({ label, value, valueClass = 'text-slate-300' }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-b-0">
      <span className="font-mono text-[9px] text-slate-500 tracking-[1px] uppercase shrink-0 w-36">{label}</span>
      <span className={`font-mono text-[11px] ${valueClass} text-right ml-4`}>{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card">
      <div className="card-header"><div className="card-title">{title}</div></div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function ConfluenceDot({ label, active }) {
  return (
    <div className={`flex items-center gap-2 py-2 px-3 rounded-lg border transition-colors
      ${active ? 'bg-bull/8 border-bull/20' : 'bg-bg3 border-border'}`}>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-bull' : 'bg-slate-600'}`} />
      <span className={`font-mono text-[10px] ${active ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
    </div>
  );
}

export default function TradeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.trades.get(id)
      .then(({ trade }) => { setTrade(trade); setLoading(false); })
      .catch(() => navigate('/trades'));
  }, [id]);

  async function handleDelete() {
    if (!confirm('Delete this trade permanently?')) return;
    await api.trades.delete(id);
    navigate('/trades');
  }

  if (loading) return <Layout><div className="p-6 font-mono text-[11px] text-slate-600">Loading...</div></Layout>;
  if (!trade)  return null;

  const confluenceScore = [
    trade.hasSwingBos, trade.hasDiscountZone, trade.hasOrderBlock,
    trade.hasFvg, trade.hasChoch, trade.hasIbos,
  ].filter(Boolean).length;

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
              <h1 className="font-display text-4xl text-white tracking-widest">{fmtDate(trade.tradeDate)}</h1>
              <span className={`pill ${outcomePill(trade.outcome)} text-sm`}>{trade.outcome}</span>
              <span className={`font-display text-3xl ${rClass(trade.rResult)}`}>{fmtR(trade.rResult)}</span>
              {trade.isBacktest && <span className="badge-neutral">BACKTEST</span>}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className={`font-mono text-[11px] ${sessionColor(trade.session)}`}>{trade.session}</span>
              <span className="text-slate-600">·</span>
              <span className={`font-mono text-[11px] ${trade.direction === 'LONG' ? 'text-bull' : 'text-bear'}`}>
                {directionIcon(trade.direction)} {trade.direction}
              </span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-[11px] text-slate-400">{trade.setupType}</span>
              {trade.tradeTime && <><span className="text-slate-600">·</span><span className="font-mono text-[11px] text-slate-500">{trade.tradeTime} GMT</span></>}
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

            {/* MTF Bias */}
            <Section title="Multi-Timeframe Bias">
              <div className="grid grid-cols-3 gap-4 py-4">
                {[['H1','biasH1'],['M15','biasM15'],['M5','biasM5']].map(([tf,k]) => (
                  <div key={tf} className="text-center">
                    <div className="font-mono text-[9px] text-slate-600 mb-1">{tf}</div>
                    <div className={`font-display text-2xl tracking-widest ${biasClass(trade[k])}`}>
                      {trade[k] === 'BULL' ? '▲' : trade[k] === 'BEAR' ? '▼' : '—'} {trade[k]}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Confluence */}
            <Section title={`SMC Confluence — ${confluenceScore}/6`}>
              <div className="grid grid-cols-2 gap-2 py-4">
                <ConfluenceDot label="H1 Swing BOS" active={trade.hasSwingBos} />
                <ConfluenceDot label="Discount / Premium Zone" active={trade.hasDiscountZone} />
                <ConfluenceDot label="M15 Order Block" active={trade.hasOrderBlock} />
                <ConfluenceDot label="Fair Value Gap (FVG)" active={trade.hasFvg} />
                <ConfluenceDot label="M5 CHoCH" active={trade.hasChoch} />
                <ConfluenceDot label="M5 Internal BOS" active={trade.hasIbos} />
              </div>
            </Section>

            {/* Journal */}
            {(trade.preAnalysis || trade.postAnalysis || trade.mistakes) && (
              <div className="card">
                <div className="card-header"><div className="card-title">Trade Journal</div></div>
                <div className="p-5 space-y-5">
                  {trade.preAnalysis && (
                    <div>
                      <div className="font-mono text-[9px] text-acc tracking-[2px] mb-2">PRE-TRADE ANALYSIS</div>
                      <p className="font-mono text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{trade.preAnalysis}</p>
                    </div>
                  )}
                  {trade.postAnalysis && (
                    <div>
                      <div className="font-mono text-[9px] text-bull tracking-[2px] mb-2">POST-TRADE ANALYSIS</div>
                      <p className="font-mono text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{trade.postAnalysis}</p>
                    </div>
                  )}
                  {trade.mistakes && (
                    <div>
                      <div className="font-mono text-[9px] text-bear tracking-[2px] mb-2">MISTAKES & RULE VIOLATIONS</div>
                      <p className="font-mono text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{trade.mistakes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Screenshot */}
            {trade.screenshotUrl && (
              <div className="card">
                <div className="card-header"><div className="card-title">Chart Screenshot</div></div>
                <div className="p-4">
                  <img src={trade.screenshotUrl} alt="Trade chart" className="rounded-lg w-full object-contain max-h-96 border border-border" />
                </div>
              </div>
            )}
          </div>

          {/* Right col */}
          <div className="space-y-4">

            {/* Levels */}
            <Section title="Price Levels">
              <DetailRow label="Entry" value={trade.entryPrice} valueClass="text-slate-200" />
              <DetailRow label="Stop Loss" value={trade.stopLoss} valueClass="text-bear" />
              <DetailRow label="TP 1" value={trade.takeProfit1} valueClass="text-bull" />
              <DetailRow label="TP 2" value={trade.takeProfit2} valueClass="text-bull" />
              <DetailRow label="Exit" value={trade.exitPrice} valueClass="text-slate-200" />
            </Section>

            {/* Result */}
            <Section title="Result">
              <DetailRow label="Outcome" value={trade.outcome}
                valueClass={trade.outcome==='WIN'?'text-bull':trade.outcome==='LOSS'?'text-bear':'text-gold'} />
              <DetailRow label="R Result" value={fmtR(trade.rResult)} valueClass={rClass(trade.rResult)} />
              <DetailRow label="Pips" value={trade.pips} />
              <DetailRow label="P&L (USD)" value={trade.pnlUsd ? `$${trade.pnlUsd}` : null} />
              <DetailRow label="Risk %" value={`${trade.riskPercent}%`} />
            </Section>

            {/* Psychology */}
            {(trade.emotionBefore || trade.emotionDuring || trade.emotionAfter || trade.rating) && (
              <Section title="Psychology">
                <DetailRow label="Before" value={trade.emotionBefore} />
                <DetailRow label="During" value={trade.emotionDuring} />
                <DetailRow label="After"  value={trade.emotionAfter} />
                {trade.rating > 0 && (
                  <DetailRow label="Quality" value={'★'.repeat(trade.rating) + '☆'.repeat(5-trade.rating)} valueClass="text-gold" />
                )}
              </Section>
            )}

            {/* Metadata */}
            <Section title="Metadata">
              <DetailRow label="Logged" value={new Date(trade.createdAt).toLocaleDateString()} />
              <DetailRow label="Updated" value={new Date(trade.updatedAt).toLocaleDateString()} />
              <DetailRow label="Type" value={trade.isBacktest ? 'Backtest' : 'Live'} />
            </Section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
