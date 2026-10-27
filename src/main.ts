import Phaser from 'phaser';
import './style.css';
import { Simulation, type Input } from './simulation';
import { levels } from './levels';
import { WorldScene, type Palette } from './renderer';
import { AudioEngine } from './audio';

type Save = { unlocked: number; palette: Palette; sound: boolean; best: number | null };
const defaultSave: Save = { unlocked: 0, palette: { skin: 0xe6ba97, hair: 0x685348, shirt: 0xc57967 }, sound: true, best: null };
let saved: Save = { ...defaultSave, palette: { ...defaultSave.palette } };
try { const raw = JSON.parse(localStorage.getItem('ikiteru-v1') ?? 'null'); if (raw && Number.isInteger(raw.unlocked)) { saved.unlocked = Math.max(0, Math.min(2, raw.unlocked)); saved.sound = raw.sound !== false; saved.best = typeof raw.best === 'number' && Number.isFinite(raw.best) ? raw.best : null; for (const k of ['skin', 'hair', 'shirt'] as const) if (Number.isInteger(raw.palette?.[k]) && raw.palette[k] >= 0 && raw.palette[k] <= 0xffffff) saved.palette[k] = raw.palette[k]; } } catch { /* Storage is optional. */ }
const persist = () => { try { localStorage.setItem('ikiteru-v1', JSON.stringify(saved)); } catch { /* Continue without persistent storage. */ } };
const sim = new Simulation(), audio = new AudioEngine(); audio.enabled = saved.sound;
const input: Input = { left: false, right: false, jump: false, jumpPressed: false, provoke: false };
let mode: 'menu' | 'play' | 'pause' | 'clear' | 'finish' = 'menu', accumulator = 0, menuClock = 0, runStart = 0;
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
<header class="masthead"><a href="./" class="wordmark"><span class="brand-eye">◉</span> いきてるせかい<span class="edition">小さな冒険の記録</span></a><span class="chapter">WORLD 01 <i></i> めざめのそうげん</span><button id="sound" class="quiet" aria-label="音の切り替え">音 ON</button></header>
<main><div class="above"><span><i class="dot"></i> あなたが来るのを、待っていた。</span><span>2D EXPLORATION / PROTOTYPE 0.1</span></div>
<section id="stage" aria-label="ゲーム画面"><div id="game"></div>
<div id="hud" hidden><div><span id="level-number">01</span><div><small>めざめのそうげん</small><strong id="level-name"></strong></div></div><div class="hud-right"><span id="stats"></span><button id="retry" aria-label="リトライ">↻</button><button id="pause" aria-label="ポーズ">Ⅱ</button></div></div>
<div id="menu" class="overlay"><div class="intro"><span class="eyebrow">EVERYTHING HERE IS ALIVE.</span><h1>いきてる<br><span>せかい</span><span class="title-star">✦</span></h1><p>足場は、こわがり。トゲは、おこりんぼう。<br>ちょっとふしぎな世界を、きみの足で。</p><button id="start" class="primary">冒険をはじめる <span>→</span></button><button id="continue" class="text-button" ${saved.unlocked ? '' : 'hidden'}>つづきから →</button><div class="menu-small">3つの区画 / 何度でも、やりなおせる。</div></div><div class="field-note"><span>FIELD NOTE — 001</span><b>目が合った？</b><p>ここでは、足もとだって<br>あなたを見ています。</p><div class="note-eyes">● ●</div></div><div class="menu-bottom"><button id="customize">冒険者の色をえらぶ <span>＋</span></button><span>移動 ← → &nbsp; ジャンプ SPACE &nbsp; ちょっかい X</span></div></div>
<div id="modal" class="overlay modal" hidden><div class="paper"><span id="modal-eyebrow" class="eyebrow"></span><h2 id="modal-title"></h2><p id="modal-body"></p><div id="palette" hidden></div><button id="modal-primary" class="primary"></button><button id="home" class="text-button">タイトルへ</button></div></div>
<div id="rotate" hidden>↻<strong>横向きにすると、世界が広がる。</strong><span>スマートフォンを横にして遊んでね。</span></div>
</section>
<div class="below"><span id="hint">観察して、ちょっかいを出して、もう一度。生き物の習性が、道になる。</span><span class="world-count">01 <span>—</span> 03</span></div>
<div id="touch"><div><button data-action="left" aria-label="左へ">◀</button><button data-action="right" aria-label="右へ">▶</button></div><div><button data-action="provoke" class="poke">ちょっかい</button><button data-action="jump" class="jump">ジャンプ</button></div></div>
<footer><span>ふしぎな草原で、ひとつずつ。</span><span>一撃死 / 即リトライ <i>·</i> ESC ポーズ <i>·</i> R やりなおし</span></footer></main>`;
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const clearInput = () => { for (const k of Object.keys(input) as (keyof Input)[]) input[k] = false; held.clear(); pointers.clear(); accumulator = 0; };
function updateSound() { el('sound').textContent = saved.sound ? '♪ 音 ON' : '♪ 音 OFF'; el('sound').setAttribute('aria-pressed', String(saved.sound)); }
updateSound();
el('sound').onclick = () => { saved.sound = !saved.sound; audio.enabled = saved.sound; audio.unlock(); persist(); updateSound(); };
function begin(index: number) { runStart = index; clearInput(); sim.finished = false; sim.deaths = 0; sim.totalTime = 0; sim.elapsed = [0, 0, 0]; sim.losses = [0, 0, 0]; sim.load(index); mode = 'play'; el('menu').hidden = true; el('modal').hidden = true; el('hud').hidden = false; audio.unlock(); refresh(); }
function refresh() { el('level-number').textContent = `0${sim.index + 1}`; el('level-name').textContent = sim.level.name; el('hint').textContent = sim.level.hint; }
el('start').onclick = () => begin(0); el('continue').onclick = () => begin(saved.unlocked);
function dialog(eyebrow: string, title: string, body: string, button: string, action: () => void) { clearInput(); el('modal').hidden = false; el('palette').hidden = true; el('modal-eyebrow').textContent = eyebrow; el('modal-title').textContent = title; el('modal-body').textContent = body; el('modal-primary').textContent = button; el('modal-primary').onclick = action; el('modal-primary').focus(); }
function pause() { if (mode === 'play') { mode = 'pause'; dialog('TAKE A LITTLE BREATH', 'ひとやすみ。', '← → / A D：移動　 Space / Z：ジャンプ\nX：ちょっかい　 R：リトライ\nジャンプを長く押すと、高く跳べます。', '冒険にもどる →', resume); } else if (mode === 'pause') resume(); }
function resume() { mode = 'play'; clearInput(); el('modal').hidden = true; }
el('pause').onclick = pause; el('retry').onclick = () => { if (mode === 'play') sim.retry(); };
el('home').onclick = () => { mode = 'menu'; clearInput(); sim.load(0); sim.player.x = 690; sim.player.y = 60; el('menu').hidden = false; el('modal').hidden = true; el('hud').hidden = true; el('continue').hidden = !saved.unlocked; el('hint').textContent = '観察して、ちょっかいを出して、もう一度。生き物の習性が、道になる。'; };
el('customize').onclick = () => {
  dialog('YOUR LITTLE EXPLORER', 'きみは、どんな色？', '能力は同じ。好きな色で出かけよう。', 'この色で、出かける →', () => { persist(); el('modal').hidden = true; });
  const palettes = { skin: [0xe6ba97, 0xc18d6d, 0x92654f, 0xf1d1b5], hair: [0x685348, 0x302e3c, 0xba9865, 0xb6bdad], shirt: [0xc57967, 0x789d92, 0xc4ad6c, 0x8b83ae] };
  el('palette').hidden = false;
  el('palette').innerHTML = `<div class="preview-person"><div class="head"></div><div class="body"></div><div class="legs"></div></div>` + Object.entries(palettes).map(([key, colors]) => `<div class="palette-row"><span>${({ skin: '肌', hair: '髪', shirt: '服' } as Record<string, string>)[key]}</span>${colors.map((color, i) => `<button aria-label="${key} ${i + 1}" data-key="${key}" data-color="${color}" style="--swatch:#${color.toString(16).padStart(6, '0')}" class="swatch ${saved.palette[key as keyof Palette] === color ? 'selected' : ''}"></button>`).join('')}</div>`).join('');
  const preview = () => { for (const k of ['skin', 'hair', 'shirt'] as const) el('palette').style.setProperty(`--${k}`, `#${saved.palette[k].toString(16).padStart(6, '0')}`); };
  preview();
  el('palette').querySelectorAll<HTMLButtonElement>('.swatch').forEach(b => b.onclick = () => { saved.palette[b.dataset.key as keyof Palette] = Number(b.dataset.color); b.parentElement!.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected')); b.classList.add('selected'); preview(); persist(); });
};
const held = new Set<string>(), pointers = new Map<number, string>();
const keyActions: Record<string, string> = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', KeyZ: 'jump', KeyX: 'provoke' };
function syncInput() { const actions = new Set([...held].map(k => keyActions[k]).concat([...pointers.values()])); const jump = actions.has('jump'); if (jump && !input.jump) input.jumpPressed = true; input.jump = jump; input.left = actions.has('left'); input.right = actions.has('right'); input.provoke = actions.has('provoke'); }
window.addEventListener('keydown', e => { if (keyActions[e.code] && mode === 'play') { e.preventDefault(); held.add(e.code); syncInput(); } if (e.repeat) return; if (e.code === 'Escape') pause(); if (e.code === 'KeyR' && mode === 'play') sim.retry(); });
window.addEventListener('keyup', e => { held.delete(e.code); syncInput(); });
window.addEventListener('blur', () => { clearInput(); if (mode === 'play') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); if (mode === 'play') pause(); } });
document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(b => {
  b.onpointerdown = e => { e.preventDefault(); if (mode !== 'play') return; b.setPointerCapture(e.pointerId); pointers.set(e.pointerId, b.dataset.action!); syncInput(); b.classList.add('pressed'); };
  const release = (e: PointerEvent) => { pointers.delete(e.pointerId); syncInput(); b.classList.remove('pressed'); };
  b.onpointerup = release; b.onpointercancel = release; b.onlostpointercapture = release;
});
function tick(dt: number) {
  if (mode === 'menu') { menuClock += Math.min(dt, 0.05); sim.time = menuClock; return; }
  if (mode !== 'play') return;
  accumulator += Math.min(dt, 0.1);
  while (accumulator >= 1 / 120) { sim.step(1 / 120, input); input.jumpPressed = false; accumulator -= 1 / 120; }
  while (sim.sounds.length) audio.play(sim.sounds.shift()!);
  el('stats').textContent = `${Math.floor(sim.elapsed[sim.index])}s  /  ${sim.losses[sim.index]} 回`;
  if (sim.complete) {
    const last = sim.index === levels.length - 1;
    saved.unlocked = Math.max(saved.unlocked, Math.min(2, sim.index + 1)); persist(); mode = last ? 'finish' : 'clear';
    if (last && runStart === 0) { if (saved.best === null || sim.totalTime < saved.best) saved.best = sim.totalTime; persist(); }
    dialog(last ? 'THE MEADOW REMEMBERS YOU' : 'A LITTLE DISCOVERY', last ? '世界と、少し仲良くなった。' : '習性が、道になった。', last ? `今回の冒険をクリア！\n今回のプレイ ${Math.floor(sim.totalTime)}秒 / ${sim.deaths}回のリトライ\nまた会おうね、小さな冒険者。` : `${sim.level.name} をクリア\n${Math.floor(sim.elapsed[sim.index])}秒 / ${sim.losses[sim.index]}回のリトライ`, last ? 'もう一度、冒険へ →' : '次の区画へ →', () => { if (last) begin(0); else { sim.load(sim.index + 1); resume(); refresh(); } });
  }
}
sim.player.x = 690; sim.player.y = 60;
window.matchMedia('(max-width:600px) and (orientation:portrait)').addEventListener('change', e => { if (e.matches && mode === 'play') pause(); });
const scene = new WorldScene(sim, saved.palette, tick, () => mode === 'menu');
new Phaser.Game({ type: Phaser.AUTO, width: 320, height: 180, parent: 'game', pixelArt: true, roundPixels: true, backgroundColor: '#112c34', antialias: false, scene, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, audio: { noAudio: true } });
if (import.meta.env.DEV) Object.assign(window, { __game: { sim, input, begin, get mode() { return mode; } } });
