import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import Layout from '../components/Layout.js';

const TODAY = new Date().toISOString().slice(0, 10);
const BIASES = ['Bullish', 'Bearish', 'Neutral', 'Ranging', 'Wait'] as const;

interface Note { content?: string; marketBias?: string; }

export default function Notes() {
  const [date,    setDate]    = useState(TODAY);
  const [content, setContent] = useState('');
  const [bias,    setBias]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => { loadNote(); }, [date]);

  async function loadNote() {
    try {
      const { note } = await api.notes.get(date) as { note: Note | null };
      setContent(note?.content || '');
      setBias(note?.marketBias || '');
    } catch { setContent(''); setBias(''); }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await api.notes.save(date, { content, marketBias: bias });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <Layout>
      <div className="p-6 space-y-5">

        <div className="flex items-end justify-between anim-up">
          <div>
            <div className="font-mono text-[9px] text-slate-600 tracking-[3px] mb-1">PRE-SESSION</div>
            <h1 className="font-display text-4xl text-white tracking-widest">DAILY<span className="text-gold"> NOTES</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <input type="date" className="input w-44" value={date} onChange={e => setDate(e.target.value)} />
            <button onClick={save} disabled={saving} className="btn-primary">
              {saved ? '✓ SAVED' : saving ? 'SAVING...' : 'SAVE NOTE'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5 anim-up anim-up-1">

          {/* Editor */}
          <div className="col-span-2 card">
            <div className="card-header">
              <div className="card-title">Session Notes — {date}</div>
              <div className="font-mono text-[9px] text-slate-600">Click Save to store</div>
            </div>
            <div className="p-5 space-y-4">
              <div className="field">
                <label className="label">Market Bias Today</label>
                <div className="flex gap-2 flex-wrap">
                  {BIASES.map(b => (
                    <button key={b} type="button" onClick={() => setBias(bias === b ? '' : b)}
                      className={`btn text-[10px] ${bias === b ? 'btn-primary' : 'btn-ghost'}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label className="label">Notes</label>
                <textarea rows={16} className="textarea"
                  placeholder={`${date} — Pre-Session Notes\n\nMarket Context:\n- \n\nKey Levels:\n- Resistance: \n- Support: \n\nPlan:\n- Bias: \n- Setups to watch: \n- Risk reminder: \n\nPsychology:\n- How am I feeling?\n- Any biases to watch for?`}
                  value={content} onChange={e => setContent(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-4">
              <div className="card-title mb-3">Pre-Session Checklist</div>
              {[
                'Check economic calendar',
                'Review higher timeframe structure',
                'Mark key support & resistance levels',
                'Identify potential setups',
                'Set daily bias',
                'Review risk parameters',
                "Review yesterday's trades",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border last:border-b-0">
                  <div className="w-4 h-4 mt-0.5 rounded border border-border2 flex-shrink-0" />
                  <span className="font-mono text-[10px] text-slate-500">{item}</span>
                </div>
              ))}
            </div>

            <div className="card p-4">
              <div className="card-title mb-3">Risk Rules</div>
              {[
                ['Risk / trade', '1% max'],
                ['Min R:R',      '1:2'],
                ['Max trades/day', '3'],
                ['Daily stop-out', '-3%'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <span className="font-mono text-[9px] text-slate-500">{k}</span>
                  <span className="font-mono text-[10px] text-gold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
