import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { CAM, CUES, STORY, SUBS } from "./story";
import { camera, worldTransform } from "./kit/camera";
import { eback, eio, ramp, rnd, wobble } from "./kit/helpers";
import { Face, Glow, StoryDefs } from "./kit/parts";
import { Subtitles } from "./kit/Subtitles";

// STARTER SCENE. A tiny 6-second example that shows how a film is put together:
// a world drawn in SVG, a camera that moves over it, a character with a face, a beat from CUES,
// subtitles from SUBS, and the audio mix. Replace the world and the characters for each story,
// and keep the structure.

const STARS = Array.from({ length: 90 }, (_, k) => ({ x: rnd(`sx${k}`) * 2200 - 140, y: rnd(`sy${k}`) * 560 - 40, r: 0.8 + rnd(`sr${k}`) * 1.8, s: rnd(`ss${k}`) * 10 }));

const Buddy: React.FC<{ f: number }> = ({ f }) => {
  const hop = f >= CUES.hop ? Math.sin(Math.min(Math.PI, ((f - CUES.hop) / 24) * Math.PI)) * 46 : 0;
  const squash = 1 + 0.04 * wobble(f, 2);
  return (
    <g transform={`translate(1000 ${792 - hop})`}>
      <ellipse cx={0} cy={hop + 6} rx={70 - hop * 0.4} ry={10} fill="#000" opacity={0.25} />
      <g transform={`scale(${1 / squash} ${squash})`}>
        <path d="M -70,0 C -78,-90 -40,-140 0,-140 C 40,-140 78,-90 70,0 Z" fill="#ffe2b8" />
        <path d="M -70,0 C -66,-30 -50,-50 -20,-56 L 70,0 Z" fill="#f2c48c" opacity={0.5} />
        <g transform="translate(0 -78)">
          <Face f={f} seed={3} look={[0.6, -0.8]} mood={f >= CUES.hop ? "happy" : "smile"} />
        </g>
      </g>
    </g>
  );
};

export const Film: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = STORY;
  const cam = camera(f, CAM);
  const moonIn = eback(ramp(f, 10, 40));
  const fade = Math.max(1 - ramp(f, 0, 10), ramp(f, STORY.durationFrames - 20, STORY.durationFrames - 1));

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1030" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <StoryDefs />
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a0f2e" /><stop offset="1" stopColor="#2b2f63" /></linearGradient>
        <rect width={width} height={height} fill="url(#sky)" />
        <g transform={worldTransform(cam, width, height)}>
          {STARS.map((s, k) => <circle key={k} cx={s.x} cy={s.y} r={s.r} fill="#fff8e0" opacity={0.45 + 0.45 * Math.sin(f * 0.08 + s.s)} />)}
          <g transform={`translate(1450 230) scale(${moonIn})`}>
            <Glow x={0} y={0} r={190} warm={false} opacity={0.9} />
            <circle r={60} fill="#fff3c8" />
          </g>
          <path d="M -400,800 C 200,640 700,700 1100,760 C 1500,820 1900,700 2400,760 L 2400,1300 L -400,1300 Z" fill="#1d2a52" />
          <path d="M -400,860 C 300,760 800,780 1300,820 C 1700,850 2000,800 2400,830 L 2400,1300 L -400,1300 Z" fill="#26386a" />
          <Buddy f={f} />
        </g>
        <rect width={width} height={height} fill="url(#vignette)" />
        <rect y={height * 0.72} width={width} height={height * 0.28} fill="url(#subScrim)" opacity={eio(ramp(f, 10, 20))} />
      </svg>
      <Subtitles f={f} subs={SUBS} width={width} height={height} />
      {/* The mix from scripts/mix.py already starts the voice at OFFSET (0.5 s), so it plays from frame 0. */}
      {STORY.audio && <Audio src={staticFile(STORY.audio)} />}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};
