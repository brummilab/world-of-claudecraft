// The meters' number and duration formatting, shared by the Damage Meters
// window (meters.ts) and the practice DPS tracker (hud/practice/) so the two
// surfaces can never print the same damage differently. Moved out of meters.ts
// verbatim when the tracker became the second consumer of every function here.
// Host-agnostic: digits route through formatNumber, units through t() keys.

import { formatNumber, t } from './i18n';

// Compact damage/heal/threat number. Digits route through formatNumber so the
// numerals/decimal mark follow the active locale, while the classic English
// k/m suffixes + thresholds are preserved (useGrouping:false keeps the readout
// byte-identical to the historical `toFixed(1)`/`Math.round` form in en); the
// suffix itself is a localizable key rather than a literal.
export function fmtNum(v: number): string {
  const one = { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false };
  // Thresholds compare the value as it will DISPLAY (rounded to 0.1k / a whole
  // number), so 999,960 reads "1.0m" rather than "1000.0k".
  if (Math.round(v / 100) >= 10_000)
    return t('hudChrome.meters.millions', { value: formatNumber(v / 1_000_000, one) });
  if (Math.round(v) >= 10_000)
    return t('hudChrome.meters.thousands', { value: formatNumber(v / 1000, one) });
  return formatNumber(Math.round(v), { maximumFractionDigits: 0, useGrouping: false });
}

// "{rate}/s" cell, e.g. "1.2k/s": the /s unit comes from the localizable key.
export function fmtPerSecond(v: number): string {
  return t('hudChrome.meters.perSecond', { value: fmtNum(v) });
}

export function fmtPercent(pct: number): string {
  const p = Math.round(pct * 100);
  return t('hudChrome.meters.percent', {
    value: formatNumber(p, { maximumFractionDigits: 0, useGrouping: false }),
  });
}

// "{total} ({rate}/s)" or "{total} ({rate}/s, {pct}%)" cell.
export function fmtPerSecondRow(total: number, rate: number, percent?: number): string {
  if (percent !== undefined && percent > 0) {
    const pctStr = fmtPercent(percent);
    return `${fmtNum(total)} (${fmtPerSecond(rate)}, ${pctStr})`;
  }
  return t('hudChrome.meters.perSecondRow', { total: fmtNum(total), rate: fmtPerSecond(rate) });
}

// Count cell with optional percent, e.g. "4 (25%)" for interrupts/deaths.
export function fmtCountRow(count: number, percent?: number): string {
  if (percent !== undefined && percent > 0) {
    const pctStr = fmtPercent(percent);
    return `${fmtNum(count)} (${pctStr})`;
  }
  return fmtNum(count);
}

// "Xm Ys" / "Ys" duration; the m/s units come from localizable keys, digits via
// formatNumber.
// Rounds to whole seconds once, up front, so 119.6s carries to "2m 0s" instead
// of printing "1m 60s".
export function fmtDuration(s: number): string {
  const total = Math.max(0, Math.round(s));
  const m = Math.floor(total / 60);
  const num = (n: number) => formatNumber(n, { maximumFractionDigits: 0, useGrouping: false });
  return m > 0
    ? t('hudChrome.meters.minutesSeconds', { m: num(m), s: num(total % 60) })
    : t('hudChrome.meters.seconds', { s: num(total) });
}
