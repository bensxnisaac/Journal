import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import Layout from '../components/Layout.jsx';
import { SESSIONS, DIRECTIONS, OUTCOMES, SETUP_TYPES, BIASES, EMOTIONS, RATINGS } from '../lib/constants.js';

const DEFAULTS = {
  tradeDate: new Date().toISOString().slice(0, 10),
  tradeTime: '', session: 'London', pair: 'EURUSD',
  direction: 'LONG', setupType: 'OB+BOS',
  biasH1: 'BULL', biasM15: 'BULL', biasM5: 'BULL',
  hasSwingBos: true, hasDiscountZone: false, hasOrderBlock: true,
  hasFvg: false, hasChoch: true, hasIbos: true,
  entryPrice: '', stopLoss: '', takeProfit1: '', takeProfit2: '', exitPrice: '',
  riskPercent: 1.0, outcome: 'RUNNING', rResult: '', pips: '', pnlUsd: '',
  preAnalysis: '', postAnalysis: '', mistakes: '',
  rating: 0, emotionBefore: '', emotionDuring: '', emotionAfter: '',
  screenshotUrl: '', isBacktest: false,
};

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        onClick={onChange}
        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all
          ${checked ? 'bg-bull border-bull' : 'border-border2 group-hover:border-bull/40'}`}
      >
        {checked && <span className="text-black text-[9px] font-bold">✓</span>}
      </div>
      <span className="font-mono text-[10px] text-slate-400 group-hover:text-slate-300 select-none">{label}</span>
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="card-header bg-bg3/50">
        <div className="card-title">{title}</div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Row({ children }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{children}</div>;
}

export default function TradeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(DEFAULTS);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    api.trades.get(id).then(({ trade }) => {
      setForm({
        ...DEFAULTS,
        ...Object.fromEntries(Object.entries(trade).map(([k, v]) => [k, v ?? DEFAULTS[k] ?? ''])),
      });
      setLoading(false);
    }).catch(() => navigate('/trades'));
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const tog = (k) => setForm(f => ({ ...f, [k]: !f[k] }));

  // Auto-calc R result from prices
  useEffect(() => {
    const entry = parseFloat(form.entryPrice);
    const sl    = parseFloat(form.stopLoss);
    const exit  = parseFloat(form.exitPrice);
    if (!entry || !sl || !exit) return;
    const risk   = Math.abs(entry - sl);
    const pnl    = form.direction === 'LONG' ? exit - entry : entry - exit;
    const rResult = risk > 0 ? parseFloat((pnl / risk).toFixed(2)) : 0;
    setForm(f => ({ ...f, rResult }));
  }, [form.entryPrice, form.stopLoss, form.exitPrice, form.direction]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        entryPrice:   form.entryPrice   ? parseFloat(form.entryPrice)   : null,
        stopLoss:     form.stopLoss     ? parseFloat(form.stopLoss)     : null,
        takeProfit1:  form.takeProfit1  ? parseFloat(form.takeProfit1)  : null,
        takeProfit2:  form.takeProfit2  ? parseFloat(form.takeProfit2)  : null,
        exitPrice:    form.exitPrice    ? parseFloat(form.exitPrice)    : null,
        rResult:      form.rResult !== '' ? parseFloat(form.rResult)    : null,
        pips:         form.pips         ? parseFloat(form.pips)         : null,
        pnlUsd:       form.pnlUsd       ? parseFloat(form.pnlUsd)       : null,
        riskPercent:  parseFloat(form.riskPercent) || 1.0,
        rating:       form.rating       ? parseInt(form.rating)         : null,
      };
      if (isEdit) {
        await api.trades.update(id, payload);
      } else {
        await api.trades.create(payload);
      }
      navigate('/trades');
    } catch (err) {
      setError(err.message || 'Failed to save trade');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Layout><div className="p-6 font-mono text-[11px] text-slate-600">Loading...</div></Layout>;

  return (
    <Layout>
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-5">

          {/* Header */}
          <div className="flex items-end justify-between anim-up">
            <div>
              <div className="font-mono text-[9px] text-slate-600 tracking-[3px] mb-1">TRADE JOURNAL</div>
              <h1 className="font-display text-4xl text-white tracking-widest">
                {isEdit ? 'EDIT' : 'NEW'}<span className="text-bull"> TRADE</span>
              </h1>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => navigate(-1)} className="btn-ghost">CANCEL</button>
              <button type="submit" disabled={saving} className="btn-bull">
                {saving ? 'SAVING...' : isEdit ? 'UPDATE TRADE' : 'LOG TRADE'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-bear/10 border border-bear/20 rounded-lg px-4 py-2.5 font-mono text-[11px] text-bear">
              {error}
            </div>
          )}

          {/* ── SECTION 1: Basics */}
          <Section title="Trade Basics">
            <Row>
              <div className="field">
                <label className="label">Date *</label>
                <input type="date" required className="input" value={form.tradeDate} onChange={e => set('tradeDate', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Time (GMT)</label>
                <input type="time" className="input" value={form.tradeTime} onChange={e => set('tradeTime', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Session *</label>
                <select required className="select" value={form.session} onChange={e => set('session', e.target.value)}>
                  {SESSIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Pair</label>
                <input className="input" value={form.pair} onChange={e => set('pair', e.target.value)} />
              </div>
            </Row>
            <Row>
              <div className="field">
                <label className="label">Direction *</label>
                <select required className="select" value={form.direction} onChange={e => set('direction', e.target.value)}>
                  {DIRECTIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Setup Type *</label>
                <select required className="select" value={form.setupType} onChange={e => set('setupType', e.target.value)}>
                  {SETUP_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Type</label>
                <select className="select" value={form.isBacktest ? 'backtest' : 'live'} onChange={e => set('isBacktest', e.target.value === 'backtest')}>
                  <option value="live">Live Trade</option>
                  <option value="backtest">Backtest</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Risk %</label>
                <input type="number" step="0.1" className="input" value={form.riskPercent} onChange={e => set('riskPercent', e.target.value)} />
              </div>
            </Row>
          </Section>

          {/* ── SECTION 2: MTF Bias */}
          <Section title="Multi-Timeframe Bias">
            <Row>
              {[['biasH1','H1 Bias *'],['biasM15','M15 Bias *'],['biasM5','M5 Bias *']].map(([k, label]) => (
                <div key={k} className="field">
                  <label className="label">{label}</label>
                  <select required className="select" value={form[k]} onChange={e => set(k, e.target.value)}>
                    {BIASES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              ))}
            </Row>
          </Section>

          {/* ── SECTION 3: SMC Confluence */}
          <Section title="SMC Confluence Checklist">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Checkbox label="H1 Swing BOS confirmed" checked={form.hasSwingBos} onChange={() => tog('hasSwingBos')} />
              <Checkbox label="Price in Discount / Premium zone" checked={form.hasDiscountZone} onChange={() => tog('hasDiscountZone')} />
              <Checkbox label="M15 Order Block identified" checked={form.hasOrderBlock} onChange={() => tog('hasOrderBlock')} />
              <Checkbox label="Fair Value Gap (FVG) present" checked={form.hasFvg} onChange={() => tog('hasFvg')} />
              <Checkbox label="M5 CHoCH confirmed" checked={form.hasChoch} onChange={() => tog('hasChoch')} />
              <Checkbox label="M5 internal BOS printed" checked={form.hasIbos} onChange={() => tog('hasIbos')} />
            </div>
            <div className="mt-2">
              <div className="font-mono text-[9px] text-slate-500">
                Confluence score: <span className={
                  [form.hasSwingBos,form.hasDiscountZone,form.hasOrderBlock,form.hasFvg,form.hasChoch,form.hasIbos].filter(Boolean).length >= 5
                    ? 'text-bull' : 'text-gold'
                }>
                  {[form.hasSwingBos,form.hasDiscountZone,form.hasOrderBlock,form.hasFvg,form.hasChoch,form.hasIbos].filter(Boolean).length}/6
                </span>
                {[form.hasSwingBos,form.hasDiscountZone,form.hasOrderBlock,form.hasFvg,form.hasChoch,form.hasIbos].filter(Boolean).length >= 5 && (
                  <span className="text-bull ml-2">✓ A+ Setup</span>
                )}
              </div>
            </div>
          </Section>

          {/* ── SECTION 4: Levels */}
          <Section title="Price Levels & Result">
            <Row>
              <div className="field">
                <label className="label">Entry Price</label>
                <input type="number" step="0.00001" className="input" placeholder="1.15680" value={form.entryPrice} onChange={e => set('entryPrice', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Stop Loss</label>
                <input type="number" step="0.00001" className="input" placeholder="1.15480" value={form.stopLoss} onChange={e => set('stopLoss', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Take Profit 1</label>
                <input type="number" step="0.00001" className="input" placeholder="1.16080" value={form.takeProfit1} onChange={e => set('takeProfit1', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Take Profit 2</label>
                <input type="number" step="0.00001" className="input" placeholder="1.16280" value={form.takeProfit2} onChange={e => set('takeProfit2', e.target.value)} />
              </div>
            </Row>
            <Row>
              <div className="field">
                <label className="label">Exit Price</label>
                <input type="number" step="0.00001" className="input" placeholder="1.16080" value={form.exitPrice} onChange={e => set('exitPrice', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Outcome *</label>
                <select required className="select" value={form.outcome} onChange={e => set('outcome', e.target.value)}>
                  {OUTCOMES.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">R Result (auto-calc)</label>
                <input type="number" step="0.01" className="input" value={form.rResult} onChange={e => set('rResult', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Pips</label>
                <input type="number" step="0.1" className="input" value={form.pips} onChange={e => set('pips', e.target.value)} />
              </div>
            </Row>
          </Section>

          {/* ── SECTION 5: Journal */}
          <Section title="Trade Journal — The Edge Builder">
            <div className="field">
              <label className="label">Pre-Trade Analysis — Your Plan Before Entry</label>
              <textarea rows={4} className="textarea" placeholder="Why are you taking this trade? What do you see on H1? Where is the OB? What's your M5 confirmation plan?" value={form.preAnalysis} onChange={e => set('preAnalysis', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Post-Trade Analysis — What Actually Happened</label>
              <textarea rows={4} className="textarea" placeholder="How did the trade play out? Did price respect the OB? Did the M5 CHoCH print cleanly? Were your targets hit?" value={form.postAnalysis} onChange={e => set('postAnalysis', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Mistakes & Rule Violations</label>
              <textarea rows={3} className="textarea" placeholder="Did you enter too early? Move your SL? Trade outside session hours? Be honest — this is where improvement lives." value={form.mistakes} onChange={e => set('mistakes', e.target.value)} />
            </div>
          </Section>

          {/* ── SECTION 6: Psychology */}
          <Section title="Psychology & Rating">
            <Row>
              {[['emotionBefore','Emotion Before'],['emotionDuring','Emotion During'],['emotionAfter','Emotion After']].map(([k,label]) => (
                <div key={k} className="field">
                  <label className="label">{label}</label>
                  <select className="select" value={form[k]} onChange={e => set(k, e.target.value)}>
                    <option value="">Select...</option>
                    {EMOTIONS.map(em => <option key={em}>{em}</option>)}
                  </select>
                </div>
              ))}
              <div className="field">
                <label className="label">Trade Quality (1-5)</label>
                <div className="flex gap-1 mt-1">
                  {RATINGS.map(r => (
                    <button key={r} type="button"
                      onClick={() => set('rating', form.rating === r ? 0 : r)}
                      className={`w-9 h-9 rounded-lg border font-mono text-sm transition-all
                        ${form.rating >= r ? 'bg-gold/15 border-gold/30 text-gold' : 'bg-bg3 border-border text-slate-600 hover:border-gold/20'}`}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </Row>
            <div className="field">
              <label className="label">Screenshot URL (optional)</label>
              <input type="url" className="input" placeholder="https://..." value={form.screenshotUrl} onChange={e => set('screenshotUrl', e.target.value)} />
            </div>
          </Section>

          {/* Submit */}
          <div className="flex gap-3 justify-end pb-4">
            <button type="button" onClick={() => navigate(-1)} className="btn-ghost">CANCEL</button>
            <button type="submit" disabled={saving} className="btn-bull px-8">
              {saving ? 'SAVING...' : isEdit ? 'UPDATE TRADE' : 'LOG TRADE'}
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
