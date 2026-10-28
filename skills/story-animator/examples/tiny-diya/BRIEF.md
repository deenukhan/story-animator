# Example: The Tiny Diya

A finished film made with this pipeline. `Film.tsx` here is the complete source of the film (it was built before the template existed, inside a larger Remotion project, so it has its own helpers, camera and subtitles and some raw frame numbers. Study its drawing, light and motion; for structure, follow the template and SKILL.md).

## Story (as sent to ElevenLabs)
1. On Diwali night, every house on the lane glowed with big, bright lamps.
2. And at the very end of the row sat Deepu... the tiniest diya of all.
3. His flame was so small, nobody even noticed him.
4. Then... whoosh! A cold wind rushed down the lane.
5. One by one, the big lamps flickered... and went out.
6. The whole lane went dark.
7. But Deepu sat low, tucked behind the doorstep... and his little flame held on.
8. Carefully, he leaned over... and lit the diya next to him.
9. That one lit the next... and the next... and the next.
10. Until the whole lane was shining again.
11. And that night, everyone learned... even the smallest light can start something big.

Transformation: unnoticed → the one who relights the lane. Token: Deepu's flame (small at the start, the source of every flame at the end).

## Cue table (film frames = 15 + round(t x 30))
| # | Line | Frames | Picture |
|---|---|---|---|
| 1 | On Diwali night… lamps | 15–174 | Wide lane with everything lit. Slow drift right. |
| 2 | …end of the row sat Deepu | 181–351 ("Deepu" f265) | Glide right and push in to Deepu |
| 3 | His flame was so small… | 368–477 | Close. Deepu looks up at the big lamps; the big glows dwarf him. |
| 4 | Then… whoosh! A cold wind… | 491 ("whoosh" f517)–612 | Pull back wide. Wind streaks and petals; lanterns swing. |
| 5 | One by one… went out | 631–744 (out f645→741) | Wide. Flames bend and puff out left→right, and the lit diyas close their eyes. |
| 6 | The whole lane went dark | 749–813 ("dark" f800) | Wide, dark. Only Deepu's tiny glow at the right end. |
| 7 | But Deepu sat low… held on | 835–1011 ("held on" f985) | Push in to Deepu behind the step. His flame bends, then steadies and grows. |
| 8 | Carefully, he leaned… lit the diya | 1035–1158 ("leaned" f1070, "lit" f1112) | Deepu tilts, flame to flame. His neighbour wakes up. |
| 9 | That one lit the next… | 1214 / 1251 / 1289, then faster | Pull back and pan left as the chain runs. Big lamps relight as it passes. |
| 10 | …whole lane shining again | 1313–1383 ("shining" f1366) | Wide, everything lit, a bloom |
| 11 | And that night… something big | 1405–1581 ("big" f1570) | Glide back to Deepu. The row's eyes turn to him and sky lanterns rise. |
| — | tail | 1581–1665 | Hold with flicker, then fade to black over the last 20 frames |
