import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type Input } from '../src/simulation';
const idle: Input = { left: false, right: false, jump: false, jumpPressed: false, provoke: false };
function route(s: Simulation) {
  const frame = (input: Partial<Input> = {}) => { s.step(1 / 120, { ...idle, ...input }); assert.equal(s.deaths, 0, `died at ${s.player.x}, ${s.player.y}`); };
  const wait = (n: number) => { for (let i = 0; i < n; i++) frame(); };
  const move = (x: number) => { for (let i = 0; i < 600 && Math.abs(s.player.x - x) > 2; i++) frame({ right: s.player.x < x, left: s.player.x > x }); assert.ok(s.complete || Math.abs(s.player.x - x) < 4, `stuck at ${s.player.x}, wanted ${x}`); wait(12); };
  const jump = (x: number) => { frame({ jump: true, jumpPressed: true }); for (let i = 0; i < 120; i++) { frame({ jump: true, right: s.player.x < x - 2, left: s.player.x > x + 2 }); if (s.player.grounded) break; } wait(10); };
  return { frame, wait, move, jump };
}
test('practice section standard route is completable from spawn', () => {
  const s = new Simulation(); const r = route(s); r.wait(60); r.move(155); r.jump(242); r.move(278); r.jump(354); r.move(385); r.jump(477); r.move(567); r.jump(614); assert.equal(s.player.y, 108); r.jump(679); r.move(754); assert.equal(s.complete, true);
});
test('lure section standard route breaks wall and reaches goal', () => {
  const s = new Simulation(1); const r = route(s); r.wait(60); r.move(230); r.jump(315); r.wait(210); r.move(284); r.wait(45); r.jump(284); r.wait(70); r.move(367); r.jump(460); assert.equal(s.walls.length, 0); r.move(527); r.jump(617); r.move(642); r.jump(718); r.move(755); assert.equal(s.complete, true);
});
test('combined section standard route reaches goal', () => {
  const s = new Simulation(2); const r = route(s); r.wait(60); r.move(118); r.jump(203); r.wait(210); r.move(164); r.wait(45); r.jump(164); r.wait(70); r.move(233); r.jump(324); r.jump(410); r.move(428); r.jump(514); r.move(540); r.wait(210); r.move(514); r.wait(45); r.jump(514); r.wait(70); r.move(s.creatures[1].x - 55); r.jump(s.creatures[1].x + 38); r.move(653); r.jump(700); r.jump(770); r.move(850); assert.equal(s.complete, true);
});
