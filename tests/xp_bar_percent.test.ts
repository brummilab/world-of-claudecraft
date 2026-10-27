// The XP bar floors to a whole percent (classic truncate-don't-round), but the
// floor must run on exact integer math: 116/400 is exactly 29%, and the float
// path (0.29 * 100 = 28.999...) used to print "28%".

import { describe, expect, it } from 'vitest';
import { xpForLevel } from '../src/sim/types';
import { xpBarView } from '../src/ui/xp_bar';

describe('xpBarView percentText', () => {
  it('shows an exact whole percent without a float off-by-one', () => {
    const need = xpForLevel(1);
    let checked = 0;
    for (const pct of [29, 57, 58]) {
      const xp = (need * pct) / 100;
      if (!Number.isInteger(xp)) continue;
      const v = xpBarView({ level: 1, xp, lifetimeXp: xp, showOverflow: true });
      expect(v.percentText).toBe(`${pct}%`);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('still truncates a partial percent down', () => {
    const need = xpForLevel(1);
    const xp = Math.floor((need * 29.9) / 100);
    const v = xpBarView({ level: 1, xp, lifetimeXp: xp, showOverflow: true });
    expect(v.percentText).toBe(`${Math.floor((xp * 100) / need)}%`);
  });
});
