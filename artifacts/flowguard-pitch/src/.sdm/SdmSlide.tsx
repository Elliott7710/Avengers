import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { sameFrame, updateElement } from './core/operations';
import type { SdmTextCommand } from './core/protocol';
import {
  parseSlideDocument,
  type Action,
  type ParseSlideDocumentResult,
  type SlideDocument,
  type TextBody,
} from './core/schema';
import { ensureRegistryFontsStylesheet } from './fontCss';
import { isMotionPlaybackEnabled, playSlideMotion } from './motion';
import {
  backgroundValue,
  PaintLayer,
  SdmElementView,
  SdmRenderContext,
} from './render';
import { resolveAssetSrc, paintToBackground } from './style';
import {
  SdmInteractionLayer,
  type SdmTextAutofitHandle,
} from './SdmInteractionLayer';
import type {
  SdmTextCaretPoint,
  SdmTextEditorHandle,
  SdmTextEditorOptions,
} from './SdmTextEditor';
import { SDM_BASE_URL, sdmWidgetModules } from './sdmRuntime';
import { useSdmRuntimeSession } from './session';

interface Props {
  slideId: string;
  initialDocument: unknown;
  active?: boolean;
}

interface ParsedState {
  document: SlideDocument | null;
  error: string | null;
}

const RENDER_CONTEXT = {
  baseUrl: SDM_BASE_URL,
  widgets: sdmWidgetModules,
};

function describeParseFailure(
  result: Exclude<ParseSlideDocumentResult, { ok: true }>,
): string {
  if (result.reason === 'unsupportedVersion') {
    return `document version ${result.version} is newer than this runtime supports`;
  }

  return result.issues
    .slice(0, 8)
    .map((issue) => `${issue.path}: ${issue.message}`)
    .join('; ');
}

function tryParse(input: unknown): ParsedState {
  const result = parseSlideDocument(input);
  if (result.ok) {
    return { document: result.document, error: null };
  }

  return { document: null, error: describeParseFailure(result) };
}

function useStageScale(
  rootRef: RefObject<HTMLDivElement | null>,
  size: { width: number; height: number },
): number {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const update = () => {
      const w = root.clientWidth;
      const h = root.clientHeight;
      if (w > 0 && h > 0) {
        setScale(Math.min(w / size.width, h / size.height));
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);

    return () => observer.disconnect();
  }, [rootRef, size.height, size.width]);

  return scale;
}

export function SdmSlide({ slideId, initialDocument, active }: Props) {
  const [state, setState] = useState<ParsedState>(() =>
    tryParse(initialDocument),
  );
  const [motionEnabled] = useState(() => isMotionPlaybackEnabled());
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const document = state.document;
  const documentRef = useRef(document);
  documentRef.current = document;
  const [preview, setPreview] = useState<{
    source: SlideDocument | null;
    document: SlideDocument;
  } | null>(null);
  const handlePreview = useCallback((next: SlideDocument | null) => {
    setPreview(
      next === null ? null : { source: documentRef.current, document: next },
    );
  }, []);
  const size = document?.size ?? { width: 1920, height: 1080 };
  const scale = useStageScale(rootRef, size);

  useEffect(() => {
    ensureRegistryFontsStylesheet();
  }, []);

  const handleDocumentReplaced = useCallback((next: SlideDocument) => {
    documentRef.current = next;
    setState({ document: next, error: null });
  }, []);
  const textEditorHandleRef = useRef<SdmTextEditorHandle | null>(null);
  const textCaretElementIdRef = useRef<string | null>(null);
  const textAutofitHandleRef = useRef<SdmTextAutofitHandle | null>(null);
  const handleTextAutofitHandle = useCallback(
    (handle: SdmTextAutofitHandle | null) => {
      textAutofitHandleRef.current = handle;
    },
    [],
  );
  const handleTextCommand = useCallback(
    (elementId: string, command: SdmTextCommand, preserveFocus?: boolean): boolean => {
      if (elementId !== textCaretElementIdRef.current) {
        return false;
      }

      return (
        textEditorHandleRef.current?.applyCommand(command, preserveFocus) ??
        false
      );
    },
    [],
  );
  const commitRef = useRef<
    ReturnType<typeof useSdmRuntimeSession>['commit'] | null
  >(null);
  // Persists the caret's pending text, then the frame drafted for it: a
  // frame drafted after the last body commit (a late font load, an
  // inspector command) has no body delta to ride along with.
  const commitTextCaret = useCallback(() => {
    textEditorHandleRef.current?.commit();
    const autofit = textAutofitHandleRef.current;
    const currentDocument = documentRef.current;
    if (autofit === null || currentDocument === null) {
      return documentRef.current;
    }
    const fitted = autofit.fit();
    if (fitted === null) {
      return documentRef.current;
    }
    const nextDocument = updateElement(
      currentDocument,
      autofit.elementId,
      (element) =>
        sameFrame(element.frame, fitted) ? element : { ...element, frame: fitted },
    );
    if (nextDocument !== currentDocument) {
      commitRef.current?.(nextDocument, [autofit.elementId], {
        keepTextCaret: true,
      });
    }

    return documentRef.current;
  }, []);
  const {
    editing,
    selectedIds,
    textCaretElementId,
    viewportScale,
    select,
    isSelectionCurrent,
    activateTextCaret,
    exitTextCaret,
    reportTextSelection,
    commit,
    requestHistory,
    forwardKey,
    requestContextMenu,
  } = useSdmRuntimeSession({
      slideId,
      document,
      onBeforeTextCaretExit: commitTextCaret,
      onDocumentReplaced: handleDocumentReplaced,
      onTextCommand: handleTextCommand,
    });
  textCaretElementIdRef.current = textCaretElementId;
  commitRef.current = commit;
  const previewDocument =
    editing && preview?.source === document ? preview.document : null;
  const renderedDocument = previewDocument ?? document;
  const selectionContainsLockedElement =
    renderedDocument?.elements.some(
      (element) => selectedIds.includes(element.id) && element.locked,
    ) ?? false;
  const [textCaretPoint, setTextCaretPoint] =
    useState<SdmTextCaretPoint | null>(null);
  const handleActivateTextCaret = useCallback(
    (elementId: string, point: SdmTextCaretPoint) => {
      setTextCaretPoint(point);
      const activated = activateTextCaret(elementId);
      if (!activated) {
        setTextCaretPoint(null);
      }

      return activated;
    },
    [activateTextCaret],
  );
  const handleExitTextCaret = useCallback(() => {
    setTextCaretPoint(null);
    exitTextCaret();

    return documentRef.current;
  }, [exitTextCaret]);
  const handlePlaceTextCaret = useCallback((point: SdmTextCaretPoint) => {
    const handle = textEditorHandleRef.current;
    if (handle === null) {
      return false;
    }
    handle.placeCaret(point);

    return true;
  }, []);
  const textEditor = useMemo<SdmTextEditorOptions | undefined>(() => {
    if (document === null || textCaretElementId === null) {
      return undefined;
    }

    return {
      initialPoint: textCaretPoint,
      onCancel: handleExitTextCaret,
      onCommit: (body: TextBody) => {
        const currentDocument = documentRef.current;
        if (currentDocument === null) {
          return;
        }
        // Fit the box to the text being committed right now: formatting
        // commands commit synchronously, before the ResizeObserver drafts.
        const autofit = textAutofitHandleRef.current;
        const fitted =
          autofit !== null && autofit.elementId === textCaretElementId
            ? autofit.fit()
            : null;
        const nextDocument = updateElement(
          currentDocument,
          textCaretElementId,
          (element) => {
            if (
              (element.type !== 'text' && element.type !== 'shape') ||
              element.body === body
            ) {
              return element;
            }

            return fitted !== null
              ? { ...element, body, frame: fitted }
              : { ...element, body };
          },
        );
        if (nextDocument !== currentDocument) {
          // The caret session survives its own commits; exits are explicit
          // (Escape, outside click, selection change).
          commit(nextDocument, [textCaretElementId], { keepTextCaret: true });
        }
      },
      onHandle: (handle) => {
        textEditorHandleRef.current = handle;
      },
      onSelectionChange: (formatting) => {
        reportTextSelection(textCaretElementId, formatting);
      },
    };
  }, [
    commit,
    document,
    handleExitTextCaret,
    reportTextSelection,
    textCaretElementId,
    textCaretPoint,
  ]);
  const editingRef = useRef(editing);
  editingRef.current = editing;

  useEffect(() => {
    if (textCaretElementId === null) {
      setTextCaretPoint(null);
    }
  }, [textCaretElementId]);

  const lastReportedCaretRef = useRef<string | null>(null);
  useEffect(() => {
    const previous = lastReportedCaretRef.current;
    if (previous !== null && previous !== textCaretElementId) {
      reportTextSelection(previous, null);
    }
    lastReportedCaretRef.current = textCaretElementId;
  }, [reportTextSelection, textCaretElementId]);

  useEffect(() => {
    const hot = import.meta.hot;
    if (!hot) {
      return;
    }
    const handler = (data: { slideId?: string; document?: unknown }) => {
      if (data?.slideId !== slideId || !data.document || editingRef.current) {
        return;
      }
      setState(tryParse(data.document));
    };
    hot.on('sdm:documentChanged', handler);

    return () => hot.off?.('sdm:documentChanged', handler);
  }, [slideId]);

  useLayoutEffect(() => {
    if (!motionEnabled || active !== true || editing || document === null) {
      return;
    }
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    const handle = playSlideMotion(stage, document);

    return () => handle.cancel();
  }, [active, document, editing, motionEnabled]);

  const handleAction = useCallback((action: Action) => {
    window.postMessage({ type: 'sdm:action', action }, '*');
  }, []);

  const background = document
    ? paintToBackground(document.background, document.theme, (assetId) =>
        resolveAssetSrc(document.assets, assetId, SDM_BASE_URL),
      )
    : undefined;
  const stageBackground = document
    ? (backgroundValue(background) ?? '#ffffff')
    : '#1a1a1a';

  return (
    <SdmRenderContext.Provider value={RENDER_CONTEXT}>
      <div
        ref={rootRef}
        className="relative w-screen h-screen overflow-hidden"
        style={{ background: stageBackground }}
        data-sdm-slide-id={slideId}
        data-sdm-ready="true"
        data-sdm-editing={editing ? 'true' : undefined}
      >
        <div
          ref={stageRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: size.width,
            height: size.height,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: 'center center',
            background: stageBackground,
            overflow: 'hidden',
          }}
        >
          <PaintLayer resolved={background} />
          {renderedDocument?.elements.map((element) => (
            <SdmElementView
              key={element.id}
              element={element}
              document={renderedDocument}
              moveCursor={
                editing &&
                !element.locked &&
                (!selectedIds.includes(element.id) ||
                  !selectionContainsLockedElement)
              }
              onAction={handleAction}
              textEditor={
                textCaretElementId === element.id ? textEditor : undefined
              }
            />
          ))}
          {editing && document ? (
            <SdmInteractionLayer
              document={document}
              previewDocument={previewDocument}
              onPreview={handlePreview}
              selectedIds={selectedIds}
              isGestureCurrent={(baseDocument, ids) =>
                baseDocument === documentRef.current && isSelectionCurrent(ids)
              }
              scale={scale}
              viewportScale={viewportScale}
              stageRef={stageRef}
              onSelect={select}
              textCaretElementId={textCaretElementId}
              onActivateTextCaret={handleActivateTextCaret}
              onExitTextCaret={handleExitTextCaret}
              onTextAutofitHandle={handleTextAutofitHandle}
              onPlaceTextCaret={handlePlaceTextCaret}
              onCommit={(next, ids, baseDocument) => {
                if (baseDocument === documentRef.current) {
                  // Persist pending typing and the frame drafted for it
                  // before moving, without replacing the text with the
                  // gesture's older copy of the body.
                  commitTextCaret();
                  const textElement = documentRef.current?.elements.find(
                    (element) => element.id === textCaretElementId,
                  );
                  const body =
                    textElement?.type === 'text' ||
                    textElement?.type === 'shape'
                      ? textElement.body
                      : undefined;
                  const nextDocument =
                    textCaretElementId !== null && body !== undefined
                      ? updateElement(next, textCaretElementId, (element) =>
                          element.type === 'text' || element.type === 'shape'
                            ? { ...element, body }
                            : element,
                        )
                      : next;
                  commit(nextDocument, ids, {
                    keepTextCaret: textCaretElementId !== null,
                  });
                }
              }}
              onHistory={requestHistory}
              onForwardKey={forwardKey}
              onContextMenuRequest={requestContextMenu}
            />
          ) : null}
        </div>

        {state.error ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              color: '#fca5a5',
              fontFamily: 'monospace',
              fontSize: 16,
              textAlign: 'center',
            }}
          >
            Invalid SDM slide “{slideId}”: {state.error}
          </div>
        ) : null}
      </div>
    </SdmRenderContext.Provider>
  );
}
