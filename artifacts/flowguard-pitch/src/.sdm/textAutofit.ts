import { SDM_POINT_TO_UNIT, type Element, type Frame } from './core/schema';
import {
  MIN_SIZE,
  resizeHeightAnchored,
  type HeightAnchor,
} from './geometry';

export type AutofitElement = Extract<Element, { type: 'text' }>;

/** Height of the rendered text content in stage units, or null when unknown. */
export type TextContentMeasurer = (stageNode: HTMLElement) => number | null;

const AUTOFIT_TOLERANCE = 1;

export function shouldAutofit(element: Element): element is AutofitElement {
  return element.type === 'text' && element.body.overflow !== 'clip';
}

export const measureTextContentHeight: TextContentMeasurer = (stageNode) => {
  const content = stageNode.querySelector('[data-sdm-text-content]');
  if (!(content instanceof HTMLElement)) {
    return null;
  }
  const height = content.offsetHeight;

  return height > 0 ? height : null;
};

/** Frame height needed to show the measured content without spilling. */
export function requiredHeight(
  element: AutofitElement,
  contentHeight: number,
): number {
  const insets = element.body.insetsPt;
  const insetHeight =
    insets === undefined
      ? 0
      : (insets.top + insets.bottom) * SDM_POINT_TO_UNIT;
  const borderHeight =
    element.stroke === undefined
      ? 0
      : element.stroke.widthPt * SDM_POINT_TO_UNIT * 2;

  return Math.max(
    MIN_SIZE,
    Math.ceil(contentHeight + insetHeight + borderHeight),
  );
}

/** Whether the frame is sized to its content rather than holding slack. */
export function isTrackingContent(frame: Frame, required: number): boolean {
  return Math.abs(frame.height - required) <= AUTOFIT_TOLERANCE;
}

/**
 * Measures the element's rendered text and reports whether its frame is
 * sized to that text right now. Unmeasurable or non-autofit elements hold
 * slack by definition.
 */
export function isTrackingAtStart(
  element: Element,
  stageNode: HTMLElement | null,
  measure: TextContentMeasurer,
): boolean {
  if (!shouldAutofit(element) || stageNode === null) {
    return false;
  }
  const contentHeight = measure(stageNode);

  return (
    contentHeight !== null &&
    isTrackingContent(element.frame, requiredHeight(element, contentHeight))
  );
}

/**
 * The lowest height a resize gesture may leave a text frame at.
 *
 * A frame that tracks its text keeps following it: a drag that only changes
 * the width, or asks for less height, floors at zero so the text alone sets
 * the height (shrinking back down after it grew, clamping a too-short drag).
 * A drag that asks for more height, or any drag of a frame holding slack,
 * floors at the requested height so the frame never drops below what the
 * user (or the author) set.
 */
export function resizeFloor({
  startHeight,
  requestedHeight,
  tracking,
}: {
  startHeight: number;
  requestedHeight: number;
  tracking: boolean;
}): number {
  return tracking && requestedHeight <= startHeight ? 0 : requestedHeight;
}

/**
 * Grows the frame to the required height, and shrinks it back down to
 * `floor` when the frame follows its content. Returns the same frame when
 * the change is within tolerance.
 */
export function withFittedHeight(
  element: AutofitElement,
  frame: Frame,
  required: number,
  options: { anchor?: HeightAnchor; floor?: number } = {},
): Frame {
  const anchor = options.anchor ?? 'top';
  const height = Math.max(required, options.floor ?? frame.height);
  if (Math.abs(height - frame.height) <= AUTOFIT_TOLERANCE) {
    return frame;
  }

  return resizeHeightAnchored(frame, height, anchor, element.rotationDeg);
}

/**
 * Measures the element's rendered text and returns the frame it needs, or
 * null when the frame already fits or the content cannot be measured.
 */
export function fittedFrame(
  element: Element,
  frame: Frame,
  stageNode: HTMLElement | null,
  measure: TextContentMeasurer,
  options: { anchor?: HeightAnchor; floor?: number } = {},
): Frame | null {
  if (!shouldAutofit(element) || stageNode === null) {
    return null;
  }
  const contentHeight = measure(stageNode);
  if (contentHeight === null) {
    return null;
  }
  const fitted = withFittedHeight(
    element,
    frame,
    requiredHeight(element, contentHeight),
    options,
  );

  return fitted === frame ? null : fitted;
}
