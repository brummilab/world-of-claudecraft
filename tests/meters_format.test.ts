// Rounding-boundary pins for the shared meters formatters (meters_format.ts).
// Each function rounds for display, so the unit/threshold decision must be made
// on the ROUNDED value: otherwise a value just below a boundary prints a
// carried-over form like "1m 60s" or "1000.0k".

import { describe, expect, it } from 'vitest';
import { fmtDuration, fmtNum } from '../src/ui/meters_format';

describe('fmtDuration', () => {
  it('formats whole seconds and minutes', () => {
    expect(fmtDuration(0)).toBe('0s');
    expect(fmtDuration(45)).toBe('45s');
    expect(fmtDuration(60)).toBe('1m 0s');
    expect(fmtDuration(125)).toBe('2m 5s');
  });

  it('carries a seconds value that rounds up to 60 into the minutes', () => {
    expect(fmtDuration(59.6)).toBe('1m 0s');
    expect(fmtDuration(119.6)).toBe('2m 0s');
    expect(fmtDuration(119.4)).toBe('1m 59s');
  });

  it('never prints a negative duration', () => {
    expect(fmtDuration(-3)).toBe('0s');
  });
});

describe('fmtNum', () => {
  it('keeps the classic k/m thresholds', () => {
    expect(fmtNum(9_999)).toBe('9999');
    expect(fmtNum(10_000)).toBe('10.0k');
    expect(fmtNum(999_900)).toBe('999.9k');
    expect(fmtNum(1_000_000)).toBe('1.0m');
  });

  it('switches unit when the rounded value reaches the next threshold', () => {
    expect(fmtNum(9_999.6)).toBe('10.0k');
    expect(fmtNum(999_960)).toBe('1.0m');
  });
});
