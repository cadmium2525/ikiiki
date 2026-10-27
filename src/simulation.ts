import { levels, type Rect, type CreatureSeed } from './levels';
export type Input = { left: boolean; right: boolean; jump: boolean; jumpPressed: boolean; provoke: boolean };
export type Creature = CreatureSeed & { home: number; state: 'idle' | 'warn' | 'charge' | 'tired' | 'scared'; timer: number; dir: number; dx: number };
export type WorldEvent = { type: 'Sound' | 'Touch' | 'Impact' | 'Sight' | 'Provoke'; x: number; y: number; radius: number; depth: number; source?: Creature };
export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export class Simulation {
  index = 0; time = 0; deaths = 0; totalTime = 0; dead = 0; complete = false; finished = false;
  player = { x: 26, y: 110, w: 12, h: 20, vx: 0, vy: 0, face: 1, grounded: false, coyote: 0, buffer: 0, poke: 0, cooldown: 0 };
  creatures: Creature[] = []; walls: Rect[] = []; events: WorldEvent[] = []; sounds: string[] = []; elapsed = [0, 0, 0]; losses = [0, 0, 0];
  constructor(index = 0) { this.load(index); }
  get level() { return levels[this.index]; }
  load(index: number) {
    this.index = index; this.time = 0; this.dead = 0; this.complete = false;
    this.player = { x: this.level.start, y: 110, w: 12, h: 20, vx: 0, vy: 0, face: 1, grounded: false, coyote: 0, buffer: 0, poke: 0, cooldown: 0 };
    this.creatures = this.level.creatures.map(c => ({ ...c, home: c.x, state: 'idle', timer: 0, dir: 1, dx: 0 }));
    this.walls = this.level.walls.map(w => ({ ...w })); this.events = [];
  }
  retry() { this.die(); }
  die() { if (this.dead || this.complete) return; this.deaths++; this.losses[this.index]++; this.dead = 0.45; this.sounds.push('death'); }
  emit(type: WorldEvent['type'], x: number, y: number, radius: number, source?: Creature, depth = 0) { if (depth < 4) this.events.push({ type, x, y, radius, depth, source }); }
  dispatch() {
    let count = 0;
    while (this.events.length && count++ < 32) {
      const e = this.events.shift()!;
      for (const c of this.creatures) {
        if (e.source === c || Math.hypot(c.x + c.w / 2 - e.x, c.y + c.h / 2 - e.y) > e.radius) continue;
        if (c.kind === 'block' && e.type !== 'Touch') { c.dir = c.x + c.w / 2 < e.x ? -1 : 1; c.state = 'scared'; c.timer = e.type === 'Impact' ? 1.5 : 0.4; }
        if (c.kind === 'spike' && c.state === 'idle' && (e.type === 'Provoke' || e.type === 'Sight')) { c.dir = e.x < c.x + c.w / 2 ? -1 : 1; c.state = 'warn'; c.timer = 0.65; this.sounds.push('warn'); }
      }
    }
    this.events.length = 0;
  }
  step(dt: number, input: Input) {
    if (this.complete || this.finished) return;
    if (this.dead) { this.dead = Math.max(0, this.dead - dt); if (!this.dead) this.load(this.index); return; }
    this.time += dt; this.totalTime += dt; this.elapsed[this.index] += dt;
    const p = this.player, previousPlayerX = p.x;
    p.poke = Math.max(0, p.poke - dt); p.cooldown = Math.max(0, p.cooldown - dt);
    p.buffer = input.jumpPressed ? 0.1 : Math.max(0, p.buffer - dt);
    p.coyote = p.grounded ? 0.08 : Math.max(0, p.coyote - dt);
    if (input.provoke && !p.cooldown) { p.poke = 0.18; p.cooldown = 0.35; this.emit('Provoke', p.x + 6 + p.face * 20, p.y + 10, 28); this.sounds.push('poke'); }
    this.emit('Sight', p.x + 6, p.y + 10, 90); this.dispatch();
    for (const c of this.creatures) {
      const previous = c.x;
      c.timer -= dt;
      if (c.kind === 'block') {
        if (c.state === 'scared') { c.x = Math.max(c.min, Math.min(c.max, c.x + c.dir * 48 * dt)); if (c.timer <= 0) c.state = 'idle'; }
      } else {
        if (c.state === 'warn' && c.timer <= 0) { c.state = 'charge'; c.timer = 1.15; this.sounds.push('charge'); }
        if (c.state === 'charge') {
          c.x += c.dir * 190 * dt;
          const wall = this.walls.find(w => overlaps(c, w));
          const block = this.creatures.find(b => b.kind === 'block' && overlaps(c, b));
          if (wall || block || c.x <= c.min || c.x >= c.max || c.timer <= 0) {
            if (wall) this.walls = this.walls.filter(w => w !== wall);
            if (block) c.x = c.dir > 0 ? block.x - c.w : block.x + block.w;
            c.x = Math.max(c.min, Math.min(c.max, c.x));
            this.emit('Impact', c.x + c.w / 2, c.y + 9, 85, c); this.emit('Sound', c.x, c.y, 100, c);
            c.state = 'tired'; c.timer = 1.4; this.sounds.push('impact');
          }
        } else if (c.state === 'tired' && c.timer <= 0) c.state = 'idle';
      }
      c.dx = c.x - previous;
      if (c.kind === 'block' && p.grounded && Math.abs(p.y + p.h - c.y) < 1 && p.x + p.w > previous && p.x < previous + c.w) p.x += c.dx;
    }
    this.dispatch();
    const direction = Number(input.right) - Number(input.left);
    if (direction) p.face = direction;
    const target = direction * 130, accel = direction ? 1100 : 1500;
    p.vx += Math.sign(target - p.vx) * Math.min(Math.abs(target - p.vx), accel * dt);
    if (p.buffer > 0 && p.coyote > 0) { p.vy = -310; p.grounded = false; p.coyote = 0; p.buffer = 0; this.sounds.push('jump'); }
    if (!input.jump && p.vy < -140) p.vy = -140;
    p.vy = Math.min(460, p.vy + 860 * dt);
    const solids = [...this.level.terrain, ...this.walls, ...this.creatures.filter(c => c.kind === 'block')];
    p.x += p.vx * dt;
    const horizontalTravel = p.x - previousPlayerX;
    for (const s of solids) if (overlaps(p, s)) { if (horizontalTravel > 0) p.x = s.x - p.w; else if (horizontalTravel < 0) p.x = s.x + s.w; p.vx = 0; }
    p.x = Math.max(0, Math.min(this.level.width - p.w, p.x));
    p.y += p.vy * dt; p.grounded = false;
    for (const s of solids) if (overlaps(p, s)) { if (p.vy >= 0) { p.y = s.y - p.h; p.grounded = true; } else { p.y = s.y + s.h; } p.vy = 0; }
    if (p.y > 190 || this.level.hazards.some(h => overlaps(p, h)) || this.creatures.some(c => c.kind === 'spike' && overlaps(p, c))) this.die();
    if (!this.dead && overlaps(p, this.level.goal)) { this.complete = true; this.sounds.push('clear'); }
  }
}
