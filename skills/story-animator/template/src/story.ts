// The film's settings and timeline. This is the ONE place every frame number lives.
//
// How to fill it in (see the skill's references/pipeline.md):
// 1. Put the narration in public/audio/ and get word timestamps (scripts/transcribe.py).
// 2. Convert seconds to frames with f(t) = OFFSET + Math.round(t * FPS).
// 3. Write one SUBS row per subtitle chunk and one CUES entry per story beat.
// 4. Set durationFrames = the frame of the last word + about 2.5 s of tail.
//
// The values below belong to the tiny starter scene in Film.tsx (6 s, no audio), so a fresh
// project renders straight away. Replace them for every new film.

export const FPS = 30;
export const OFFSET = 15; // the narration starts 0.5 s in

export const SHAPES = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
} as const;

const SHAPE = SHAPES["16:9"];

export const STORY = {
  title: "Starter scene",
  fps: FPS,
  width: SHAPE.width,
  height: SHAPE.height,
  durationFrames: 180,
  // Path inside public/ of the final audio mix, ALWAYS made by scripts/mix.py (even for voice only):
  // the mix already places the voice at OFFSET, so the subtitles and cues stay in sync.
  // Never point this at the raw narration file: it would play 0.5 s early. null while there is no mix yet.
  audio: null as string | null,
};

// Subtitles: [startFrame, endFrame, text]. Chunks of 4-10 words, as spoken.
export const SUBS: [number, number, string][] = [
  [15, 90, "Once upon a time, on a quiet little hill..."],
  [92, 170, "...lived a tiny friend who loved the moon."],
];

// Story beats by frame. Film.tsx reads these instead of hard-coding numbers.
export const CUES = {
  hop: 100, // the character hops when the second line starts
  end: 170,
};

// Camera keyframes: [frame, centreX, centreY, zoom] in world units (the world is 1920 × 1080 at zoom 1).
// Moves ease in and out; zoom eases in log space so push-ins feel even.
export const CAM: [number, number, number, number][] = [
  [0, 960, 540, 1.0],
  [180, 1010, 600, 1.25],
];
