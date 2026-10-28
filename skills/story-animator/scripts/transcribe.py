#!/usr/bin/env python3
"""Word-level timestamps for the narration, so every animation beat can land on the spoken word.

usage:  python transcribe.py public/audio/narration.mp3 [--offset 15] [--fps 30] [--lang en] [--model small]
writes: <audio>.words.json  ([{"w": word, "s": start_s, "e": end_s}, ...])
prints: one line per sentence-ish chunk with its start/end in seconds AND in film frames
        (frame = offset + round(seconds * fps)), ready to paste into src/story.ts.

Needs faster-whisper. If it isn't installed, the script tells you the one command to run.
"""
import argparse, json, os, sys, warnings

warnings.filterwarnings("ignore")  # faster-whisper prints harmless mel_spec RuntimeWarnings

ap = argparse.ArgumentParser()
ap.add_argument("audio")
ap.add_argument("--offset", type=int, default=15, help="frames of silence before the narration starts in the film")
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--lang", default="en")
ap.add_argument("--model", default="small", help="tiny / base / small / medium (bigger = slower, more accurate)")
a = ap.parse_args()

try:
    from faster_whisper import WhisperModel
except ImportError:
    sys.exit("faster-whisper is missing. Run:\n  python3 -m venv .venv && .venv/bin/pip install faster-whisper\n"
             "then:  .venv/bin/python " + " ".join(sys.argv))

model = WhisperModel(a.model, device="cpu", compute_type="int8")
segs, info = model.transcribe(a.audio, word_timestamps=True, vad_filter=True, language=a.lang)
words = []
for s in segs:
    for w in s.words or []:
        words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)})

out = os.path.splitext(a.audio)[0] + ".words.json"
json.dump(words, open(out, "w"), indent=0)

fr = lambda t: a.offset + round(t * a.fps)
line, start = [], None
for i, w in enumerate(words):
    if start is None:
        start = w["s"]
    line.append(w["w"])
    end_of_line = w["w"].endswith((".", "!", "?", "...", ",")) and len(line) >= 4
    if end_of_line or i == len(words) - 1:
        print(f"{start:6.2f}-{w['e']:6.2f}s  f{fr(start):>5}-f{fr(w['e']):>5}  {' '.join(line)}")
        line, start = [], None

print(f"\n{len(words)} words -> {out}")
print("Key words with their frames:", " ".join(f"{w['w']}@f{fr(w['s'])}" for w in words))
if words:
    print(f"Last word ends at {words[-1]['e']:.2f}s = f{fr(words[-1]['e'])}. "
          f"Suggested durationFrames (2.5 s tail): {fr(words[-1]['e']) + int(2.5 * a.fps)}")
