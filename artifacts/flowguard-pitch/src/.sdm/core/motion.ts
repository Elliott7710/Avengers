import type { Element, Frame, Size, SlideDocument } from './schema';

export const SDM_MOTION_EXTENSION_KEY = 'replit.motion';
export const SDM_MOTION_VERSION = 1;

export const SDM_MOTION_ENTRANCE_PRESETS = [
  'appear',
  'fade-in',
  'fly-in',
  'float-in',
  'wipe-in',
  'zoom-in',
  'blur-in',
] as const;
export const SDM_MOTION_EXIT_PRESETS = [
  'disappear',
  'fade-out',
  'fly-out',
  'float-out',
  'wipe-out',
  'zoom-out',
] as const;
export const SDM_MOTION_LOOP_PRESETS = ['pulse', 'float', 'spin'] as const;
export const SDM_MOTION_EASINGS = [
  'standard',
  'decelerate',
  'accelerate',
  'spring',
  'linear',
] as const;
export const SDM_MOTION_ENTRANCE_DIRECTIONS = [
  'from-left',
  'from-right',
  'from-top',
  'from-bottom',
] as const;
export const SDM_MOTION_EXIT_DIRECTIONS = [
  'to-left',
  'to-right',
  'to-top',
  'to-bottom',
] as const;
export const SDM_MOTION_FLOAT_DIRECTIONS = ['up', 'down'] as const;

export type SdmMotionEntrancePreset =
  (typeof SDM_MOTION_ENTRANCE_PRESETS)[number];
export type SdmMotionExitPreset = (typeof SDM_MOTION_EXIT_PRESETS)[number];
export type SdmMotionLoopPreset = (typeof SDM_MOTION_LOOP_PRESETS)[number];
export type SdmMotionEasing = (typeof SDM_MOTION_EASINGS)[number];
export type SdmMotionDirection =
  | (typeof SDM_MOTION_ENTRANCE_DIRECTIONS)[number]
  | (typeof SDM_MOTION_EXIT_DIRECTIONS)[number]
  | (typeof SDM_MOTION_FLOAT_DIRECTIONS)[number];

export const SDM_MOTION_EASING_CSS: Record<SdmMotionEasing, string> = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  decelerate: 'cubic-bezier(0, 0, 0, 1)',
  accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear: 'linear',
};

export const SDM_MOTION_DURATION_MS_RANGE = { min: 80, max: 3000 } as const;
export const SDM_MOTION_DELAY_MS_RANGE = { min: 0, max: 4000 } as const;
export const SDM_MOTION_PERIOD_MS_RANGE = { min: 600, max: 20000 } as const;

export type SdmMotionIssueCode =
  | 'motion-schema'
  | 'motion-orphan-target'
  | 'motion-preset-unknown'
  | 'motion-direction-invalid'
  | 'motion-duration-range'
  | 'motion-step-gap'
  | 'motion-exit-before-entrance';

export interface SdmMotionIssue {
  code: SdmMotionIssueCode;
  severity: 'error' | 'warning';
  elementIds: Array<string>;
  message: string;
}

export interface SdmMotionEffect {
  target: string;
  kind: 'entrance' | 'exit';
  preset: SdmMotionEntrancePreset | SdmMotionExitPreset;
  direction?: SdmMotionDirection;
  step: number;
  delayMs: number;
  durationMs: number;
  easing: SdmMotionEasing;
  frame: Frame;
  container: Size;
}

export interface SdmMotionLoop {
  target: string;
  preset: SdmMotionLoopPreset;
  periodMs: number;
}

export interface SdmMotionPlan {
  effects: Array<SdmMotionEffect>;
  loops: Array<SdmMotionLoop>;
}

export interface SdmMotionParseResult {
  present: boolean;
  plan: SdmMotionPlan;
  issues: Array<SdmMotionIssue>;
}

/* Relative to the authored pose: dx/dy in container units, scale as a
 * multiplier, rotateDeg additive, opacity as a multiplier of the authored
 * opacity, clipProgress 0 (fully clipped) to 1 (fully revealed). Every
 * keyframe of one track defines the same channel set. */
export interface SdmMotionKeyframe {
  offset: number;
  dx?: number;
  dy?: number;
  scale?: number;
  rotateDeg?: number;
  opacity?: number;
  blurPx?: number;
  clipProgress?: number;
}

export interface SdmMotionTrack {
  target: string;
  kind: 'entrance' | 'exit' | 'loop';
  preset: SdmMotionEntrancePreset | SdmMotionExitPreset | SdmMotionLoopPreset;
  direction?: SdmMotionDirection;
  startMs: number;
  durationMs: number;
  easing: SdmMotionEasing;
  iterations: 1 | 'infinite';
  holdEnd: boolean;
  stopMs?: number;
  keyframes: Array<SdmMotionKeyframe>;
}

export interface SdmMotionTimeline {
  tracks: Array<SdmMotionTrack>;
  settleMs: number;
}

const FLOAT_TRAVEL = 48;
const LOOP_FLOAT_TRAVEL = 14;
const PULSE_SCALE = 1.045;
const ZOOM_SCALE = 0.6;
const BLUR_IN_PX = 16;

interface EffectPresetSpec {
  durationMs: number;
  easing: SdmMotionEasing;
  directions: ReadonlyArray<SdmMotionDirection> | null;
  defaultDirection?: SdmMotionDirection;
  instant?: boolean;
}

const ENTRANCE_SPECS: Record<SdmMotionEntrancePreset, EffectPresetSpec> = {
  appear: { durationMs: 0, easing: 'linear', directions: null, instant: true },
  'fade-in': { durationMs: 400, easing: 'standard', directions: null },
  'fly-in': {
    durationMs: 500,
    easing: 'decelerate',
    directions: SDM_MOTION_ENTRANCE_DIRECTIONS,
    defaultDirection: 'from-bottom',
  },
  'float-in': {
    durationMs: 500,
    easing: 'decelerate',
    directions: SDM_MOTION_FLOAT_DIRECTIONS,
    defaultDirection: 'up',
  },
  'wipe-in': {
    durationMs: 450,
    easing: 'standard',
    directions: SDM_MOTION_ENTRANCE_DIRECTIONS,
    defaultDirection: 'from-left',
  },
  'zoom-in': { durationMs: 400, easing: 'standard', directions: null },
  'blur-in': { durationMs: 450, easing: 'decelerate', directions: null },
};

const EXIT_SPECS: Record<SdmMotionExitPreset, EffectPresetSpec> = {
  disappear: {
    durationMs: 0,
    easing: 'linear',
    directions: null,
    instant: true,
  },
  'fade-out': { durationMs: 300, easing: 'accelerate', directions: null },
  'fly-out': {
    durationMs: 450,
    easing: 'accelerate',
    directions: SDM_MOTION_EXIT_DIRECTIONS,
    defaultDirection: 'to-bottom',
  },
  'float-out': {
    durationMs: 400,
    easing: 'accelerate',
    directions: SDM_MOTION_FLOAT_DIRECTIONS,
    defaultDirection: 'up',
  },
  'wipe-out': {
    durationMs: 450,
    easing: 'accelerate',
    directions: SDM_MOTION_EXIT_DIRECTIONS,
    defaultDirection: 'to-right',
  },
  'zoom-out': { durationMs: 300, easing: 'accelerate', directions: null },
};

const LOOP_PERIOD_MS: Record<SdmMotionLoopPreset, number> = {
  pulse: 2400,
  float: 4000,
  spin: 6000,
};

const LOOP_EASINGS: Record<SdmMotionLoopPreset, SdmMotionEasing> = {
  pulse: 'standard',
  float: 'standard',
  spin: 'linear',
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

interface TargetGeometry {
  frame: Frame;
  container: Size;
}

function collectTargetGeometry(
  document: SlideDocument,
): Map<string, TargetGeometry> {
  const geometry = new Map<string, TargetGeometry>();
  const visit = (elements: Array<Element>, container: Size): void => {
    for (const element of elements) {
      if (!geometry.has(element.id)) {
        geometry.set(element.id, { frame: element.frame, container });
      }
      if (element.type === 'group') {
        visit(element.children, element.coordinateSpace);
      }
    }
  };
  visit(document.elements, document.size);
  return geometry;
}

interface IssueSink {
  issues: Array<SdmMotionIssue>;
}

function report(
  sink: IssueSink,
  code: SdmMotionIssueCode,
  severity: 'error' | 'warning',
  elementIds: Array<string>,
  message: string,
): void {
  sink.issues.push({ code, severity, elementIds, message });
}

function clampWithWarning(
  sink: IssueSink,
  value: number,
  range: { min: number; max: number },
  target: string,
  label: string,
): number {
  if (value < range.min || value > range.max) {
    report(
      sink,
      'motion-duration-range',
      'warning',
      [target],
      `${label} ${value} is outside ${range.min}-${range.max}ms and clamps at playback`,
    );
    return Math.min(range.max, Math.max(range.min, value));
  }
  return value;
}

interface ParsedDefaults {
  durationMs?: number;
  easing?: SdmMotionEasing;
}

function parseDefaults(sink: IssueSink, value: unknown): ParsedDefaults {
  if (value === undefined) {
    return {};
  }
  if (!isPlainObject(value)) {
    report(
      sink,
      'motion-schema',
      'error',
      [],
      'defaults must be an object; ignoring it',
    );
    return {};
  }
  const defaults: ParsedDefaults = {};
  if (value.durationMs !== undefined) {
    if (isFiniteNumber(value.durationMs)) {
      defaults.durationMs = value.durationMs;
    } else {
      report(
        sink,
        'motion-schema',
        'error',
        [],
        'defaults.durationMs must be a number; ignoring it',
      );
    }
  }
  if (value.easing !== undefined) {
    if (isEasing(value.easing)) {
      defaults.easing = value.easing;
    } else {
      report(
        sink,
        'motion-schema',
        'error',
        [],
        `defaults.easing must be one of ${SDM_MOTION_EASINGS.join(', ')}; ignoring it`,
      );
    }
  }
  return defaults;
}

function isEasing(value: unknown): value is SdmMotionEasing {
  return (
    typeof value === 'string' &&
    (SDM_MOTION_EASINGS as ReadonlyArray<string>).includes(value)
  );
}

function parseEffectEntry(
  sink: IssueSink,
  kind: 'entrance' | 'exit',
  entry: unknown,
  index: number,
  defaults: ParsedDefaults,
  geometry: Map<string, TargetGeometry>,
  seen: Set<string>,
): SdmMotionEffect | undefined {
  const list = kind === 'entrance' ? 'entrance' : 'exit';
  if (!isPlainObject(entry)) {
    report(
      sink,
      'motion-schema',
      'error',
      [],
      `${list}[${index}] must be an object; dropping it`,
    );
    return undefined;
  }
  if (typeof entry.target !== 'string' || entry.target.length === 0) {
    report(
      sink,
      'motion-schema',
      'error',
      [],
      `${list}[${index}] needs a string target; dropping it`,
    );
    return undefined;
  }
  const target = entry.target;
  if (typeof entry.preset !== 'string') {
    report(
      sink,
      'motion-schema',
      'error',
      [target],
      `${list} entry for "${target}" needs a string preset; dropping it`,
    );
    return undefined;
  }
  const presets: ReadonlyArray<string> =
    kind === 'entrance' ? SDM_MOTION_ENTRANCE_PRESETS : SDM_MOTION_EXIT_PRESETS;
  if (!presets.includes(entry.preset)) {
    report(
      sink,
      'motion-preset-unknown',
      'error',
      [target],
      `unknown ${list} preset "${entry.preset}"; dropping the entry`,
    );
    return undefined;
  }
  const preset = entry.preset as SdmMotionEntrancePreset | SdmMotionExitPreset;
  const spec =
    kind === 'entrance'
      ? ENTRANCE_SPECS[preset as SdmMotionEntrancePreset]
      : EXIT_SPECS[preset as SdmMotionExitPreset];

  let direction = spec.defaultDirection;
  if (entry.direction !== undefined) {
    if (
      spec.directions === null ||
      typeof entry.direction !== 'string' ||
      !(spec.directions as ReadonlyArray<string>).includes(entry.direction)
    ) {
      const expected =
        spec.directions === null
          ? `"${preset}" takes no direction`
          : `"${preset}" accepts ${spec.directions.join(', ')}`;
      report(
        sink,
        'motion-direction-invalid',
        'error',
        [target],
        `invalid direction for ${list} preset: ${expected}; dropping the entry`,
      );
      return undefined;
    }
    direction = entry.direction as SdmMotionDirection;
  }

  let step = 0;
  if (entry.step !== undefined) {
    if (!Number.isSafeInteger(entry.step) || (entry.step as number) < 0) {
      report(
        sink,
        'motion-schema',
        'error',
        [target],
        `${list} entry for "${target}" needs a non-negative integer step; dropping it`,
      );
      return undefined;
    }
    step = entry.step as number;
  }

  let delayMs = 0;
  if (entry.delayMs !== undefined) {
    if (!isFiniteNumber(entry.delayMs)) {
      report(
        sink,
        'motion-schema',
        'error',
        [target],
        `${list} entry for "${target}" needs a numeric delayMs; dropping it`,
      );
      return undefined;
    }
    delayMs = clampWithWarning(
      sink,
      entry.delayMs,
      SDM_MOTION_DELAY_MS_RANGE,
      target,
      'delayMs',
    );
  }

  let durationMs = defaults.durationMs ?? spec.durationMs;
  if (entry.durationMs !== undefined) {
    if (!isFiniteNumber(entry.durationMs)) {
      report(
        sink,
        'motion-schema',
        'error',
        [target],
        `${list} entry for "${target}" needs a numeric durationMs; dropping it`,
      );
      return undefined;
    }
    durationMs = entry.durationMs;
  }
  if (spec.instant) {
    durationMs = 0;
  } else {
    durationMs = clampWithWarning(
      sink,
      durationMs,
      SDM_MOTION_DURATION_MS_RANGE,
      target,
      'durationMs',
    );
  }

  let easing = defaults.easing ?? spec.easing;
  if (entry.easing !== undefined) {
    if (!isEasing(entry.easing)) {
      report(
        sink,
        'motion-schema',
        'error',
        [target],
        `${list} entry for "${target}" has an unknown easing; dropping it`,
      );
      return undefined;
    }
    easing = entry.easing;
  }

  const targetGeometry = geometry.get(target);
  if (!targetGeometry) {
    report(
      sink,
      'motion-orphan-target',
      'error',
      [target],
      `${list} target "${target}" matches no element id in the slide; dropping the entry`,
    );
    return undefined;
  }
  if (seen.has(target)) {
    report(
      sink,
      'motion-schema',
      'error',
      [target],
      `duplicate ${list} entry for "${target}"; keeping the first`,
    );
    return undefined;
  }
  seen.add(target);

  const effect: SdmMotionEffect = {
    target,
    kind,
    preset,
    step,
    delayMs,
    durationMs,
    easing,
    frame: targetGeometry.frame,
    container: targetGeometry.container,
  };
  if (direction !== undefined) {
    effect.direction = direction;
  }
  return effect;
}

function parseLoopEntry(
  sink: IssueSink,
  entry: unknown,
  index: number,
  geometry: Map<string, TargetGeometry>,
  seen: Set<string>,
): SdmMotionLoop | undefined {
  if (!isPlainObject(entry)) {
    report(
      sink,
      'motion-schema',
      'error',
      [],
      `loops[${index}] must be an object; dropping it`,
    );
    return undefined;
  }
  if (typeof entry.target !== 'string' || entry.target.length === 0) {
    report(
      sink,
      'motion-schema',
      'error',
      [],
      `loops[${index}] needs a string target; dropping it`,
    );
    return undefined;
  }
  const target = entry.target;
  if (
    typeof entry.preset !== 'string' ||
    !(SDM_MOTION_LOOP_PRESETS as ReadonlyArray<string>).includes(entry.preset)
  ) {
    report(
      sink,
      'motion-preset-unknown',
      'error',
      [target],
      `unknown loop preset "${String(entry.preset)}"; dropping the entry`,
    );
    return undefined;
  }
  const preset = entry.preset as SdmMotionLoopPreset;

  let periodMs = LOOP_PERIOD_MS[preset];
  if (entry.periodMs !== undefined) {
    if (!isFiniteNumber(entry.periodMs)) {
      report(
        sink,
        'motion-schema',
        'error',
        [target],
        `loop entry for "${target}" needs a numeric periodMs; dropping it`,
      );
      return undefined;
    }
    periodMs = clampWithWarning(
      sink,
      entry.periodMs,
      SDM_MOTION_PERIOD_MS_RANGE,
      target,
      'periodMs',
    );
  }

  if (!geometry.has(target)) {
    report(
      sink,
      'motion-orphan-target',
      'error',
      [target],
      `loop target "${target}" matches no element id in the slide; dropping the entry`,
    );
    return undefined;
  }
  if (seen.has(target)) {
    report(
      sink,
      'motion-schema',
      'error',
      [target],
      `duplicate loop entry for "${target}"; keeping the first`,
    );
    return undefined;
  }
  seen.add(target);

  return { target, preset, periodMs };
}

function emptyPlan(): SdmMotionPlan {
  return { effects: [], loops: [] };
}

export function parseSlideMotion(
  document: SlideDocument,
): SdmMotionParseResult {
  const raw = document.extensions?.[SDM_MOTION_EXTENSION_KEY];
  if (raw === undefined) {
    return { present: false, plan: emptyPlan(), issues: [] };
  }
  const sink: IssueSink = { issues: [] };
  if (!isPlainObject(raw)) {
    report(
      sink,
      'motion-schema',
      'error',
      [],
      'replit.motion must be an object',
    );
    return { present: true, plan: emptyPlan(), issues: sink.issues };
  }
  if (raw.version !== SDM_MOTION_VERSION) {
    report(
      sink,
      'motion-schema',
      'error',
      [],
      `replit.motion version must be ${SDM_MOTION_VERSION}`,
    );
    return { present: true, plan: emptyPlan(), issues: sink.issues };
  }

  const defaults = parseDefaults(sink, raw.defaults);
  const geometry = collectTargetGeometry(document);
  const effects: Array<SdmMotionEffect> = [];
  const loops: Array<SdmMotionLoop> = [];

  for (const kind of ['entrance', 'exit'] as const) {
    const rawList = raw[kind];
    if (rawList === undefined) {
      continue;
    }
    if (!Array.isArray(rawList)) {
      report(
        sink,
        'motion-schema',
        'error',
        [],
        `${kind} must be a list; ignoring it`,
      );
      continue;
    }
    const seen = new Set<string>();
    rawList.forEach((entry, index) => {
      const effect = parseEffectEntry(
        sink,
        kind,
        entry,
        index,
        defaults,
        geometry,
        seen,
      );
      if (effect) {
        effects.push(effect);
      }
    });
  }

  if (raw.loops !== undefined) {
    if (!Array.isArray(raw.loops)) {
      report(
        sink,
        'motion-schema',
        'error',
        [],
        'loops must be a list; ignoring it',
      );
    } else {
      const seen = new Set<string>();
      raw.loops.forEach((entry, index) => {
        const loop = parseLoopEntry(sink, entry, index, geometry, seen);
        if (loop) {
          loops.push(loop);
        }
      });
    }
  }

  const steps = [...new Set(effects.map((effect) => effect.step))].sort(
    (left, right) => left - right,
  );
  const hasGap =
    steps.length > 0 &&
    (steps[0] !== 0 || steps[steps.length - 1] !== steps.length - 1);
  if (hasGap) {
    report(
      sink,
      'motion-step-gap',
      'warning',
      [],
      `steps ${steps.join(', ')} are not contiguous from 0; playback renumbers them`,
    );
  }

  for (const exit of effects) {
    if (exit.kind !== 'exit') {
      continue;
    }
    const entrance = effects.find(
      (effect) => effect.kind === 'entrance' && effect.target === exit.target,
    );
    if (entrance && exit.step <= entrance.step) {
      report(
        sink,
        'motion-exit-before-entrance',
        'warning',
        [exit.target],
        `exit step ${exit.step} does not come after entrance step ${entrance.step} for "${exit.target}"`,
      );
    }
  }

  return { present: true, plan: { effects, loops }, issues: sink.issues };
}

function flyDelta(
  frame: Frame,
  container: Size,
  direction: SdmMotionDirection,
): { dx: number; dy: number } {
  switch (direction) {
    case 'from-left':
    case 'to-left':
      return { dx: -(frame.x + frame.width), dy: 0 };
    case 'from-right':
    case 'to-right':
      return { dx: container.width - frame.x, dy: 0 };
    case 'from-top':
    case 'to-top':
      return { dx: 0, dy: -(frame.y + frame.height) };
    case 'from-bottom':
    case 'to-bottom':
      return { dx: 0, dy: container.height - frame.y };
    case 'up':
    case 'down':
      return { dx: 0, dy: 0 };
    default: {
      const exhaustive: never = direction;
      return exhaustive;
    }
  }
}

function effectKeyframes(effect: SdmMotionEffect): Array<SdmMotionKeyframe> {
  const direction = effect.direction;
  switch (effect.preset) {
    case 'appear':
    case 'fade-in':
      return [
        { offset: 0, opacity: 0 },
        { offset: 1, opacity: 1 },
      ];
    case 'fly-in': {
      const from = flyDelta(
        effect.frame,
        effect.container,
        direction ?? 'from-bottom',
      );
      return [
        { offset: 0, dx: from.dx, dy: from.dy },
        { offset: 1, dx: 0, dy: 0 },
      ];
    }
    case 'float-in': {
      const dy = direction === 'down' ? -FLOAT_TRAVEL : FLOAT_TRAVEL;
      return [
        { offset: 0, dy, opacity: 0 },
        { offset: 1, dy: 0, opacity: 1 },
      ];
    }
    case 'wipe-in':
      return [
        { offset: 0, clipProgress: 0 },
        { offset: 1, clipProgress: 1 },
      ];
    case 'zoom-in':
      return [
        { offset: 0, scale: ZOOM_SCALE, opacity: 0 },
        { offset: 1, scale: 1, opacity: 1 },
      ];
    case 'blur-in':
      return [
        { offset: 0, blurPx: BLUR_IN_PX, opacity: 0 },
        { offset: 1, blurPx: 0, opacity: 1 },
      ];
    case 'disappear':
    case 'fade-out':
      return [
        { offset: 0, opacity: 1 },
        { offset: 1, opacity: 0 },
      ];
    case 'fly-out': {
      const to = flyDelta(
        effect.frame,
        effect.container,
        direction ?? 'to-bottom',
      );
      return [
        { offset: 0, dx: 0, dy: 0, opacity: 1 },
        { offset: 1, dx: to.dx, dy: to.dy, opacity: 0 },
      ];
    }
    case 'float-out': {
      const dy = direction === 'down' ? FLOAT_TRAVEL : -FLOAT_TRAVEL;
      return [
        { offset: 0, dy: 0, opacity: 1 },
        { offset: 1, dy, opacity: 0 },
      ];
    }
    case 'wipe-out':
      return [
        { offset: 0, clipProgress: 1 },
        { offset: 1, clipProgress: 0 },
      ];
    case 'zoom-out':
      return [
        { offset: 0, scale: 1, opacity: 1 },
        { offset: 1, scale: ZOOM_SCALE, opacity: 0 },
      ];
    default: {
      const exhaustive: never = effect.preset;
      return exhaustive;
    }
  }
}

function loopKeyframes(preset: SdmMotionLoopPreset): Array<SdmMotionKeyframe> {
  switch (preset) {
    case 'pulse':
      return [
        { offset: 0, scale: 1 },
        { offset: 0.5, scale: PULSE_SCALE },
        { offset: 1, scale: 1 },
      ];
    case 'float':
      return [
        { offset: 0, dy: 0 },
        { offset: 0.5, dy: -LOOP_FLOAT_TRAVEL },
        { offset: 1, dy: 0 },
      ];
    case 'spin':
      return [
        { offset: 0, rotateDeg: 0 },
        { offset: 1, rotateDeg: 360 },
      ];
    default: {
      const exhaustive: never = preset;
      return exhaustive;
    }
  }
}

export function resolveMotionTimeline(plan: SdmMotionPlan): SdmMotionTimeline {
  const stepOrdinals = new Map<number, number>();
  for (const step of [...new Set(plan.effects.map((e) => e.step))].sort(
    (left, right) => left - right,
  )) {
    stepOrdinals.set(step, stepOrdinals.size);
  }

  const groups: Array<Array<SdmMotionEffect>> = Array.from(
    { length: stepOrdinals.size },
    () => [],
  );
  for (const effect of plan.effects) {
    const ordinal = stepOrdinals.get(effect.step);
    if (ordinal !== undefined) {
      groups[ordinal].push(effect);
    }
  }

  const tracks: Array<SdmMotionTrack> = [];
  const entranceEnds = new Map<string, number>();
  const exitStarts = new Map<string, number>();
  let stepStart = 0;
  let settleMs = 0;
  for (const group of groups) {
    let stepEnd = stepStart;
    for (const effect of group) {
      const startMs = stepStart + effect.delayMs;
      const endMs = startMs + effect.durationMs;
      stepEnd = Math.max(stepEnd, endMs);
      const track: SdmMotionTrack = {
        target: effect.target,
        kind: effect.kind,
        preset: effect.preset,
        startMs,
        durationMs: effect.durationMs,
        easing: effect.easing,
        iterations: 1,
        holdEnd: effect.kind === 'exit',
        keyframes: effectKeyframes(effect),
      };
      if (effect.direction !== undefined) {
        track.direction = effect.direction;
      }
      tracks.push(track);
      if (effect.kind === 'entrance') {
        entranceEnds.set(effect.target, endMs);
      } else {
        exitStarts.set(effect.target, startMs);
      }
    }
    settleMs = Math.max(settleMs, stepEnd);
    stepStart = stepEnd;
  }

  for (const loop of plan.loops) {
    const track: SdmMotionTrack = {
      target: loop.target,
      kind: 'loop',
      preset: loop.preset,
      startMs: entranceEnds.get(loop.target) ?? 0,
      durationMs: loop.periodMs,
      easing: LOOP_EASINGS[loop.preset],
      iterations: 'infinite',
      holdEnd: false,
      keyframes: loopKeyframes(loop.preset),
    };
    const stopMs = exitStarts.get(loop.target);
    if (stopMs !== undefined) {
      track.stopMs = stopMs;
    }
    tracks.push(track);
  }

  return { tracks, settleMs };
}
