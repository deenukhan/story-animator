# Story Animator: animated story videos with Claude

A Claude Code skill that turns one line like

> *Make a 60-second kids' story about a tiny cleaning robot who finds the last flower in a grey city.*

into a finished, narrated 2D animated film:

- **Claude writes the story**: one character, one problem, one turn, a happy ending.
- **ElevenLabs voices it**: Claude picks a storyteller voice and makes the narration.
- **Claude draws every frame in code**: SVG shapes in [Remotion](https://www.remotion.dev), timed to the voice. No AI image or video generation.
- **Optional music and sound effects**: mixed so the voice is always on top.
- **You get an MP4** for YouTube (16:9), Reels/Shorts (9:16) or an Instagram post (4:5).

Made by [@neuraltech.ai](https://www.instagram.com/neuraltech.ai/).

---

## Install (one time)

### The easy way
Open **Claude Code** (the **Code** tab in the Claude desktop app, or `claude` in a terminal) and paste:

```
install this skill: https://github.com/deenukhan/story-animator
```

Claude downloads it and puts it in your skills folder (`~/.claude/skills/story-animator`).

### As a plugin
```
/plugin marketplace add deenukhan/story-animator
/plugin install story-animator@story-animator
```

### By hand
```bash
git clone https://github.com/deenukhan/story-animator.git
mkdir -p ~/.claude/skills
cp -R story-animator/skills/story-animator ~/.claude/skills/
```

Start a new Claude Code session after installing.

## What you need
| Thing | Why | Cost |
|---|---|---|
| Claude Code | Runs everything | Needs a paid Claude plan |
| ElevenLabs, connected to Claude (Settings → Connectors → ElevenLabs) | The narrator voice, music, sound effects | The free plan is enough to start (see the note below) |
| Node.js 18+ | Runs Remotion, the animation engine | Free |
| ffmpeg | Mixes the audio | Free |
| Python 3 | The timing and mixing helper scripts | Free |

Claude checks these at the start and tells you exactly what's missing.

> **About the ElevenLabs free plan:** about 10,000 credits a month, enough to try a few stories. It has
> **no commercial licence** and needs attribution. If you're going to make money from the videos (a
> monetised channel, client work), use a paid ElevenLabs plan. Check their pricing page for current terms.

## Use it
In Claude Code, open a folder for your videos and type something like:

```
Use the story-animator skill to make a 60-second kids' story about a little lantern
that is scared of the dark. Vertical 9:16, with music.
```

or just

```
Use story-animator to make a story video. Surprise me.
```

Claude asks a few quick questions (length, shape, voice, music), shows you the story to approve, and
then does the rest: voice → timing → drawing → sound → render. You get `out/film.mp4`.

## What's inside
```
skills/story-animator/
  SKILL.md                 the step-by-step workflow Claude follows
  references/              story craft, timing pipeline, visual style, voice and sound, QA checklist
  template/                a ready Remotion project (camera, faces, glows, subtitles, starter scene)
  scripts/transcribe.py    word timestamps → film frames
  scripts/mix.py           voice + music + sound effects, with the voice always on top
  scripts/contact_sheet.sh render a few frames to check the film by eye
  examples/                two complete films (a Diwali story and a robot story), full source
```

## Ideas for what to make
- A kids' bedtime story channel
- Festival greetings for brands, starring their mascot
- Picture-book trailers for authors
- Story-based lessons for teachers
- Personalised birthday stories with a child's name

If you post kids' content on YouTube, set the video as **Made for kids**, and follow each platform's
rules for AI-assisted content.

## Licence
MIT. See [LICENSE](LICENSE). Use it, change it, build on it.
