import { useState, useEffect, ReactNode, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import Layout from '../components/Layout.js';
import { DIRECTIONS, OUTCOMES, EMOTIONS, RATINGS } from '../lib/constants.js';

type FormState = {
  tradeDate: string; tradeTime: string;
  instrument: string; direction: string;
  setupType: string; session: string;
  entryPrice: string; stopLoss: string; takeProfit1: string; takeProfit2: string; exitPrice: string;
  riskPercent: number; outcome: string; rResult: string | number; pips: string; pnlUsd: string;
  preAnalysis: string; postAnalysis: string; mistakes: string;
  rating: number; emotionBefore: string; emotionDuring: string; emotionAfter: string;
  screenshotUrl: string; isBacktest: boolean;
};

const DEFAULTS: FormState = {
  tradeDate: new Date().toISOString().slice(0, 10),
  tradeTime: '', instrument: '', direction: 'LONG',
  setupType: '', session: '',
  entryPrice: '', stopLoss: '', takeProfit1: '', takeProfit2: '', exitPrice: '',
  riskPercent: 1.0, outcome: 'RUNNING', rResult: '', pips: '', pnlUsd: '',
  preAnalysis: '', postAnalysis: '', mistakes: '',
  rating: 0, emotionBefore: '', emotionDuring: '', emotionAfter: '',
  screenshotUrl: '', isBacktest: false,
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="card-header bg-bg3/50"><div className="card-title">{title}</div></div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{children}</div>;
}

export default function TradeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm]       = useState<FormState>(DEFAULTS);
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    api.trades.get(id!).then((res) => {
      const trade = (res as { trade: Record<string, unknown> }).trade;
      setForm({
        ...DEFAULTS,
        ...Object.fromEntries(Object.entries(trade).map(([k, v]) => [k, v ?? (DEFAULTS as Record<string, unknown>)[k] ?? ''])),
      } as FormState);
      setLoading(false);
    }).catch(() => navigate('/trades'));
  }, [id]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  // Auto-calc R result from prices
  useEffect(() => {
    const entry = parseFloat(form.entryPrice as string);
    const sl    = parseFloat(form.stopLoss as string);
    const exit  = parseFloat(form.exitPrice as string);
    if (!entry || !sl || !exit) return;
    const risk    = Math.abs(entry - sl);
    const pnl     = form.direction === 'LONG' ? exit - entry : entry - exit;
    const rResult = risk > 0 ? parseFloat((pnl / risk).toFixed(2)) : 0;
    setForm(f => ({ ...f, rResult }));
  }, [form.entryPrice, form.stopLoss, form.exitPrice, form.direction]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        entryPrice:  form.entryPrice  ? parseFloat(form.entryPrice as string)  : null,
        stopLoss:    form.stopLoss    ? parseFloat(form.stopLoss as string)    : null,
        takeProfit1: form.takeProfit1 ? parseFloat(form.takeProfit1 as string) : null,
        takeProfit2: form.takeProfit2 ? parseFloat(form.takeProfit2 as string) : null,
        exitPrice:   form.exitPrice   ? parseFloat(form.exitPrice as string)   : null,
        rResult:     form.rResult !== '' ? parseFloat(form.rResult as string)  : null,
        pips:        form.pips        ? parseFloat(form.pips as string)        : null,
        pnlUsd:      form.pnlUsd      ? parseFloat(form.pnlUsd as string)      : null,
        riskPercent: parseFloat(String(form.riskPercent)) || 1.0,
        rating:      form.rating      ? parseInt(String(form.rating))          : null,
      };
      if (isEdit) {
        await api.trades.update(id!, payload);
      } else {
        await api.trades.create(payload);
      }
      navigate('/trades');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save trade');
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
            <div className="bg-bear/10 border border-bear/20 rounded-lg px-4 py-2.5 font-mono text-[11px] text-bear">{error}</div>
          )}

          {/* Basics */}
          <Section title="Trade Details">
            <Row>
              <div className="field">
                <label className="label">Date *</label>
                <input type="date" required className="input" value={form.tradeDate} onChange={e => set('tradeDate', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Time</label>
                <input type="time" className="input" value={form.tradeTime} onChange={e => set('tradeTime', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Instrument</label>
                <input className="input" placeholder="EURUSD, BTC, AAPL..." value={form.instrument} onChange={e => set('instrument', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Session</label>
                <input className="input" placeholder="London, NY, Asian..." value={form.session} onChange={e => set('session', e.target.value)} />
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
                <label className="label">Setup Type</label>
                <input className="input" placeholder="Breakout, Reversal, OB..." value={form.setupType} onChange={e => set('setupType', e.target.value)} />
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
                <input type="number" step="0.1" className="input" value={form.riskPercent} onChange={e => set('riskPercent', parseFloat(e.target.value))} />
              </div>
            </Row>
          </Section>

          {/* Levels */}
          <Section title="Price Levels & Result">
            <Row>
              <div className="field"><label className="label">Entry Price</label>
                <input type="number" step="any" className="input" value={form.entryPrice} onChange={e => set('entryPrice', e.target.value)} /></div>
              <div className="field"><label className="label">Stop Loss</label>
                <input type="number" step="any" className="input" value={form.stopLoss} onChange={e => set('stopLoss', e.target.value)} /></div>
              <div className="field"><label className="label">Take Profit 1</label>
                <input type="number" step="any" className="input" value={form.takeProfit1} onChange={e => set('takeProfit1', e.target.value)} /></div>
              <div className="field"><label className="label">Take Profit 2</label>
                <input type="number" step="any" className="input" value={form.takeProfit2} onChange={e => set('takeProfit2', e.target.value)} /></div>
            </Row>
            <Row>
              <div className="field"><label className="label">Exit Price</label>
                <input type="number" step="any" className="input" value={form.exitPrice} onChange={e => set('exitPrice', e.target.value)} /></div>
              <div className="field"><label className="label">Outcome *</label>
                <select required className="select" value={form.outcome} onChange={e => set('outcome', e.target.value)}>
                  {OUTCOMES.map(o => <option key={o}>{o}</option>)}
                </select></div>
              <div className="field"><label className="label">R Result (auto-calc)</label>
                <input type="number" step="0.01" className="input" value={form.rResult} onChange={e => set('rResult', e.target.value)} /></div>
              <div className="field"><label className="label">Pips / Points</label>
                <input type="number" step="any" className="input" value={form.pips} onChange={e => set('pips', e.target.value)} /></div>
            </Row>
          </Section>

          {/* Journal */}
          <Section title="Trade Journal">
            <div className="field">
              <label className="label">Pre-Trade Analysis</label>
              <textarea rows={4} className="textarea" placeholder="Why are you taking this trade? What's your thesis?" value={form.preAnalysis} onChange={e => set('preAnalysis', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Post-Trade Analysis</label>
              <textarea rows={4} className="textarea" placeholder="How did the trade play out? What did you learn?" value={form.postAnalysis} onChange={e => set('postAnalysis', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Mistakes & Rule Violations</label>
              <textarea rows={3} className="textarea" placeholder="Did you deviate from your plan? Be honest." value={form.mistakes} onChange={e => set('mistakes', e.target.value)} />
            </div>
          </Section>

          {/* Psychology */}
          <Section title="Psychology & Rating">
            <Row>
              {([['emotionBefore','Emotion Before'],['emotionDuring','Emotion During'],['emotionAfter','Emotion After']] as [keyof FormState, string][]).map(([k, label]) => (
                <div key={k as string} className="field">
                  <label className="label">{label}</label>
                  <select className="select" value={form[k] as string} onChange={e => set(k, e.target.value as FormState[typeof k])}>
                    <option value="">Select...</option>
                    {EMOTIONS.map(em => <option key={em}>{em}</option>)}
                  </select>
                </div>
              ))}
              <div className="field">
                <label className="label">Trade Quality (1–5)</label>
                <div className="flex gap-1 mt-1">
                  {RATINGS.map(r => (
                    <button key={r} type="button"
                      onClick={() => set('rating', form.rating === r ? 0 : r)}
                      className={`w-9 h-9 rounded-lg border font-mono text-sm transition-all ${form.rating >= r ? 'bg-gold/15 border-gold/30 text-gold' : 'bg-bg3 border-border text-slate-600 hover:border-gold/20'}`}>
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
