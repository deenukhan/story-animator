import { eio, lerp, ramp } from "./helpers";

export type CamKey = [number, number, number, number]; // frame, centreX, centreY, zoom

// The camera looks at (cx, cy) in world units with a zoom. Between keyframes it eases in and out,
// and the zoom moves in log space so a 1× → 2× push feels as even as 2× → 4×.
// Use it as: <g transform={worldTransform(camera(f, CAM), width, height)}> ...the world... </g>
export const camera = (f: number, keys: CamKey[]) => {
  for (let k = 0; k < keys.length - 1; k++) {
    const [f0, x0, y0, z0] = keys[k], [f1, x1, y1, z1] = keys[k + 1];
    if (f <= f1) {
      const t = eio(ramp(f, f0, f1));
      return { cx: lerp(x0, x1, t), cy: lerp(y0, y1, t), z: Math.exp(lerp(Math.log(z0), Math.log(z1), t)) };
    }
  }
  const [, x, y, z] = keys[keys.length - 1];
  return { cx: x, cy: y, z };
};

// The world is drawn in a 1920 × 1080 design space. On other shapes (9:16, 4:5) the same world is
// scaled to cover the frame, so a vertical film shows the centre of the scene.
export const worldTransform = (cam: { cx: number; cy: number; z: number }, width: number, height: number) => {
  const cover = Math.max(width / 1920, height / 1080);
  return `translate(${width / 2} ${height / 2}) scale(${cam.z * cover}) translate(${-cam.cx} ${-cam.cy})`;
};
