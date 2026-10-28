import React from "react";
import { Composition } from "remotion";
import { Film } from "./Film";
import { STORY } from "./story";

// One composition: the whole film. Size, fps and length all come from src/story.ts.
export const RemotionRoot: React.FC = () => (
  <Composition id="Film" component={Film} width={STORY.width} height={STORY.height} fps={STORY.fps} durationInFrames={STORY.durationFrames} />
);
