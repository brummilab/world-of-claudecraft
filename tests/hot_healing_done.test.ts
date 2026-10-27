// A HoT tick takes the healer's healing-done multipliers live, the same source
// factors applyHeal gives a direct heal: a buff_heal_done aura (Anointing's
// +20% healing) raises every tick, and Weakening Hex (documented as throttling
// "damage AND healing") lowers it. Before the fix only Sporemender Form reached
// the tick, so both were silently ignored for HoTs.

import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { Aura } from '../src/sim/types';
import { EMPTY_TEST_WORLD } from './sim_shared';

// Every Sporemending (rejuvenation) tick a level-20 druid lands on themself.
function rejuvTicks(aura?: Pick<Aura, 'kind' | 'value'>): number[] {
  // biome-ignore lint/suspicious/noExplicitAny: reaching sim internals, the suite idiom.
  const sim = new Sim({ seed: 3, playerClass: 'druid', world: EMPTY_TEST_WORLD }) as any;
  sim.setPlayerLevel(20);
  const p = sim.player;
  p.maxHp = 100_000;
  p.hp = 1;
  p.resource = p.maxResource;
  if (aura) {
    sim.applyAura(p, {
      id: `test_${aura.kind}`,
      name: 'Test',
      kind: aura.kind,
      value: aura.value,
      remaining: 60,
      duration: 60,
      sourceId: p.id,
      school: 'holy',
    });
  }
  sim.targetId = p.id;
  sim.castAbility('rejuvenation', undefined);
  const ticks: number[] = [];
  for (let i = 0; i < 20 * 14; i++) {
    for (const ev of sim.tick()) {
      if (ev.type === 'heal2' && ev.targetId === p.id && ev.ability === 'Sporemending')
        ticks.push(ev.amount);
    }
  }
  return ticks;
}

describe('HoT ticks take the healer healing-done multipliers', () => {
  const base = rejuvTicks();

  it('lands ticks at all (the vacuity floor)', () => {
    expect(base.filter((n) => n > 0).length).toBeGreaterThan(1);
  });

  it('a +20% healing-done buff raises every tick by 20%', () => {
    expect(rejuvTicks({ kind: 'buff_heal_done', value: 0.2 })).toEqual(
      base.map((n) => Math.round(n * 1.2)),
    );
  });

  it('Weakening Hex on the healer throttles every tick', () => {
    expect(rejuvTicks({ kind: 'hex', value: 0.5 })).toEqual(base.map((n) => Math.round(n * 0.5)));
  });
});
