import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/PatrickHand";

// "The Tiny Diya": a 55.5 s kids' story film, every frame drawn in code (SVG). No images, no AI video.
// Narration (ElevenLabs take A) is muxed after render at +15 frames. Cue table: projects/tiny-diya-story/BRIEF.md
// Key frames: "Deepu" f265 · "whoosh" f517 · lamps out f645→741 · "dark" f800 · "held on" f985 ·
// "leaned" f1070 · "lit" f1112 · chain f1214/1251/1289 → "shining" f1366 · final line f1405–1581.

const { fontFamily } = loadFont();
export const FILM_FRAMES = 1665;

// ---------- helpers ----------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eout = (t: number) => 1 - Math.pow(1 - t, 3);
const eback = (t: number) => { const c1 = 1.9, c3 = c1 + 1; return t >= 1 ? 1 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const rnd = (s: string) => random(s);

// ---------- story clock ----------
const WIND_ON = 505, WIND_OFF = 790;
const wind = (f: number) => eio(ramp(f, WIND_ON, 535)) * (1 - eio(ramp(f, 740, WIND_OFF)));
const outTime = (x: number) => 645 + 96 * clamp01((x - 100) / 2800);

// The row of diyas on the plinth (left → right). Deepu sits apart, lower, at the right end.
const N = 23;
const ROW = Array.from({ length: N }, (_, i) => ({ i, x: 150 + i * (2650 / (N - 1)), y: 800 }));
const chainTime = (k: number) => (k === 0 ? 1112 : k === 1 ? 1214 : k === 2 ? 1251 : k === 3 ? 1289 : 1300 + 62 * Math.sqrt((k - 4) / (N - 5)));
const rowIn = (i: number) => chainTime(N - 1 - i);
// When the relight chain reaches a world x (big lamps relight as it passes).
const chainAt = (x: number) => {
  let best = 0, bd = 1e9;
  ROW.forEach((d) => { const dd = Math.abs(d.x - x); if (dd < bd) { bd = dd; best = d.i; } });
  return rowIn(best) + 5;
};
const DEEPU = { x: 2925, y: 840, s: 0.62 };

// A light's life: lit from frame 0, blown out at tOut, relit at tIn.
const lightState = (f: number, tOut: number, tIn: number) => {
  if (f < tOut) return { size: 1, on: 1, dying: 0 };
  if (f < tIn) { const d = ramp(f, tOut, tOut + 14); return { size: 1 - eio(d), on: 1 - d, dying: d }; }
  const g = ramp(f, tIn, tIn + 12);
  return { size: eback(g), on: eout(g), dying: 0 };
};

// ---------- camera: one world, eased moves ----------
type Cam = [number, number, number, number]; // frame, cx, cy, zoom
const CAM: Cam[] = [
  [0, 1380, 560, 0.66], [175, 1640, 560, 0.66],
  [330, 2865, 765, 2.0], [372, 2870, 768, 2.05],
  [470, 2830, 680, 1.55], [482, 2830, 680, 1.55],
  [560, 1500, 560, 0.64], [830, 1560, 560, 0.64],
  [935, 2905, 800, 2.6], [1030, 2905, 805, 2.75],
  [1100, 2850, 790, 2.2], [1165, 2845, 790, 2.2],
  [1372, 1500, 560, 0.64], [1405, 1520, 560, 0.645],
  [1565, 2680, 600, 1.15], [1665, 2720, 610, 1.22],
];
const camera = (f: number) => {
  for (let k = 0; k < CAM.length - 1; k++) {
    const [f0, x0, y0, z0] = CAM[k], [f1, x1, y1, z1] = CAM[k + 1];
    if (f <= f1) {
      const t = eio(ramp(f, f0, f1));
      // zoom eases in log space so push-ins feel even
      return { cx: lerp(x0, x1, t), cy: lerp(y0, y1, t), z: Math.exp(lerp(Math.log(z0), Math.log(z1), t)) };
    }
  }
  const [, x, y, z] = CAM[CAM.length - 1];
  return { cx: x, cy: y, z };
};

// ---------- flame ----------
const flamePath = (tx: number, ty: number, r: number) => {
  const h = -ty;
  return `M ${tx},${ty} C ${tx * 0.45 + r * 0.75},${-h * 0.58} ${r * 1.2},${-r * 0.9} ${r * 0.95},${-r * 0.1} C ${r * 0.8},${r * 0.78} ${-r * 0.8},${r * 0.78} ${-r * 0.95},${-r * 0.1} C ${-r * 1.2},${-r * 0.9} ${tx * 0.45 - r * 0.75},${-h * 0.58} ${tx},${ty} Z`;
};
const flick = (f: number, s: number) => 1 + 0.07 * Math.sin(f * 0.9 + s) + 0.05 * Math.sin(f * 1.7 + s * 2.1) + 0.03 * Math.sin(f * 3.3 + s * 0.7);
const sway = (f: number, s: number) => 0.09 * Math.sin(f * 0.6 + s) + 0.05 * Math.sin(f * 1.35 + s * 1.9);

// A flame whose base is at (0,0). tip = explicit tip offset (for Deepu's reach), else built from h + bend.
const Flame: React.FC<{ f: number; seed: number; h: number; size: number; bend: number; tip?: [number, number]; glow?: number }> = ({ f, seed, h, size, bend, tip, glow = 1 }) => {
  if (size <= 0.01) return null;
  const hh = h * size * flick(f, seed);
  const r = h * 0.3 * Math.min(1.15, Math.max(size, 0.2));
  const tx = tip ? tip[0] : hh * (sway(f, seed) + bend * 0.75);
  const ty = tip ? tip[1] : -hh;
  return (
    <g>
      <circle cx={tx * 0.3} cy={ty * 0.4} r={h * 3.4 * Math.min(size, 1.2)} fill="url(#glowSmall)" opacity={0.85 * glow * Math.min(1, size)} style={{ mixBlendMode: "screen" }} />
      <path d={flamePath(tx, ty, r)} fill="#ff9a1f" />
      <path d={flamePath(tx * 0.8, ty * 0.72, r * 0.68)} fill="#ffd23f" transform={`translate(0 ${r * 0.12})`} />
      <path d={flamePath(tx * 0.6, ty * 0.42, r * 0.4)} fill="#fff6cf" transform={`translate(0 ${r * 0.22})`} />
      <ellipse cx={0} cy={r * 0.38} rx={r * 0.42} ry={r * 0.22} fill="#8ec5ff" opacity={0.55} />
    </g>
  );
};

// Smoke curl after a flame dies.
const Smoke: React.FC<{ f: number; t0: number; seed: number }> = ({ f, t0, seed }) => {
  const d = f - t0;
  if (d < 4 || d > 60) return null;
  return (
    <g>
      {[0, 1, 2].map((k) => {
        const p = clamp01((d - 4 - k * 6) / 46);
        if (p <= 0) return null;
        return <circle key={k} cx={Math.sin(p * 5 + seed + k) * 6 + p * 34 * (wind(f) + 0.3)} cy={-p * 70 - k * 4} r={3 + p * 11} fill="#c9cde6" opacity={0.42 * (1 - p)} />;
      })}
    </g>
  );
};

// Sparkles when a flame catches.
const Sparks: React.FC<{ f: number; t0: number; seed: number; scale?: number }> = ({ f, t0, seed, scale = 1 }) => {
  const d = f - t0;
  if (d < 0 || d > 18) return null;
  const p = d / 18;
  return (
    <g>
      {Array.from({ length: 7 }, (_, k) => {
        const a = (k / 7) * Math.PI * 2 + rnd(`sp${seed}${k}`) * 0.6;
        const dist = (14 + 34 * eout(p)) * scale;
        return <circle key={k} cx={Math.cos(a) * dist} cy={Math.sin(a) * dist - 20 * scale} r={2.6 * scale * (1 - p)} fill="#fff1b0" opacity={1 - p} />;
      })}
    </g>
  );
};

// ---------- the diya character ----------
type Face = { open: number; lookX: number; lookY: number; mood: "smile" | "o" | "happy" };
const DiyaBody: React.FC<{ face: Face; wickSide: number }> = ({ face, wickSide }) => {
  const { open, lookX, lookY, mood } = face;
  const eye = (ex: number) => {
    if (mood === "happy") return <path d={`M ${ex - 5},-13 Q ${ex},-20 ${ex + 5},-13`} stroke="#2b1408" strokeWidth={2.4} fill="none" strokeLinecap="round" />;
    if (open < 0.25) return <path d={`M ${ex - 5},-15 Q ${ex},-11 ${ex + 5},-15`} stroke="#2b1408" strokeWidth={2.2} fill="none" strokeLinecap="round" />;
    return (
      <g>
        <ellipse cx={ex + lookX} cy={-15 + lookY} rx={4.2} ry={5.4 * open} fill="#2b1408" />
        <circle cx={ex + lookX + 1.4} cy={-16.6 + lookY} r={1.4 * open} fill="#fff" />
      </g>
    );
  };
  return (
    <g>
      {/* clay bowl */}
      <path d="M -46,-28 C -44,-7 -25,0 0,0 C 25,0 44,-7 46,-28 Z" fill="#c4612f" />
      <path d="M -46,-28 C -44,-7 -25,0 0,0 C 6,0 12,-0.6 17,-1.8 C -6,-4 -30,-12 -40,-28 Z" fill="#a84d22" opacity={0.6} />
      {/* spout lip on the wick side */}
      <path d={`M ${wickSide * 30},-31 Q ${wickSide * 50},-36 ${wickSide * 54},-30 Q ${wickSide * 44},-24 ${wickSide * 30},-25 Z`} fill="#b3552a" />
      <ellipse cx={0} cy={-28} rx={46} ry={9} fill="#9a4524" />
      <ellipse cx={0} cy={-28.5} rx={38} ry={6} fill="#5a2812" />
      <ellipse cx={-8} cy={-30} rx={20} ry={2.2} fill="#7a3a18" opacity={0.7} />
      {/* painted dots band */}
      {[-30, -18, -6, 6, 18, 30].map((dx) => <circle key={dx} cx={dx} cy={-24 + Math.abs(dx) * 0.06} r={1.7} fill="#ffe2b0" opacity={0.85} />)}
      {/* face */}
      {eye(-12)}
      {eye(12)}
      <ellipse cx={-22} cy={-9} rx={5} ry={2.8} fill="#ff8a7a" opacity={0.55} />
      <ellipse cx={22} cy={-9} rx={5} ry={2.8} fill="#ff8a7a" opacity={0.55} />
      {mood === "o" ? <ellipse cx={0} cy={-7} rx={2.6} ry={3.2} fill="#2b1408" /> : <path d={mood === "happy" ? "M -5,-8.5 Q 0,-2 5,-8.5" : "M -4,-8 Q 0,-4.5 4,-8"} stroke="#2b1408" strokeWidth={2} fill={mood === "happy" ? "#7a2a14" : "none"} strokeLinecap="round" />}
      {/* wick */}
      <path d={`M ${wickSide * 40},-31 l ${wickSide * 4},-5`} stroke="#3a1e0e" strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
};
const WICK = (side: number): [number, number] => [side * 44, -36];

const blinkAt = (f: number, seed: number) => {
  const period = 95 + Math.floor(rnd(`bp${seed}`) * 60);
  const ph = (f + Math.floor(rnd(`bo${seed}`) * period)) % period;
  return ph < 4 ? 0.1 : 1;
};

// ---------- big lamps ----------
const Samai: React.FC<{ f: number; x: number; seed: number; st: { size: number; on: number }; bend: number }> = ({ f, x, seed, st, bend }) => (
  <g transform={`translate(${x} 800)`}>
    <ellipse cx={0} cy={-4} rx={34} ry={8} fill="#7a5418" />
    <path d="M -30,-4 Q -28,-22 -10,-26 L 10,-26 Q 28,-22 30,-4 Z" fill="#c8932c" />
    <rect x={-5} y={-196} width={10} height={172} fill="#b8862a" />
    <rect x={-2} y={-196} width={3} height={172} fill="#ffe08a" opacity={0.45} />
    {[-60, -120].map((y) => <ellipse key={y} cx={0} cy={y} rx={11} ry={6} fill="#d6a23a" />)}
    <path d="M -40,-206 Q 0,-180 40,-206 Q 30,-196 0,-192 Q -30,-196 -40,-206 Z" fill="#d9a83c" />
    <ellipse cx={0} cy={-206} rx={40} ry={7} fill="#8f6519" />
    <path d="M -6,-210 Q 0,-236 6,-210 Z" fill="#e2b44a" />
    <circle cx={0} cy={-238} r={6} fill="#e2b44a" />
    {[-30, 0, 30].map((dx, k) => (
      <g key={dx} transform={`translate(${dx} ${-212})`}>
        <Flame f={f} seed={seed + k * 1.7} h={30} size={st.size} bend={bend} />
      </g>
    ))}
  </g>
);

const Lantern: React.FC<{ f: number; x: number; seed: number; on: number; swing: number; hue: [string, string] }> = ({ f, x, seed, on, swing, hue }) => {
  const a = swing;
  const bright = 0.25 + 0.75 * on * flick(f, seed) ;
  return (
    <g transform={`translate(${x} 312) rotate(${a})`}>
      <line x1={0} y1={0} x2={0} y2={62} stroke="#c9b48a" strokeWidth={2} />
      <g transform="translate(0 62)">
        <circle cx={0} cy={56} r={170} fill="url(#glowBig)" opacity={0.75 * on} style={{ mixBlendMode: "screen" }} />
        <rect x={-18} y={0} width={36} height={10} rx={3} fill="#7a4a1c" />
        <path d="M -44,26 L -18,10 L 18,10 L 44,26 L 44,84 L 18,102 L -18,102 L -44,84 Z" fill={hue[1]} />
        <path d="M -44,26 L -18,10 L 18,10 L 44,26 L 44,84 L 18,102 L -18,102 L -44,84 Z" fill={hue[0]} opacity={bright} />
        <path d="M -18,10 L -18,102 M 18,10 L 18,102 M -44,55 L 44,55" stroke="#5a1e16" strokeWidth={2.2} opacity={0.55} />
        <ellipse cx={0} cy={56} rx={16} ry={26} fill="#fff1b8" opacity={0.6 * on} />
        {[-24, 0, 24].map((dx) => (
          <g key={dx}>
            <line x1={dx} y1={102} x2={dx + Math.sin(f * 0.2 + dx) * 2} y2={140} stroke={hue[0]} strokeWidth={3} strokeLinecap="round" />
            <circle cx={dx + Math.sin(f * 0.2 + dx) * 2} cy={142} r={3.5} fill="#ffd36b" />
          </g>
        ))}
      </g>
    </g>
  );
};

// ---------- houses ----------
const HOUSES = [
  { c: 390, wall: "#c98a7c", trim: "#8f5a52", hue: ["#ff5a6e", "#5a1e2a"] as [string, string] },
  { c: 1130, wall: "#d6aa5e", trim: "#946e2c", hue: ["#ff8a2a", "#5a2a10"] as [string, string] },
  { c: 1870, wall: "#74a7a2", trim: "#3f6e6a", hue: ["#ff4fa0", "#56173a"] as [string, string] },
  { c: 2610, wall: "#b791b7", trim: "#7a5a7c", hue: ["#ffb12a", "#5a3410"] as [string, string] },
];
const BIG = HOUSES.flatMap((h, hi) => [
  { kind: "samai" as const, x: h.c - 135, house: hi },
  { kind: "lantern" as const, x: h.c, house: hi },
  { kind: "samai" as const, x: h.c + 135, house: hi },
]);
const bigState = (f: number, x: number) => lightState(f, outTime(x), chainAt(x));

const House: React.FC<{ c: number; wall: string; trim: string; lit: number }> = ({ c, wall, trim, lit }) => {
  const x0 = c - 350;
  const arch = (cx: number, top: number, w: number, bottom: number) => `M ${cx - w / 2},${bottom} L ${cx - w / 2},${top + w / 2} A ${w / 2},${w / 2} 0 0 1 ${cx + w / 2},${top + w / 2} L ${cx + w / 2},${bottom} Z`;
  return (
    <g>
      <rect x={x0} y={300} width={700} height={505} fill={wall} />
      <rect x={x0} y={300} width={700} height={505} fill="url(#wallShade)" />
      <rect x={x0 - 14} y={282} width={728} height={26} rx={4} fill={trim} />
      {Array.from({ length: 12 }, (_, k) => <rect key={k} x={x0 - 6 + k * 61} y={266} width={30} height={18} rx={3} fill={trim} />)}
      <rect x={x0} y={308} width={700} height={8} fill="#000" opacity={0.12} />
      {/* windows */}
      {[-240, 240].map((dx) => (
        <g key={dx}>
          <path d={arch(c + dx, 392, 116, 540)} fill={trim} />
          <path d={arch(c + dx, 400, 100, 532)} fill="#1b2147" />
          <path d={arch(c + dx, 400, 100, 532)} fill="url(#windowWarm)" opacity={0.9 * lit} />
          <path d={`M ${c + dx},404 L ${c + dx},532 M ${c + dx - 50},470 L ${c + dx + 50},470`} stroke={trim} strokeWidth={5} />
        </g>
      ))}
      {/* door */}
      <path d={arch(c, 500, 186, 800)} fill={trim} />
      <path d={arch(c, 512, 164, 800)} fill="#3b2626" />
      <path d={arch(c, 512, 164, 800)} fill="url(#doorWarm)" opacity={0.55 * lit} />
      <path d={`M ${c},560 L ${c},800`} stroke="#241515" strokeWidth={4} />
      <circle cx={c - 14} cy={690} r={5} fill="#d9a83c" /><circle cx={c + 14} cy={690} r={5} fill="#d9a83c" />
      {/* toran: marigolds + mango leaves */}
      {Array.from({ length: 13 }, (_, k) => {
        const t = k / 12, x = c - 108 + t * 216, y = 506 + Math.sin(t * Math.PI) * 16;
        return (
          <g key={k}>
            {k % 2 === 0 && <path d={`M ${x},${y + 4} q -7,16 0,26 q 7,-10 0,-26 Z`} fill="#3f8a3a" />}
            <circle cx={x} cy={y} r={7.5} fill={k % 2 ? "#ffb300" : "#ff7a1a"} />
          </g>
        );
      })}
    </g>
  );
};

const Rangoli: React.FC<{ c: number; lit: number; seed: number }> = ({ c, lit, seed }) => {
  const cols = ["#ff5fa2", "#ffd23f", "#3fd0c9", "#ffffff", "#ff8a2a"];
  return (
    <g transform={`translate(${c} 968) scale(1 0.32)`} opacity={0.3 + 0.6 * lit}>
      <circle r={118} fill="none" stroke={cols[seed % 5]} strokeWidth={14} />
      <circle r={86} fill={cols[(seed + 1) % 5]} opacity={0.85} />
      {Array.from({ length: 12 }, (_, k) => {
        const a = (k / 12) * Math.PI * 2;
        return <ellipse key={k} cx={Math.cos(a) * 62} cy={Math.sin(a) * 62} rx={20} ry={11} transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * 62} ${Math.sin(a) * 62})`} fill={cols[(seed + 2) % 5]} />;
      })}
      <circle r={30} fill={cols[(seed + 3) % 5]} />
      <circle r={12} fill="#fff" />
    </g>
  );
};

// ---------- sky ----------
const STARS = Array.from({ length: 140 }, (_, k) => ({ x: rnd(`sx${k}`) * 2400 - 240, y: rnd(`sy${k}`) * 620 - 60, r: 0.8 + rnd(`sr${k}`) * 1.8, s: rnd(`ss${k}`) * 10 }));
const SKYLINE = Array.from({ length: 22 }, (_, k) => ({ x: -900 + k * 260 + rnd(`kx${k}`) * 80, w: 160 + rnd(`kw${k}`) * 160, h: 120 + rnd(`kh${k}`) * 170, dome: rnd(`kd${k}`) > 0.72 }));

// ---------- subtitles ----------
const SUBS: [number, number, string][] = [
  [15, 181, "On Diwali night, every house on the lane glowed with big, bright lamps."],
  [181, 292, "And at the very end of the row sat Deepu..."],
  [292, 362, "...the tiniest diya of all."],
  [368, 482, "His flame was so small, nobody even noticed him."],
  [491, 627, "Then... whoosh! A cold wind rushed down the lane."],
  [631, 747, "One by one, the big lamps flickered... and went out."],
  [749, 826, "The whole lane went dark."],
  [835, 949, "But Deepu sat low, tucked behind the doorstep..."],
  [951, 1026, "...and his little flame held on."],
  [1035, 1166, "Carefully, he leaned over... and lit the diya next to him."],
  [1179, 1309, "That one lit the next... and the next... and the next..."],
  [1313, 1396, "...until the whole lane was shining again."],
  [1405, 1485, "And that night, everyone learned..."],
  [1487, 1604, "...even the smallest light can start something big."],
];
const Subtitle: React.FC<{ f: number }> = ({ f }) => {
  const s = SUBS.find(([a, b]) => f >= a && f < b);
  if (!s) return null;
  const o = Math.min(ramp(f, s[0], s[0] + 6), 1 - ramp(f, s[1] - 6, s[1]));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ fontFamily, fontSize: 50, color: "#fff7e6", letterSpacing: 0.5, textAlign: "center", maxWidth: 1500, lineHeight: 1.2, textShadow: "0 2px 0 rgba(10,14,40,0.85), 0 0 18px rgba(10,14,40,0.9), 0 0 4px rgba(10,14,40,1)" }}>{s[2]}</div>
    </div>
  );
};

// ---------- the film ----------
export const TinyDiyaFilm: React.FC = () => {
  const f = useCurrentFrame();
  const { cx, cy, z } = camera(f);
  const w = wind(f);

  const rowStates = ROW.map((d) => lightState(f, outTime(d.x), rowIn(d.i)));
  const bigStates = BIG.map((b) => bigState(f, b.x));
  const L = (rowStates.reduce((a, s) => a + s.on, 0) + bigStates.reduce((a, s) => a + s.on, 0) * 2) / (N + BIG.length * 2);
  const houseLit = HOUSES.map((_, hi) => { const s = BIG.map((b, k) => (b.house === hi ? bigStates[k].on : -1)).filter((v) => v >= 0); return s.reduce((a, v) => a + v, 0) / s.length; });

  // Deepu: shelters through the wind, holds on, leans and reaches, ends as the hero.
  const struggle = eio(ramp(f, 520, 700)) * (1 - eio(ramp(f, 940, 1000)));
  const dSize = (1 - 0.48 * struggle) * (1 + 0.18 * eio(ramp(f, 960, 1000)) - 0.08 * ramp(f, 1150, 1250)) + 0.12 * Math.sin(f * 1.9) * struggle * 0.4;
  const lean = eio(ramp(f, 1062, 1100)) * (1 - eio(ramp(f, 1124, 1150)));
  const reach = eio(ramp(f, 1084, 1110)) * (1 - eio(ramp(f, 1120, 1146)));
  const hop = f >= 1560 ? Math.abs(Math.sin((f - 1560) * 0.16)) * 6 * (1 - ramp(f, 1600, 1640)) : 0;
  let dFace: Face = { open: blinkAt(f, 99), lookX: 0, lookY: 0, mood: "smile" };
  if (f >= 378 && f < 476) dFace = { ...dFace, lookX: -1.6, lookY: -2.4 };
  if (f >= 522 && f < 770) dFace = { open: 0.1, lookX: 0, lookY: 0, mood: "o" };
  if (f >= 770 && f < 905) dFace = { open: 1.15, lookX: -1.8, lookY: 0.4, mood: "o" };
  if (f >= 905 && f < 985) dFace = { open: 0.7, lookX: 0, lookY: 0, mood: "smile" };
  if (f >= 1040 && f < 1135) dFace = { open: 1, lookX: -2.2, lookY: -1.2, mood: "smile" };
  if (f >= 1300 && f < 1420) dFace = { open: blinkAt(f, 99), lookX: -2.2, lookY: -0.6, mood: "happy" };
  if (f >= 1545) dFace = { open: 1, lookX: 0, lookY: 0, mood: "happy" };

  // Deepu's reaching flame, in world space.
  const tilt = -16 * lean;
  const rad = (tilt * Math.PI) / 180;
  const wk = WICK(-1);
  const wLocal: [number, number] = [wk[0] * DEEPU.s, wk[1] * DEEPU.s];
  // he tips up on his front (left) edge, so the pivot is the bowl's bottom-left
  const px = -40 * DEEPU.s;
  const v: [number, number] = [wLocal[0] - px, wLocal[1]];
  const dBase: [number, number] = [DEEPU.x + px + v[0] * Math.cos(rad) - v[1] * Math.sin(rad), DEEPU.y - hop + v[0] * Math.sin(rad) + v[1] * Math.cos(rad)];
  const nb = ROW[N - 1];
  const nbWick: [number, number] = [nb.x + WICK(1)[0], nb.y + WICK(1)[1] - 6];
  const dH = 42 * DEEPU.s;
  const restTip: [number, number] = [dH * dSize * (sway(f, 7) + w * 0.35 - 0.1 * lean), -dH * dSize * flick(f, 7)];
  const tip: [number, number] = [lerp(restTip[0], nbWick[0] - dBase[0], reach), lerp(restTip[1], nbWick[1] - dBase[1], reach)];

  // final: the whole row turns to look at Deepu
  const turn = eio(ramp(f, 1412, 1460));

  const bloom = f >= 1360 ? Math.exp(-Math.max(0, f - 1368) / 22) * ramp(f, 1360, 1368) : 0;
  const fade = Math.max(1 - ramp(f, 0, 14), ramp(f, 1645, 1664));
  const windShift = (f - WIND_ON) * 26;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1030" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0f2e" />
            <stop offset="0.65" stopColor="#1a2457" />
            <stop offset="1" stopColor="#2b2f63" />
          </linearGradient>
          <radialGradient id="glowSmall"><stop offset="0" stopColor="#ffc861" stopOpacity="0.75" /><stop offset="0.35" stopColor="#ff9a2a" stopOpacity="0.28" /><stop offset="1" stopColor="#ff7a00" stopOpacity="0" /></radialGradient>
          <radialGradient id="glowBig"><stop offset="0" stopColor="#ffbf5a" stopOpacity="0.55" /><stop offset="0.45" stopColor="#ff8a2a" stopOpacity="0.18" /><stop offset="1" stopColor="#ff6a00" stopOpacity="0" /></radialGradient>
          <radialGradient id="moonGlow"><stop offset="0" stopColor="#fff4d0" stopOpacity="0.35" /><stop offset="1" stopColor="#fff4d0" stopOpacity="0" /></radialGradient>
          <linearGradient id="wallShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0d1440" stopOpacity="0.15" /><stop offset="1" stopColor="#0d1440" stopOpacity="0.35" /></linearGradient>
          <radialGradient id="windowWarm" cx="0.5" cy="0.7" r="0.8"><stop offset="0" stopColor="#ffe6a3" /><stop offset="1" stopColor="#ff9e3d" /></radialGradient>
          <radialGradient id="doorWarm" cx="0.5" cy="0.85" r="0.9"><stop offset="0" stopColor="#ffb75a" /><stop offset="1" stopColor="#5a2a10" stopOpacity="0" /></radialGradient>
          <linearGradient id="street" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#262c5c" /><stop offset="1" stopColor="#10142f" /></linearGradient>
          <radialGradient id="screenBloom" cx="0.5" cy="0.6" r="0.7"><stop offset="0" stopColor="#ffcf7a" stopOpacity="0.5" /><stop offset="1" stopColor="#ff8a2a" stopOpacity="0" /></radialGradient>
          <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stopColor="#05081c" stopOpacity="0" /><stop offset="1" stopColor="#05081c" stopOpacity="0.55" /></radialGradient>
          <linearGradient id="subScrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#070a22" stopOpacity="0" /><stop offset="1" stopColor="#070a22" stopOpacity="0.62" /></linearGradient>
          <radialGradient id="laneHaze" cx="0.5" cy="1" r="0.9"><stop offset="0" stopColor="#ff9a3a" stopOpacity="0.4" /><stop offset="1" stopColor="#ff9a3a" stopOpacity="0" /></radialGradient>
        </defs>

        {/* sky + stars + moon (screen space, light parallax) */}
        <rect width={1920} height={1080} fill="url(#sky)" />
        <g transform={`translate(${-(cx - 1500) * 0.06} ${-(cy - 560) * 0.08})`}>
          {STARS.map((s, k) => <circle key={k} cx={s.x} cy={s.y} r={s.r} fill="#fff8e0" opacity={(0.45 + 0.45 * Math.sin(f * 0.08 + s.s)) * (1 - 0.35 * L)} />)}
          <g transform="translate(1560 150)">
            <circle r={150} fill="url(#moonGlow)" />
            <circle r={52} fill="#fff3c8" />
            <circle cx={22} cy={-12} r={46} fill="#141c48" />
          </g>
        </g>

        {/* world */}
        <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
          {/* distant skyline, parallax */}
          <g transform={`translate(${(cx - 1500) * 0.45} ${(cy - 560) * 0.35})`}>
            {SKYLINE.map((b, k) => (
              <g key={k}>
                <rect x={b.x} y={420 - b.h} width={b.w} height={b.h + 400} fill="#1a2152" />
                {b.dome && <path d={`M ${b.x + b.w * 0.2},${420 - b.h} A ${b.w * 0.3},${b.w * 0.34} 0 0 1 ${b.x + b.w * 0.8},${420 - b.h} Z`} fill="#1a2152" />}
                {Array.from({ length: 3 }, (_, j) => <rect key={j} x={b.x + 20 + j * (b.w / 3)} y={440 - b.h + 30 + (k % 3) * 18} width={12} height={16} fill="#ffcf7a" opacity={(0.25 + 0.5 * L) * (rnd(`wl${k}${j}`) > 0.45 ? 1 : 0)} />)}
              </g>
            ))}
          </g>

          {/* sky lanterns rising at the end, behind the houses */}
          {f >= 1395 && Array.from({ length: 7 }, (_, k) => {
            const t = (f - 1395 - k * 16) / 270;
            if (t <= 0) return null;
            const x = 2000 + k * 200 + Math.sin(f * 0.03 + k) * 18, y = 330 - t * 230 - (k % 3) * 30;
            return (
              <g key={k} transform={`translate(${x} ${y}) scale(${0.8 + rnd(`ls${k}`) * 0.5})`} opacity={clamp01(t * 6)}>
                <circle r={90} fill="url(#glowBig)" style={{ mixBlendMode: "screen" }} />
                <path d="M -18,-26 L 18,-26 L 24,22 L -24,22 Z" fill="#ffb347" />
                <path d="M -18,-26 L 18,-26 L 24,22 L -24,22 Z" fill="#fff0b0" opacity={0.45 + 0.2 * Math.sin(f * 0.4 + k)} />
                <ellipse cx={0} cy={22} rx={24} ry={4} fill="#c86a1a" />
              </g>
            );
          })}

          {/* boundary wall + tree at the lane's end */}
          <circle cx={3230} cy={430} r={190} fill="#142048" />
          <circle cx={3080} cy={500} r={130} fill="#16234d" />
          <rect x={2985} y={600} width={900} height={280} fill="#2c3263" />
          <rect x={2975} y={588} width={920} height={20} fill="#3a4176" />
          {Array.from({ length: 7 }, (_, r) => <line key={r} x1={2985} y1={630 + r * 34} x2={3885} y2={630 + r * 34} stroke="#252a55" strokeWidth={3} />)}

          {/* houses */}
          {HOUSES.map((h, hi) => <House key={hi} c={h.c} wall={h.wall} trim={h.trim} lit={houseLit[hi]} />)}
          {/* night shade over the houses, lifts with the light */}
          <rect x={-300} y={250} width={3300} height={560} fill="#0e1545" opacity={0.42 - 0.24 * L} />

          {/* warm light pooling on walls from the big lamps */}
          {BIG.map((b, k) => <circle key={k} cx={b.x} cy={b.kind === "lantern" ? 440 : 600} r={b.kind === "lantern" ? 300 : 330} fill="url(#glowBig)" opacity={0.85 * bigStates[k].on} style={{ mixBlendMode: "screen" }} />)}

          {/* lanterns */}
          {BIG.map((b, k) => b.kind === "lantern" ? (
            <Lantern key={k} f={f} x={b.x} seed={k * 3.1} on={bigStates[k].on} swing={2.2 * Math.sin(f * 0.05 + k) + w * 16 * Math.sin(f * 0.23 + k) + w * 10} hue={HOUSES[b.house].hue} />
          ) : null)}

          {/* street + rangoli */}
          <rect x={-1200} y={850} width={5400} height={1100} fill="url(#street)" />
          {Array.from({ length: 70 }, (_, k) => <ellipse key={k} cx={rnd(`cbx${k}`) * 3600 - 300} cy={880 + rnd(`cby${k}`) * 520} rx={10 + rnd(`cbr${k}`) * 16} ry={4} fill="#1a2050" opacity={0.7} />)}
          {HOUSES.map((h, hi) => <Rangoli key={hi} c={h.c} lit={houseLit[hi]} seed={hi + 1} />)}
          <rect x={-1200} y={850} width={5400} height={300} fill="url(#laneHaze)" opacity={L} style={{ mixBlendMode: "screen" }} />

          {/* samai lamps (stand on the plinth, behind the row) */}
          {BIG.map((b, k) => b.kind === "samai" ? <Samai key={k} f={f} x={b.x} seed={k * 2.3} st={bigStates[k]} bend={w * (bigStates[k].dying > 0 ? 1.4 : 0.9)} /> : null)}

          {/* plinth with the low step at the end where Deepu sits */}
          <rect x={-300} y={800} width={3160} height={52} fill="#3a3358" />
          <rect x={-300} y={796} width={3160} height={10} fill="#5d5383" />
          <rect x={2860} y={840} width={140} height={40} fill="#352f52" />
          <rect x={2860} y={836} width={140} height={9} fill="#5a5080" />
          <rect x={2855} y={800} width={8} height={44} fill="#2a2546" />

          {/* the row of diyas */}
          {ROW.map((d, k) => {
            const st = rowStates[k];
            const seed = d.i * 1.37;
            const open = st.on > 0.5 ? blinkAt(f, d.i) : 0;
            const face: Face = { open, lookX: 2.4 * turn, lookY: -0.4 * turn, mood: turn > 0.5 && st.on > 0.5 ? "happy" : "smile" };
            const wkk = WICK(1);
            return (
              <g key={k} transform={`translate(${d.x} ${d.y})`}>
                <ellipse cx={0} cy={2} rx={48} ry={6} fill="#000" opacity={0.25} />
                <DiyaBody face={face} wickSide={1} />
                <g transform={`translate(${wkk[0]} ${wkk[1]})`}>
                  <Flame f={f} seed={seed} h={34} size={st.size} bend={w * (st.dying > 0 ? 1.6 : 1)} />
                  {st.size < 0.05 && f > outTime(d.x) && <Smoke f={f} t0={outTime(d.x) + 10} seed={seed} />}
                  <Sparks f={f} t0={rowIn(d.i)} seed={d.i} />
                </g>
              </g>
            );
          })}
          {/* big-lamp smoke + sparks */}
          {BIG.map((b, k) => {
            const y = b.kind === "lantern" ? 440 : 588;
            return (
              <g key={k} transform={`translate(${b.x} ${y})`}>
                <Smoke f={f} t0={outTime(b.x) + 10} seed={k} />
                <Sparks f={f} t0={chainAt(b.x)} seed={k + 50} scale={1.6} />
              </g>
            );
          })}

          {/* Deepu */}
          <g transform={`translate(${DEEPU.x + px} ${DEEPU.y - hop}) rotate(${tilt}) translate(${-px} 0) scale(${DEEPU.s})`}>
            <ellipse cx={0} cy={2} rx={48} ry={6} fill="#000" opacity={0.3} />
            <DiyaBody face={dFace} wickSide={-1} />
          </g>
          <g transform={`translate(${dBase[0]} ${dBase[1]})`}>
            <Flame f={f} seed={7} h={dH} size={Math.max(0.3, dSize)} bend={0} tip={tip} glow={1 + 0.6 * eio(ramp(f, 960, 1000)) * (1 - ramp(f, 1180, 1300))} />
          </g>

          {/* wind: streaks + marigold petals */}
          {w > 0.01 && (
            <g opacity={w}>
              {Array.from({ length: 14 }, (_, k) => {
                const y = 340 + rnd(`wy${k}`) * 520;
                const x = ((rnd(`wx${k}`) * 4200 + windShift * (0.8 + rnd(`ws${k}`) * 0.6)) % 4400) - 600;
                const len = 220 + rnd(`wl${k}`) * 260;
                return <path key={k} d={`M ${x},${y} q ${len * 0.3},${-18} ${len * 0.55},0 t ${len * 0.45},-6`} stroke="#dfe6ff" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.35} />;
              })}
              {Array.from({ length: 40 }, (_, k) => {
                const y = 320 + rnd(`py${k}`) * 560 + Math.sin(f * 0.15 + k) * 24;
                const x = ((rnd(`px${k}`) * 4200 + windShift * (0.9 + rnd(`pv${k}`) * 0.5)) % 4400) - 600;
                return <ellipse key={k} cx={x} cy={y} rx={9} ry={5} transform={`rotate(${f * 9 + k * 40} ${x} ${y})`} fill={k % 3 ? "#ffb300" : "#ff6a1a"} />;
              })}
            </g>
          )}
        </g>

        {/* "shining" bloom */}
        <rect width={1920} height={1080} fill="url(#screenBloom)" opacity={bloom} style={{ mixBlendMode: "screen" }} />
        {/* soft vignette */}
        <rect width={1920} height={1080} fill="url(#vignette)" />
        {/* subtitle scrim */}
        <rect y={820} width={1920} height={260} fill="url(#subScrim)" />
      </svg>
      <Subtitle f={f} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};
