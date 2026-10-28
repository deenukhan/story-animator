import React from "react";
import { blink } from "./helpers";

// Reusable drawing parts in the storybook style. Draw with SVG paths and soft fills; never use
// images. Extend these or write new ones per film.

// A pair of cute eyes with blinking, a look direction and an optional mood for the mouth.
export const Face: React.FC<{
  f: number;
  seed: number;
  size?: number; // eye radius
  gap?: number; // distance between eye centres
  look?: [number, number]; // pupil offset, -1..1
  open?: number; // override openness (0 = closed); defaults to blinking
  mood?: "smile" | "happy" | "o" | "sad" | "none";
  ink?: string;
}> = ({ f, seed, size = 9, gap = 34, look = [0, 0], open, mood = "smile", ink = "#2b1d18" }) => {
  const o = open ?? blink(f, seed);
  return (
    <g>
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${(side * gap) / 2} 0)`}>
          {o > 0.08 ? (
            <g transform={`scale(1 ${o})`}>
              <ellipse rx={size} ry={size * 1.15} fill={ink} />
              <circle cx={size * 0.35 + look[0] * size * 0.25} cy={-size * 0.4 + look[1] * size * 0.25} r={size * 0.33} fill="#fff" />
            </g>
          ) : (
            <path d={`M ${-size},0 Q 0,${size * 0.7} ${size},0`} stroke={ink} strokeWidth={size * 0.35} fill="none" strokeLinecap="round" />
          )}
        </g>
      ))}
      <ellipse cx={-gap * 0.85} cy={size * 1.6} rx={size * 0.9} ry={size * 0.5} fill="#ff8fa3" opacity={0.55} />
      <ellipse cx={gap * 0.85} cy={size * 1.6} rx={size * 0.9} ry={size * 0.5} fill="#ff8fa3" opacity={0.55} />
      {mood === "smile" && <path d={`M ${-size * 0.8},${size * 1.7} Q 0,${size * 2.6} ${size * 0.8},${size * 1.7}`} stroke={ink} strokeWidth={size * 0.3} fill="none" strokeLinecap="round" />}
      {mood === "happy" && <path d={`M ${-size},${size * 1.6} Q 0,${size * 3.2} ${size},${size * 1.6} Z`} fill={ink} />}
      {mood === "o" && <ellipse cx={0} cy={size * 2} rx={size * 0.45} ry={size * 0.6} fill={ink} />}
      {mood === "sad" && <path d={`M ${-size * 0.8},${size * 2.3} Q 0,${size * 1.5} ${size * 0.8},${size * 2.3}`} stroke={ink} strokeWidth={size * 0.3} fill="none" strokeLinecap="round" />}
    </g>
  );
};

// Shared gradients. Put <StoryDefs /> once inside the film's <svg>.
export const StoryDefs: React.FC = () => (
  <defs>
    <radialGradient id="glowWarm"><stop offset="0" stopColor="#ffc861" stopOpacity="0.75" /><stop offset="0.35" stopColor="#ff9a2a" stopOpacity="0.28" /><stop offset="1" stopColor="#ff7a00" stopOpacity="0" /></radialGradient>
    <radialGradient id="glowCool"><stop offset="0" stopColor="#dff3ff" stopOpacity="0.6" /><stop offset="1" stopColor="#dff3ff" stopOpacity="0" /></radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stopColor="#05081c" stopOpacity="0" /><stop offset="1" stopColor="#05081c" stopOpacity="0.5" /></radialGradient>
    <linearGradient id="subScrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#070a22" stopOpacity="0" /><stop offset="1" stopColor="#070a22" stopOpacity="0.6" /></linearGradient>
  </defs>
);

// A soft glow (light source). Screen-blended so it brightens whatever is underneath.
export const Glow: React.FC<{ x: number; y: number; r: number; warm?: boolean; opacity?: number }> = ({ x, y, r, warm = true, opacity = 1 }) => (
  <circle cx={x} cy={y} r={r} fill={warm ? "url(#glowWarm)" : "url(#glowCool)"} opacity={opacity} style={{ mixBlendMode: "screen" }} />
);
