# The look: soft flat storybook, drawn in SVG

The target is a modern picture book that moves: simple shapes, soft colour, one warm light, cute
characters. Not clip art, not vector-stock icons.

## World
- **Build in layers, back to front:** sky gradient → far shapes (skyline, hills, mountains, parallax at
  0.3–0.5 of the camera) → mid world (houses, trees) → ground → characters → foreground details →
  light (glows, screen-blended) → vignette → subtitle scrim.
- **One light source per scene** (moon, lamp, sun, a flame). Everything else gets darker or cooler away
  from it. Glows use `mixBlendMode: "screen"` radial gradients (`Glow` in `kit/parts.tsx`).
- **Colour tells the story.** Pick 3–4 colours per mood and change them when the story turns: grey
  city → spring pastels; warm lit lane → dark blue → warm again. A single accent (the red flower)
  draws the eye.
- **Texture and life:** a few drifting particles (stars twinkling, dust, petals, rain), seeded with
  `rnd()` so every render is identical.
- Skies and walls get gentle gradients; avoid flat full-screen single colours.

## Characters
- **Simple silhouette first.** A character must read as a black shape. Round, soft forms: a bean, a
  pebble, a bowl, a rounded robot.
- **Big eyes, small mouth, blush.** Use `Face` from `kit/parts.tsx`: blinking, a look direction and a
  mood (`smile`, `happy`, `o`). Eyes carry all the emotion; change them on the story beats (wide on
  surprise, closed when scared, hearts or a big smile on joy).
- **Always alive:** breathing (scale 1 ± 0.03), a blink every 3–5 s, a slight bob. Never a frozen pose.
- **Squash and stretch** on hops and landings; `eback()` for pops; anticipation (a small dip) before a
  big move.
- **Same character in every shot.** Draw each character as ONE React component with props for pose,
  mood and facing, and reuse it. Never redraw it differently in close-ups.
- Props that matter to the story (the token) get extra care: their own little glow or highlight.

## Motion
- Ease everything (`eio`, `eout`, `eback`). Nothing moves linearly except rain and stars.
- Things appear by being drawn, growing or popping in, not by plain fade-ins.
- **No dead air:** something visibly changes every second. Inside a long line, add a slow camera creep
  plus idle motion.
- Effects that sell the story: wind streaks and flying petals, rain plus lightning flashes (a 3–4
  frame white flash at 20–35% opacity), smoke curls when a light dies, sparks when one lights, sprouts
  popping up one by one.

## Subtitles
Handwritten font (Patrick Hand), warm white with a soft dark halo, near the bottom (higher on 9:16 so
the app's buttons don't cover it), with a soft dark scrim behind. Exactly the spoken words.

## Craft checklist for the look frame
- Would a picture-book illustrator be proud of this frame?
- Can you tell where the light comes from?
- Does the main character read instantly, even small?
- Is there depth: near, middle, far?
- Is the token visible and lit?
- Nothing ugly: no stretched shapes, no hard pure-black areas, no text off-screen, no shapes cutting
  through each other by accident.

## Study the examples
`examples/tiny-diya/Film.tsx` (Diwali lane: lamps, wind, flames, a chain of lights) and
`examples/little-robot/Film.tsx` (grey city to spring: a robot with LED eyes, a storm, seeds and
sprouts) show complete films built this way, around 550–650 lines each.
