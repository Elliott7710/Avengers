import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import {
  VideoCanvas,
  VideoPausedContext,
  type VideoAspectRatio,
  useVideoAudio,
  useVideoPlayer,
} from '@/lib/video';
import { AnimatePresence } from 'framer-motion';

import { Scene1 } from './scenes/Scene1';
import { Scene2 } from './scenes/Scene2';
import { Scene3 } from './scenes/Scene3';
import { Scene4 } from './scenes/Scene4';
import { Scene5 } from './scenes/Scene5';
import { Scene6 } from './scenes/Scene6';
import { Scene7 } from './scenes/Scene7';

export const SCENE_DURATIONS = {
  introduction: 14000,
  request: 25000,
  reviewFlag: 22000,
  decision: 24000,
  outcome: 18000,
  activityHistory: 21000,
  closing: 29514.667,
};

const VIDEO_ASPECT_RATIO: VideoAspectRatio = '16:9';
const SCENE_COMPONENTS: Record<string, ComponentType> = {
  introduction: Scene1,
  request: Scene2,
  reviewFlag: Scene3,
  decision: Scene4,
  outcome: Scene5,
  activityHistory: Scene6,
  closing: Scene7,
};
const SCENE_START_SEC: Record<string, number> = (() => {
  const offsets: Record<string, number> = {};
  let total = 0;
  for (const [key, duration] of Object.entries(SCENE_DURATIONS)) {
    offsets[key] = total / 1000;
    total += duration;
  }
  return offsets;
})();
const AUDIO_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  paused = false,
  muted = false,
  preview = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  paused?: boolean;
  muted?: boolean;
  preview?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop, paused });
  const { paused: workspacePaused, muted: workspaceMuted } = useVideoAudio();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSceneKeyRef = useRef<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const effectivePaused = paused || workspacePaused;
  const effectiveMuted = muted || workspaceMuted;
  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 1;
    if (effectivePaused) {
      audio.pause();
      return;
    }
    if (lastSceneKeyRef.current !== currentSceneKey) {
      lastSceneKeyRef.current = currentSceneKey;
      const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
      if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
        audio.currentTime = targetTime;
      }
    }
    audio.play().then(
      () => setAudioBlocked(false),
      () => setAudioBlocked(true),
    );
  }, [currentSceneKey, baseSceneKey, effectiveMuted, effectivePaused]);

  const handleEnableNarration = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(
      () => setAudioBlocked(false),
      () => setAudioBlocked(true),
    );
  };

  return (
    <VideoPausedContext.Provider value={effectivePaused}>
      <VideoCanvas
        aspectRatio={VIDEO_ASPECT_RATIO}
        style={{ backgroundColor: 'var(--color-bg-dark)' }}
      >
        <AnimatePresence mode="sync">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
        <audio
          ref={audioRef}
          src={`${import.meta.env.BASE_URL}audio/flowguard-narration.m4a`}
          preload="auto"
          autoPlay
          muted={effectiveMuted}
        />
        {preview && audioBlocked && !effectivePaused && (
          <div
            className="absolute bottom-[6%] left-1/2 z-[100] flex max-w-[min(92%,42rem)] -translate-x-1/2 items-center gap-4 rounded-xl border border-[#d5b66c]/50 bg-[#102b2d]/95 px-5 py-4 text-[#f2f1e9] shadow-[0_1.5rem_4rem_rgba(0,0,0,.35)]"
            role="alert"
            aria-live="assertive"
          >
            <p className="m-0 flex-1 text-sm leading-relaxed">
              Narration did not start. Enable it to play the supplied recording.
            </p>
            <button
              type="button"
              onClick={handleEnableNarration}
              className="shrink-0 rounded-lg bg-[#b8e1c8] px-4 py-2.5 text-sm font-semibold text-[#173638] transition-colors hover:bg-[#d1ebd8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8e1c8]"
            >
              Enable narration
            </button>
          </div>
        )}
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}
