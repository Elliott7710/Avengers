import {
  parseSlideMotion,
  resolveMotionTimeline,
  SDM_MOTION_EASING_CSS,
  type SdmMotionDirection,
  type SdmMotionTrack,
} from './core/motion';
import type { SlideDocument } from './core/schema';

export const SDM_MOTION_URL_PARAM = 'replitMotion';

export interface SdmMotionEnvironment {
  search: string;
  pathname: string;
  webdriver: boolean;
  reducedMotion: boolean;
}

export function motionPlaybackEnabled(env: SdmMotionEnvironment): boolean {
  return (
    new URLSearchParams(env.search).get(SDM_MOTION_URL_PARAM) === '1' &&
    !env.pathname.endsWith('/allslides') &&
    !env.webdriver &&
    !env.reducedMotion
  );
}

export function isMotionPlaybackEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return motionPlaybackEnabled({
    search: window.location.search,
    pathname: window.location.pathname,
    webdriver: window.navigator.webdriver === true,
    reducedMotion:
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
}

export interface SdmMotionHandle {
  cancel(): void;
}

const NOOP_HANDLE: SdmMotionHandle = { cancel: () => {} };

function clipInset(
  direction: SdmMotionDirection | undefined,
  progress: number,
): string {
  const hidden = `${(1 - progress) * 100}%`;
  const side =
    direction === undefined
      ? 'left'
      : direction.slice(direction.indexOf('-') + 1);
  switch (side) {
    case 'right':
      return `inset(0 0 0 ${hidden})`;
    case 'top':
      return `inset(0 0 ${hidden} 0)`;
    case 'bottom':
      return `inset(${hidden} 0 0 0)`;
    default:
      return `inset(0 ${hidden} 0 0)`;
  }
}

function toWaapiKeyframes(
  track: SdmMotionTrack,
  authoredOpacity: number,
): Array<Keyframe> {
  return track.keyframes.map((keyframe) => {
    const frame: Keyframe = { offset: keyframe.offset };
    if (keyframe.dx !== undefined || keyframe.dy !== undefined) {
      frame.translate = `${keyframe.dx ?? 0}px ${keyframe.dy ?? 0}px`;
    }
    if (keyframe.scale !== undefined) {
      frame.scale = `${keyframe.scale}`;
    }
    if (keyframe.rotateDeg !== undefined) {
      frame.rotate = `${keyframe.rotateDeg}deg`;
    }
    if (keyframe.opacity !== undefined) {
      frame.opacity = authoredOpacity * keyframe.opacity;
    }
    if (keyframe.blurPx !== undefined) {
      frame.filter = `blur(${keyframe.blurPx}px)`;
    }
    if (keyframe.clipProgress !== undefined) {
      frame.clipPath = clipInset(track.direction, keyframe.clipProgress);
    }
    return frame;
  });
}

function trackFill(track: SdmMotionTrack): FillMode {
  if (track.holdEnd) {
    return 'forwards';
  }

  return track.kind === 'entrance' ? 'backwards' : 'none';
}

export function playSlideMotion(
  stage: HTMLElement,
  slideDocument: SlideDocument,
): SdmMotionHandle {
  const { plan } = parseSlideMotion(slideDocument);
  if (plan.effects.length === 0 && plan.loops.length === 0) {
    return NOOP_HANDLE;
  }

  const timeline = resolveMotionTimeline(plan);
  const orderedTracks = [
    ...timeline.tracks.filter((track) => track.kind === 'loop'),
    ...timeline.tracks.filter((track) => track.kind !== 'loop'),
  ];
  const animations: Array<Animation> = [];
  const loopsByTarget = new Map<string, Array<Animation>>();
  const exitsByTarget = new Map<string, Animation>();
  for (const track of orderedTracks) {
    const target = stage.querySelector<HTMLElement>(
      `[data-sdm-id="${track.target}"]`,
    );
    if (!target || typeof target.animate !== 'function') {
      continue;
    }
    const authoredOpacity =
      target.style.opacity === '' ? 1 : Number(target.style.opacity);
    const animation = target.animate(toWaapiKeyframes(track, authoredOpacity), {
      delay: track.startMs,
      duration: track.durationMs,
      easing: SDM_MOTION_EASING_CSS[track.easing],
      iterations: track.iterations === 'infinite' ? Infinity : 1,
      fill: trackFill(track),
    });
    animations.push(animation);
    if (track.kind === 'loop') {
      const loops = loopsByTarget.get(track.target) ?? [];
      loops.push(animation);
      loopsByTarget.set(track.target, loops);
    } else if (track.kind === 'exit') {
      exitsByTarget.set(track.target, animation);
    }
  }

  for (const [target, exit] of exitsByTarget) {
    const loops = loopsByTarget.get(target);
    if (!loops) {
      continue;
    }
    exit.finished.then(
      () => {
        for (const loop of loops) {
          loop.cancel();
        }
      },
      () => {},
    );
  }

  return {
    cancel: () => {
      for (const animation of animations) {
        animation.cancel();
      }
    },
  };
}
