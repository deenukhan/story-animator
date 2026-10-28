#!/usr/bin/env python3
"""Mix narration + background music + sound effects into one file, with the voice always on top.

usage:  python mix.py audio_cues.json [--out public/audio/mix.wav]

audio_cues.json (paths are relative to the json file):
{
  "duration": 58.9,                                   # film length in seconds (durationFrames / fps)
  "voice":  {"file": "narration.mp3", "start": 0.5},  # start = OFFSET / fps
  "music":  {"file": "music.mp3", "gain_db": -11},    # optional; -11 is a good start
  "sfx": [                                             # optional; each at a time in seconds
    {"file": "sfx_thunder.mp3", "at": 26.35, "gain_db": -12},
    {"file": "sfx_rain.mp3", "at": 25.9, "gain_db": -11, "loop_for": 7}
  ],
  "sfx_bus_db": -18                                    # extra cut on all SFX together
}

What it does:
  - music: gently compressed (so a quiet intro is still audible), set to gain_db, and ducked
    under the voice whenever she/he speaks (side-chain), with a 1.5 s fade in and a 3 s fade out
  - sfx: placed at their times, mixed, then cut by sfx_bus_db
  - master: loudness-normalised to -14 LUFS (Instagram/YouTube), true peak -1 dB
  - prints the loudness of the voice vs everything else. Aim for the background 12-18 dB under
    the voice. If the background is closer than 10 dB, lower music gain_db or sfx_bus_db.
Needs ffmpeg on PATH.
"""
import argparse, json, os, re, subprocess, sys, tempfile

ap = argparse.ArgumentParser()
ap.add_argument("cues")
ap.add_argument("--out", default="public/audio/mix.wav")
a = ap.parse_args()
cfg = json.load(open(a.cues))
base = os.path.dirname(os.path.abspath(a.cues))
P = lambda f: os.path.join(base, f)
D = float(cfg["duration"])
tmp = tempfile.mkdtemp()

def ff(*args):
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", *args], capture_output=True, text=True)
    if r.returncode:
        sys.exit("ffmpeg failed:\n" + r.stderr)

def lufs(path):
    r = subprocess.run(["ffmpeg", "-i", path, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True)
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
    return float(m[-1]) if m else float("nan")

# voice stem
v = cfg["voice"]; vd = int(float(v.get("start", 0.5)) * 1000)
voice = os.path.join(tmp, "voice.wav")
ff("-i", P(v["file"]), "-af", f"adelay={vd}|{vd},apad,atrim=0:{D},aresample=48000", "-ac", "2", voice)

# sfx stem
sfx = None
if cfg.get("sfx"):
    ins, fl = [], []
    for k, s in enumerate(cfg["sfx"]):
        ins += ["-i", P(s["file"])]
        t = int(float(s["at"]) * 1000)
        loop = ""
        if s.get("loop_for"):
            L = float(s["loop_for"])
            loop = f",aloop=loop=-1:size=2e9,atrim=0:{L},afade=t=in:d=0.6,afade=t=out:st={max(0, L - 1.4)}:d=1.4"
        fl.append(f"[{k}]aresample=48000{loop},volume={s.get('gain_db', 0)}dB,adelay={t}|{t}[s{k}]")
    n = len(cfg["sfx"])
    fl.append("".join(f"[s{k}]" for k in range(n)) + f"amix=inputs={n}:normalize=0,apad,atrim=0:{D},volume={cfg.get('sfx_bus_db', -18)}dB[o]")
    sfx = os.path.join(tmp, "sfx.wav")
    ff(*ins, "-filter_complex", ";".join(fl), "-map", "[o]", "-ac", "2", sfx)

# music stem (ducked under the voice)
bg_parts = []
if cfg.get("music"):
    m = cfg["music"]
    music = os.path.join(tmp, "music.wav")
    ff("-i", P(m["file"]), "-af", f"atrim=0:{D},apad,atrim=0:{D},afade=t=in:d=1.5,afade=t=out:st={max(0, D - 3)}:d=3,aresample=48000", "-ac", "2", music)
    ducked = os.path.join(tmp, "music_ducked.wav")
    ff("-i", music, "-i", voice, "-filter_complex",
       f"[0]acompressor=threshold=-34dB:ratio=3:attack=200:release=1500:makeup=6dB,volume={m.get('gain_db', -11)}dB[m];"
       "[m][1]sidechaincompress=threshold=0.03:ratio=2.5:attack=25:release=400[o]", "-map", "[o]", ducked)
    bg_parts.append(ducked)
if sfx:
    bg_parts.append(sfx)

os.makedirs(os.path.dirname(os.path.abspath(a.out)) or ".", exist_ok=True)
if bg_parts:
    bg = os.path.join(tmp, "bg.wav")
    if len(bg_parts) == 1:
        bg = bg_parts[0]
    else:
        ff("-i", bg_parts[0], "-i", bg_parts[1], "-filter_complex", "[0][1]amix=inputs=2:normalize=0[o]", "-map", "[o]", bg)
    ff("-i", voice, "-i", bg, "-filter_complex", "[0][1]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1:LRA=11[o]", "-map", "[o]", "-ar", "48000", a.out)
    lv, lb = lufs(voice), lufs(bg)
    print(f"voice {lv:.1f} LUFS | music+sfx {lb:.1f} LUFS | background sits {lv - lb:.1f} dB under the voice")
    if lv - lb < 10:
        print("WARNING: the background is too loud. Lower music gain_db or sfx_bus_db and run again.")
else:
    ff("-i", voice, "-af", "loudnorm=I=-14:TP=-1:LRA=11", "-ar", "48000", a.out)
    print("voice only (no music or sfx given)")
print(f"mix -> {a.out}  (final {lufs(a.out):.1f} LUFS)")
