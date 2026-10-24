import { normalizeRootElementIds } from './core/operations';
import type { Element, Frame, SlideDocument } from './core/schema';
import {
  getSelectionBounds,
  requiresProportionalResize,
  resizeRootElements,
} from './core/selectionGeometry';
import { MIN_SIZE, type Handle } from './geometry';
import {
  collectSnapCandidates,
  createSnapDwell,
  type SnapGuide,
} from './snapping';

export interface GestureModifiers {
  shiftKey: boolean;
  altKey: boolean;
}

export interface GestureOptions<Value> {
  startEvent: PointerEvent;
  selectionIds?: Array<string>;
  startValue: Value;
  valueAt: (
    dx: number,
    dy: number,
    modifiers: GestureModifiers,
    event: PointerEvent,
  ) => Value;
  valuesEqual: (left: Value, right: Value) => boolean;
  applyValue: (value: Value) => void;
  commitValue: (value: Value) => void;
  restore: () => void;
  onClick?: () => void;
  recheckDelay?: () => number | null;
}

export type TrackGesture = <Value>(options: GestureOptions<Value>) => void;

export interface MarqueePreview {
  bounds: Frame;
  ids: Array<string>;
}

function touchesBox(element: Element, box: Frame): boolean {
  const frame = element.frame;
  const angle = ((element.rotationDeg ?? 0) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = box.x + box.width / 2 - frame.x - frame.width / 2;
  const dy = box.y + box.height / 2 - frame.y - frame.height / 2;
  const c = Math.abs(cos);
  const s = Math.abs(sin);

  return (
    Math.abs(dx) <= (box.width + c * frame.width + s * frame.height) / 2 &&
    Math.abs(dy) <= (box.height + s * frame.width + c * frame.height) / 2 &&
    Math.abs(dx * cos + dy * sin) <=
      (frame.width + c * box.width + s * box.height) / 2 &&
    Math.abs(-dx * sin + dy * cos) <=
      (frame.height + s * box.width + c * box.height) / 2
  );
}

export function beginMarquee({
  event,
  document,
  selectedIds,
  stage,
  scale,
  track,
  preview,
  select,
}: {
  event: PointerEvent;
  document: SlideDocument;
  selectedIds: Array<string>;
  stage: HTMLElement;
  scale: number;
  track: TrackGesture;
  preview: (value: MarqueePreview | null) => void;
  select: (ids: Array<string>) => void;
}) {
  event.preventDefault();
  const rect = stage.getBoundingClientRect();
  const x = (event.clientX - rect.left) / (scale || 1);
  const y = (event.clientY - rect.top) / (scale || 1);
  const additive = event.shiftKey || event.metaKey || event.ctrlKey;
  track<MarqueePreview>({
    startEvent: event,
    selectionIds: selectedIds,
    startValue: { bounds: { x, y, width: 0, height: 0 }, ids: selectedIds },
    valueAt: (dx, dy) => {
      const endX = Math.min(document.size.width, Math.max(0, x + dx));
      const endY = Math.min(document.size.height, Math.max(0, y + dy));
      const bounds = {
        x: Math.min(x, endX),
        y: Math.min(y, endY),
        width: Math.abs(endX - x),
        height: Math.abs(endY - y),
      };
      const hits = document.elements
        .filter((element) => !element.hidden && touchesBox(element, bounds))
        .map((element) => element.id);

      return {
        bounds,
        ids: normalizeRootElementIds(
          document,
          additive ? [...selectedIds, ...hits] : hits,
        ),
      };
    },
    valuesEqual: () => false,
    applyValue: preview,
    commitValue: (value) => select(value.ids),
    restore: () => preview(null),
    onClick: () => select(additive ? selectedIds : []),
  });
}

function constrainedBounds(
  start: Frame,
  target: Frame,
  elements: Array<Element>,
  handle: Handle,
  proportional: boolean,
): Frame {
  const minX = Math.max(
    ...elements.map((element) => Math.min(1, MIN_SIZE / element.frame.width)),
  );
  const minY = Math.max(
    ...elements.map((element) => Math.min(1, MIN_SIZE / element.frame.height)),
  );
  let sx =
    handle.includes('e') || handle.includes('w')
      ? Math.max(minX, target.width / start.width)
      : 1;
  let sy =
    handle.includes('n') || handle.includes('s')
      ? Math.max(minY, target.height / start.height)
      : 1;
  if (proportional) {
    const requested = Math.abs(sx - 1) >= Math.abs(sy - 1) ? sx : sy;
    sx = sy = Math.max(requested, minX, minY);
  }
  const width = start.width * sx;
  const height = start.height * sy;

  return {
    x: start.x + (handle.includes('w') ? start.width - width : 0),
    y: start.y + (handle.includes('n') ? start.height - height : 0),
    width,
    height,
  };
}

export function beginSelectionResize({
  event,
  document,
  elements,
  selectedIds,
  handle,
  tolerance,
  track,
  preview,
  commit,
  guides,
}: {
  event: PointerEvent;
  document: SlideDocument;
  elements: Array<Element>;
  selectedIds: Array<string>;
  handle: Handle;
  tolerance: () => number;
  track: TrackGesture;
  preview: (document: SlideDocument | null) => void;
  commit: (
    document: SlideDocument,
    ids: Array<string>,
    baseDocument: SlideDocument,
  ) => void;
  guides: (guides: Array<SnapGuide>) => void;
}) {
  const start = getSelectionBounds(elements);
  if (
    !start ||
    start.width <= 0 ||
    start.height <= 0 ||
    elements.some((element) => element.locked || element.hidden)
  ) {
    return;
  }
  const ids = selectedIds;
  const rotated = requiresProportionalResize(elements);
  const candidates = collectSnapCandidates(document, ids);
  let dwell = createSnapDwell();
  const sameBounds = (a: Frame, b: Frame) =>
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
  track<{ frame: Frame; guides: Array<SnapGuide> }>({
    startEvent: event,
    selectionIds: ids,
    startValue: { frame: start, guides: [] },
    valueAt: (dx, dy, modifiers) => {
      const corner = handle.length === 2;
      const proportional = rotated || (modifiers.shiftKey && corner);
      const raw = {
        ...start,
        width:
          start.width +
          (handle.includes('e') ? dx : handle.includes('w') ? -dx : 0),
        height:
          start.height +
          (handle.includes('s') ? dy : handle.includes('n') ? -dy : 0),
      };
      if (modifiers.altKey || proportional) {
        dwell = createSnapDwell();

        return {
          frame: constrainedBounds(start, raw, elements, handle, proportional),
          guides: [],
        };
      }
      const snapped = dwell.gateResize(
        {
          start,
          handle,
          dx,
          dy,
          keepAspect: false,
          candidates,
          tolerance: tolerance(),
        },
        Date.now(),
      );
      const frame = constrainedBounds(
        start,
        snapped.frame,
        elements,
        handle,
        false,
      );

      return {
        frame,
        guides: sameBounds(frame, snapped.frame) ? snapped.guides : [],
      };
    },
    valuesEqual: (a, b) => sameBounds(a.frame, b.frame),
    applyValue: (value) => {
      preview(resizeRootElements(document, ids, value.frame));
      guides(value.guides);
    },
    commitValue: (value) => {
      const next = resizeRootElements(document, ids, value.frame);
      if (next !== document) {
        commit(next, ids, document);
      }
    },
    restore: () => preview(null),
    recheckDelay: () => dwell.recheckDelay(),
  });
}
