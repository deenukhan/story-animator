---
name: story-animator
description: Make a narrated 2D animated story video (kids' story, bedtime story, fable, festival story, short animated film) where every frame is drawn in code with Remotion, the narration is an ElevenLabs voice, and there is optional music and sound effects. No AI image or video generation. Use whenever someone asks to make, animate or create a story video, cartoon, 2D animation, animated short or kids' video from an idea, e.g. "use story-animator to make a 60-second story about a little robot who finds a flower".
---

# Story Animator

You turn a one-line story idea into a finished, narrated 2D animated film (MP4). You write the story,
voice it with ElevenLabs, time every beat to the spoken words, draw every frame in code (SVG inside
Remotion), add music and sound effects, and render. The look is a soft, flat storybook cartoon:
cute characters with big eyes, warm light, gentle camera moves and handwritten subtitles.

Two finished films are in `examples/` (a 55 s Diwali story and a 59 s robot story). Study their
**drawing and motion** (characters, light, weather, particles, camera) before you draw your first
film. They were built before this template existed, so they carry their own helpers and some raw
frame numbers. For **structure**, follow the template and the rules below, not the examples.

## The rules that never change
1. **Every frame is drawn in code.** SVG shapes, paths and gradients in React. Never generate or
   download images or video for the film. (Fonts from Google Fonts are fine.)
2. **The story comes first.** One character, one problem, one turn, one happy ending, and one small
   object (a "token") that matters at the start and pays off at the end. See `references/story.md`.
3. **The voice leads, the picture follows.** Every beat lands on the spoken word (word timestamps →
   frames). See `references/pipeline.md`.
4. **Something moves every second.** Breathing, blinking, flicker, drifting particles, a slow camera
   move. A frozen frame looks broken.
5. **The voice is always clearly on top.** Music and effects sit 12–18 dB under it. See
   `references/voice-and-sound.md`.
6. **Be honest about cost and limits.** Tell the user what costs credits before you spend them. You
   cannot hear audio or watch motion yourself: say what you checked by measurement and ask the user
   to watch and listen once.

## Step 0: Check the setup (once)
Check, and fix what you can, before anything else:
- **Node.js 18+** (`node -v`). If missing, tell the user to install it from nodejs.org (LTS).
- **ffmpeg** (`ffmpeg -version`). If missing: `brew install ffmpeg` (Mac), `winget install ffmpeg`
  (Windows) or the system package manager (Linux). Ask before installing.
- **Python 3** (`python3 --version`), needed for the timing and mixing scripts.
- **ElevenLabs.** Look for the ElevenLabs connector's tools (names like `creative_list_voices`,
  `creative_generate_speech`, `creative_get_generations`). If they're not available, either:
  - ask the user to connect it: Claude app → Settings → Connectors → ElevenLabs → Connect → log in
    (the free plan is enough to start), then start a new session; or
  - use an API key: ask the user to put `ELEVENLABS_API_KEY` in their environment, and call the REST
    API with curl (see `references/voice-and-sound.md`).

## Step 1: Ask the questions (one message)
If the request doesn't already answer them, ask all of these in ONE short message, each with a
default, and say "reply 'go' to use the defaults":
1. **The story idea** (one line), or "surprise me".
2. **Length:** any length; suggest 30 s, 60 s (default) or 90 s.
3. **Shape:** 16:9 for YouTube (default), 9:16 for Reels/Shorts/TikTok, or 4:5 for an Instagram post.
4. **Narration:** language (default English) and voice feel (default: warm, gentle storyteller).
5. **Music and sound effects:** yes (default) or no.
6. **Audience:** young kids (default), older kids, or all ages.

Tell the user the expected ElevenLabs cost in the same message: the narration is made as **2 takes**,
about **2 × 6 credits per second of story** (a 60 s story ≈ 1,400–1,600 credits); music ≈ 900 per
60 s take; each sound effect ≈ 17. If the user says "you decide" or "go", use the defaults.

## Step 2: Write the story
Follow `references/story.md`. Produce:
- the spine in three sentences (setup → turn → payoff) and the token;
- the narration, about 2.2 words per second (25 s ≈ 50 words, 60 s ≈ 120–130), in short lines,
  one picture per line;
- a beat list: what we SEE on each line, and the camera move.

Show the narration and the beat list to the user and wait for an OK, unless they asked you to just go.

## Step 3: Set up the project
1. Copy this skill's `template/` folder to a new folder named after the story (e.g. `./paper-boat/`)
   in the user's current directory.
2. Run `npm install` there. (npm may warn that esbuild's postinstall script wasn't run; rendering
   still works, so ignore it.)
3. In `src/story.ts`, pick the shape (`SHAPES["9:16"]` etc.).

## Step 4: Make the voice (ElevenLabs)
See `references/voice-and-sound.md` for details.
1. Pick a voice with `creative_list_voices` (language, `use_cases: ["narrative_story"]`, accent).
2. Generate with `creative_generate_speech`, model `eleven_v4`, 2 takes. Add light direction tags
   such as `[warm, gentle storytelling]`, `[softly]`, `[delighted]` at the start of lines. Never put a
   sound word inside a tag (e.g. `[whooshing]`); the voice may read it out.
3. Download both takes into the project: `creative_get_generations` → `full_res_url` →
   `curl -o public/audio/take_A.mp3 "<url>"` (and `take_B.mp3`).
4. Transcribe both (Step 5.1) and keep the take that says every word correctly, with no tags read
   aloud and names pronounced right. Copy it to `public/audio/narration.mp3`.

## Step 5: Time the beats
1. Word timings:
   `python3 -m venv .venv && .venv/bin/pip install faster-whisper` (once), then
   `.venv/bin/python <skill>/scripts/transcribe.py public/audio/narration.mp3`.
   It prints every word with its film frame (`frame = 15 + round(seconds × 30)`) and a suggested length.
2. Fill in `src/story.ts`:
   - `durationFrames`: the user's exact length if they gave one (e.g. 25 s → 750), otherwise the
     suggested length (last word + about 2.5 s);
   - `SUBS`: subtitle chunks, as spoken;
   - `CUES`: one named frame per beat;
   - `CAM`: one camera move per beat.
   See `references/pipeline.md`, including how much of the world a 9:16 or 4:5 frame shows.

## Step 6: Draw ONE look frame first
Before animating everything, build the world, the main character and the lighting for the hardest
moment of the film (usually the turn), and render that one frame:
`npx remotion still src/index.ts Film out/look.png --frame=<frame>`. Look at it and critique it in
writing against `references/visual-style.md` (character appeal, readable silhouette, one light
source, depth, colour story, nothing covering a face or the token, nothing cut off at the edges).
Fix it until a picture-book illustrator would be proud of it. Show it to the user if they want to
approve the look.

## Step 7: Build the whole film
Write `src/Film.tsx` for the whole story, beat by beat, using the helpers in `src/kit/`:
`camera()` and `worldTransform()` for the camera, `ramp()`/`eio()`/`eback()` for timing,
`blink()`/`wobble()` for life, `Face` for eyes and mouths (moods: smile, happy, o, sad, none), `Glow`
for light, `Subtitles` for text. Every frame number comes from `CUES` in `story.ts`, never typed into
Film.tsx.
- Typecheck often: `npx tsc --noEmit -p .`
- Check your work with a contact sheet at every beat:
  `bash <skill>/scripts/contact_sheet.sh out/sheet.jpg <frame> <frame> ...` (8–12 frames) and LOOK at it.
- Go through `references/qa.md` before rendering.

## Step 8: Sound (always run the mix)
The mix is what puts the voice at the right moment (0.5 s in) and at the right loudness, so run it
**even for a voice-only film**.
1. **Voice only:** write `public/audio/audio_cues.json` as
   `{"duration": <durationFrames / 30>, "voice": {"file": "narration.mp3", "start": 0.5}}`.
2. **With music and sound effects** (the user said yes; remind them of the cost first):
   - Music: the ElevenLabs music node (`eleven_music_v2_5`, through `creative_generate_in_flow` with
     `node_type: "music"`). Describe the emotional arc second by second. 1–2 takes; pick the one
     whose loudness follows the story.
   - Sound effects: `eleven_text_to_sound_v2` (`node_type: "sfx"`, `generations_count: 1`), one per
     story moment, subtle.
   - Add `"music"` and `"sfx"` entries to `audio_cues.json` (format in `scripts/mix.py`). Never put an
     effect ON a key word; put it just before or after.
3. Run `python3 <skill>/scripts/mix.py public/audio/audio_cues.json`. It writes `public/audio/mix.wav`
   and prints how far the background sits under the voice (aim for 12–18 dB).
4. Set `STORY.audio = "audio/mix.wav"` in `story.ts`. **Never point it at the raw narration**: the
   film would play the voice 0.5 s early.

## Step 9: Render and deliver
1. `npm run render` → `out/film.mp4` (H.264 + AAC, ready for YouTube and Instagram).
2. Check with `ffprobe`: video + audio, the right size and length. The opening fade from black should
   be 10 frames at most, and the voice should start at about 0.5 s.
3. Tell the user: where the file is, the story in one line, the voice used, the credits spent, what
   you verified by measurement, and ask them to watch and listen once.

## When something goes wrong
- A render fails with a missing font or a timeout: run it again once; Google Fonts load on first use.
- `transcribe.py` says faster-whisper is missing: run the one install command it prints.
- The voice reads a tag aloud or mispronounces a name: use the other take, or spell the name
  phonetically in the text (e.g. "Dee-ya") and generate again.
- The film feels static: add idle motion (blink, breathing, flicker, drifting dust) and a slow
  camera creep inside long beats.
- More fixes: `references/qa.md`.
