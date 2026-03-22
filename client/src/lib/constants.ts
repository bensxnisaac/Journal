export const DIRECTIONS = ['LONG', 'SHORT'] as const;
export const OUTCOMES   = ['WIN', 'LOSS', 'BE', 'RUNNING'] as const;
export const EMOTIONS   = ['Calm', 'Focused', 'Anxious', 'FOMO', 'Revenge', 'Overconfident', 'Hesitant'] as const;
export const RATINGS    = [1, 2, 3, 4, 5] as const;

export function outcomeClass(outcome: string): string {
  return outcome === 'WIN' ? 'text-bull' : outcome === 'LOSS' ? 'text-bear' : outcome === 'BE' ? 'text-gold' : 'text-slate-400';
}

export function outcomePill(outcome: string): string {
  return outcome === 'WIN'  ? 'pill-bull'
       : outcome === 'LOSS' ? 'pill-bear'
       : outcome === 'BE'   ? 'pill-gold'
       : 'pill-neutral';
}

export function rClass(r: number | null | undefined): string {
  if (r == null) return 'text-slate-500';
  return r > 0 ? 'text-bull' : r < 0 ? 'text-bear' : 'text-gold';
}

export function fmtR(r: number | null | undefined): string {
  if (r == null) return '—';
  return (r > 0 ? '+' : '') + r.toFixed(2) + 'R';
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function directionIcon(d: string): string {
  return d === 'LONG' ? '▲' : '▼';
}
