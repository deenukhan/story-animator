import { random } from "remotion";

// Small maths helpers used by every film. Everything is a pure function of the frame number,
// so any frame renders the same on any machine (no Math.random, no Date).

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// 0 before frame a, 1 after frame b, linear in between.
export const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));

// Easing curves (input and output 0..1).
export const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // smooth in-out
export const eout = (t: number) => 1 - Math.pow(1 - t, 3); // fast start, soft landing
export const eback = (t: number) => {
  const c1 = 1.9, c3 = c1 + 1;
  return t >= 1 ? 1 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}; // small overshoot, good for things popping into place

// Seeded random in 0..1. Same seed → same number on every frame.
export const rnd = (seed: string) => random(seed);

// Gentle repeating motion for "alive" idles (breathing, bobbing, flicker).
export const wobble = (f: number, seed: number, speed = 1) =>
  0.6 * Math.sin(f * 0.11 * speed + seed) + 0.4 * Math.sin(f * 0.23 * speed + seed * 1.7);

// Blinks: returns eye openness 0..1. Each character gets its own seed so they don't blink together.
export const blink = (f: number, seed: number) => {
  const period = 95 + Math.floor(rnd(`blink-${seed}`) * 60);
  const p = (f + Math.floor(rnd(`blinko-${seed}`) * period)) % period;
  return p < 3 ? 1 - p / 3 : p < 6 ? (p - 3) / 3 : 1;
};
