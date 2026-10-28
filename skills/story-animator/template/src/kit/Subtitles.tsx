import React from "react";
import { loadFont } from "@remotion/google-fonts/PatrickHand";
import { ramp } from "./helpers";

// Burned-in storybook subtitles: a handwritten font, warm white, with a soft dark halo so they
// read on any background. Each chunk fades in and out over 6 frames.
const { fontFamily } = loadFont();

export const Subtitles: React.FC<{ f: number; subs: [number, number, string][]; width: number; height: number }> = ({ f, subs, width, height }) => {
  const s = subs.find(([a, b]) => f >= a && f < b);
  if (!s) return null;
  const o = Math.min(ramp(f, s[0], s[0] + 6), 1 - ramp(f, s[1] - 6, s[1]));
  const vertical = height > width;
  const size = Math.round((vertical ? 0.052 : 0.046) * Math.min(width, height) * (vertical ? 1.0 : 1.0) + (vertical ? 8 : 0));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: vertical ? height * 0.2 : height * 0.06, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ fontFamily, fontSize: size, color: "#fff7e6", textAlign: "center", maxWidth: width * (vertical ? 0.84 : 0.8), lineHeight: 1.2, letterSpacing: 0.5, textShadow: "0 2px 0 rgba(10,14,40,0.85), 0 0 18px rgba(10,14,40,0.9), 0 0 4px rgba(10,14,40,1)" }}>
        {s[2]}
      </div>
    </div>
  );
};
