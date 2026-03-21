import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import Layout from '../components/Layout.jsx';

const TODAY = new Date().toISOString().slice(0, 10);
const BIASES = ['Bullish', 'Bearish', 'Neutral', 'Ranging', 'Wait'];

export default function Notes() {
  const [date, setDate]     = useState(TODAY);
  const [note, setNote]     = useState(null);
  const [content, setContent] = useState('');
  const [bias, setBias]     = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => { loadNote(); }, [date]);

  async function loadNote() {
    try {
      const { note } = await api.notes.get(date);
      setNote(note);
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

          {/* Note editor */}
          <div className="col-span-2 card">
            <div className="card-header">
              <div className="card-title">Session Notes — {date}</div>
              <div className="font-mono text-[9px] text-slate-600">Auto-saves when you click Save</div>
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
                <label className="label">Notes — Market context, key levels, plan for the session</label>
                <textarea
                  rows={16}
                  className="textarea"
                  placeholder={`${date} — London Session Notes\n\nMarket Context:\n- \n\nKey Levels:\n- H1 resistance: \n- H1 support: \n- Order blocks to watch: \n\nSession Plan:\n- Bias: \n- Setups I'm watching: \n- Rules reminder: Trade London open (07:00-10:00) and NY overlap (12:00-15:00) only\n\nPsychology check:\n- How am I feeling today?\n- Any biases to watch for?`}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-4">
              <div className="card-title mb-3">Session Windows (GMT)</div>
              {[
                { name:'🔥 London Open', time:'07:00–10:00', primary:true, col:'text-acc' },
                { name:'London/NY', time:'10:00–12:00', col:'text-slate-400' },
                { name:'🔥 NY Overlap', time:'12:00–15:00', primary:true, col:'text-purple-400' },
                { name:'NY Afternoon', time:'15:00–21:00', col:'text-slate-500' },
                { name:'Asian', time:'00:00–07:00', col:'text-gold' },
              ].map(({ name, time, col, primary }) => (
                <div key={name} className={`flex items-center justify-between py-2 border-b border-border last:border-b-0 ${primary ? '' : 'opacity-60'}`}>
                  <span className={`font-mono text-[10px] ${col}`}>{name}</span>
                  <span className="font-mono text-[9px] text-slate-600">{time}</span>
                </div>
              ))}
            </div>

            <div className="card p-4">
              <div className="card-title mb-3">Pre-Session Checklist</div>
              {[
                'Check economic calendar',
                'Mark H1 swing structure',
                'Identify key OBs on M15',
                'Note EQH / EQL levels',
                'Set daily bias (bull/bear/neutral)',
                'Review risk parameters (1% max)',
                'Check yesterday\'s trades',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border last:border-b-0">
                  <div className="w-4 h-4 mt-0.5 rounded border border-border2 flex-shrink-0" />
                  <span className="font-mono text-[10px] text-slate-500">{item}</span>
                </div>
              ))}
            </div>

            <div className="card p-4">
              <div className="card-title mb-3">Risk Reminder</div>
              {[
                ['Risk / trade', '1% max'],
                ['Min R:R', '1:2'],
                ['Max trades/day', '3'],
                ['Daily stop-out', '-3%'],
              ].map(([k,v]) => (
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
