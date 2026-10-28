# From voice to frames: the timing pipeline

## Frames
- The film runs at **30 frames per second**.
- The narration starts at frame **15** (0.5 s in), so the first frame is never a hard cut into speech.
- A spoken word at `t` seconds sits at frame `15 + round(t × 30)`. `scripts/transcribe.py` prints this for every word.

## The cue table lives in `src/story.ts`
Everything time-based is a named frame in ONE place. `Film.tsx` never contains a raw frame number.
This means re-timing a beat is a one-line change, and you can read the whole film's timeline at a glance.

```ts
export const CUES = {
  pipAppears: 296,   // "Pip"
  flowerReveal: 515, // "red"
  hearts: 700,       // "alive"
  storm: 762,        // "storm"
  batteryLow: 1021,  // "gone"
  seeds: 1174,       // "seeds"
  sweep1: 1281,      // "swept"
  spring: 1444,      // "Spring"
  green: 1553,       // "green"
  life: 1682,        // "life"
};
```

**Lead the word slightly.** Start a visual change 2–6 frames BEFORE its word, so it reads as the word
lands. Big changes (lightning, a reveal) can land exactly on the word.

## Subtitles: `SUBS`
`[startFrame, endFrame, text]` rows. Split lines into chunks of 4–10 words, as spoken. A chunk starts
at its first word's frame and ends 2–8 frames after its last word, or where the next chunk starts.
Keep the exact words the voice says.

## Camera: `CAM`
`[frame, centreX, centreY, zoom]` keyframes in the 1920 × 1080 world. Between two keyframes the
camera eases in and out. Rules:
- **One move per beat.** A slow push in, a drift, or a pull back. Never several moves at once.
- Hold a keyframe twice (same values at two frames) for a calm moment; the scene still lives through
  idle motion.
- Wide shots for the world and the payoff, close shots for emotion and the turn.
- On 9:16 and 4:5 the same world is cropped to the centre. How much of the 1920 × 1080 world you see
  at zoom `z`:

  | Shape | Visible world width | Visible world height |
  |---|---|---|
  | 16:9 (1920 × 1080) | 1920 / z | 1080 / z |
  | 9:16 (1080 × 1920) | **about 607 / z** (a third of the world at zoom 1) | 1080 / z |
  | 4:5 (1080 × 1350) | 864 / z | 1080 / z |

  So on 9:16 put the subject within ±300/z of the camera's `cx`, use zoom 1.2–2 for most shots, and
  keep faces and the token above the subtitle band (the bottom ~25% of the frame: world y below
  roughly `cy + 270 / z`).

## Length
`durationFrames` = the frame where the last word ends + about 75 frames (2.5 s) of tail. Fade to black
over the last 20 frames (the template does this), and fade in from black over at most the first 10.
If the user asked for an exact length (e.g. 25 s), use that instead: `durationFrames = seconds × 30`.

## Example: the Little Robot cue table (59.5 s, 1785 frames)
| # | Line | Frames (key words) | Picture |
|---|---|---|---|
| 1 | In a city made of steel and smoke… | 15–200 | Wide grey city, smoke, slow drift |
| 2 | Every night… Pip swept the empty streets | 209–365 ("Pip" f296) | Night falls; push in to Pip under a lamp |
| 3 | One morning, Pip found… never seen before | 379–494 | Grey morning; Pip stops, eyes wide |
| 4 | …a little red flower, growing through a crack | 502–598 ("red" f520) | Close: the red flower, the only colour |
| 5 | He didn't know what it was… alive | 605–722 ("alive" f704) | His LED eyes turn into hearts |
| 6 | Then… the storm came | 735–795 ("storm" f768) | Sky darkens, lightning, rain |
| 7 | Pip held his broom over the flower… | 796–950 | Broom as an umbrella; battery drains |
| 8 | By morning, his battery was almost gone… | 956–1115 | Dawn; battery blinks red; flower stands |
| 9 | And now… it was full of seeds | 1120–1200 | Petals fall; a glowing seed head |
| 10 | So Pip did what he did best | 1208–1272 | Sunbeams; battery refills |
| 11 | He swept… every seed into every crack | 1277–1430 | Pan as seeds arc into cracks |
| 12 | Then spring came… the cracks turned green | 1435–1576 | Sprouts pop; sky turns blue; colour spreads |
| 13 | The little robot who cleaned the city… | 1583–1712 | Glide to Pip and the blooming flower |
