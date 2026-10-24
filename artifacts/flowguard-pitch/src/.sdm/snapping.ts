import { visualBounds } from './core/operations';
import type { Frame, SlideDocument } from './core/schema';
import { MIN_SIZE, resizeFrame, type Handle } from './geometry';

export type SnapAxis = 'x' | 'y';

export interface SnapCandidate {
  value: number;
  source: 'canvas' | 'element';
  elementId: string | null;
  order: number;
}

export interface SnapAxisCandidates {
  edges: Array<SnapCandidate>;
  centers: Array<SnapCandidate>;
}

export interface SnapCandidates {
  x: SnapAxisCandidates;
  y: SnapAxisCandidates;
}

export interface SnapGuide {
  axis: SnapAxis;
  position: number;
  source: 'canvas' | 'element';
  elementId: string | null;
}

export interface MoveSnapResult {
  snapped: boolean;
  dx: number;
  dy: number;
  guides: Array<SnapGuide>;
}

export interface ResizeSnapInput {
  start: Frame;
  handle: Handle;
  dx: number;
  dy: number;
  keepAspect: boolean;
  candidates: SnapCandidates;
  tolerance: number;
}

export interface ResizeSnapResult {
  frame: Frame;
  guides: Array<SnapGuide>;
}

export const SNAP_DWELL_MS = 120;

export interface SnapDwell {
  gateMove(
    candidates: SnapCandidates,
    moving: Frame,
    tolerance: number,
    now: number,
  ): MoveSnapResult;
  gateResize(input: ResizeSnapInput, now: number): ResizeSnapResult;
  pendingDeadline(): number | null;
  recheckDelay(): number | null;
}

interface SnapHit {
  candidate: SnapCandidate;
  distance: number;
}

function compareCandidates(left: SnapCandidate, right: SnapCandidate): number {
  if (left.value !== right.value) {
    return left.value - right.value;
  }
  if (left.source !== right.source) {
    return left.source === 'canvas' ? -1 : 1;
  }

  return left.order - right.order;
}

function canvasCandidate(value: number): SnapCandidate {
  return { value, source: 'canvas', elementId: null, order: -1 };
}

function elementCandidate(
  value: number,
  elementId: string,
  order: number,
): SnapCandidate {
  return { value: Math.round(value), source: 'element', elementId, order };
}

export function collectSnapCandidates(
  document: SlideDocument,
  movingIds: ReadonlyArray<string>,
): SnapCandidates {
  const moving = new Set(movingIds);
  const x: SnapAxisCandidates = {
    edges: [
      canvasCandidate(0),
      canvasCandidate(Math.round(document.size.width)),
    ],
    centers: [canvasCandidate(Math.round(document.size.width / 2))],
  };
  const y: SnapAxisCandidates = {
    edges: [
      canvasCandidate(0),
      canvasCandidate(Math.round(document.size.height)),
    ],
    centers: [canvasCandidate(Math.round(document.size.height / 2))],
  };
  document.elements.forEach((element, order) => {
    if (element.hidden || moving.has(element.id)) {
      return;
    }
    const bounds = visualBounds(element);
    x.edges.push(elementCandidate(bounds.x, element.id, order));
    x.edges.push(elementCandidate(bounds.x + bounds.width, element.id, order));
    x.centers.push(
      elementCandidate(bounds.x + bounds.width / 2, element.id, order),
    );
    y.edges.push(elementCandidate(bounds.y, element.id, order));
    y.edges.push(elementCandidate(bounds.y + bounds.height, element.id, order));
    y.centers.push(
      elementCandidate(bounds.y + bounds.height / 2, element.id, order),
    );
  });
  x.edges.sort(compareCandidates);
  x.centers.sort(compareCandidates);
  y.edges.sort(compareCandidates);
  y.centers.sort(compareCandidates);

  return { x, y };
}

function isBetterCandidate(
  candidate: SnapCandidate,
  distance: number,
  best: SnapHit,
): boolean {
  if (distance !== best.distance) {
    return distance < best.distance;
  }
  if (candidate.source !== best.candidate.source) {
    return candidate.source === 'canvas';
  }
  if (candidate.order !== best.candidate.order) {
    return candidate.order < best.candidate.order;
  }

  return candidate.value < best.candidate.value;
}

function findNearest(
  sorted: Array<SnapCandidate>,
  anchor: number,
  tolerance: number,
  eligible?: (candidate: SnapCandidate) => boolean,
): SnapHit | null {
  const min = anchor - tolerance;
  const max = anchor + tolerance;
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    const probe = sorted[mid];
    if (probe !== undefined && probe.value < min) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  let best: SnapHit | null = null;
  for (let index = low; index < sorted.length; index += 1) {
    const candidate = sorted[index];
    if (candidate === undefined || candidate.value > max) {
      break;
    }
    if (eligible !== undefined && !eligible(candidate)) {
      continue;
    }
    const distance = Math.abs(candidate.value - anchor);
    if (best === null || isBetterCandidate(candidate, distance, best)) {
      best = { candidate, distance };
    }
  }

  return best;
}

function toGuide(axis: SnapAxis, candidate: SnapCandidate): SnapGuide {
  return {
    axis,
    position: candidate.value,
    source: candidate.source,
    elementId: candidate.elementId,
  };
}

function resolveMoveAxis(
  axis: SnapAxis,
  axisCandidates: SnapAxisCandidates,
  start: number,
  size: number,
  tolerance: number,
): { delta: number; guide: SnapGuide } | null {
  const anchors = [
    { value: start + size / 2, pool: axisCandidates.centers },
    { value: start, pool: axisCandidates.edges },
    { value: start + size, pool: axisCandidates.edges },
  ];
  let best: SnapHit | null = null;
  let bestAnchor = 0;
  for (const anchor of anchors) {
    const hit = findNearest(anchor.pool, anchor.value, tolerance);
    if (hit !== null && (best === null || hit.distance < best.distance)) {
      best = hit;
      bestAnchor = anchor.value;
    }
  }
  if (best === null) {
    return null;
  }

  return {
    delta: best.candidate.value - bestAnchor,
    guide: toGuide(axis, best.candidate),
  };
}

export function resolveMoveSnap(
  candidates: SnapCandidates,
  moving: Frame,
  tolerance: number,
): MoveSnapResult {
  const x = resolveMoveAxis(
    'x',
    candidates.x,
    moving.x,
    moving.width,
    tolerance,
  );
  const y = resolveMoveAxis(
    'y',
    candidates.y,
    moving.y,
    moving.height,
    tolerance,
  );
  const guides: Array<SnapGuide> = [];
  if (x !== null) {
    guides.push(x.guide);
  }
  if (y !== null) {
    guides.push(y.guide);
  }

  return {
    snapped: x !== null || y !== null,
    dx: x === null ? 0 : x.delta,
    dy: y === null ? 0 : y.delta,
    guides,
  };
}

function resolveAspectResizeSnap(
  input: ResizeSnapInput,
  raw: Frame,
): ResizeSnapResult {
  const { start, handle, dx, dy, candidates, tolerance } = input;
  const east = handle.includes('e');
  const north = handle.includes('n');
  const plain = resizeFrame(start, handle, dx, dy, false, 0);
  const widthScale = plain.width / start.width;
  const heightScale = plain.height / start.height;
  const dominantX =
    Math.abs(widthScale - 1) >= Math.abs(heightScale - 1);
  const right = start.x + start.width;
  const bottom = start.y + start.height;

  if (dominantX) {
    const anchor = east ? raw.x + raw.width : raw.x;
    const widthAt = (candidate: SnapCandidate) =>
      east ? candidate.value - start.x : right - candidate.value;
    const hit = findNearest(
      candidates.x.edges,
      anchor,
      tolerance,
      (candidate) => {
        const width = widthAt(candidate);

        return (
          width >= MIN_SIZE &&
          Math.round(start.height * (width / start.width)) >= MIN_SIZE
        );
      },
    );
    if (hit === null) {
      return { frame: raw, guides: [] };
    }
    const width = widthAt(hit.candidate);
    const height = Math.round(start.height * (width / start.width));
    const frame = {
      x: east ? start.x : hit.candidate.value,
      y: north ? bottom - height : start.y,
      width,
      height,
    };
    const guides = [toGuide('x', hit.candidate)];
    const derivedEdge = north ? frame.y : frame.y + frame.height;
    const exact = findNearest(candidates.y.edges, derivedEdge, 0);
    if (exact !== null) {
      guides.push(toGuide('y', exact.candidate));
    }

    return { frame, guides };
  }

  const anchor = north ? raw.y : raw.y + raw.height;
  const heightAt = (candidate: SnapCandidate) =>
    north ? bottom - candidate.value : candidate.value - start.y;
  const hit = findNearest(candidates.y.edges, anchor, tolerance, (candidate) => {
    const height = heightAt(candidate);

    return (
      height >= MIN_SIZE &&
      Math.round(start.width * (height / start.height)) >= MIN_SIZE
    );
  });
  if (hit === null) {
    return { frame: raw, guides: [] };
  }
  const height = heightAt(hit.candidate);
  const width = Math.round(start.width * (height / start.height));
  const frame = {
    x: east ? start.x : right - width,
    y: north ? hit.candidate.value : start.y,
    width,
    height,
  };
  const guides: Array<SnapGuide> = [];
  const derivedEdge = east ? frame.x + frame.width : frame.x;
  const exact = findNearest(candidates.x.edges, derivedEdge, 0);
  if (exact !== null) {
    guides.push(toGuide('x', exact.candidate));
  }
  guides.push(toGuide('y', hit.candidate));

  return { frame, guides };
}

export function resolveResizeSnap(input: ResizeSnapInput): ResizeSnapResult {
  const { start, handle, dx, dy, candidates, tolerance } = input;
  const east = handle.includes('e');
  const west = handle.includes('w');
  const south = handle.includes('s');
  const north = handle.includes('n');
  const keepAspect = input.keepAspect && (east || west) && (north || south);
  const raw = resizeFrame(start, handle, dx, dy, keepAspect, 0);
  if (keepAspect) {
    return resolveAspectResizeSnap(input, raw);
  }

  let frame = raw;
  const guides: Array<SnapGuide> = [];
  if (east || west) {
    const widthAt = (candidate: SnapCandidate) =>
      east
        ? candidate.value - raw.x
        : start.x + start.width - candidate.value;
    const anchor = east ? raw.x + raw.width : raw.x;
    const hit = findNearest(
      candidates.x.edges,
      anchor,
      tolerance,
      (candidate) => widthAt(candidate) >= MIN_SIZE,
    );
    if (hit !== null) {
      const width = widthAt(hit.candidate);
      frame = east
        ? { ...frame, width }
        : { ...frame, x: hit.candidate.value, width };
      guides.push(toGuide('x', hit.candidate));
    }
  }
  if (south || north) {
    const heightAt = (candidate: SnapCandidate) =>
      south
        ? candidate.value - raw.y
        : start.y + start.height - candidate.value;
    const anchor = south ? raw.y + raw.height : raw.y;
    const hit = findNearest(
      candidates.y.edges,
      anchor,
      tolerance,
      (candidate) => heightAt(candidate) >= MIN_SIZE,
    );
    if (hit !== null) {
      const height = heightAt(hit.candidate);
      frame = south
        ? { ...frame, height }
        : { ...frame, y: hit.candidate.value, height };
      guides.push(toGuide('y', hit.candidate));
    }
  }

  return { frame, guides };
}

const EMPTY_AXIS_CANDIDATES: SnapAxisCandidates = { edges: [], centers: [] };

interface DwellAxisState {
  key: string;
  since: number;
}

function guideKey(guide: SnapGuide): string {
  return `${guide.source}:${guide.elementId ?? ''}:${guide.position}`;
}

export function createSnapDwell(dwellMs = SNAP_DWELL_MS): SnapDwell {
  let xState: DwellAxisState | null = null;
  let yState: DwellAxisState | null = null;
  let deadline: number | null = null;

  const armAxis = (
    state: DwellAxisState | null,
    guide: SnapGuide | undefined,
    now: number,
  ): { state: DwellAxisState | null; armed: boolean } => {
    if (guide === undefined) {
      return { state: null, armed: false };
    }
    const key = guideKey(guide);
    if (state !== null && state.key === key) {
      return { state, armed: now - state.since >= dwellMs };
    }

    return { state: { key, since: now }, armed: dwellMs <= 0 };
  };

  const armAxes = (guides: Array<SnapGuide>, now: number) => {
    const x = armAxis(
      xState,
      guides.find((guide) => guide.axis === 'x'),
      now,
    );
    xState = x.state;
    const y = armAxis(
      yState,
      guides.find((guide) => guide.axis === 'y'),
      now,
    );
    yState = y.state;
    deadline = null;
    if (!x.armed && xState !== null) {
      deadline = xState.since + dwellMs;
    }
    if (!y.armed && yState !== null) {
      const yDeadline = yState.since + dwellMs;
      deadline = deadline === null ? yDeadline : Math.min(deadline, yDeadline);
    }

    return { x: x.armed, y: y.armed };
  };

  return {
    pendingDeadline() {
      return deadline;
    },
    recheckDelay() {
      return deadline === null ? null : Math.max(deadline - Date.now(), 0);
    },
    gateMove(candidates, moving, tolerance, now) {
      const result = resolveMoveSnap(candidates, moving, tolerance);
      const armed = armAxes(result.guides, now);
      const guides = result.guides.filter((guide) =>
        guide.axis === 'x' ? armed.x : armed.y,
      );
      if (guides.length === result.guides.length) {
        return result;
      }

      return {
        snapped: guides.length > 0,
        dx: armed.x ? result.dx : 0,
        dy: armed.y ? result.dy : 0,
        guides,
      };
    },
    gateResize(input, now) {
      const result = resolveResizeSnap(input);
      const armed = armAxes(result.guides, now);
      const vetoedX =
        !armed.x && result.guides.some((guide) => guide.axis === 'x');
      const vetoedY =
        !armed.y && result.guides.some((guide) => guide.axis === 'y');
      if (!vetoedX && !vetoedY) {
        return result;
      }

      return resolveResizeSnap({
        ...input,
        candidates: {
          x: vetoedX ? EMPTY_AXIS_CANDIDATES : input.candidates.x,
          y: vetoedY ? EMPTY_AXIS_CANDIDATES : input.candidates.y,
        },
      });
    },
  };
}
