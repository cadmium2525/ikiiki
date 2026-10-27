export class AudioEngine {
  context?: AudioContext; enabled = true;
  unlock() { if (!this.context) this.context = new AudioContext(); void this.context.resume(); }
  play(name: string) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const ctx = this.context, o = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
    const notes: Record<string, [number, number, number]> = { jump: [420, 800, 0.12], poke: [700, 330, 0.09], warn: [190, 260, 0.15], charge: [130, 70, 0.16], impact: [90, 35, 0.24], death: [330, 60, 0.3], clear: [520, 1040, 0.5] };
    const [from, to, duration] = notes[name] ?? notes.poke;
    o.type = name === 'impact' ? 'sawtooth' : 'triangle'; o.frequency.setValueAtTime(from, now); o.frequency.exponentialRampToValueAtTime(to, now + duration);
    gain.gain.setValueAtTime(0.055, now); gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    o.connect(gain); gain.connect(ctx.destination); o.start(); o.stop(now + duration);
  }
}
