# Checks before you call it done

## Story
- [ ] The spine fits in three sentences, with a clear turn.
- [ ] The token appears at the start and pays off at the end.
- [ ] Every narration line has a picture.

## Timing
- [ ] Every frame number lives in `story.ts` (`CUES`, `SUBS`, `CAM`); none are typed into Film.tsx.
- [ ] Each visual beat starts 2–6 frames before its word.
- [ ] Subtitles match the spoken words exactly and never overlap.
- [ ] `durationFrames` = last word + about 2.5 s.

## Picture (contact sheet at every beat: `scripts/contact_sheet.sh`)
- [ ] The first frame is not black for more than about 0.3 s; the voice starts within about 0.5 s.
- [ ] The main character reads instantly in every shot and looks the same in every shot.
- [ ] One light source per scene; the token is lit.
- [ ] No dead air: something moves every second (blink, breathing, particles, camera creep).
- [ ] Nothing is cut off at the edges in the chosen shape (9:16 crops the sides of the 16:9 world).
- [ ] Subtitles are readable on every background and clear of the platform's buttons on 9:16.
- [ ] `npx tsc --noEmit -p .` passes.

## Sound
- [ ] The chosen narration take says every word, with no tags read aloud.
- [ ] `mix.py` was run (even for voice only) and `STORY.audio` points at `audio/mix.wav`, not the raw narration.
- [ ] `mix.py` reports the background 12–18 dB under the voice and the final at about −14 LUFS.
- [ ] No effect lands on a key word.

## Delivery
- [ ] `out/film.mp4` has video + audio, the right size and the expected length (`ffprobe`).
- [ ] Tell the user: the file path, the story line, the voice, the credits spent, what you measured,
      and ask them to watch and listen once.

## Common fixes
| Problem | Fix |
|---|---|
| A character looks different in close-ups | Draw it as one component with props; scale the whole group, never redraw it |
| The film feels static | Idle motion on every character, particles, a slow camera creep in long beats |
| The camera feels jumpy | One move per beat, eased; add a hold keyframe between big moves |
| The colours feel muddy | Fewer colours per scene; one warm light; darken and cool the far layers |
| Render is slow | Fewer particles; avoid huge blur filters; cache static shapes outside the frame loop |
| A render fails once with a font error | Run it again; Google Fonts load on first use |
| The voice reads "[softly]" aloud | Use the other take, or remove that tag and regenerate |
| The voice is 0.5 s ahead of the subtitles | `STORY.audio` points at the raw narration; run `mix.py` and use `audio/mix.wav` |
| npm warns about esbuild's postinstall script | Harmless; rendering works without it |
