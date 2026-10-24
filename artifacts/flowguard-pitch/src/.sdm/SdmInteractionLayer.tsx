import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import {
  planRootPointerSelection,
  setElementFrame,
  translateRootElements,
  unionFrames,
  updateElement,
  visualBounds,
} from './core/operations';
import type { SdmContextMenuInvocation } from './core/protocol';
import type {
  Element as SdmElement,
  Frame,
  SlideDocument,
} from './core/schema';
import type { SdmTextCaretPoint } from './SdmTextEditor';
import {
  getSelectionBounds,
  requiresProportionalResize,
} from './core/selectionGeometry';
import {
  beginMarquee,
  beginSelectionResize,
  type GestureModifiers,
  type GestureOptions,
  type MarqueePreview,
} from './selectionGestures';
import {
  HANDLE_CURSORS,
  HANDLE_POS,
  HANDLES,
  elementTransform,
  resizeFrame,
  rotationTransform,
  type Handle,
} from './geometry';
import {
  collectSnapCandidates,
  createSnapDwell,
  type SnapGuide,
} from './snapping';
import {
  fittedFrame,
  isTrackingAtStart,
  measureTextContentHeight,
  resizeFloor,
  shouldAutofit,
  type TextContentMeasurer,
} from './textAutofit';

const DRAG_THRESHOLD_PX = 3;
const SNAP_TOLERANCE_SCREEN_PX = 6;
const TEXT_SELECTION_PADDING_SCREEN_PX = 8;
const SNAP_GUIDE_COLOR = '#EA4335';

// Text has no drawn edge, so its outline stands off the glyphs; anything with
// a visible edge (shapes, images, lines, tables) gets an outline on the frame.
function selectionPaddingScreenPx(
  elements: ReadonlyArray<SdmElement>,
): number {
  return elements.length > 0 &&
    elements.every((element) => element.type === 'text')
    ? TEXT_SELECTION_PADDING_SCREEN_PX
    : 0;
}

const SNAP_GUIDE_X_STYLE: CSSProperties = {
  position: 'absolute',
  top: 0,
  height: '100%',
  display: 'none',
  background: SNAP_GUIDE_COLOR,
  pointerEvents: 'none',
};

const SNAP_GUIDE_Y_STYLE: CSSProperties = {
  position: 'absolute',
  left: 0,
  width: '100%',
  display: 'none',
  background: SNAP_GUIDE_COLOR,
  pointerEvents: 'none',
};

interface DragGestureValue {
  frame: Frame;
  guides: Array<SnapGuide>;
}

interface Props {
  document: SlideDocument;
  previewDocument: SlideDocument | null;
  onPreview: (document: SlideDocument | null) => void;
  selectedIds: Array<string>;
  isGestureCurrent: (document: SlideDocument, ids: Array<string>) => boolean;
  scale: number;
  /**
   * Extra visual scale the embedding workspace applies to the iframe. Sizes
   * selection chrome only — pointer math stays in the iframe's own space.
   */
  viewportScale?: number;
  stageRef: RefObject<HTMLDivElement | null>;
  onSelect: (ids: Array<string>) => void;
  textCaretElementId: string | null;
  onActivateTextCaret: (
    elementId: string,
    point: SdmTextCaretPoint,
  ) => boolean;
  onExitTextCaret: () => SlideDocument | null;
  onPlaceTextCaret: (point: SdmTextCaretPoint) => boolean;
  onCommit: (
    document: SlideDocument,
    selectedIds: Array<string>,
    baseDocument: SlideDocument,
  ) => void;
  onHistory: (direction: 'undo' | 'redo') => void;
  onForwardKey: (event: KeyboardEvent) => boolean;
  onContextMenuRequest: (
    target: string | null,
    invocation: SdmContextMenuInvocation,
  ) => boolean;
  /** Overrides DOM measurement of text content height; tests inject this. */
  measureTextContent?: TextContentMeasurer;
  /**
   * Hands out the autofit handle for the caret element for as long as its
   * text is being drafted, and null once the drafting stops.
   */
  onTextAutofitHandle?: (handle: SdmTextAutofitHandle | null) => void;
}

export interface SdmTextAutofitHandle {
  elementId: string;
  /**
   * Fits the caret element to its text right now and returns the drafted
   * frame, or null when the document frame already fits.
   */
  fit: () => Frame | null;
}

const KEYBOARD_OWNER_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="textbox"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '[role="listbox"]',
  '[role="tree"]',
  '[role="treeitem"]',
  '[role="dialog"]',
  '[role="combobox"]',
].join(',');

const ENTER_OWNER_SELECTOR = [
  'button',
  'a[href]',
  '[role="button"]',
  '[role="link"]',
  'summary',
].join(',');

function topLevelIdAt(
  target: EventTarget | null,
  stage: HTMLElement,
): string | null {
  if (!(target instanceof Element)) {
    return null;
  }
  let found: string | null = null;
  let node: Element | null = target.closest('[data-sdm-id]');
  while (node !== null && stage.contains(node)) {
    const id = node.getAttribute('data-sdm-id');
    if (id !== null) {
      found = id;
    }
    node = node.parentElement?.closest('[data-sdm-id]') ?? null;
  }

  return found;
}

function isKeyOwnedByTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest(KEYBOARD_OWNER_SELECTOR) !== null
  );
}

function isEnterOwnedByTarget(event: KeyboardEvent): boolean {
  return (
    event.key === 'Enter' &&
    event.target instanceof Element &&
    event.target.closest(ENTER_OWNER_SELECTOR) !== null
  );
}

function hasNoModifiers(event: KeyboardEvent): boolean {
  return !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

function isNudgeKey(event: KeyboardEvent): boolean {
  return (
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    (event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown')
  );
}

function shouldSuppressForwardedDefault(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  const isPlainDelete =
    (event.key === 'Delete' || event.key === 'Backspace') &&
    hasNoModifiers(event);
  const isSelectAll =
    key === 'a' &&
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey;
  const hasPrimaryModifier = event.ctrlKey || event.metaKey;
  const isDuplicate =
    key === 'd' && hasPrimaryModifier && !event.altKey && !event.shiftKey;
  const isClipboard =
    (key === 'c' || key === 'v' || key === 'x') &&
    hasPrimaryModifier &&
    !event.altKey &&
    !event.shiftKey;
  const isArrange =
    hasPrimaryModifier &&
    !event.altKey &&
    (event.code === 'BracketRight' ||
      event.key === ']' ||
      event.key === '}' ||
      event.code === 'BracketLeft' ||
      event.key === '[' ||
      event.key === '{');
  const isMac = window.navigator.userAgent.includes('Macintosh');
  const hasPlatformPrimaryModifier = isMac
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey && !event.getModifierState('AltGraph');
  const isArrowArrange =
    hasPlatformPrimaryModifier &&
    !event.altKey &&
    (event.key === 'ArrowUp' || event.key === 'ArrowDown');
  const isGroup =
    hasPlatformPrimaryModifier &&
    event.altKey &&
    (key === 'g' || event.code === 'KeyG');

  return (
    isPlainDelete ||
    isNudgeKey(event) ||
    isSelectAll ||
    isDuplicate ||
    isClipboard ||
    isArrange ||
    isArrowArrange ||
    isGroup
  );
}

function isOverlayChrome(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('[data-sdm-handle], [data-sdm-rotate-handle]') !== null
  );
}

function isTextCaretTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('[data-sdm-text-caret-active="true"]') !== null
  );
}

function isRenderedTextTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('[data-sdm-text-run], [data-sdm-text-marker]') !== null
  );
}

function isEditableTextElement(element: SdmElement): boolean {
  return (
    element.type === 'text' ||
    (element.type === 'shape' && element.body !== undefined)
  );
}

function sameFrame(left: Frame, right: Frame): boolean {
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.width === right.width &&
    left.height === right.height
  );
}

interface DraftNodes {
  stage: HTMLElement | null;
  outline: HTMLElement | null;
}

function queryDraftNodes(
  stageRoot: HTMLElement | null,
  overlayRoot: HTMLElement | null,
  elementId: string,
): DraftNodes {
  const stage = stageRoot?.querySelector(
    `[data-sdm-id="${CSS.escape(elementId)}"]`,
  );
  const outline = overlayRoot?.querySelector(
    `[data-sdm-selection-id="${CSS.escape(elementId)}"]`,
  );

  return {
    stage: stage instanceof HTMLElement ? stage : null,
    outline: outline instanceof HTMLElement ? outline : null,
  };
}

function applyDraft(nodes: DraftNodes, frame: Frame) {
  for (const node of [nodes.stage, nodes.outline]) {
    if (node === null) {
      continue;
    }
    node.style.left = `${frame.x}px`;
    node.style.top = `${frame.y}px`;
    node.style.width = `${frame.width}px`;
    node.style.height = `${frame.height}px`;
  }
}

interface DraftTarget {
  elementId: string;
  kind: 'stage' | 'outline';
  node: HTMLElement;
  base: string;
}

function baseTransformFor(
  kind: DraftTarget['kind'],
  element: SdmElement,
): string {
  return kind === 'stage'
    ? (elementTransform(element) ?? '')
    : (rotationTransform(element.rotationDeg) ?? '');
}

function normalizeRotation(rotationDeg: number): number {
  return ((rotationDeg % 360) + 360) % 360;
}

function useLatest<Value>(value: Value) {
  const ref = useRef(value);
  ref.current = value;

  return ref;
}

export function SdmInteractionLayer(props: Props) {
  const {
    document,
    previewDocument,
    selectedIds,
    isGestureCurrent,
    scale,
    viewportScale = 1,
    stageRef,
  } = props;
  const latest = useLatest(props);
  const documentRef = useRef(document);
  documentRef.current = document;
  const lastDocumentRef = useRef(document);
  const textAutofitRef = useRef<SdmTextAutofitHandle | null>(null);
  const [marquee, setMarquee] = useState<MarqueePreview | null>(null);
  const isGestureCurrentRef = useRef(isGestureCurrent);
  isGestureCurrentRef.current = isGestureCurrent;
  const overlayRef = useRef<HTMLDivElement>(null);
  const snapGuideXRef = useRef<HTMLDivElement>(null);
  const snapGuideYRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<{
    captureTarget: HTMLElement;
    controller: AbortController;
    pointerId: number;
    selectionIds?: Array<string>;
    restore: () => void;
  } | null>(null);

  const nodesFor = (elementId: string) =>
    queryDraftNodes(stageRef.current, overlayRef.current, elementId);

  const resolveDraftTargets = (
    dragElements: Array<SdmElement>,
  ): Array<DraftTarget> => {
    const targets: Array<DraftTarget> = [];
    for (const dragElement of dragElements) {
      const { stage, outline } = nodesFor(dragElement.id);
      if (stage !== null) {
        targets.push({
          elementId: dragElement.id,
          kind: 'stage',
          node: stage,
          base: baseTransformFor('stage', dragElement),
        });
      }
      if (outline !== null) {
        targets.push({
          elementId: dragElement.id,
          kind: 'outline',
          node: outline,
          base: baseTransformFor('outline', dragElement),
        });
      }
    }

    return targets;
  };

  const applyRotationDraft = (
    element: SdmElement,
    rotationDeg: number | undefined,
  ) => {
    const { stage, outline } = nodesFor(element.id);
    if (stage !== null) {
      stage.style.transform = elementTransform(element, rotationDeg) ?? '';
    }
    if (outline !== null) {
      outline.style.transform = rotationTransform(rotationDeg) ?? '';
    }
  };

  const exitCaretAndAdopt = () => {
    const committedDocument = latest.current.onExitTextCaret();
    if (committedDocument !== null) {
      documentRef.current = committedDocument;
      lastDocumentRef.current = committedDocument;
    }
  };

  const currentElement = (renderedElement: SdmElement): SdmElement =>
    documentRef.current.elements.find(
      (candidate) => candidate.id === renderedElement.id,
    ) ?? renderedElement;

  // A drag keeps the caret, so the caret element moves (and snaps) from the
  // frame its text has drafted rather than the one the document last saved.
  const draftedTextFrame = (ids: Array<string>) => {
    const autofit = textAutofitRef.current;
    if (autofit === null || !ids.includes(autofit.elementId)) {
      return null;
    }
    const fitted = autofit.fit();

    return fitted === null ? null : { id: autofit.elementId, frame: fitted };
  };
  const withTextDraft = (
    document: SlideDocument,
    draft: { id: string; frame: Frame } | null,
  ): SlideDocument =>
    draft === null
      ? document
      : updateElement(document, draft.id, (element) => ({
          ...element,
          frame: draft.frame,
        }));

  const applySnapGuide = (
    node: HTMLDivElement | null,
    guide: SnapGuide | undefined,
    thickness: number,
  ) => {
    if (node === null) {
      return;
    }
    if (guide === undefined) {
      node.style.display = 'none';

      return;
    }
    const offset = `${guide.position - thickness / 2}px`;
    if (guide.axis === 'x') {
      node.style.left = offset;
      node.style.width = `${thickness}px`;
    } else {
      node.style.top = offset;
      node.style.height = `${thickness}px`;
    }
    node.style.display = 'block';
  };

  const snapTolerance = () =>
    SNAP_TOLERANCE_SCREEN_PX /
    ((latest.current.scale || 1) * (latest.current.viewportScale || 1));

  const applySnapGuides = (guides: Array<SnapGuide>) => {
    const visualScale =
      (latest.current.scale || 1) * (latest.current.viewportScale || 1);
    const thickness = 1 / visualScale;
    applySnapGuide(
      snapGuideXRef.current,
      guides.find((guide) => guide.axis === 'x'),
      thickness,
    );
    applySnapGuide(
      snapGuideYRef.current,
      guides.find((guide) => guide.axis === 'y'),
      thickness,
    );
  };

  const endGesture = () => {
    const gesture = gestureRef.current;
    if (gesture === null) {
      return;
    }
    gestureRef.current = null;
    gesture.restore();
    applySnapGuides([]);
    gesture.controller.abort();
    try {
      gesture.captureTarget.releasePointerCapture(gesture.pointerId);
    } catch {}
  };

  const trackGesture = <Value,>({
    startEvent,
    selectionIds,
    startValue,
    valueAt,
    valuesEqual,
    applyValue,
    commitValue,
    restore,
    onClick,
    recheckDelay,
  }: GestureOptions<Value>) => {
    endGesture();
    const captureTarget = stageRef.current;
    if (captureTarget === null) {
      return;
    }
    const controller = new AbortController();
    const baseDocument = documentRef.current;
    gestureRef.current = {
      captureTarget,
      controller,
      pointerId: startEvent.pointerId,
      selectionIds,
      restore,
    };
    let moved = false;
    let lastValue = startValue;
    let lastMoveEvent: PointerEvent | null = null;
    let modifiers: GestureModifiers = {
      shiftKey: startEvent.shiftKey,
      altKey: startEvent.altKey,
    };
    let recheckTimer: ReturnType<typeof setTimeout> | null = null;

    const clearRecheck = () => {
      if (recheckTimer !== null) {
        clearTimeout(recheckTimer);
        recheckTimer = null;
      }
    };
    controller.signal.addEventListener('abort', clearRecheck);

    const evaluate = (event: PointerEvent) => {
      lastMoveEvent = event;
      const stageScale = latest.current.scale || 1;
      lastValue = valueAt(
        (event.clientX - startEvent.clientX) / stageScale,
        (event.clientY - startEvent.clientY) / stageScale,
        modifiers,
        event,
      );
      applyValue(lastValue);
      clearRecheck();
      const delay = recheckDelay?.();
      if (delay !== null && delay !== undefined) {
        recheckTimer = setTimeout(() => evaluate(event), delay + 1);
      }
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== startEvent.pointerId) {
        return;
      }
      const dxClient = event.clientX - startEvent.clientX;
      const dyClient = event.clientY - startEvent.clientY;
      if (!moved && Math.hypot(dxClient, dyClient) < DRAG_THRESHOLD_PX) {
        return;
      }
      moved = true;
      modifiers = { shiftKey: event.shiftKey, altKey: event.altKey };
      evaluate(event);
    };

    const onModifier = (event: KeyboardEvent) => {
      if (
        event.shiftKey === modifiers.shiftKey &&
        event.altKey === modifiers.altKey
      ) {
        return;
      }
      modifiers = { shiftKey: event.shiftKey, altKey: event.altKey };
      if (moved && lastMoveEvent !== null) {
        evaluate(lastMoveEvent);
      }
    };

    const finish = (event: PointerEvent) => {
      if (event.pointerId !== startEvent.pointerId) {
        return;
      }
      if (
        selectionIds !== undefined &&
        !isGestureCurrentRef.current(baseDocument, selectionIds)
      ) {
        endGesture();

        return;
      }
      const shouldCommit = moved && !valuesEqual(lastValue, startValue);
      endGesture();
      if (!shouldCommit) {
        if (!moved) {
          onClick?.();
        }

        return;
      }
      commitValue(lastValue);
    };

    const cancel = (event: PointerEvent) => {
      if (event.pointerId !== startEvent.pointerId) {
        return;
      }
      endGesture();
    };

    window.addEventListener('pointermove', onMove, {
      signal: controller.signal,
    });
    window.addEventListener('pointerup', finish, { signal: controller.signal });
    window.addEventListener('pointercancel', cancel, {
      signal: controller.signal,
    });
    window.addEventListener('keydown', onModifier, {
      signal: controller.signal,
    });
    window.addEventListener('keyup', onModifier, {
      signal: controller.signal,
    });
    captureTarget.addEventListener('lostpointercapture', cancel, {
      signal: controller.signal,
    });
    try {
      captureTarget.setPointerCapture(startEvent.pointerId);
    } catch {}
  };

  const beginDrag = (
    event: PointerEvent,
    element: SdmElement,
    elementIds: Array<string>,
    collapseTo?: string,
    onClick?: () => void,
  ) => {
    const textDraft = draftedTextFrame(elementIds);
    const startDocument = withTextDraft(documentRef.current, textDraft);
    const dragElements = startDocument.elements.filter((candidate) =>
      elementIds.includes(candidate.id),
    );
    const dragBlocked = dragElements.some((dragElement) => dragElement.locked);
    const snapCandidates = dragBlocked
      ? null
      : collectSnapCandidates(startDocument, elementIds);
    const snapDwell = createSnapDwell();
    let snapGated = false;
    let draftTargets: Array<DraftTarget> | null = null;
    const startBounds = dragElements.reduce<Frame | null>(
      (bounds, dragElement) =>
        bounds === null
          ? visualBounds(dragElement)
          : unionFrames(bounds, visualBounds(dragElement)),
      null,
    );
    trackGesture<DragGestureValue>({
      startEvent: event,
      startValue: { frame: element.frame, guides: [] },
      valueAt: (dx, dy, gestureModifiers) => {
        snapGated = false;
        if (dragBlocked) {
          return { frame: element.frame, guides: [] };
        }
        let snapDx = 0;
        let snapDy = 0;
        let guides: Array<SnapGuide> = [];
        if (
          !gestureModifiers.altKey &&
          snapCandidates !== null &&
          startBounds !== null
        ) {
          const snap = snapDwell.gateMove(
            snapCandidates,
            {
              x: startBounds.x + dx,
              y: startBounds.y + dy,
              width: startBounds.width,
              height: startBounds.height,
            },
            snapTolerance(),
            Date.now(),
          );
          snapGated = true;
          snapDx = snap.dx;
          snapDy = snap.dy;
          guides = snap.guides;
        }
        const logicalDx = Math.round(dx + snapDx);
        const logicalDy = Math.round(dy + snapDy);

        return {
          frame: {
            ...element.frame,
            x: element.frame.x + logicalDx,
            y: element.frame.y + logicalDy,
          },
          guides,
        };
      },
      valuesEqual: (left, right) => sameFrame(left.frame, right.frame),
      applyValue: (value) => {
        if (dragBlocked) {
          return;
        }
        if (draftTargets === null) {
          draftTargets = resolveDraftTargets(dragElements);
          for (const target of draftTargets) {
            target.node.style.willChange = 'transform';
          }
        }
        const dx = value.frame.x - element.frame.x;
        const dy = value.frame.y - element.frame.y;
        const offset =
          dx === 0 && dy === 0 ? '' : `translate(${dx}px, ${dy}px) `;
        for (const target of draftTargets) {
          target.node.style.transform = `${offset}${target.base}`;
        }
        const boundsNode = overlayRef.current?.querySelector(
          '[data-sdm-selection-bounds]',
        );
        if (boundsNode instanceof HTMLElement) {
          boundsNode.style.transform = offset;
        }
        applySnapGuides(value.guides);
      },
      commitValue: (value) => {
        if (dragBlocked) {
          return;
        }
        const currentDocument = documentRef.current;
        // Measure again: a font settling mid-drag re-fits the box after the
        // drag started.
        const nextDocument = translateRootElements(
          withTextDraft(currentDocument, draftedTextFrame(elementIds)),
          elementIds,
          value.frame.x - element.frame.x,
          value.frame.y - element.frame.y,
        );
        if (nextDocument !== currentDocument) {
          latest.current.onCommit(nextDocument, elementIds, currentDocument);
        }
      },
      restore: () => {
        const boundsNode = overlayRef.current?.querySelector(
          '[data-sdm-selection-bounds]',
        );
        if (boundsNode instanceof HTMLElement) {
          boundsNode.style.transform = '';
        }
        if (draftTargets === null) {
          return;
        }
        for (const target of draftTargets) {
          const currentElement = documentRef.current.elements.find(
            (candidate) => candidate.id === target.elementId,
          );
          target.node.style.transform =
            currentElement === undefined
              ? target.base
              : baseTransformFor(target.kind, currentElement);
          target.node.style.willChange = '';
        }
      },
      onClick:
        collapseTo === undefined
          ? onClick
          : () => latest.current.onSelect([collapseTo]),
      recheckDelay: () => (snapGated ? snapDwell.recheckDelay() : null),
    });
  };

  const beginResize = (
    event: ReactPointerEvent<HTMLDivElement>,
    renderedElement: SdmElement,
    handle: Handle,
  ) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (latest.current.textCaretElementId !== null) {
      exitCaretAndAdopt();
    }
    // Exiting the caret can commit a fitted frame the rendered element predates.
    const element = currentElement(renderedElement);
    const anchor = handle.includes('n') ? 'bottom' : 'top';
    const measure =
      latest.current.measureTextContent ?? measureTextContentHeight;
    // A frame sized to its text keeps following it as the width changes
    // (shrinking back down when widened); a frame with slack only grows past
    // its height and returns to it.
    const tracking = isTrackingAtStart(
      element,
      nodesFor(element.id).stage,
      measure,
    );
    const fitDraft = (frame: Frame): Frame | null =>
      fittedFrame(element, frame, nodesFor(element.id).stage, measure, {
        anchor,
        floor: resizeFloor({
          startHeight: element.frame.height,
          requestedHeight: frame.height,
          tracking,
        }),
      });
    const snapCandidates =
      (element.rotationDeg ?? 0) % 360 === 0
        ? collectSnapCandidates(documentRef.current, [element.id])
        : null;
    const snapDwell = createSnapDwell();
    let snapGated = false;
    trackGesture<DragGestureValue>({
      startEvent: event.nativeEvent,
      startValue: { frame: element.frame, guides: [] },
      valueAt: (dx, dy, gestureModifiers) => {
        snapGated = false;
        if (snapCandidates === null || gestureModifiers.altKey) {
          return {
            frame: resizeFrame(
              element.frame,
              handle,
              dx,
              dy,
              gestureModifiers.shiftKey,
              element.rotationDeg,
            ),
            guides: [],
          };
        }
        const value = snapDwell.gateResize(
          {
            start: element.frame,
            handle,
            dx,
            dy,
            keepAspect: gestureModifiers.shiftKey,
            candidates: snapCandidates,
            tolerance: snapTolerance(),
          },
          Date.now(),
        );
        snapGated = true;

        return value;
      },
      valuesEqual: (left, right) => sameFrame(left.frame, right.frame),
      applyValue: (value) => {
        // Text reflows at the draft width, so measure after applying it.
        applyDraft(nodesFor(element.id), value.frame);
        const fitted = fitDraft(value.frame);
        if (fitted !== null) {
          applyDraft(nodesFor(element.id), fitted);
        }
        applySnapGuides(fitted === null ? value.guides : []);
      },
      commitValue: (value) => {
        // The gesture has restored the stage node; redraw the draft to
        // measure at its width what the text needs now, not at the last move.
        const nodes = nodesFor(element.id);
        applyDraft(nodes, value.frame);
        const fitted = fitDraft(value.frame);
        applyDraft(nodes, currentElement(element).frame);
        const frame = fitted ?? value.frame;
        // The clamp can hand back the frame the box already has.
        if (sameFrame(frame, currentElement(element).frame)) {
          return;
        }
        const currentDocument = documentRef.current;
        latest.current.onCommit(
          setElementFrame(currentDocument, element.id, frame),
          [element.id],
          currentDocument,
        );
      },
      restore: () => {
        const currentElement = documentRef.current.elements.find(
          (candidate) => candidate.id === element.id,
        );
        if (currentElement !== undefined) {
          applyDraft(nodesFor(element.id), currentElement.frame);
        }
      },
      recheckDelay: () => (snapGated ? snapDwell.recheckDelay() : null),
    });
  };

  const beginRotation = (
    event: ReactPointerEvent<HTMLDivElement>,
    renderedElement: SdmElement,
  ) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (latest.current.textCaretElementId !== null) {
      exitCaretAndAdopt();
    }
    const element = currentElement(renderedElement);
    const stage = stageRef.current;
    if (stage === null) {
      return;
    }
    const stageRect = stage.getBoundingClientRect();
    const stageScale = latest.current.scale || 1;
    const centerX =
      stageRect.left +
      (element.frame.x + element.frame.width / 2) * stageScale;
    const centerY =
      stageRect.top +
      (element.frame.y + element.frame.height / 2) * stageScale;
    const angleAt = (pointerEvent: PointerEvent) =>
      normalizeRotation(
        (Math.atan2(
          pointerEvent.clientY - centerY,
          pointerEvent.clientX - centerX,
        ) *
          180) /
          Math.PI +
          90,
      );
    const startRotation = normalizeRotation(element.rotationDeg ?? 0);
    const startPointerAngle = angleAt(event.nativeEvent);
    trackGesture({
      startEvent: event.nativeEvent,
      startValue: startRotation,
      valueAt: (_dx, _dy, gestureModifiers, pointerEvent) => {
        const pointerDelta =
          ((angleAt(pointerEvent) - startPointerAngle + 540) % 360) - 180;
        const rotation = normalizeRotation(startRotation + pointerDelta);
        const increment = gestureModifiers.shiftKey ? 15 : 1;

        return normalizeRotation(Math.round(rotation / increment) * increment);
      },
      valuesEqual: (left, right) => left === right,
      applyValue: (rotationDeg) =>
        applyRotationDraft(element, rotationDeg),
      commitValue: (rotationDeg) => {
        const currentDocument = documentRef.current;
        const nextDocument = updateElement(
          currentDocument,
          element.id,
          (currentElement) => ({ ...currentElement, rotationDeg }),
        );
        if (nextDocument !== currentDocument) {
          latest.current.onCommit(nextDocument, [element.id], currentDocument);
        }
      },
      restore: () => {
        const currentElement = documentRef.current.elements.find(
          (candidate) => candidate.id === element.id,
        );
        if (currentElement !== undefined) {
          applyRotationDraft(currentElement, currentElement.rotationDeg);
        }
      },
    });
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      window.focus();
      if (isOverlayChrome(event.target)) {
        return;
      }
      const id = topLevelIdAt(event.target, stage);
      const activeCaretId = latest.current.textCaretElementId;
      if (activeCaretId !== null) {
        if (isTextCaretTarget(event.target)) {
          return;
        }
        if (id !== activeCaretId) {
          exitCaretAndAdopt();
        }
      }
      const currentIds = latest.current.selectedIds;
      const hasSelectionModifier =
        event.ctrlKey || event.metaKey || event.shiftKey;
      const selectionPlan = planRootPointerSelection(
        documentRef.current,
        currentIds,
        id,
        hasSelectionModifier,
      );
      if (id === null) {
        beginMarquee({
          event,
          document: documentRef.current,
          selectedIds: currentIds,
          stage,
          scale: latest.current.scale,
          track: trackGesture,
          preview: setMarquee,
          select: (ids) => latest.current.onSelect(ids),
        });

        return;
      }
      const element = documentRef.current.elements.find(
        (candidate) => candidate.id === id,
      );
      if (element === undefined) {
        return;
      }
      event.preventDefault();
      const selectionChanged =
        currentIds.length !== selectionPlan.selectedIds.length ||
        currentIds.some(
          (selectedId, index) =>
            selectedId !== selectionPlan.selectedIds[index],
        );
      if (selectionChanged) {
        latest.current.onSelect(selectionPlan.selectedIds);
      }
      if (!selectionPlan.selectedIds.includes(id)) {
        return;
      }
      const activateTextCaret =
        !hasSelectionModifier &&
        !element.locked &&
        isEditableTextElement(element) &&
        selectionPlan.selectedIds.length === 1 &&
        selectionPlan.selectedIds[0] === id &&
        ((currentIds.length === 1 && currentIds[0] === id) ||
          isRenderedTextTarget(event.target))
          ? () => {
              const point = {
                clientX: event.clientX,
                clientY: event.clientY,
              };
              if (id === activeCaretId) {
                latest.current.onPlaceTextCaret(point);
              } else {
                latest.current.onActivateTextCaret(id, point);
              }
            }
          : undefined;
      beginDrag(
        event,
        element,
        selectionPlan.selectedIds,
        selectionPlan.collapseTo,
        selectionPlan.collapseTo === undefined
          ? activateTextCaret
          : undefined,
      );
    };

    const suppressActions = (event: MouseEvent) => {
      if (event.button !== 0 || isTextCaretTarget(event.target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    const onDoubleClick = (event: MouseEvent) => {
      if (isTextCaretTarget(event.target)) {
        return;
      }
      const id = topLevelIdAt(event.target, stage);
      if (id === null) {
        return;
      }
      const element = documentRef.current.elements.find(
        (candidate) => candidate.id === id,
      );
      if (
        element === undefined ||
        !isEditableTextElement(element) ||
        element.locked
      ) {
        return;
      }
      latest.current.onActivateTextCaret(id, {
        clientX: event.clientX,
        clientY: event.clientY,
      });
    };

    // Keyboard invocations (Shift+F10, Menu key) fire at the focused element
    // outside the stage, so this listens window-wide. Browsers synthesize
    // them without a button and at unreliable coordinates (Chrome uses the
    // focused element's center), so the secondary button is the pointer
    // signal — not the position.
    const onContextMenu = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        latest.current.textCaretElementId !== null ||
        gestureRef.current !== null
      ) {
        return;
      }
      if (event.button !== 2) {
        if (isKeyOwnedByTarget(event.target)) {
          return;
        }
        if (latest.current.onContextMenuRequest(null, { kind: 'keyboard' })) {
          event.preventDefault();
        }

        return;
      }
      const size = documentRef.current.size;
      const stageRect = stage.getBoundingClientRect();
      const stageScale = latest.current.scale || 1;
      const point = {
        x: Math.min(
          Math.max((event.clientX - stageRect.left) / stageScale, 0),
          size.width,
        ),
        y: Math.min(
          Math.max((event.clientY - stageRect.top) / stageScale, 0),
          size.height,
        ),
      };
      const target = isOverlayChrome(event.target)
        ? (latest.current.selectedIds[0] ?? null)
        : topLevelIdAt(event.target, stage);
      if (
        latest.current.onContextMenuRequest(target, { kind: 'pointer', point })
      ) {
        event.preventDefault();
      }
    };

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('click', suppressActions, true);
    stage.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('contextmenu', onContextMenu);

    return () => {
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('click', suppressActions, true);
      stage.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('contextmenu', onContextMenu);
    };
  }, [stageRef]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        (event.ctrlKey && event.getModifierState('AltGraph')) ||
        latest.current.textCaretElementId !== null ||
        isEnterOwnedByTarget(event) ||
        isKeyOwnedByTarget(event.target)
      ) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && !event.altKey) {
        const key = event.key.toLowerCase();
        if (key === 'z') {
          event.preventDefault();
          endGesture();
          latest.current.onHistory(event.shiftKey ? 'redo' : 'undo');

          return;
        }
        if (key === 'y') {
          event.preventDefault();
          endGesture();
          latest.current.onHistory('redo');

          return;
        }
      }
      if (event.key === 'Escape') {
        if (gestureRef.current !== null) {
          event.preventDefault();
          endGesture();

          return;
        }
        if (latest.current.selectedIds.length > 0) {
          latest.current.onSelect([]);
        }

        return;
      }
      if (gestureRef.current !== null) {
        if (shouldSuppressForwardedDefault(event)) {
          event.preventDefault();
        }

        return;
      }
      if (latest.current.selectedIds.length === 0 && isNudgeKey(event)) {
        return;
      }
      if (
        latest.current.onForwardKey(event) &&
        shouldSuppressForwardedDefault(event)
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const elementId = props.textCaretElementId;
    if (elementId === null || typeof ResizeObserver === 'undefined') {
      return;
    }
    const findElement = () =>
      documentRef.current.elements.find(
        (candidate) => candidate.id === elementId,
      );
    const findNodes = () =>
      queryDraftNodes(stageRef.current, overlayRef.current, elementId);
    const element = findElement();
    const nodes = findNodes();
    const content = nodes.stage?.querySelector('[data-sdm-text-content]');
    if (
      element === undefined ||
      !shouldAutofit(element) ||
      nodes.stage === null ||
      !(content instanceof HTMLElement)
    ) {
      return;
    }
    const measure =
      latest.current.measureTextContent ?? measureTextContentHeight;
    // A frame sized to its text keeps following it while typing; a frame
    // with slack only grows past its authored height and returns to it.
    const floor = isTrackingAtStart(element, nodes.stage, measure)
      ? 0
      : element.frame.height;
    const fit = () => {
      const current = findElement();
      if (current === undefined) {
        return null;
      }
      const currentNodes = findNodes();
      const fitted = fittedFrame(
        current,
        current.frame,
        currentNodes.stage,
        measure,
        { floor },
      );
      applyDraft(currentNodes, fitted ?? current.frame);

      return fitted;
    };
    const observer = new ResizeObserver(() => {
      fit();
    });
    observer.observe(content);
    const handle = { elementId, fit };
    textAutofitRef.current = handle;
    latest.current.onTextAutofitHandle?.(handle);

    return () => {
      observer.disconnect();
      textAutofitRef.current = null;
      latest.current.onTextAutofitHandle?.(null);
      // React leaves an unchanged inline height alone, so drop the draft.
      const current = findElement();
      if (current !== undefined) {
        applyDraft(findNodes(), current.frame);
      }
    };
  }, [latest, props.textCaretElementId, stageRef]);

  useEffect(() => () => endGesture(), []);

  useEffect(() => {
    const gestureSelection = gestureRef.current?.selectionIds;
    if (
      gestureSelection !== undefined &&
      (gestureSelection.length !== selectedIds.length ||
        gestureSelection.some((id) => !selectedIds.includes(id)))
    ) {
      endGesture();
    }
    if (lastDocumentRef.current === document) {
      return;
    }
    lastDocumentRef.current = document;
    endGesture();
  });

  const selectedElements = (previewDocument ?? document).elements.filter(
    (element) => (marquee?.ids ?? selectedIds).includes(element.id),
  );
  const multipleBounds =
    selectedElements.length > 1 ? getSelectionBounds(selectedElements) : null;
  const multipleResizable =
    multipleBounds !== null &&
    !selectedElements.some((element) => element.locked || element.hidden);
  const proportionalOnly = requiresProportionalResize(selectedElements);
  const resizeTarget =
    selectedElements.length === 1 &&
    selectedElements[0] !== undefined &&
    !selectedElements[0].locked &&
    selectedElements[0].type !== 'group' &&
    selectedElements[0].type !== 'line'
      ? selectedElements[0]
      : null;
  const visualScale = (scale || 1) * viewportScale;
  const selectionChromeScale = Math.min(Math.max(visualScale, 1), 1.5);
  const outlineWidth = Math.max(1.5 / visualScale, 1);
  const handleSize = (8 * selectionChromeScale) / visualScale;
  const rotationHandleSize = (12 * selectionChromeScale) / visualScale;
  const rotationHandleOffset = (16 * selectionChromeScale) / visualScale;
  const rotationIconSize = (7 * selectionChromeScale) / visualScale;
  const selectionChromeStyle: CSSProperties = {
    position: 'absolute',
    inset: -selectionPaddingScreenPx(selectedElements) / visualScale,
    border: `${outlineWidth}px solid #2563eb`,
    boxSizing: 'border-box',
    pointerEvents: 'none',
  };

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1000000,
      }}
    >
      {selectedElements.map((element) => (
        <div
          key={element.id}
          data-sdm-selection-id={element.id}
          style={{
            position: 'absolute',
            left: element.frame.x,
            top: element.frame.y,
            width: element.frame.width,
            height: element.frame.height,
            transform: rotationTransform(element.rotationDeg),
            transformOrigin: 'center center',
            pointerEvents: 'none',
          }}
        >
          <div data-sdm-selection-chrome="" style={selectionChromeStyle}>
            {resizeTarget === element && marquee === null ? (
              <>
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: -rotationHandleOffset,
                    width: outlineWidth,
                    height: rotationHandleOffset,
                    marginLeft: -outlineWidth / 2,
                    background: '#2563eb',
                  }}
                />
                <div
                  data-sdm-rotate-handle=""
                  onPointerDown={(handleEvent) =>
                    beginRotation(handleEvent, element)
                  }
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: -rotationHandleOffset,
                    width: rotationHandleSize,
                    height: rotationHandleSize,
                    marginLeft: -rotationHandleSize / 2,
                    marginTop: -rotationHandleSize / 2,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#2563eb',
                    background: '#ffffff',
                    border: `${outlineWidth}px solid #2563eb`,
                    borderRadius: '50%',
                    boxSizing: 'border-box',
                    cursor: 'grab',
                    pointerEvents: 'auto',
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={rotationIconSize}
                    height={rotationIconSize}
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M21 2.25a.75.75 0 0 1 .75.75v5a.754.754 0 0 1-.058.286c-.012.03-.028.056-.044.083a.742.742 0 0 1-.118.161.755.755 0 0 1-.244.162c-.032.014-.065.022-.099.03-.013.004-.025.01-.039.012l-.016.003A.75.75 0 0 1 21 8.75h-5a.75.75 0 0 1 0-1.5h3.19l-.98-.98a9.01 9.01 0 0 0-5.777-2.51L12 3.75A8.25 8.25 0 1 0 20.25 12a.75.75 0 0 1 .75-.75l.076.004a.75.75 0 0 1 .674.746 9.751 9.751 0 0 1-16.645 6.895A9.75 9.75 0 0 1 12 2.25l.508.013a10.509 10.509 0 0 1 6.752 2.936l.99.99V3a.75.75 0 0 1 .75-.75Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                {HANDLES.map((handle) => (
                  <div
                    key={handle}
                    data-sdm-handle={handle}
                    onPointerDown={(handleEvent) =>
                      beginResize(handleEvent, element, handle)
                    }
                    style={{
                      position: 'absolute',
                      left: HANDLE_POS[handle].left,
                      top: HANDLE_POS[handle].top,
                      width: handleSize,
                      height: handleSize,
                      marginLeft: -handleSize / 2,
                      marginTop: -handleSize / 2,
                      background: '#ffffff',
                      border: `${outlineWidth}px solid #2563eb`,
                      borderRadius: (2 * selectionChromeScale) / visualScale,
                      cursor: HANDLE_CURSORS[handle],
                      pointerEvents: 'auto',
                    }}
                  />
                ))}
              </>
            ) : null}
          </div>
        </div>
      ))}
      {multipleBounds !== null && marquee === null ? (
        <div
          data-sdm-selection-bounds=""
          style={{
            position: 'absolute',
            left: multipleBounds.x,
            top: multipleBounds.y,
            width: multipleBounds.width,
            height: multipleBounds.height,
          }}
        >
          <div data-sdm-selection-chrome="" style={selectionChromeStyle}>
            {multipleResizable
              ? HANDLES.filter(
                  (handle) => !proportionalOnly || handle.length === 2,
                ).map((handle) => (
                  <div
                    key={handle}
                    data-sdm-handle={handle}
                    onPointerDown={(event) => {
                      if (event.button !== 0) {
                        return;
                      }
                      event.preventDefault();
                      event.stopPropagation();
                      beginSelectionResize({
                        event: event.nativeEvent,
                        document: documentRef.current,
                        elements: selectedElements,
                        selectedIds: latest.current.selectedIds,
                        handle,
                        tolerance: snapTolerance,
                        track: trackGesture,
                        preview: (next) => latest.current.onPreview(next),
                        commit: (next, ids, baseDocument) =>
                          latest.current.onCommit(next, ids, baseDocument),
                        guides: applySnapGuides,
                      });
                    }}
                    style={{
                      position: 'absolute',
                      left: HANDLE_POS[handle].left,
                      top: HANDLE_POS[handle].top,
                      width: handleSize,
                      height: handleSize,
                      marginLeft: -handleSize / 2,
                      marginTop: -handleSize / 2,
                      background: '#ffffff',
                      border: `${outlineWidth}px solid #2563eb`,
                      borderRadius: (2 * selectionChromeScale) / visualScale,
                      cursor: HANDLE_CURSORS[handle],
                      pointerEvents: 'auto',
                    }}
                  />
                ))
              : null}
          </div>
        </div>
      ) : null}
      {marquee !== null ? (
        <div
          data-sdm-marquee=""
          style={{
            position: 'absolute',
            left: marquee.bounds.x,
            top: marquee.bounds.y,
            width: marquee.bounds.width,
            height: marquee.bounds.height,
            background: 'rgba(128, 128, 128, 0.18)',
            border: `${outlineWidth}px solid #808080`,
            boxSizing: 'border-box',
          }}
        />
      ) : null}
      <div
        ref={snapGuideXRef}
        data-sdm-guide="x"
        aria-hidden="true"
        style={SNAP_GUIDE_X_STYLE}
      />
      <div
        ref={snapGuideYRef}
        data-sdm-guide="y"
        aria-hidden="true"
        style={SNAP_GUIDE_Y_STYLE}
      />
    </div>
  );
}
