// A mob cleave splash rides the primary swing's roll, so when that swing crits
// the splash basis is already doubled. A committed tank standing in the splash
// is crit-immune to creatures (combat/tank_crit_immunity.ts): it must take the
// uncrit splash with no crit flag, exactly as if the swing had not crit.

import { describe, expect, it } from 'vitest';
import { isCritImmuneTank } from '../src/sim/combat/tank_crit_immunity';
import { MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import type { Entity, SimEvent } from '../src/sim/types';

type DamageEv = Extract<SimEvent, { type: 'damage' }>;

// Olen's swing at a mage with a Protection warrior 4 yd away (inside his 8 yd
// Reaping Arc). `critDraw` scripts the swing's crit roll: 0 crits, 0.99 not.
function splashOnTank(tankSpec: 'prot' | 'arms', critDraw: number) {
  // biome-ignore lint/suspicious/noExplicitAny: reaching sim internals, the suite idiom.
  const sim = new Sim({ seed: 42, playerClass: 'warrior', noPlayer: true }) as any;
  const mage = sim.addPlayer('mage', 'Primary');
  const tank = sim.addPlayer('warrior', 'Tank');
  sim.setPlayerLevel(20, tank);
  sim.applyTalents({ spec: tankSpec, rows: {} }, tank);
  const mob = createMob(sim.nextId++, MOBS.knight_commander_olen, 13, { x: 0, y: 0, z: 0 });
  mob.hostile = true;
  sim.addEntity(mob);
  const place = (pid: number, x: number, z: number): Entity => {
    const e = sim.entities.get(pid);
    e.pos = { x, y: 0, z };
    e.prevPos = { ...e.pos };
    e.maxHp = 1e6;
    e.hp = 1e6;
    return e;
  };
  const mageE = place(mage, 1, 0);
  const tankE = place(tank, 1, 4);
  tankE.stats.armor = 0;
  const immune = isCritImmuneTank(mob, tankE, sim.players.get(tank));

  // Table roll 0.99 (a clean hit), weapon roll 0.5, then the crit roll.
  const script = [0.99, 0.5, critDraw];
  sim.rng.next = () => (script.length ? script.shift() : 0.99);
  const events: SimEvent[] = [];
  const orig = sim.emit.bind(sim);
  sim.emit = (ev: SimEvent) => {
    events.push(ev);
    return orig(ev);
  };
  sim.mobSwing(mob, mageE);
  const dmg = events.filter((e): e is DamageEv => e.type === 'damage');
  const primary = dmg.find((e) => e.targetId === mageE.id);
  const splash = dmg.find((e) => e.targetId === tankE.id);
  if (!primary || !splash) throw new Error('expected a primary hit and a splash');
  return { immune, primaryCrit: primary.crit, splashCrit: splash.crit, splash: splash.amount };
}

describe('mob cleave splash vs a crit-immune tank', () => {
  it('a crit swing splashes a committed tank uncrit, for the uncrit amount', () => {
    const crit = splashOnTank('prot', 0);
    const plain = splashOnTank('prot', 0.99);
    expect(crit.immune).toBe(true);
    expect(crit.primaryCrit).toBe(true);
    expect(crit.splashCrit).toBe(false);
    expect(crit.splash).toBe(plain.splash);
  });

  it('a non-tank in the splash still takes the crit', () => {
    const crit = splashOnTank('arms', 0);
    const plain = splashOnTank('arms', 0.99);
    expect(crit.immune).toBe(false);
    expect(crit.splashCrit).toBe(true);
    expect(crit.splash).toBeGreaterThan(plain.splash);
  });
});
