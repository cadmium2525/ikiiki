import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type Input } from '../src/simulation';
const idle: Input = { left: false, right: false, jump: false, jumpPressed: false, provoke: false };
const step = (s: Simulation, n: number, input: Partial<Input> = {}) => { for (let i = 0; i < n; i++) s.step(1 / 120, { ...idle, ...input, jumpPressed: i === 0 && !!input.jumpPressed }); };
test('jump reaches approximately 56 pixels and release shortens it', () => {
  const run = (held: boolean) => { const s = new Simulation(); step(s, 60); const base = s.player.y; let peak = base; s.step(1 / 120, { ...idle, jump: true, jumpPressed: true }); for (let i = 0; i < 80; i++) { s.step(1 / 120, { ...idle, jump: held }); peak = Math.min(peak, s.player.y); } return base - peak; };
  assert.ok(run(true) > 50 && run(true) < 58); assert.ok(run(false) < 20);
});
test('death resets creatures and walls within half a second', () => {
  const s = new Simulation(1); s.walls = []; s.creatures[0].x = 400; s.die(); step(s, 56);
  assert.equal(s.deaths, 1); assert.equal(s.walls.length, 1); assert.equal(s.creatures[0].x, 304); assert.equal(s.dead, 0);
});
test('spike telegraphs then destroys a wall', () => {
  const s = new Simulation(1); s.player.x = 365; s.player.y = 132; step(s, 1);
  assert.equal(s.creatures[0].state, 'warn'); step(s, 60); assert.equal(s.creatures[0].state, 'warn');
  s.player.x = 80; step(s, 110); assert.equal(s.walls.length, 0); assert.equal(s.creatures[0].state, 'tired');
});
test('block flees and stops at its boundary', () => {
  const s = new Simulation(); s.player.x = 510; s.player.y = 132; step(s, 1); assert.equal(s.creatures[0].state, 'scared');
  for (let i = 0; i < 300; i++) { s.player.x = s.creatures[0].x - 30; s.step(1 / 120, idle); }
  assert.equal(s.creatures[0].x, s.creatures[0].max);
});
test('same input produces identical simulation', () => {
  const a = new Simulation(), b = new Simulation(); for (let i = 0; i < 1200; i++) { const input = { ...idle, right: true, jump: i % 100 < 60, jumpPressed: i % 100 === 0 }; a.step(1 / 120, input); b.step(1 / 120, input); }
  assert.deepEqual(a, b);
});
test('event cascade is bounded', () => { const s = new Simulation(); s.emit('Impact', 540, 135, 100, undefined, 4); assert.equal(s.events.length, 0); });
test('goal completes a section', () => { const s = new Simulation(); s.player.x = 755; s.player.y = 60; step(s, 1); assert.equal(s.complete, true); });
