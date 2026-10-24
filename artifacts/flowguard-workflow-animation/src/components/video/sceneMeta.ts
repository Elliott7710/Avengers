// Optional scene metadata for Replit workspace integrations. When the
// workspace's scene controls are enabled for this project, a viewer's click on
// a scene segment scopes their next chat request to that scene's source file.
// Fill one entry per SCENE_DURATIONS key in VideoTemplate.tsx only when a
// skill reference asks for it; otherwise leave the map empty. Scenes missing
// from the map still play and can be jumped to.
//
// Example:
//   export const SCENE_DETAILS: Record<string, SceneDetails> = {
//     open: { title: 'Intro', filePath: 'src/components/video/video_scenes/Scene1.tsx' },
//   };

export interface SceneDetails {
  title: string;
  filePath: string;
}

export const SCENE_DETAILS: Record<string, SceneDetails> = {
  introduction: { title: 'Introduction', filePath: 'src/components/video/scenes/Scene1.tsx' },
  request: { title: 'The Request', filePath: 'src/components/video/scenes/Scene2.tsx' },
  reviewFlag: { title: 'The Review Flag', filePath: 'src/components/video/scenes/Scene3.tsx' },
  decision: { title: 'Independent manager review', filePath: 'src/components/video/scenes/Scene4.tsx' },
  outcome: { title: 'The Outcome', filePath: 'src/components/video/scenes/Scene5.tsx' },
  activityHistory: { title: 'The Activity History', filePath: 'src/components/video/scenes/Scene6.tsx' },
  closing: { title: 'Closing', filePath: 'src/components/video/scenes/Scene7.tsx' },
};
