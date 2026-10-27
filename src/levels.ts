export type Rect = { x: number; y: number; w: number; h: number };
export type CreatureSeed = Rect & { kind: 'block' | 'spike'; min: number; max: number };
export type Level = { name: string; subtitle: string; hint: string; width: number; start: number; goal: Rect; terrain: Rect[]; walls: Rect[]; hazards: Rect[]; creatures: CreatureSeed[]; signs: { x: number; text: string }[] };
const ground = (x: number, w: number, y = 152): Rect => ({ x, y, w, h: 180 - y });
export const levels: Level[] = [
  { name: 'ゆかがにげた', subtitle: '01 / 練習', hint: '近づくと逃げる足場。壁ぎわまで追い込んで、上に乗ってみよう。', width: 800, start: 26,
    goal: { x: 752, y: 48, w: 24, h: 32 },
    terrain: [ground(0, 190), ground(226, 194), ground(460, 174), ground(634, 166, 80)], walls: [],
    hazards: [{ x: 306, y: 145, w: 26, h: 7 }],
    creatures: [{ kind: 'block', x: 526, y: 128, w: 32, h: 24, min: 480, max: 602 }],
    signs: [{ x: 62, text: 'あるく →' }, { x: 144, text: 'ジャンプ！' }, { x: 352, text: '目をあわせて' }, { x: 490, text: 'この足場、にげる。' }] },
  { name: 'トゲはともだち', subtitle: '02 / 誘導', hint: '赤く震えたら突進の合図。ジャンプでかわして、ひび割れた壁を壊そう。', width: 800, start: 30,
    goal: { x: 754, y: 120, w: 24, h: 32 },
    terrain: [ground(0, 560), ground(602, 198)], walls: [{ x: 440, y: 80, w: 18, h: 72 }],
    hazards: [{ x: 672, y: 145, w: 25, h: 7 }],
    creatures: [{ kind: 'spike', x: 304, y: 134, w: 18, h: 18, min: 210, max: 480 }],
    signs: [{ x: 78, text: 'あの子、こっちを見てる。' }, { x: 360, text: '壁へさそおう →' }, { x: 490, text: 'やればできる。' }] },
  { name: 'みんな、いきてる', subtitle: '03 / 複合', hint: 'トゲの突進は足場にも届く。最後は足場を壁ぎわに寄せて、高い出口へ。', width: 900, start: 28,
    goal: { x: 850, y: 48, w: 24, h: 32 },
    terrain: [ground(0, 350), ground(390, 330), ground(720, 180, 80)],
    walls: [{ x: 306, y: 80, w: 16, h: 72 }], hazards: [],
    creatures: [{ kind: 'spike', x: 192, y: 134, w: 18, h: 18, min: 90, max: 330 }, { kind: 'spike', x: 502, y: 134, w: 18, h: 18, min: 440, max: 680 }, { kind: 'block', x: 600, y: 128, w: 32, h: 24, min: 564, max: 688 }],
    signs: [{ x: 60, text: '習性を、おもいだして。' }, { x: 400, text: 'あの足場も、こわがり。' }, { x: 766, text: 'もうすぐ、朝。' }] },
];
