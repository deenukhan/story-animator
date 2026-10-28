import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/PatrickHand";

// "The Little Robot and the Last Flower": a 59.5 s kids' story film, every frame drawn in code (SVG). No images, no AI video.
// Narration (ElevenLabs, Clara, take A) is muxed after render at +15 frames. Cue table: projects/little-robot-story/BRIEF.md
// Key frames: "Pip" f296 · "before" f473 · "red" f520 · "alive" f704 · "storm" f768 · "gone" f1027 · "standing" f1096 ·
// "seeds" f1181 · "swept" f1291/f1321 · "one" f1496 → "green" f1556 · "life" f1688.

const { fontFamily } = loadFont();
export const FILM_FRAMES = 1785;

// ---------- helpers ----------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eout = (t: number) => 1 - Math.pow(1 - t, 3);
const eback = (t: number) => { const c1 = 1.9, c3 = c1 + 1; return t >= 1 ? 1 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const rnd = (s: string) => random(s);
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b), k = clamp01(t);
  return "#" + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, "0")).join("");
};
// piecewise eased keyframes [frame, value]
const keys = (f: number, K: [number, number][]) => {
  for (let k = 0; k < K.length - 1; k++) if (f <= K[k + 1][0]) return lerp(K[k][1], K[k + 1][1], eio(ramp(f, K[k][0], K[k + 1][0])));
  return K[K.length - 1][1];
};

// ---------- story clock ----------
const nightAmt = (f: number) => eio(ramp(f, 205, 245)) * (1 - eio(ramp(f, 372, 400)));
const stormDark = (f: number) => eio(ramp(f, 735, 770)) * (1 - eio(ramp(f, 950, 1000)));
const rainAmt = (f: number) => eio(ramp(f, 752, 790)) * (1 - eio(ramp(f, 945, 985)));
const springAmt = (f: number) => eio(ramp(f, 1440, 1560));
const sunBreak = (f: number) => eio(ramp(f, 1205, 1240)) * (1 - eio(ramp(f, 1272, 1300)));
const STRIKES = [768, 846, 910];
const flashAt = (f: number) => STRIKES.reduce((a, t) => a + (f >= t ? Math.exp(-(f - t) / 3.5) : 0) + (f >= t + 5 ? 0.6 * Math.exp(-(f - t - 5) / 3) : 0), 0);
// colour spreads outward from the flower in spring
const FLOWER = { x: 1900, y: 806 };
const greenAt = (f: number, x: number) => { const d = Math.abs(x - FLOWER.x) * 0.03; return eio(ramp(f, 1450 + d, 1545 + d)); };

// ---------- Pip's route ----------
const PIP_Y = 880;
const pipX = (f: number) => keys(f, [[0, 980], [205, 1060], [470, 1790], [1285, 1790], [1425, 3320], [1445, 3320], [1565, 1985], [1785, 1985]]);
const sweeping = (f: number) => (f < 470 ? 1 : 0) * (1 - ramp(f, 455, 470)) + (f > 1285 && f < 1425 ? 1 : 0);
const umbrella = (f: number) => eio(ramp(f, 790, 818)) * (1 - eio(ramp(f, 958, 990)));
const battery = (f: number) => (f < 800 ? 1 : f < 1215 ? lerp(1, 0.1, eio(ramp(f, 800, 1030))) : lerp(0.1, 1, eio(ramp(f, 1215, 1262))));
const slump = (f: number) => eio(ramp(f, 985, 1020)) * (1 - eio(ramp(f, 1212, 1240)));

// ---------- camera ----------
type Cam = [number, number, number, number];
const CAM: Cam[] = [
  [0, 2000, 520, 0.56], [205, 2080, 540, 0.6],
  [335, 1440, 720, 1.45], [470, 1800, 720, 1.5],
  [540, 1895, 760, 2.7], [600, 1898, 762, 2.75],
  [645, 1850, 730, 1.95], [725, 1850, 730, 2.0],
  [790, 1860, 600, 1.15], [950, 1860, 620, 1.32],
  [1020, 1850, 730, 2.0], [1110, 1852, 732, 2.1],
  [1150, 1900, 730, 2.8], [1200, 1900, 730, 2.85],
  [1240, 1830, 700, 1.65], [1285, 1830, 700, 1.65],
  [1425, 3200, 700, 1.3],
  [1500, 2000, 520, 0.56], [1580, 2000, 520, 0.58],
  [1700, 1960, 690, 1.45], [1785, 1960, 692, 1.5],
];
const camera = (f: number) => {
  for (let k = 0; k < CAM.length - 1; k++) {
    const [f0, x0, y0, z0] = CAM[k], [f1, x1, y1, z1] = CAM[k + 1];
    if (f <= f1) { const t = eio(ramp(f, f0, f1)); return { cx: lerp(x0, x1, t), cy: lerp(y0, y1, t), z: Math.exp(lerp(Math.log(z0), Math.log(z1), t)) }; }
  }
  const [, x, y, z] = CAM[CAM.length - 1];
  return { cx: x, cy: y, z };
};

// ---------- the city ----------
const GREYS = ["#8e949b", "#9aa0a6", "#868c94", "#a1a6ab", "#939aa1"];
const PASTELS = ["#f2b5a0", "#f6d38b", "#a8d8c8", "#b9c7f2", "#f3c6d6"];
const BLD = (() => {
  const out: { x: number; w: number; h: number; k: number; tank: boolean; ant: boolean }[] = [];
  let x = -500, k = 0;
  while (x < 4500) { const w = 280 + rnd(`bw${k}`) * 150; out.push({ x, w, h: 300 + rnd(`bh${k}`) * 260, k, tank: rnd(`bt${k}`) > 0.6, ant: rnd(`ba${k}`) > 0.55 }); x += w + 14; k++; }
  return out;
})();
const FAR = Array.from({ length: 26 }, (_, k) => ({ x: -1200 + k * 260 + rnd(`fx${k}`) * 90, w: 180 + rnd(`fw${k}`) * 170, h: 260 + rnd(`fh${k}`) * 300 }));
const STACKS = [450, 820, 2650, 3420];
const LAMPS = [320, 1150, 1560, 2420, 3150, 3750];
const CRACKS: [number, number][] = [[240, 812], [470, 905], [700, 812], [930, 905], [1160, 812], [1390, 905], [1610, 812], [2060, 812], [2210, 905], [2390, 812], [2560, 905], [2740, 812], [2910, 905], [3090, 812], [3260, 905], [3480, 812], [3700, 905], [3930, 812]];
const SPROUT_COLS = ["#ff6b8a", "#ffd23f", "#ffffff", "#ff9a3c", "#c58bff"];
const RANK = CRACKS.map((c, i) => ({ i, d: Math.abs(c[0] - FLOWER.x) })).sort((a, b) => a.d - b.d).reduce((acc, r, n) => { acc[r.i] = n; return acc; }, {} as Record<number, number>);
const sproutT = (i: number) => 1496 + RANK[i] * 4.5;
// seeds: the cracks on Pip's sweep path get theirs from his broom, the rest are carried by the wind
const ON_PATH = (x: number) => x > 1950 && x < 3340;
const landT = (i: number) => {
  const x = CRACKS[i][0];
  if (ON_PATH(x)) return 1285 + (x - 1790) / 10.9 + 6;
  return 1340 + RANK[i] * 6;
};
const TREES = [690, 2300, 3640];

// ---------- Pip ----------
type Eyes = "normal" | "wide" | "heart" | "tired" | "happy" | "determined";
const blink = (f: number, s: number) => { const p = (f + s * 37) % 110; return p < 4 ? 1 - Math.sin((p / 4) * Math.PI) : 1; };
const eyesAt = (f: number): Eyes => {
  if (f >= 470 && f < 600) return "wide";
  if (f >= 700 && f < 735) return "heart";
  if (f >= 735 && f < 800) return "wide";
  if (f >= 800 && f < 958) return "determined";
  if (f >= 990 && f < 1210) return "tired";
  if (f >= 1210 && f < 1277) return "determined";
  if (f >= 1277 && f < 1440) return "happy";
  if (f >= 1580) return "happy";
  return "normal";
};
const BODY = "#d5d9de", EDGE = "#7f868f", SCREEN = "#1c232e", LED = "#e6fbff";

const broomPose = (f: number) => {
  const u = umbrella(f), sw = sweeping(f);
  const sweepA = sw > 0 ? 38 + 13 * Math.sin(f * 0.34) : 54;
  const hand: [number, number] = [lerp(30, 46, u), lerp(-80, -120, u)];
  const ang = lerp(sweepA, -50, u);
  return { hand, ang, u };
};
// broom bristle centre in Pip's local space
const broomHeadLocal = (f: number): [number, number] => {
  const { hand, ang } = broomPose(f);
  const r = (ang * Math.PI) / 180;
  return [hand[0] + Math.cos(r) * 108, hand[1] + Math.sin(r) * 108];
};

const PipEyes: React.FC<{ f: number; kind: Eyes; look: number }> = ({ f, kind, look }) => {
  const o = blink(f, 3);
  return (
    <g>
      {[-18, 18].map((ex, k) => {
        const x = ex + look, y = -149;
        if (kind === "heart") return <path key={k} d={`M ${x},${y + 9} C ${x - 16},${y - 2} ${x - 9},${y - 15} ${x},${y - 6} C ${x + 9},${y - 15} ${x + 16},${y - 2} ${x},${y + 9} Z`} fill={LED} transform={`translate(${x} ${y}) scale(${1 + 0.12 * Math.sin(f * 0.4)}) translate(${-x} ${-y})`} />;
        if (kind === "happy") return <path key={k} d={`M ${x - 9},${y + 5} Q ${x},${y - 10} ${x + 9},${y + 5}`} stroke={LED} strokeWidth={5} fill="none" strokeLinecap="round" />;
        if (kind === "tired") return <rect key={k} x={x - 8} y={y + 1} width={16} height={6} rx={3} fill={LED} opacity={0.75 + 0.25 * Math.sin(f * 0.2)} />;
        if (kind === "determined") return <path key={k} d={ex < 0 ? `M ${x - 8},${y - 6} L ${x + 8},${y - 1} L ${x + 8},${y + 10} L ${x - 8},${y + 10} Z` : `M ${x - 8},${y - 1} L ${x + 8},${y - 6} L ${x + 8},${y + 10} L ${x - 8},${y + 10} Z`} fill={LED} />;
        const w = kind === "wide" ? 18 : 14, h = (kind === "wide" ? 28 : 22) * o;
        return <rect key={k} x={x - w / 2} y={y - h / 2} width={w} height={Math.max(2, h)} rx={w / 2} fill={LED} />;
      })}
    </g>
  );
};

const Pip: React.FC<{ f: number; x: number; facing: number; layer: "body" | "lights" }> = ({ f, x, facing, layer }) => {
  const sw = sweeping(f);
  const sl = slump(f);
  const bob = 2 * Math.sin(f * 0.12) + (sw > 0 ? 1.5 * Math.abs(Math.sin(f * 0.34)) : 0);
  const rock = sw > 0 ? 2.5 * Math.sin(f * 0.34) : 0;
  const { hand, ang, u } = broomPose(f);
  const kind = eyesAt(f);
  const look = f >= 470 && f < 1277 ? 4 : 0;
  const bat = battery(f);
  const antOn = (f % 60) < 7;
  const headTilt = (f >= 610 && f < 700 ? 7 * eio(ramp(f, 610, 640)) * (1 - eio(ramp(f, 680, 700))) : 0) + 6 * sl;
  const spin = (x * 1.6) % 360;
  if (layer === "lights") {
    return (
      <g transform={`translate(${x} ${PIP_Y - bob}) scale(${facing} 1) rotate(${rock + 4 * sl} 0 -34)`}>
        <g transform={`rotate(${headTilt} 0 -112)`}>
          <circle cx={0} cy={-149} r={58} fill="url(#ledGlow)" style={{ mixBlendMode: "screen" }} />
          <PipEyes f={f} kind={kind} look={look} />
        </g>
        <circle cx={0} cy={-216} r={antOn ? 16 : 0} fill="url(#ledGlow)" style={{ mixBlendMode: "screen" }} />
      </g>
    );
  }
  const segs = Math.ceil(bat * 4 - 0.001);
  const batCol = bat > 0.5 ? "#6ee07a" : bat > 0.25 ? "#ffd45a" : "#ff5a4a";
  const batBlink = bat < 0.25 ? (Math.sin(f * 0.45) > 0 ? 1 : 0.25) : 1;
  const r = (ang * Math.PI) / 180;
  const fan = 1 + 0.7 * u;
  return (
    <g transform={`translate(${x} ${PIP_Y})`}>
      <ellipse cx={0} cy={4} rx={74} ry={10} fill="#000" opacity={0.22} />
      <g transform={`scale(${facing} 1)`}>
        {/* treads */}
        <rect x={-62} y={-36} width={124} height={36} rx={18} fill="#4a4f57" />
        {[-38, 0, 38].map((wx, k) => (
          <g key={k} transform={`translate(${wx} -18) rotate(${spin})`}>
            <circle r={12} fill="#2f333a" />
            <line x1={-9} y1={0} x2={9} y2={0} stroke="#5b616a" strokeWidth={3} />
          </g>
        ))}
        <g transform={`translate(0 ${-bob}) rotate(${rock + 4 * sl} 0 -34)`}>
          {/* back arm */}
          <line x1={-30} y1={-78} x2={-44} y2={-54} stroke={EDGE} strokeWidth={8} strokeLinecap="round" />
          {/* body */}
          <rect x={-46} y={-112} width={92} height={78} rx={22} fill={BODY} stroke={EDGE} strokeWidth={3} />
          <rect x={-24} y={-90} width={48} height={20} rx={6} fill="#2a2f37" />
          {Array.from({ length: 4 }, (_, i) => <rect key={i} x={-20 + i * 10.5} y={-86} width={8} height={12} rx={2} fill={i < segs ? batCol : "#3a404a"} opacity={i < segs ? batBlink : 1} />)}
          <rect x={22} y={-84} width={4} height={8} rx={1} fill="#2a2f37" />
          {/* head */}
          <g transform={`rotate(${headTilt} 0 -112)`}>
            <rect x={-6} y={-116} width={12} height={8} fill={EDGE} />
            <rect x={-56} y={-188} width={112} height={76} rx={28} fill={BODY} stroke={EDGE} strokeWidth={3} />
            <rect x={-44} y={-176} width={88} height={54} rx={18} fill={SCREEN} />
            <PipEyes f={f} kind={kind} look={look} />
            <line x1={0} y1={-188} x2={0} y2={-208} stroke={EDGE} strokeWidth={4} />
            <circle cx={0} cy={-214} r={7} fill={antOn ? LED : "#b9bfc6"} />
            <rect x={-62} y={-160} width={8} height={22} rx={4} fill={EDGE} />
            <rect x={54} y={-160} width={8} height={22} rx={4} fill={EDGE} />
          </g>
          {/* broom + front arm */}
          <g transform={`translate(${hand[0]} ${hand[1]}) rotate(${ang})`}>
            <line x1={-14} y1={0} x2={94} y2={0} stroke="#7d7468" strokeWidth={7} strokeLinecap="round" />
            {/* as an umbrella the bristles turn flat over the flower, tips up */}
            <g transform={`translate(96 0) rotate(${-(ang + 90) * u}) scale(1 ${fan})`}>
              <path d="M 0,-8 L 34,-22 L 34,22 L 0,8 Z" fill={mix("#b3ab9b", "#e2c27a", springAmt(f))} stroke="#8f8676" strokeWidth={2} />
              {Array.from({ length: 6 }, (_, i) => <line key={i} x1={6} y1={-6 + i * 2.4} x2={34} y2={-19 + i * 7.6} stroke="#8f8676" strokeWidth={1.5} />)}
              <rect x={-3} y={-9} width={8} height={18} rx={2} fill="#6c665d" />
            </g>
          </g>
          <line x1={16} y1={-80} x2={hand[0]} y2={hand[1]} stroke={EDGE} strokeWidth={8} strokeLinecap="round" />
          <circle cx={hand[0]} cy={hand[1]} r={8} fill={BODY} stroke={EDGE} strokeWidth={2} />
        </g>
      </g>
      {/* (r is used by canopy splashes in the film) */}
      <g data-r={r} />
    </g>
  );
};

// ---------- flower ----------
const Flower: React.FC<{ f: number; sway: number }> = ({ f, sway }) => {
  const petals = 1 - eio(ramp(f, 1135, 1160)) + eback(ramp(f, 1515, 1555)) * 1.15;
  const seedHead = eio(ramp(f, 1150, 1185)) * (1 - ramp(f, 1500, 1520));
  const seedsLeft = 1 - ramp(f, 1279, 1302);
  const glow = seedHead * (0.75 + 0.25 * Math.sin(f * 0.2));
  return (
    <g transform={`translate(${FLOWER.x} ${FLOWER.y})`}>
      <path d="M -26,0 l 9,-3 l 7,4 l 8,-4 l 9,3 l 10,-2" stroke="#4d5258" strokeWidth={3} fill="none" />
      <g transform={`rotate(${sway})`}>
        <path d="M 0,0 C -4,-24 5,-46 0,-72" stroke="#5c8a4a" strokeWidth={5} fill="none" strokeLinecap="round" />
        <ellipse cx={-11} cy={-26} rx={12} ry={5} transform="rotate(-28 -11 -26)" fill="#6da858" />
        <ellipse cx={11} cy={-42} rx={12} ry={5} transform="rotate(26 11 -42)" fill="#6da858" />
        <g transform="translate(0 -72)">
          {petals > 0.01 && Array.from({ length: 5 }, (_, i) => {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + 0.05 * Math.sin(f * 0.05);
            return <circle key={i} cx={Math.cos(a) * 12 * petals} cy={Math.sin(a) * 12 * petals} r={12 * petals} fill="#e6394f" />;
          })}
          {petals > 0.01 && <circle r={7 * Math.min(1, petals)} fill="#ffcf3f" />}
          {seedHead > 0.01 && (
            <g>
              <circle r={50 * seedHead} fill="url(#seedGlow)" opacity={glow} style={{ mixBlendMode: "screen" }} />
              {Array.from({ length: 16 }, (_, i) => {
                if (i >= Math.round(16 * seedsLeft)) return null;
                const a = (i / 16) * Math.PI * 2;
                const L = 24 * seedHead;
                return (
                  <g key={i}>
                    <line x1={0} y1={0} x2={Math.cos(a) * L} y2={Math.sin(a) * L} stroke="#f4efe2" strokeWidth={1.5} opacity={0.8} />
                    <circle cx={Math.cos(a) * L} cy={Math.sin(a) * L} r={3.2} fill="#fff6d8" />
                  </g>
                );
              })}
              <circle r={5 * seedHead} fill="#d9cfb8" />
            </g>
          )}
        </g>
      </g>
      {/* petals falling as it goes to seed */}
      {f >= 1136 && f < 1215 && Array.from({ length: 5 }, (_, i) => {
        const t = (f - 1136 - i * 3) / 70;
        if (t <= 0 || t >= 1) return null;
        const px = Math.sin(t * 5 + i) * 18 - t * 70 + i * 6, py = -72 + t * 76;
        return <ellipse key={i} cx={px} cy={py} rx={9} ry={6} transform={`rotate(${t * 300 + i * 50} ${px} ${py})`} fill="#e6394f" opacity={1 - t * 0.6} />;
      })}
    </g>
  );
};

const Sprout: React.FC<{ g: number; col: string; seed: number }> = ({ g, col, seed }) => {
  if (g <= 0.01) return null;
  const h = 44 * g;
  const bloom = clamp01((g - 0.6) / 0.4);
  return (
    <g>
      <path d={`M 0,0 C -3,${-h * 0.4} 4,${-h * 0.7} 0,${-h}`} stroke="#4f9a4a" strokeWidth={4} fill="none" strokeLinecap="round" />
      <ellipse cx={-8 * g} cy={-h * 0.35} rx={10 * g} ry={4 * g} transform={`rotate(-25 ${-8 * g} ${-h * 0.35})`} fill="#62b25a" />
      <ellipse cx={8 * g} cy={-h * 0.55} rx={10 * g} ry={4 * g} transform={`rotate(25 ${8 * g} ${-h * 0.55})`} fill="#62b25a" />
      {bloom > 0 && (
        <g transform={`translate(0 ${-h}) rotate(${seed * 40})`}>
          {Array.from({ length: 5 }, (_, i) => { const a = (i / 5) * Math.PI * 2; return <circle key={i} cx={Math.cos(a) * 6 * bloom} cy={Math.sin(a) * 6 * bloom} r={6 * bloom} fill={col} />; })}
          <circle r={3.5 * bloom} fill="#ffcf3f" />
        </g>
      )}
    </g>
  );
};

const Building: React.FC<{ b: (typeof BLD)[number]; f: number; N: number }> = ({ b, f, N }) => {
  const top = 790 - b.h;
  const g = greenAt(f, b.x + b.w / 2);
  const wall = mix(GREYS[b.k % 5], PASTELS[b.k % 5], g * 0.85);
  const cols = Math.max(2, Math.floor((b.w - 50) / 72)), rows = Math.max(2, Math.floor((b.h - 90) / 84));
  const vine = eio(ramp(f, 1520 + Math.abs(b.x - FLOWER.x) * 0.025, 1640 + Math.abs(b.x - FLOWER.x) * 0.025));
  return (
    <g>
      <rect x={b.x} y={top} width={b.w} height={b.h} fill={wall} />
      <rect x={b.x - 6} y={top - 14} width={b.w + 12} height={16} fill={mix("#7b8189", "#e8d9c0", g * 0.7)} />
      {b.tank && <g><rect x={b.x + b.w * 0.6} y={top - 74} width={56} height={52} rx={8} fill={mix("#7d838b", "#d9b48f", g * 0.7)} /><rect x={b.x + b.w * 0.6 + 8} y={top - 22} width={6} height={10} fill="#6c727a" /><rect x={b.x + b.w * 0.6 + 42} y={top - 22} width={6} height={10} fill="#6c727a" /></g>}
      {b.ant && <g><line x1={b.x + b.w * 0.25} y1={top - 14} x2={b.x + b.w * 0.25} y2={top - 90} stroke="#6c727a" strokeWidth={4} /><line x1={b.x + b.w * 0.25 - 16} y1={top - 70} x2={b.x + b.w * 0.25 + 16} y2={top - 70} stroke="#6c727a" strokeWidth={3} /></g>}
      {Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => {
        const wx = b.x + 36 + c * ((b.w - 72) / (cols - 1)) - 17, wy = top + 40 + r * 84;
        if (wy + 46 > 760) return null;
        const lit = rnd(`wl${b.k}-${r}-${c}`) > 0.62 ? 1 : 0;
        const fill = mix(mix("#6c727a", "#c9d3e3", N * lit), "#fff1c9", g * 0.9);
        const box = g > 0.3 && rnd(`wb${b.k}-${r}-${c}`) > 0.55;
        return (
          <g key={`${r}-${c}`}>
            <rect x={wx} y={wy} width={34} height={46} rx={4} fill={fill} />
            <line x1={wx + 17} y1={wy} x2={wx + 17} y2={wy + 46} stroke={mix("#7a8088", "#e2c9a8", g)} strokeWidth={2} />
            {box && <g opacity={clamp01((g - 0.3) / 0.4)}><rect x={wx - 4} y={wy + 44} width={42} height={9} rx={2} fill="#b8754a" />{[4, 14, 24, 34].map((dx, i) => <circle key={i} cx={wx + dx} cy={wy + 42} r={5} fill={SPROUT_COLS[(i + r + c) % 5]} />)}</g>}
          </g>
        );
      }))}
      <rect x={b.x + b.w / 2 - 26} y={712} width={52} height={78} rx={6} fill={mix("#5f656d", "#9b6b4e", g * 0.8)} />
      {vine > 0.01 && [0.15, 0.85].map((p, k) => {
        const vx = b.x + b.w * p, H = b.h * 0.72 * vine;
        const d = `M ${vx},790 C ${vx + 22},${790 - H * 0.3} ${vx - 22},${790 - H * 0.6} ${vx + 6},${790 - H}`;
        return (
          <g key={k}>
            <path d={d} stroke="#4f9a4a" strokeWidth={6} fill="none" strokeLinecap="round" />
            {Array.from({ length: 7 }, (_, i) => {
              const t = (i + 1) / 8;
              if (t > vine) return null;
              const ly = 790 - b.h * 0.72 * t, lx = vx + Math.sin(t * 7 + k) * 16;
              return <g key={i}><ellipse cx={lx + (i % 2 ? 12 : -12)} cy={ly} rx={13} ry={6} transform={`rotate(${i % 2 ? 25 : -25} ${lx + (i % 2 ? 12 : -12)} ${ly})`} fill="#62b25a" />{i % 3 === 1 && <circle cx={lx} cy={ly - 6} r={6} fill={SPROUT_COLS[(i + k + b.k) % 5]} />}</g>;
            })}
          </g>
        );
      })}
    </g>
  );
};

const Tree: React.FC<{ x: number; f: number }> = ({ x, f }) => {
  const g = eback(ramp(f, 1505 + Math.abs(x - FLOWER.x) * 0.02, 1560 + Math.abs(x - FLOWER.x) * 0.02));
  return (
    <g transform={`translate(${x} 800)`}>
      <rect x={-36} y={-6} width={72} height={30} rx={6} fill={mix("#7d838b", "#c48b5c", springAmt(f))} />
      <path d="M 0,-6 L 0,-120 M 0,-70 L -34,-110 M 0,-92 L 30,-136 M 0,-120 L -12,-150" stroke="#6f6a66" strokeWidth={8} strokeLinecap="round" fill="none" />
      {g > 0.01 && (
        <g transform={`translate(0 -132) scale(${g})`}>
          <circle cx={-34} cy={8} r={40} fill="#4fa45a" />
          <circle cx={30} cy={2} r={44} fill="#5db463" />
          <circle cx={-2} cy={-30} r={48} fill="#6dbb63" />
          {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={Math.cos(i * 2.1) * 42} cy={-12 + Math.sin(i * 1.7) * 30} r={6} fill="#ffb3c6" />)}
        </g>
      )}
    </g>
  );
};

const Lamp: React.FC<{ x: number; k: number; bend: number }> = ({ x, k, bend }) => (
  <g transform={`rotate(${bend} ${x} 842)`}>
    <rect x={x - 6} y={520} width={12} height={322} fill="#5d636b" />
    <rect x={x - 14} y={826} width={28} height={16} rx={3} fill="#5d636b" />
    <path d={`M ${x},526 Q ${x},494 ${x + 40},496`} stroke="#5d636b" strokeWidth={9} fill="none" />
    <path d={`M ${x + 22},496 L ${x + 58},496 L ${x + 52},514 L ${x + 28},514 Z`} fill="#4d535b" />
    <g data-k={k} />
  </g>
);

// ---------- subtitles ----------
const SUBS: [number, number, string][] = [
  [15, 202, "In a city made of steel and smoke, nothing green had grown for a hundred years."],
  [209, 368, "Every night, a tiny cleaning robot called Pip swept the empty streets."],
  [379, 497, "One morning, Pip found something he had never seen before..."],
  [502, 598, "...a little red flower, growing through a crack."],
  [605, 727, "He didn't know what it was. But he knew it was alive."],
  [735, 794, "Then... the storm came."],
  [796, 952, "Pip held his broom over the flower... and stood there, all night long."],
  [956, 1117, "By morning, his battery was almost gone. But the flower was still standing."],
  [1120, 1200, "And now... it was full of seeds."],
  [1208, 1273, "So Pip did what he did best."],
  [1277, 1432, "He swept... and swept... every seed into every crack in the city."],
  [1435, 1578, "Then spring came. And one by one, the cracks turned green."],
  [1583, 1712, "The little robot who cleaned the city... had brought it back to life."],
];
const Subtitle: React.FC<{ f: number }> = ({ f }) => {
  const s = SUBS.find(([a, b]) => f >= a && f < b);
  if (!s) return null;
  const o = Math.min(ramp(f, s[0], s[0] + 6), 1 - ramp(f, s[1] - 6, s[1]));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ fontFamily, fontSize: 50, color: "#fffaf0", letterSpacing: 0.5, textAlign: "center", maxWidth: 1500, lineHeight: 1.2, textShadow: "0 2px 0 rgba(20,24,34,0.85), 0 0 18px rgba(20,24,34,0.9), 0 0 4px rgba(20,24,34,1)" }}>{s[2]}</div>
    </div>
  );
};

// ---------- the film ----------
export const LittleRobotFilm: React.FC = () => {
  const f = useCurrentFrame();
  const { cx, cy, z } = camera(f);
  const N = nightAmt(f), D = stormDark(f), R = rainAmt(f), S = springAmt(f), SB = sunBreak(f);
  const flash = Math.min(1.2, flashAt(f));
  const px = pipX(f);
  const facing = f >= 1440 ? -1 : 1;

  const skyTop = mix(mix(mix(mix("#8d939b", "#1b2133", N), "#3c434f", D), "#a3a7ac", SB * 0.6), "#6fbbe8", S);
  const skyBot = mix(mix(mix(mix("#c3c5c4", "#39415a", N), "#5a616b", D), "#e3ddcf", SB * 0.6), "#ffe0a6", S);
  const dark = Math.max(0.6 * N, 0.5 * D);
  const W = (x: number, y: number) => [960 + (x - cx) * z, 540 + (y - cy) * z];

  // flower sway: gentle, wilder in the storm (it sits under the broom, so not too wild)
  const sway = 4 * Math.sin(f * 0.06) + R * (5 * Math.sin(f * 0.31) + 3) * (1 - 0.6 * umbrella(f));

  // broom head in world space (for the canopy splashes and the seed cluster)
  const bh = broomHeadLocal(f);
  const broomW: [number, number] = [px + facing * bh[0], PIP_Y + bh[1]];

  // seeds
  const seedPos = (i: number): { x: number; y: number; a: number } | null => {
    const [tx, ty] = CRACKS[i];
    const lt = landT(i);
    const start: [number, number] = [FLOWER.x, FLOWER.y - 72];
    if (ON_PATH(tx)) {
      const gather = eio(ramp(f, 1279 + i * 0.8, 1300 + i * 0.8));
      const dep = lt - 16;
      if (f < 1279 || f >= lt) return null;
      if (f < dep) {
        const cl: [number, number] = [broomW[0] + 10 + Math.sin(f * 0.3 + i) * 14, broomW[1] + 30 + Math.cos(f * 0.27 + i) * 10];
        return { x: lerp(start[0], cl[0], gather) + Math.sin(gather * Math.PI) * 30, y: lerp(start[1], cl[1], gather) - Math.sin(gather * Math.PI) * 60, a: 1 };
      }
      const bw = broomHeadLocal(dep);
      const s0: [number, number] = [pipX(dep) + bw[0] + 10, PIP_Y + bw[1] + 30];
      const t = ramp(f, dep, lt);
      return { x: lerp(s0[0], tx, t), y: lerp(s0[1], ty, t) - Math.sin(t * Math.PI) * 70, a: 1 };
    }
    const dep = lt - 46;
    if (f < dep || f >= lt) return null;
    const t = eout(ramp(f, dep, lt));
    return { x: lerp(start[0], tx, t), y: lerp(start[1], ty, t) - Math.sin(t * Math.PI) * 260, a: 1 };
  };

  const fade = Math.max(1 - ramp(f, 0, 14), ramp(f, 1765, 1784));

  return (
    <AbsoluteFill style={{ backgroundColor: "#101420" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={skyTop} /><stop offset="1" stopColor={skyBot} /></linearGradient>
          <radialGradient id="lampGlow"><stop offset="0" stopColor="#f3f1e6" stopOpacity="0.7" /><stop offset="0.4" stopColor="#d9dde8" stopOpacity="0.22" /><stop offset="1" stopColor="#d9dde8" stopOpacity="0" /></radialGradient>
          <radialGradient id="ledGlow"><stop offset="0" stopColor="#dff8ff" stopOpacity="0.55" /><stop offset="1" stopColor="#dff8ff" stopOpacity="0" /></radialGradient>
          <radialGradient id="seedGlow"><stop offset="0" stopColor="#fff2bf" stopOpacity="0.9" /><stop offset="0.45" stopColor="#ffd77a" stopOpacity="0.3" /><stop offset="1" stopColor="#ffc24a" stopOpacity="0" /></radialGradient>
          <radialGradient id="sunGlow"><stop offset="0" stopColor="#fff3c4" stopOpacity="0.8" /><stop offset="1" stopColor="#ffd98a" stopOpacity="0" /></radialGradient>
          <radialGradient id="flowerGlow"><stop offset="0" stopColor="#ff5a6e" stopOpacity="0.35" /><stop offset="1" stopColor="#ff5a6e" stopOpacity="0" /></radialGradient>
          <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stopColor="#0b0e18" stopOpacity="0" /><stop offset="1" stopColor="#0b0e18" stopOpacity="0.5" /></radialGradient>
          <linearGradient id="subScrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0d1018" stopOpacity="0" /><stop offset="1" stopColor="#0d1018" stopOpacity="0.55" /></linearGradient>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff4cf" stopOpacity="0.55" /><stop offset="1" stopColor="#fff4cf" stopOpacity="0" /></linearGradient>
        </defs>

        {/* sky */}
        <rect width={1920} height={1080} fill="url(#sky)" />
        {S > 0.01 && (
          <g opacity={S}>
            <g transform={`translate(1560 ${170 + (1 - S) * 140})`}><circle r={190} fill="url(#sunGlow)" /><circle r={64} fill="#ffe9a8" /></g>
            {[0, 1, 2].map((k) => { const x = ((k * 700 + f * 0.6) % 2400) - 300, y = 140 + k * 70; return <g key={k} transform={`translate(${x} ${y})`} fill="#ffffff" opacity={0.9}><ellipse rx={90} ry={30} /><ellipse cx={-50} cy={6} rx={60} ry={24} /><ellipse cx={46} cy={-10} rx={56} ry={30} /></g>; })}
            {[0, 1, 2, 3].map((k) => { const x = ((k * 330 + f * 2.2) % 2300) - 200, y = 230 + k * 38 + Math.sin(f * 0.05 + k) * 8, w = 10 + 4 * Math.sin(f * 0.4 + k); return <path key={k} d={`M ${x - 14},${y - w * 0.4} Q ${x - 6},${y - w} ${x},${y} Q ${x + 6},${y - w} ${x + 14},${y - w * 0.4}`} stroke="#3c4a5a" strokeWidth={3} fill="none" />; })}
          </g>
        )}

        {/* world */}
        <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
          {/* far skyline + stacks, parallax */}
          <g transform={`translate(${(cx - 2000) * 0.42} ${(cy - 520) * 0.3})`}>
            {FAR.map((b, k) => <rect key={k} x={b.x} y={700 - b.h} width={b.w} height={b.h + 300} fill={mix("#7b818a", "#a6c3cf", S * 0.8)} />)}
            {STACKS.map((sx, k) => (
              <g key={k}>
                <rect x={sx - 26} y={280} width={52} height={420} fill={mix("#6d737b", "#9fb3bd", S * 0.6)} />
                <rect x={sx - 32} y={280} width={64} height={16} fill="#5f656d" />
                {Array.from({ length: 7 }, (_, i) => {
                  const p = ((f + i * 18 + k * 31) % 126) / 126;
                  return <circle key={i} cx={sx + p * 90 + Math.sin(p * 6 + k) * 10} cy={270 - p * 260} r={20 + p * 46} fill="#9a9fa6" opacity={(1 - p) * 0.55 * (1 - 0.9 * S)} />;
                })}
              </g>
            ))}
            {/* smog bands */}
            {[0, 1, 2, 3].map((k) => <ellipse key={k} cx={((k * 1300 + f * (0.5 + k * 0.15)) % 5200) - 1000} cy={420 + k * 60} rx={900} ry={46} fill="#b4b7ba" opacity={0.28 * (1 - S)} />)}
          </g>

          {/* buildings */}
          {BLD.map((b) => <Building key={b.k} b={b} f={f} N={N} />)}
          {/* grass along the walls */}
          {Array.from({ length: 90 }, (_, k) => {
            const x = -500 + k * 55 + rnd(`gx${k}`) * 20;
            const g = eback(ramp(f, 1500 + Math.abs(x - FLOWER.x) * 0.025, 1540 + Math.abs(x - FLOWER.x) * 0.025));
            if (g <= 0.01) return null;
            return <path key={k} d={`M ${x - 8},792 q 2,${-16 * g} 4,${-22 * g} M ${x},792 q 0,${-20 * g} 1,${-28 * g} M ${x + 8},792 q -2,${-14 * g} -4,${-20 * g}`} stroke="#5aa552" strokeWidth={4} fill="none" strokeLinecap="round" />;
          })}

          {/* trees in planters */}
          {TREES.map((x, k) => <Tree key={k} x={x} f={f} />)}

          {/* sidewalk + road */}
          <rect x={-1000} y={790} width={6200} height={52} fill={mix("#a9acad", "#dccfb5", S)} />
          <rect x={-1000} y={788} width={6200} height={5} fill={mix("#8f9396", "#c9b99c", S)} />
          {Array.from({ length: 70 }, (_, k) => <line key={k} x1={-1000 + k * 90} y1={792} x2={-1000 + k * 90 - 14} y2={842} stroke={mix("#94989b", "#c7b89e", S)} strokeWidth={2.5} />)}
          <rect x={-1000} y={842} width={6200} height={12} fill={mix("#80858a", "#b0a18a", S)} />
          <rect x={-1000} y={854} width={6200} height={700} fill={mix("#6d727a", "#7d7f86", S * 0.4)} />
          {Array.from({ length: 34 }, (_, k) => <rect key={k} x={-1000 + k * 190} y={1010} width={90} height={8} rx={4} fill="#858a91" opacity={0.7} />)}
          {/* rain puddles shine during and after the storm */}
          {Array.from({ length: 10 }, (_, k) => <ellipse key={k} cx={1300 + k * 130 + rnd(`pd${k}`) * 60} cy={930 + rnd(`pe${k}`) * 80} rx={60} ry={9} fill="#aab4c4" opacity={0.35 * eio(ramp(f, 800, 900)) * (1 - ramp(f, 1300, 1450))} />)}

          {/* cracks + sprouts */}
          {CRACKS.map(([x, y], i) => {
            const g = eback(ramp(f, sproutT(i), sproutT(i) + 20));
            return (
              <g key={i} transform={`translate(${x} ${y})`}>
                <path d="M -30,0 l 10,-3 l 8,4 l 9,-5 l 10,3 l 12,-2" stroke="#4d5258" strokeWidth={3} fill="none" />
                <Sprout g={g} col={SPROUT_COLS[i % 5]} seed={i} />
                {g > 0.3 && <g transform="translate(16 2)"><Sprout g={g * 0.7} col={SPROUT_COLS[(i + 2) % 5]} seed={i + 3} /></g>}
              </g>
            );
          })}

          {/* street lamps (bend in the storm) */}
          {LAMPS.map((x, k) => <Lamp key={k} x={x} k={k} bend={R * (4 + 3 * Math.sin(f * 0.13 + k * 1.3))} />)}

          {/* the flower, with a soft red halo so it reads as the only colour */}
          <circle cx={FLOWER.x} cy={FLOWER.y - 72} r={70} fill="url(#flowerGlow)" opacity={(1 - S) * (f >= 500 ? 1 : 0.5)} />
          <Flower f={f} sway={sway} />

          {/* Pip */}
          <Pip f={f} x={px} facing={facing} layer="body" />

          {/* butterflies in spring */}
          {S > 0.01 && ["#ff8fb1", "#ffd34d", "#8fd3ff"].map((col, k) => {
            const x = 1930 + 150 * Math.sin(f * 0.018 + k * 2.1), y = 640 + 50 * Math.sin(f * 0.043 + k * 1.7) - k * 30;
            const w = 0.25 + 0.75 * Math.abs(Math.sin(f * 0.5 + k));
            return <g key={k} transform={`translate(${x} ${y})`} opacity={S}><g transform={`scale(${w} 1)`}><ellipse cx={-9} cy={-4} rx={10} ry={8} fill={col} /><ellipse cx={9} cy={-4} rx={10} ry={8} fill={col} /><ellipse cx={-7} cy={7} rx={6} ry={5} fill={col} /><ellipse cx={7} cy={7} rx={6} ry={5} fill={col} /></g><rect x={-1.5} y={-8} width={3} height={18} rx={1.5} fill="#3c3c3c" /></g>;
          })}
        </g>

        {/* night / storm darkness */}
        <rect width={1920} height={1080} fill="#0f1424" opacity={dark} />

        {/* lights pass: things that glow through the dark */}
        <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
          {LAMPS.map((x, k) => {
            const flick = k === 2 ? (Math.sin(f * 1.7) > -0.3 ? 1 : 0.25) : 1;
            const on = Math.max(N, D * 0.85) * flick;
            const bend = R * (4 + 3 * Math.sin(f * 0.13 + k * 1.3));
            if (on < 0.02) return null;
            return (
              <g key={k} transform={`rotate(${bend} ${x} 842)`} opacity={on}>
                <path d={`M ${x + 28},514 L ${x + 52},514 L ${x + 150},842 L ${x - 70},842 Z`} fill="url(#beam)" style={{ mixBlendMode: "screen" }} />
                <circle cx={x + 40} cy={512} r={120} fill="url(#lampGlow)" style={{ mixBlendMode: "screen" }} />
                <rect x={x + 28} y={512} width={24} height={6} rx={3} fill="#f6f3e8" />
              </g>
            );
          })}
          <Pip f={f} x={px} facing={facing} layer="lights" />
          {/* glowing seeds + seeded cracks */}
          {CRACKS.map(([x, y], i) => {
            const lt = landT(i);
            const p = seedPos(i);
            const landed = f >= lt && f < sproutT(i) + 14;
            const pulse = landed ? 0.35 + 0.65 * Math.exp(-(f - lt) / 10) : 0;
            return (
              <g key={i}>
                {p && <g><circle cx={p.x} cy={p.y} r={26} fill="url(#seedGlow)" style={{ mixBlendMode: "screen" }} /><circle cx={p.x} cy={p.y} r={4} fill="#fff8e0" /></g>}
                {landed && <g><circle cx={x} cy={y - 2} r={40 * (0.6 + pulse)} fill="url(#seedGlow)" opacity={pulse} style={{ mixBlendMode: "screen" }} /><circle cx={x} cy={y - 2} r={3.5} fill="#fff8e0" opacity={0.9} /></g>}
              </g>
            );
          })}
          {/* rain bouncing off the broom canopy */}
          {R > 0.02 && umbrella(f) > 0.5 && Array.from({ length: 8 }, (_, k) => {
            const p = ((f * 0.9 + k * 7) % 14) / 14;
            const ox = (k - 3.5) * 9;
            return <circle key={k} cx={broomW[0] + ox + (ox > 0 ? p * 26 : -p * 26)} cy={broomW[1] - 28 - Math.sin(p * Math.PI) * 22} r={2.6} fill="#dfe6f2" opacity={R * (1 - p)} />;
          })}
          {/* splashes on the ground */}
          {R > 0.02 && Array.from({ length: 70 }, (_, k) => {
            const p = ((f + k * 11) % 22) / 22;
            const x = 1300 + rnd(`sx${k}`) * 1200, y = 795 + rnd(`sy${k}`) * 230;
            return <ellipse key={k} cx={x} cy={y} rx={3 + p * 12} ry={1 + p * 3} fill="none" stroke="#c9d2e0" strokeWidth={2} opacity={R * (1 - p) * 0.7} />;
          })}
        </g>

        {/* sunbeams breaking through ("did what he did best") */}
        {SB > 0.01 && (() => {
          const [sx, sy] = W(px, PIP_Y - 120);
          return [0, 1, 2].map((k) => <path key={k} d={`M ${sx + 420 + k * 160},-40 L ${sx + 560 + k * 170},-40 L ${sx + 60 + k * 50},${sy + 160} L ${sx - 90 + k * 40},${sy + 160} Z`} fill="url(#beam)" opacity={0.75 * SB} style={{ mixBlendMode: "screen" }} />);
        })()}

        {/* rain */}
        {R > 0.02 && (
          <g opacity={R}>
            {Array.from({ length: 150 }, (_, k) => {
              const sp = 44 + rnd(`rs${k}`) * 22;
              const y = ((rnd(`ry${k}`) * 1300 + f * sp) % 1300) - 120;
              const x = ((rnd(`rx${k}`) * 2400 + f * sp * 0.3) % 2400) - 240;
              return <line key={k} x1={x} y1={y} x2={x - 16} y2={y + 46} stroke="#d4dcea" strokeWidth={2.4} strokeLinecap="round" opacity={0.5} />;
            })}
          </g>
        )}

        {/* lightning */}
        {flash > 0.15 && STRIKES.map((t, k) => {
          if (f < t || f > t + 10) return null;
          const bx = [1450, 520, 1220][k];
          const pts = Array.from({ length: 9 }, (_, i) => `${bx + (rnd(`lb${k}${i}`) - 0.5) * 120 + i * 6},${-10 + i * 55}`).join(" ");
          return <polyline key={k} points={pts} stroke="#ffffff" strokeWidth={6} fill="none" strokeLinejoin="round" opacity={Math.min(1, flash)} />;
        })}
        <rect width={1920} height={1080} fill="#eef3ff" opacity={0.55 * Math.min(1, flash)} />

        <rect width={1920} height={1080} fill="url(#vignette)" />
        <rect y={820} width={1920} height={260} fill="url(#subScrim)" />
      </svg>
      <Subtitle f={f} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};
