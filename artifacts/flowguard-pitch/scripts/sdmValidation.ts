import { Value } from '@sinclair/typebox/value';

import { analyzeSlideLayout } from '../src/.sdm/core/layoutValidation';
import { parseSlideMotion } from '../src/.sdm/core/motion';
import {
  parseSlideDocument,
  type Color,
  type Element,
  type Font,
  type Paint,
  type RunStyle,
  type SlideDocument,
  type TextBody,
  type Theme,
} from '../src/.sdm/core/schema';
import {
  decodeYamlValue,
  sdmSlideDocumentFilename,
} from '../src/.sdm/core/serialization';
import type { SlideManifestEntry as SlideEntry } from '../src/.sdm/core/slidesManifest';
import { effectiveParagraph } from '../src/.sdm/core/text/listStyles';
import { isRepairableAssetArray } from './sdmRepair';

export interface SdmValidationIo {
  readFile: (projectRelativePath: string) => string | null;
  listFiles: (projectRelativeDir: string) => Array<string>;
}

const SDM_SLIDES_DIR = 'src/data/slides';
const WIDGETS_DIR = 'src/widgets';
const SDM_SLIDE_ID = /^[A-Za-z0-9_-]+$/;
const EXTERNAL_ASSET_SRC = /^(?:https?:|data:|blob:)/i;
const UNQUOTED_HASH_VALUE = /:[ \t]+#/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function schemaIssueMessage(
  issue: { path: string; message: string },
  input: unknown,
): string {
  if (
    issue.path === '/assets' &&
    isRecord(input) &&
    Array.isArray(input.assets)
  ) {
    return isRepairableAssetArray(input.assets)
      ? 'assets must be an object keyed by asset id, not an array; run validate-slides to repair id-bearing asset entries'
      : 'assets must be an object keyed by unique asset ids, not an array; give every entry a unique non-blank string id, then convert the array to an id-keyed object manually';
  }

  return issue.message;
}

export interface SdmValidationIssue {
  filepath: string;
  code: string;
  elementIds: Array<string>;
  message: string;
}

export function formatSdmValidationIssue(issue: SdmValidationIssue): string {
  const ids =
    issue.elementIds.length > 0 ? ` (${issue.elementIds.join(', ')})` : '';

  return `${issue.filepath} [${issue.code}]${ids}: ${issue.message}`;
}

function formatMessage(
  filepath: string,
  code: string,
  elementIds: Array<string>,
  message: string,
): SdmValidationIssue {
  return { filepath, code, elementIds, message };
}

function collectWidgetModules(
  elements: Array<Element>,
  into: Map<string, string>,
): void {
  for (const element of elements) {
    if (element.type === 'widget') {
      into.set(element.id, element.widget.module);
    } else if (element.type === 'group') {
      collectWidgetModules(element.children, into);
    }
  }
}

function widgetModuleMessages(
  filepath: string,
  document: SlideDocument,
  io: SdmValidationIo,
): Array<SdmValidationIssue> {
  const modules = new Map<string, string>();
  collectWidgetModules(document.elements, modules);
  if (modules.size === 0) {
    return [];
  }
  const widgetFiles = new Set(
    io.listFiles(WIDGETS_DIR).map((file) => file.replaceAll('\\', '/')),
  );
  const messages: Array<SdmValidationIssue> = [];
  for (const [elementId, module] of modules) {
    const relative = module.replace(/^\.\/widgets\//, '');
    if (!widgetFiles.has(relative)) {
      messages.push(
        formatMessage(
          filepath,
          'widget-module',
          [elementId],
          `widget module ${module} does not exist under ${WIDGETS_DIR}/. Add the file or fix the module path.`,
        ),
      );
    }
  }

  return messages;
}

function assetFileMessages(
  filepath: string,
  document: SlideDocument,
  io: SdmValidationIo,
): Array<SdmValidationIssue> {
  const messages: Array<SdmValidationIssue> = [];
  for (const [assetId, asset] of Object.entries(document.assets ?? {})) {
    if (EXTERNAL_ASSET_SRC.test(asset.src)) {
      continue;
    }
    if (asset.src.startsWith('/')) {
      messages.push(
        formatMessage(
          filepath,
          'asset-file',
          [],
          `asset "${assetId}" references "${asset.src}", but root-relative asset sources bypass the artifact base path. Remove the leading "/" and keep the file under public/.`,
        ),
      );
      continue;
    }
    const sourcePath = asset.src.split(/[?#]/, 1)[0];
    if (sourcePath.split(/[\\/]/).includes('..')) {
      messages.push(
        formatMessage(
          filepath,
          'asset-file',
          [],
          `asset "${assetId}" references "${asset.src}", but relative asset sources cannot contain ".." segments. Copy the file under public/ and reference it directly.`,
        ),
      );
      continue;
    }
    const publicPath = `public/${sourcePath.replace(/^\//, '')}`;
    if (io.readFile(publicPath) === null) {
      messages.push(
        formatMessage(
          filepath,
          'asset-file',
          [],
          `asset "${assetId}" references "${asset.src}", but ${publicPath} does not exist. Add the file under public/ or fix the asset src.`,
        ),
      );
    }
  }

  return messages;
}

function collectListSpacingMessages(
  filepath: string,
  body: TextBody,
  elementId: string,
  location: string,
  messages: Array<SdmValidationIssue>,
): void {
  const { paragraphs } = body;
  const formats = paragraphs.map((paragraph) => {
    if (!paragraph.bullet || !paragraph.runs.some((run) => run.text.trim())) {
      return null;
    }
    const runs = paragraph.runs
      .filter((run) => run.text.trim())
      .map((run) => ({
        ...paragraph.defaultRunStyle,
        ...run,
        text: '',
        action: undefined,
      }))
      .filter(
        (run, index, styles) => index === 0 || !Value.Equal(run, styles[index - 1]),
      );

    return {
      ...effectiveParagraph(paragraph),
      runs,
      spaceAfterPt: 0,
      bullet:
        paragraph.bullet.kind === 'number'
          ? { kind: 'number', style: paragraph.bullet.style ?? 'arabicPeriod' }
          : paragraph.bullet,
    };
  });

  for (let start = 0; start < paragraphs.length; ) {
    const format = formats[start];
    let end = start + 1;
    while (
      end < paragraphs.length &&
      format !== null &&
      Value.Equal(
        format,
        paragraphs[end].spaceAfterPt === undefined
          ? {
              ...formats[end],
              lineHeight: paragraphs[end].lineHeight ?? format.lineHeight,
            }
          : formats[end],
      )
    ) {
      const bullet = paragraphs[end].bullet;
      if (bullet?.kind === 'number' && bullet.startAt !== undefined) {
        break;
      }
      end++;
    }
    const list = paragraphs.slice(start, end);
    const spacing = list[0].spaceAfterPt;
    const firstMissing = list.findIndex(
      (paragraph) => paragraph.spaceAfterPt === undefined,
    );
    if (
      spacing !== undefined &&
      spacing > 0 &&
      firstMissing > 0 &&
      list.every((paragraph, index) =>
        index < firstMissing
          ? paragraph.spaceAfterPt === spacing
          : paragraph.spaceAfterPt === undefined,
      )
    ) {
      for (let index = firstMissing; index < list.length; index++) {
        const lineHeightFix =
          list[index].lineHeight === undefined && list[0].lineHeight !== undefined
            ? ` and lineHeight: ${list[0].lineHeight}`
            : '';
        messages.push(
          formatMessage(
            filepath,
            'list-spacing',
            [elementId],
            `${location}.paragraphs[${start + index}] omits spaceAfterPt, but preceding matching list items use ${spacing}pt. Set spaceAfterPt: ${spacing}${lineHeightFix} to preserve spacing when users extend the list. Use an explicit spaceAfterPt: 0 only for intentional zero spacing. Allow room for trailing spacing in the text frame.`,
          ),
        );
      }
    }
    start = end;
  }
}

function listSpacingMessages(
  filepath: string,
  elements: Array<Element>,
  baseLocation = 'elements',
): Array<SdmValidationIssue> {
  const messages: Array<SdmValidationIssue> = [];
  elements.forEach((element, index) => {
    const location = `${baseLocation}[${index}]`;
    const checkBody = (body: TextBody, bodyLocation: string) => {
      collectListSpacingMessages(
        filepath,
        body,
        element.id,
        bodyLocation,
        messages,
      );
    };
    if ('body' in element && element.body) {
      checkBody(element.body, `${location}.body`);
    }
    if (element.type === 'table') {
      element.rows.forEach((row, rowIndex) => {
        row.cells.forEach((cell, cellIndex) => {
          checkBody(
            cell.body,
            `${location}.rows[${rowIndex}].cells[${cellIndex}].body`,
          );
        });
      });
    } else if (element.type === 'group') {
      messages.push(
        ...listSpacingMessages(
          filepath,
          element.children,
          `${location}.children`,
        ),
      );
    }
  });

  return messages;
}

function colorTokenMessage(
  filepath: string,
  color: Color | undefined,
  theme: Theme | undefined,
  elementIds: Array<string>,
  location: string,
): SdmValidationIssue | undefined {
  if (
    color?.kind !== 'token' ||
    (theme !== undefined && Object.hasOwn(theme.colors, color.token))
  ) {
    return undefined;
  }

  return formatMessage(
    filepath,
    'theme-token',
    elementIds,
    `${location} references color token "${color.token}", but it is not defined in theme.colors. Define the token or use an rgb color.`,
  );
}

function fontTokenMessage(
  filepath: string,
  font: Font | undefined,
  theme: Theme | undefined,
  elementIds: Array<string>,
  location: string,
): SdmValidationIssue | undefined {
  if (
    font?.kind !== 'token' ||
    (theme !== undefined && Object.hasOwn(theme.fonts, font.token))
  ) {
    return undefined;
  }

  return formatMessage(
    filepath,
    'theme-token',
    elementIds,
    `${location} references font token "${font.token}", but it is not defined in theme.fonts. Define the token or use a family font.`,
  );
}

interface ThemeTokenScan {
  messages: Array<SdmValidationIssue>;
  usesThemeTokens: boolean;
}

function collectPaintTokenMessages(
  filepath: string,
  paint: Paint | undefined,
  theme: Theme | undefined,
  elementIds: Array<string>,
  location: string,
  scan: ThemeTokenScan,
): void {
  if (paint?.kind === 'solid') {
    scan.usesThemeTokens ||= paint.color.kind === 'token';
    const message = colorTokenMessage(
      filepath,
      paint.color,
      theme,
      elementIds,
      location,
    );
    if (message) {
      scan.messages.push(message);
    }
  } else if (paint?.kind === 'linearGradient') {
    paint.stops.forEach((stop, index) => {
      scan.usesThemeTokens ||= stop.color.kind === 'token';
      const message = colorTokenMessage(
        filepath,
        stop.color,
        theme,
        elementIds,
        `${location}.stops[${index}]`,
      );
      if (message) {
        scan.messages.push(message);
      }
    });
  }
}

function collectTextTokenMessages(
  filepath: string,
  body: TextBody | undefined,
  theme: Theme | undefined,
  elementIds: Array<string>,
  location: string,
  scan: ThemeTokenScan,
): void {
  const collectStyle = (style: RunStyle, styleLocation: string) => {
    scan.usesThemeTokens ||=
      style.color?.kind === 'token' ||
      style.highlight?.kind === 'token' ||
      style.font?.kind === 'token';
    const colorMessage = colorTokenMessage(
      filepath,
      style.color,
      theme,
      elementIds,
      `${styleLocation}.color`,
    );
    const highlightMessage = colorTokenMessage(
      filepath,
      style.highlight,
      theme,
      elementIds,
      `${styleLocation}.highlight`,
    );
    const fontMessage = fontTokenMessage(
      filepath,
      style.font,
      theme,
      elementIds,
      `${styleLocation}.font`,
    );
    if (colorMessage) {
      scan.messages.push(colorMessage);
    }
    if (highlightMessage) {
      scan.messages.push(highlightMessage);
    }
    if (fontMessage) {
      scan.messages.push(fontMessage);
    }
  };
  body?.paragraphs.forEach((paragraph, paragraphIndex) => {
    const paragraphLocation = `${location}.paragraphs[${paragraphIndex}]`;
    const styles: Array<{ location: string; style: RunStyle }> = [
      ...(paragraph.defaultRunStyle === undefined
        ? []
        : [
            {
              location: `${paragraphLocation}.defaultRunStyle`,
              style: paragraph.defaultRunStyle,
            },
          ]),
      ...(paragraph.markerStyle === undefined
        ? []
        : [
            {
              location: `${paragraphLocation}.markerStyle`,
              style: paragraph.markerStyle,
            },
          ]),
      ...paragraph.runs.map((run, runIndex) => ({
        location: `${paragraphLocation}.runs[${runIndex}]`,
        style: run,
      })),
    ];
    styles.forEach(({ location: styleLocation, style }) => {
      collectStyle(style, styleLocation);
    });
  });
}

function collectElementTokenMessages(
  filepath: string,
  elements: Array<Element>,
  theme: Theme | undefined,
  baseLocation: string,
  scan: ThemeTokenScan,
): void {
  elements.forEach((element, index) => {
    const location = `${baseLocation}[${index}]`;
    const elementIds = [element.id];
    if ('fill' in element) {
      collectPaintTokenMessages(
        filepath,
        element.fill,
        theme,
        elementIds,
        `${location}.fill`,
        scan,
      );
    }
    if ('stroke' in element && element.stroke) {
      scan.usesThemeTokens ||= element.stroke.color.kind === 'token';
      const message = colorTokenMessage(
        filepath,
        element.stroke.color,
        theme,
        elementIds,
        `${location}.stroke.color`,
      );
      if (message) {
        scan.messages.push(message);
      }
    }
    if ('body' in element) {
      collectTextTokenMessages(
        filepath,
        element.body,
        theme,
        elementIds,
        `${location}.body`,
        scan,
      );
    }
    if (element.type === 'table') {
      element.rows.forEach((row, rowIndex) => {
        row.cells.forEach((cell, cellIndex) => {
          const cellLocation = `${location}.rows[${rowIndex}].cells[${cellIndex}]`;
          collectPaintTokenMessages(
            filepath,
            cell.fill,
            theme,
            elementIds,
            `${cellLocation}.fill`,
            scan,
          );
          collectTextTokenMessages(
            filepath,
            cell.body,
            theme,
            elementIds,
            `${cellLocation}.body`,
            scan,
          );
        });
      });
    } else if (element.type === 'group') {
      collectElementTokenMessages(
        filepath,
        element.children,
        theme,
        `${location}.children`,
        scan,
      );
    }
  });
}

function scanThemeTokens(
  filepath: string,
  document: SlideDocument,
): ThemeTokenScan {
  const scan: ThemeTokenScan = { messages: [], usesThemeTokens: false };
  collectPaintTokenMessages(
    filepath,
    document.background,
    document.theme,
    [],
    'background',
    scan,
  );
  collectElementTokenMessages(
    filepath,
    document.elements,
    document.theme,
    'elements',
    scan,
  );

  return scan;
}

interface DocumentTheme {
  filepath: string;
  theme: Theme | undefined;
}

const MAX_THEME_DIFFERENCES = 6;

function sortedRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function canonicalTheme(theme: Theme): Theme {
  return {
    colors: Object.fromEntries(
      Object.entries(theme.colors).map(([token, value]) => [
        token,
        value.toUpperCase(),
      ]),
    ),
    fonts: theme.fonts,
  };
}

function themeIdentity(theme: Theme | undefined): string {
  if (theme === undefined) {
    return 'none';
  }
  const canonical = canonicalTheme(theme);

  return JSON.stringify({
    colors: sortedRecord(canonical.colors),
    fonts: sortedRecord(canonical.fonts),
  });
}

function themeDifferences(theme: Theme, deckTheme: Theme): Array<string> {
  const differences: Array<string> = [];
  for (const group of ['colors', 'fonts'] as const) {
    const here = theme[group];
    const deck = deckTheme[group];
    const keys = [...new Set([...Object.keys(here), ...Object.keys(deck)])].sort(
      (a, b) => a.localeCompare(b),
    );
    for (const key of keys) {
      const hereValue = Object.hasOwn(here, key) ? here[key] : undefined;
      const deckValue = Object.hasOwn(deck, key) ? deck[key] : undefined;
      if (hereValue === deckValue) {
        continue;
      }
      if (hereValue === undefined) {
        differences.push(`${group}.${key} is missing here`);
      } else if (deckValue === undefined) {
        differences.push(`${group}.${key} is not in the deck theme`);
      } else {
        differences.push(
          `${group}.${key} is "${hereValue}" here but "${deckValue}" there`,
        );
      }
    }
  }

  return differences;
}

function themeDriftMessage(
  theme: Theme | undefined,
  exemplar: DocumentTheme,
): string {
  if (theme === undefined) {
    return `document has no theme, but ${exemplar.filepath} defines the deck theme. Copy that theme block here so every document that uses theme tokens shares it.`;
  }
  if (exemplar.theme === undefined) {
    return `document defines a theme, but ${exemplar.filepath} has none. Use one identical theme block in every document that uses theme tokens.`;
  }
  const differences = themeDifferences(
    canonicalTheme(theme),
    canonicalTheme(exemplar.theme),
  );
  const listed = differences.slice(0, MAX_THEME_DIFFERENCES);
  const remainder = differences.length - listed.length;
  const suffix = remainder > 0 ? `, and ${remainder} more` : '';

  return `theme differs from ${exemplar.filepath}: ${listed.join('; ')}${suffix}. Keep one identical theme block in every document that uses theme tokens.`;
}

function themeDriftMessages(
  documents: Array<DocumentTheme>,
): Array<SdmValidationIssue> {
  if (documents.length < 2) {
    return [];
  }
  const groups = new Map<string, Array<DocumentTheme>>();
  for (const document of documents) {
    const identity = themeIdentity(document.theme);
    const group = groups.get(identity);
    if (group === undefined) {
      groups.set(identity, [document]);
    } else {
      group.push(document);
    }
  }
  if (groups.size < 2) {
    return [];
  }
  let deckGroup: Array<DocumentTheme> = [];
  for (const group of groups.values()) {
    if (group.length > deckGroup.length) {
      deckGroup = group;
    }
  }
  const exemplar = deckGroup[0];
  const deckIdentity = themeIdentity(exemplar.theme);
  const messages: Array<SdmValidationIssue> = [];
  for (const document of documents) {
    if (themeIdentity(document.theme) === deckIdentity) {
      continue;
    }
    messages.push(
      formatMessage(
        document.filepath,
        'theme-drift',
        [],
        themeDriftMessage(document.theme, exemplar),
      ),
    );
  }

  return messages;
}

export interface SdmValidationResult {
  errors: Array<SdmValidationIssue>;
  warnings: Array<SdmValidationIssue>;
}

function motionMessages(
  filepath: string,
  document: SlideDocument,
): SdmValidationResult {
  const result: SdmValidationResult = { errors: [], warnings: [] };
  for (const issue of parseSlideMotion(document).issues) {
    const target = issue.severity === 'error' ? result.errors : result.warnings;
    target.push(
      formatMessage(filepath, issue.code, issue.elementIds, issue.message),
    );
  }

  return result;
}

export function validateSdmEntries(
  entries: Array<SlideEntry>,
  io: SdmValidationIo,
): SdmValidationResult {
  const messages: Array<SdmValidationIssue> = [];
  const warnings: Array<SdmValidationIssue> = [];
  const documentThemes: Array<DocumentTheme> = [];
  for (const entry of entries) {
    if (!SDM_SLIDE_ID.test(entry.id)) {
      messages.push(
        formatMessage(
          entry.filepath,
          'invalid-id',
          [],
          `slide id "${entry.id}" must contain only letters, numbers, underscores, and hyphens.`,
        ),
      );
      continue;
    }
    const expectedPath = `${SDM_SLIDES_DIR}/${sdmSlideDocumentFilename(entry.id)}`;
    if (entry.filepath !== expectedPath) {
      messages.push(
        formatMessage(
          entry.filepath,
          'manifest-path',
          [],
          `slide "${entry.id}" must use ${expectedPath} so the loader and HMR resolve it.`,
        ),
      );
      continue;
    }
    const raw = io.readFile(entry.filepath);
    if (raw === null) {
      messages.push(
        formatMessage(
          entry.filepath,
          'missing-file',
          [],
          `file not found (referenced by slide "${entry.id}").`,
        ),
      );
      continue;
    }
    const decoded = decodeYamlValue(raw);
    if (!decoded.ok) {
      messages.push(
        formatMessage(entry.filepath, 'parse-yaml', [], decoded.message),
      );
      continue;
    }
    const result = parseSlideDocument(decoded.value);
    if (!result.ok) {
      if (result.reason === 'unsupportedVersion') {
        messages.push(
          formatMessage(
            entry.filepath,
            'unsupported-version',
            [],
            `document version ${result.version} is newer than this tooling supports; do not edit this file by hand.`,
          ),
        );
      } else {
        for (const issue of result.issues) {
          messages.push(
            formatMessage(
              entry.filepath,
              'schema-invalid',
              [],
              `${issue.path}: ${schemaIssueMessage(issue, decoded.value)}`,
            ),
          );
        }
        if (UNQUOTED_HASH_VALUE.test(raw)) {
          messages.push(
            formatMessage(
              entry.filepath,
              'unquoted-color',
              [],
              'an unquoted value starting with "#" is read as a YAML comment and the value becomes null. Quote hex colors: value: "#0F172A".',
            ),
          );
        }
      }
      continue;
    }
    for (const issue of analyzeSlideLayout(result.document)) {
      messages.push(
        formatMessage(
          entry.filepath,
          issue.code,
          issue.elementIds,
          issue.message,
        ),
      );
    }
    messages.push(...assetFileMessages(entry.filepath, result.document, io));
    messages.push(
      ...listSpacingMessages(entry.filepath, result.document.elements),
    );
    const themeTokenScan = scanThemeTokens(
      entry.filepath,
      result.document,
    );
    messages.push(...themeTokenScan.messages);
    if (themeTokenScan.usesThemeTokens) {
      documentThemes.push({
        filepath: entry.filepath,
        theme: result.document.theme,
      });
    }
    messages.push(...widgetModuleMessages(entry.filepath, result.document, io));
    const motion = motionMessages(entry.filepath, result.document);
    messages.push(...motion.errors);
    warnings.push(...motion.warnings);
  }
  messages.push(...themeDriftMessages(documentThemes));

  return { errors: messages, warnings };
}

export function findOrphanSdmFiles(
  entries: Array<SlideEntry>,
  io: SdmValidationIo,
): Array<SdmValidationIssue> {
  const referenced = new Set(
    entries
      .filter((entry) => entry.kind === 'sdm')
      .map((entry) => entry.filepath),
  );
  const messages: Array<SdmValidationIssue> = [];
  for (const file of io.listFiles(SDM_SLIDES_DIR)) {
    const normalized = file.replaceAll('\\', '/');
    if (!normalized.endsWith('.sdm.yaml')) {
      continue;
    }
    const filepath = `${SDM_SLIDES_DIR}/${normalized}`;
    if (!referenced.has(filepath)) {
      messages.push(
        formatMessage(
          filepath,
          'orphan-file',
          [],
          'not referenced by any manifest entry with kind "sdm". Add a manifest entry or delete the file.',
        ),
      );
    }
  }

  return messages;
}
