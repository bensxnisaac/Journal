export const SESSIONS   = ['London', 'NY Overlap', 'Asian', 'Other'];
export const DIRECTIONS = ['LONG', 'SHORT'];
export const OUTCOMES   = ['WIN', 'LOSS', 'BE', 'RUNNING'];
export const SETUP_TYPES = ['OB+BOS', 'OB+FVG', 'FVG+CHoCH', 'EQH/EQL', 'Other'];
export const BIASES     = ['BULL', 'BEAR', 'NEUTRAL'];
export const EMOTIONS   = ['Calm', 'Focused', 'Anxious', 'FOMO', 'Revenge', 'Overconfident', 'Hesitant'];
export const RATINGS    = [1, 2, 3, 4, 5];

export function outcomeClass(outcome) {
  return outcome === 'WIN' ? 'text-bull' : outcome === 'LOSS' ? 'text-bear' : outcome === 'BE' ? 'text-gold' : 'text-slate-400';
}

export function outcomePill(outcome) {
  return outcome === 'WIN'  ? 'pill-bull'
       : outcome === 'LOSS' ? 'pill-bear'
       : outcome === 'BE'   ? 'pill-gold'
       : 'pill-neutral';
}

export function biasClass(bias) {
  return bias === 'BULL' ? 'text-bull' : bias === 'BEAR' ? 'text-bear' : 'text-gold';
}

export function rClass(r) {
  if (r == null) return 'text-slate-500';
  return r > 0 ? 'text-bull' : r < 0 ? 'text-bear' : 'text-gold';
}

export function fmtR(r) {
  if (r == null) return '—';
  return (r > 0 ? '+' : '') + r.toFixed(2) + 'R';
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function sessionColor(s) {
  return s === 'London' ? 'text-acc' : s === 'NY Overlap' ? 'text-purple-400' : s === 'Asian' ? 'text-gold' : 'text-slate-400';
}

export function directionIcon(d) {
  return d === 'LONG' ? '▲' : '▼';
}
