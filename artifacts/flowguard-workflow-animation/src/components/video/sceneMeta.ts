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
  hook: { title: 'The handoff', filePath: 'src/components/video/scenes/Scene1.tsx' },
  request: { title: 'Submit a request', filePath: 'src/components/video/scenes/Scene2.tsx' },
  rule: { title: 'Illustrative budget flag', filePath: 'src/components/video/scenes/Scene3.tsx' },
  decision: { title: 'Independent manager review', filePath: 'src/components/video/scenes/Scene4.tsx' },
  history: { title: 'Outcome and recording cue', filePath: 'src/components/video/scenes/Scene5.tsx' },
};
