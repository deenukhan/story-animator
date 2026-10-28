# Voice, music and sound effects (ElevenLabs)

## Cost and plans (tell the user before spending)
- Credits are per generation. From real runs: one narration take ≈ 6 credits per second of story
  (`eleven_v4`; 25 s ≈ 335, 60 s ≈ 700–820), and the skill makes **2 takes**, so double it
  (a 60 s story ≈ 1,400–1,600). A 60 s music take ≈ 900, one sound effect ≈ 17.
- The **free plan** (about 10,000 credits a month) is enough to start: a few narrations, or one full
  film with music. **But it has no commercial licence and requires attribution.** If the user will
  monetise (a YouTube channel, client work, ads), they need a paid plan (Starter or above). Say this
  plainly. Check elevenlabs.io/pricing for current terms.

## Narration
1. **Pick the voice:** `creative_list_voices` with `languages: ["en"]` (or the user's language),
   `use_cases: ["narrative_story"]`, and a `search` like "warm storyteller" or "children's storyteller".
   Optional `accent` (e.g. `en-indian`, `american`, `british`). Prefer voices described for
   children's stories or audiobooks.
2. **Generate:** `creative_generate_speech` with `model_id: "eleven_v4"` and the chosen `voice_id`.
   The default 2 takes let you pick the cleaner one.
   - Put each narration line on its own paragraph.
   - Light direction tags at the start of lines: `[warm, gentle storytelling]`, `[softly]`,
     `[curious]`, `[delighted]`, `[warmly]`.
   - Never use sound words as tags (`[whooshing]`): a take may say "whoosh whoosh". Write sounds as
     plain words in the sentence.
3. **Download:** `creative_get_generations(flow_id, [generation_ids])` returns a `full_res_url` per
   take when its status is `completed` (if it's still `generating`, wait about 20 s and ask again).
   `curl -sS -o public/audio/take_A.mp3 "<full_res_url>"`. The URLs expire after about 2 hours.
4. **Choose:** transcribe both takes with `scripts/transcribe.py`, compare them with the script, and
   keep the take with every word right, no tags read aloud and names pronounced correctly.

### Without the connector (API key)
```bash
curl -sS -X POST "https://api.elevenlabs.io/v1/text-to-speech/<VOICE_ID>?output_format=mp3_44100_128" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" -H "Content-Type: application/json" \
  -d '{"text": "<narration>", "model_id": "eleven_v3"}' -o public/audio/narration.mp3
```
List voices with `curl -H "xi-api-key: $ELEVENLABS_API_KEY" https://api.elevenlabs.io/v2/voices`.
Check the ElevenLabs API docs for the newest model id if this one is refused.

## Music
- Node `music`, model `eleven_music_v2_5`, through `creative_generate_in_flow` (put the music and SFX
  in one flow with `creative_create_flow`). `estimate_only: true` first if the user is watching cost.
- Describe the arc second by second, instrumental, "quiet enough to sit under narration", for example:
  "0–12 s lonely music box and felt piano; 12–24 s curious celesta; 24–32 s a gentle storm; 32–40 s
  fragile hope; 40–48 s playful pizzicato; 48–60 s warm strings bloom into a hopeful ending. No vocals."
- Pick between takes by their loudness shape (quiet where the story is quiet, building at the turn):
  `ffmpeg -i music.mp3 -ac 1 -ar 8000 -f s16le - | <rms per 2 s>`. Avoid takes that are loud from the
  first second.

## Sound effects
- Node `sfx`, model `eleven_text_to_sound_v2`, `generations_count: 1`. Clips are usually 1–4 s.
- One per story moment, gentle and cartoon-friendly: footsteps, a broom, a sparkle on a reveal, a
  happy beep, thunder, rain (loop it with `loop_for` in the cues file), a power-up chime, birds.
- **Never land an effect on a key word.** Move it just before or after (thunder right after "the storm came").

## Mixing (scripts/mix.py)
- The music is compressed (so a quiet intro is still heard), set around −11 dB, and ducked under the voice.
- All SFX together get an extra −18 dB, and the ones on the start of a line are lower still.
- The master is −14 LUFS, true peak −1 dB (good for Instagram and YouTube).
- Target: the background **12–18 dB under the voice** overall. People complain far more about music
  that is too loud than about music that is too quiet.
- You can't hear the result. Report the measured numbers and ask the user to listen once on a phone speaker.
