import { getRootElements, unionFrames, visualBounds } from './operations';
import type { Element, Frame, SlideDocument } from './schema';

export function getSelectionBounds(
  elements: ReadonlyArray<Element>,
): Frame | null {
  let bounds: Frame | null = null;
  for (const element of elements) {
    const frame = visualBounds(element);
    bounds = bounds ? unionFrames(bounds, frame) : frame;
  }

  return bounds;
}

export function requiresProportionalResize(
  elements: ReadonlyArray<Element>,
): boolean {
  return elements.some(
    (element) =>
      (element.rotationDeg ?? 0) % 360 !== 0 ||
      (element.type === 'group' &&
        requiresProportionalResize(element.children)),
  );
}

function validBounds(bounds: Frame): boolean {
  return (
    Number.isFinite(bounds.x) &&
    Number.isFinite(bounds.y) &&
    Number.isFinite(bounds.width) &&
    Number.isFinite(bounds.height) &&
    bounds.width > 0 &&
    bounds.height > 0
  );
}

function resizeBox(
  element: Element,
  frame: Frame,
  sx: number,
  sy: number,
): Element {
  switch (element.type) {
    case 'group':
      return {
        ...element,
        frame,
        coordinateSpace: {
          width: element.coordinateSpace.width * sx,
          height: element.coordinateSpace.height * sy,
        },
        children: element.children.map((child) =>
          resizeBox(
            child,
            {
              x: child.frame.x * sx,
              y: child.frame.y * sy,
              width: child.frame.width * sx,
              height: child.frame.height * sy,
            },
            sx,
            sy,
          ),
        ),
      };
    case 'line':
      return {
        ...element,
        frame,
        points: element.points.map((point) => ({
          x: point.x * sx,
          y: point.y * sy,
        })),
      };
    case 'table':
      return {
        ...element,
        frame,
        rows: element.rows.map((row) =>
          row.height === undefined ? row : { ...row, height: row.height * sy },
        ),
      };
    case 'text':
    case 'shape':
    case 'image':
    case 'widget':
      return { ...element, frame };
  }
}

export function resizeRootElements(
  document: SlideDocument,
  ids: ReadonlyArray<string>,
  targetBounds: Frame,
): SlideDocument {
  const selected = getRootElements(document, [...ids]);
  if (
    selected.length < 2 ||
    selected.some((element) => element.locked || element.hidden) ||
    !validBounds(targetBounds)
  ) {
    return document;
  }
  const sourceBounds = getSelectionBounds(selected);
  if (!sourceBounds || !validBounds(sourceBounds)) {
    return document;
  }
  const sx = targetBounds.width / sourceBounds.width;
  const sy = targetBounds.height / sourceBounds.height;
  if (
    !Number.isFinite(sx) ||
    !Number.isFinite(sy) ||
    sx <= 0 ||
    sy <= 0 ||
    (requiresProportionalResize(selected) &&
      Math.abs(sx - sy) > 1e-9 * Math.max(sx, sy)) ||
    (sx === 1 &&
      sy === 1 &&
      sourceBounds.x === targetBounds.x &&
      sourceBounds.y === targetBounds.y)
  ) {
    return document;
  }
  const selectedIds = new Set(selected.map((element) => element.id));

  return {
    ...document,
    elements: document.elements.map((element) => {
      if (!selectedIds.has(element.id)) {
        return element;
      }
      const { x, y, width, height } = element.frame;

      return resizeBox(
        element,
        {
          x:
            targetBounds.x +
            (x + width / 2 - sourceBounds.x) * sx -
            (width * sx) / 2,
          y:
            targetBounds.y +
            (y + height / 2 - sourceBounds.y) * sy -
            (height * sy) / 2,
          width: width * sx,
          height: height * sy,
        },
        sx,
        sy,
      );
    }),
  };
}
