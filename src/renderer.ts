import Phaser from 'phaser';
import type { Simulation } from './simulation';
export type Palette = { skin: number; hair: number; shirt: number };
export class WorldScene extends Phaser.Scene {
  ink!: Phaser.GameObjects.Graphics; cameraX = 0;
  constructor(private sim: Simulation, private palette: Palette, private tick: (dt: number) => void, private isMenu: () => boolean) { super('world'); }
  create() { this.ink = this.add.graphics(); }
  update(_t: number, delta: number) { this.tick(delta / 1000); this.draw(); }
  draw() {
    const g = this.ink, s = this.sim, t = s.time, p = s.player;
    this.cameraX = this.isMenu() ? 480 : Math.max(0, Math.min(s.level.width - 320, p.x - 100));
    const cam = Math.round(this.cameraX);
    g.clear();
    const rect = (x: number, y: number, w: number, h: number, color: number, a = 1) => { g.fillStyle(color, a); g.fillRect(Math.round(x), Math.round(y), w, h); };
    const eye = (x: number, y: number, small = false) => { rect(x, y, small ? 3 : 5, small ? 3 : 6, 0xd1dfaf); rect(x + 1, y + 1, 2, small ? 2 : 4, 0x152c31); };
    rect(0, 0, 320, 180, 0x112c34); rect(0, 72, 320, 108, 0x193c3d);
    for (let i = 0; i < 55; i++) { const x = ((i * 73 + 19 - cam * 0.12) % 340 + 340) % 340; const y = (i * 31) % 105; rect(x, y, i % 9 === 0 ? 2 : 1, 1, 0x8bb8a6, i % 3 === 0 ? 0.55 : 0.25); }
    g.fillStyle(0xb9ceb0, 0.1); g.fillCircle(257 - cam * 0.08, 40, 24); g.fillStyle(0xd9dbac); g.fillCircle(257 - cam * 0.08, 40, 16); g.fillStyle(0x9db7a2); g.fillCircle(251 - cam * 0.08, 35, 3); g.fillCircle(264 - cam * 0.08, 45, 4);
    for (let layer = 0; layer < 2; layer++) {
      for (let i = -1; i < 10; i++) {
        const x = i * 61 - (cam * (0.18 + layer * 0.14) % 61), y = 33 + ((i + 20) * 17) % 35;
        const color = layer ? 0x204847 : 0x18393e;
        rect(x + 25, y, 12, 150, color); rect(x + 18, y + 24, 9, 55, color); rect(x + 4, y + 24, 20, 7, color); rect(x + 34, y + 40, 23, 7, color);
        g.fillStyle(color); g.fillEllipse(x + 30, y, 65, 37); g.fillEllipse(x + 8, y + 18, 36, 26);
        if (layer && i % 3 === 0) { rect(x + 28, y + 58, 2, 3, 0x6c8974, 0.6); rect(x + 33, y + 58, 2, 3, 0x6c8974, 0.6); }
      }
    }
    for (let i = 0; i < 17; i++) { const x = ((i * 43 - cam * 0.6) % 340 + 340) % 340; rect(x, 120 + i % 5 * 5, 1, 1, 0xc4d791, 0.5 + Math.sin(t * 2 + i) * 0.3); }
    for (const r of s.level.terrain) {
      const x = r.x - cam;
      rect(x, r.y, r.w, r.h, 0x304547); rect(x, r.y, r.w, 5, 0x8ebd87); rect(x, r.y + 5, r.w, 4, 0x4c8067); rect(x, r.y + 9, r.w, 3, 0x233a3e);
      for (let j = 0; j < r.w; j += 8) {
        rect(x + j, r.y - (j % 3 + 1), 2, 4, 0x8ebd87); rect(x + j + 4, r.y + 5, 3, 2 + j % 6, 0x568b6c);
        if (j % 24 === 0) { rect(x + j + 2, r.y + 16, 5, 2, 0x425859); rect(x + j + 10, r.y + 23, 2, 2, 0x1f363c); }
        if (j % 56 === 16) { eye(x + j, r.y + 15, true); eye(x + j + 6, r.y + 15, true); }
      }
      for (let j = 17; j < r.w - 10; j += 71) { rect(x + j, r.y - 8, 2, 8, 0x6f9e7c); rect(x + j - 3, r.y - 9, 8, 3, 0xc1cea2); rect(x + j - 1, r.y - 11, 5, 2, 0xc1cea2); rect(x + j + 1, r.y - 9, 1, 1, 0x4c6861); }
    }
    for (const w of s.walls) {
      const x = w.x - cam;
      rect(x, w.y, w.w, w.h, 0x77877b); rect(x, w.y, w.w, 3, 0xa8b397);
      for (let y = w.y + 4; y < w.y + w.h; y += 12) { rect(x + 1, y, w.w - 2, 1, 0x465b58); rect(x + (y % 2 ? 4 : 9), y, 1, 12, 0x465b58); }
      for (let y = 0; y < w.h; y += 6) rect(x + 6 + Math.sin(y) * 3, w.y + y, 3, 7, 0x263f41);
    }
    for (const h of s.level.hazards) for (let x = h.x; x < h.x + h.w; x += 7) { g.fillStyle(0xe6b9aa); g.fillTriangle(x - cam, h.y + h.h, x + 3 - cam, h.y, x + 7 - cam, h.y + h.h); rect(x + 3 - cam, h.y + 4, 1, 2, 0x4b4048); }
    for (const sign of s.level.signs) { const x = sign.x - cam; rect(x, 140, 2, 12, 0x846b55); rect(x - 5, 135, 15, 7, 0xb4ab7c); rect(x - 2, 138, 7, 1, 0x4e6357); }
    for (const c of s.creatures) {
      let x = c.x - cam, y = c.y;
      if (c.kind === 'block') {
        rect(x + 3, y + 2, 26, 22, 0x334646); rect(x, y, 32, 20, 0x9baa82); rect(x, y, 32, 3, 0xc5c795); rect(x + 2, y + 17, 28, 3, 0x738e72);
        rect(x + 4, y + 5, 3, 2, 0xbec699); eye(x + 9, y + 7); eye(x + 20, y + 7); rect(x + 17, y + 15, 3, 2, 0x354d4b);
        rect(x + 4, y + 21, 5, 3, 0x596d58); rect(x + 23, y + 21, 5, 3, 0x596d58);
        if (c.state === 'scared') rect(x + 29, y - 3 + Math.sin(t * 12), 2, 4, 0xa7ded1);
      } else {
        if (c.state === 'warn') x += Math.round(Math.sin(t * 55));
        const col = c.state === 'warn' ? 0xf3aa83 : c.state === 'tired' ? 0x9e8190 : 0xcd8191;
        for (let j = 0; j < 3; j++) { g.fillStyle(0xf1c5b4); g.fillTriangle(x + j * 6 - 2, y + 7, x + j * 6 + 3, y - 3, x + j * 6 + 7, y + 7); }
        rect(x, y + 5, 18, 11, col); rect(x + 3, y + 2, 12, 16, col); rect(x + 2, y + 9, 4, 5, 0x403443); rect(x + 11, y + 9, 4, 5, 0x403443); rect(x + 3, y + 10, 2, 2, 0xffe7b7); rect(x + 12, y + 10, 2, 2, 0xffe7b7);
        if (c.state === 'warn') { rect(x + 8, y - 14, 2, 6, 0xffd292); rect(x + 8, y - 6, 2, 2, 0xffd292); }
        if (c.state === 'charge') { rect(x - c.dir * 9, y + 7, 6, 1, 0xd9a99b); rect(x - c.dir * 14, y + 13, 6, 1, 0xd9a99b); }
      }
    }
    const door = s.level.goal, dx = door.x - cam;
    g.fillStyle(0xd9dca2, 0.09); g.fillCircle(dx + 12, door.y + 17, 25);
    rect(dx - 2, door.y + 4, 28, 28, 0x608c74); rect(dx + 3, door.y, 18, 32, 0x608c74); rect(dx + 4, door.y + 5, 16, 27, 0x1c383b); rect(dx + 7, door.y + 9, 10, 23, 0xc6d1a0); rect(dx + 9, door.y + 11, 6, 21, 0xe7e7b7); eye(dx + 6, door.y + 1, true); eye(dx + 16, door.y + 1, true);
    if (!s.dead) {
      const x = Math.round(p.x - cam - 2), bob = p.grounded && Math.abs(p.vx) > 10 ? Math.floor(t * 12) % 2 : 0, y = Math.round(p.y - 4) - bob;
      const { skin, hair, shirt } = this.palette;
      rect(x + 2, y + 1, 12, 10, 0x20323a); rect(x + 3, y + 3, 10, 10, skin); rect(x + 2, y, 12, 5, hair); rect(x + 1, y + 3, 4, 5, hair); rect(x + 4, y - 1, 7, 2, hair);
      rect(x + (p.face > 0 ? 10 : 4), y + 6, 2, 3, 0x26323c); rect(x + (p.face > 0 ? 12 : 2), y + 9, 2, 2, 0xd18e80);
      rect(x + 3, y + 13, 10, 7, shirt); rect(x + 2, y + 12, 12, 2, 0xe7ce94); rect(x + 2, y + 14, 2, 5, skin); rect(x + 12, y + 14, 2, 5, skin);
      rect(x + 3, y + 20, 4, 4 - bob, 0x354452); rect(x + 9, y + 20, 4, 3 + bob, 0x354452); rect(x + 2, y + 23 - bob, 5, 1, 0xc2ab80); rect(x + 9, y + 22 + bob, 5, 1, 0xc2ab80);
      rect(x + (p.face > 0 ? 0 : 13), y + 13, 3, 6, 0x806b56);
      if (p.poke > 0) { const fx = x + 8 + p.face * 21; rect(fx, y + 8, 2, 9, 0xf2d79c); rect(fx - 3, y + 11, 8, 2, 0xf2d79c); }
    } else {
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, d = (0.45 - s.dead) * 70; rect(p.x - cam + 6 + Math.cos(a) * d, p.y + 10 + Math.sin(a) * d, 2, 2, 0xe4ccab); }
    }
    rect(0, 177, 320, 3, 0x102a31, 0.5);
  }
}
