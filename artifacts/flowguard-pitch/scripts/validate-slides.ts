/// <reference types="node" />
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { access } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  decodeYamlValue,
  encodeSlideDocumentText,
} from '../src/.sdm/core/serialization';
import {
  validateSlidesManifest,
  type SlideManifestIssue,
  type SlideManifestEntry as SlideEntry,
} from '../src/.sdm/core/slidesManifest';
import {
  isRepairableSdmFile,
  repairSlideDocument,
  repairSlidesManifest,
  type RepairResult,
} from './sdmRepair';
import {
  findOrphanSdmFiles,
  formatSdmValidationIssue,
  validateSdmEntries,
  type SdmValidationIssue,
  type SdmValidationIo,
} from './sdmValidation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const slidesDir = path.join(projectRoot, 'src/pages/slides');
const slidesManifestPath = path.join(
  projectRoot,
  'src/data/slides-manifest.json',
);

type ValidationIssue = {
  message: string;
};

type ValidationMode = 'fix' | 'check';

type PendingRepair = {
  relativePath: string;
  absolutePath: string;
  original: string;
  content: string;
  changes: Array<string>;
};

let slides: SlideEntry[] = [];

export function validationMode(args: Array<string>): ValidationMode {
  const effective = args[0] === '--' ? args.slice(1) : args;
  if (
    effective.length === 0 ||
    (effective.length === 1 && effective[0] === '--fix')
  ) {
    return 'fix';
  }
  if (effective.length === 1 && effective[0] === '--check') {
    return 'check';
  }

  throw new Error(`Unknown arguments: ${args.join(' ')}`);
}

function pendingRepair(
  relativePath: string,
  absolutePath: string,
  original: string,
  repaired: RepairResult,
  serialize: (value: unknown) => string,
): PendingRepair | undefined {
  if (repaired.changes.length === 0) {
    return undefined;
  }

  return {
    relativePath,
    absolutePath,
    original,
    content: serialize(repaired.value),
    changes: repaired.changes,
  };
}

function applyRepairs(repairs: Array<PendingRepair>): void {
  const staged = repairs.map((repair, index) => ({
    ...repair,
    temporaryPath: `${repair.absolutePath}.validate-slides-${process.pid}-${index}.tmp`,
  }));
  let applied = 0;
  try {
    for (const repair of staged) {
      writeFileSync(repair.temporaryPath, repair.content);
    }
    for (const repair of staged) {
      renameSync(repair.temporaryPath, repair.absolutePath);
      applied += 1;
    }
  } catch (error) {
    for (let index = 0; index < applied; index += 1) {
      const repair = staged[index];
      if (repair !== undefined) {
        writeFileSync(repair.absolutePath, repair.original);
      }
    }
    for (const repair of staged) {
      if (existsSync(repair.temporaryPath)) {
        unlinkSync(repair.temporaryPath);
      }
    }
    throw error;
  }

  for (const repair of repairs) {
    console.log(`Fixed ${repair.relativePath}:`);
    for (const change of repair.changes) {
      console.log(`- ${change}`);
    }
  }
}

function relativeToProject(filePath: string): string {
  return path.relative(projectRoot, filePath).replaceAll(path.sep, '/');
}

function formatIssuePath(issuePath: string): string {
  if (issuePath === '') {
    return 'manifest';
  }

  return issuePath
    .slice(1)
    .split('/')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
    .join('.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issuePathSegments(issuePath: string): Array<string> {
  return issuePath
    .slice(1)
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'));
}

function manifestFieldMessage(
  issue: SlideManifestIssue,
  input: unknown,
): string {
  const segments = issuePathSegments(issue.path);
  const entryIndex = Number(segments[0]);
  const field = segments[1];
  const entry =
    Array.isArray(input) && Number.isInteger(entryIndex)
      ? input[entryIndex]
      : undefined;
  const value = isRecord(entry) && field !== undefined ? entry[field] : undefined;
  if (issue.message === 'Unexpected property' && field !== undefined) {
    return `unknown property "${field}"; remove it from the manifest entry`;
  }
  if (field === 'position') {
    return value === undefined
      ? 'missing "position"; preserve the current position order, append unpositioned entries after the highest existing position in array order, then normalize to contiguous 1..N (or run validate-slides without --check to repair)'
      : 'invalid "position"; replace it with a unique integer of at least 1, preserve the current position order, then normalize to contiguous 1..N';
  }
  const requiredFieldGuidance: Record<string, string> = {
    id: 'add a stable non-blank string slide id',
    filepath: 'add the non-blank path to the slide source file',
    title: 'add a non-blank user-facing slide title',
    description: 'add a non-blank description of the slide',
  };
  if (field !== undefined && Object.hasOwn(requiredFieldGuidance, field)) {
    return `${value === undefined ? 'missing' : 'invalid'} "${field}"; ${requiredFieldGuidance[field]}`;
  }

  return issue.message;
}

export function mappedManifestIssues(
  issues: Array<SlideManifestIssue>,
  input: unknown,
): Array<SlideManifestIssue> {
  const seen = new Set<string>();
  return issues.flatMap((issue) => {
    if (seen.has(issue.path)) {
      return [];
    }
    seen.add(issue.path);

    return [{ path: issue.path, message: manifestFieldMessage(issue, input) }];
  });
}

export function sdmRollupMessages(
  issues: Array<SdmValidationIssue>,
): Array<string> {
  const groups = new Map<
    string,
    { code: string; elementIds: Array<string>; filepaths: Set<string> }
  >();
  for (const issue of issues) {
    if (issue.elementIds.length === 0) {
      continue;
    }
    const key = JSON.stringify([issue.code, issue.elementIds, issue.message]);
    const group = groups.get(key) ?? {
      code: issue.code,
      elementIds: issue.elementIds,
      filepaths: new Set<string>(),
    };
    group.filepaths.add(issue.filepath);
    groups.set(key, group);
  }

  return [...groups.values()].flatMap(({ code, elementIds, filepaths }) =>
    filepaths.size > 1
      ? [
          `[${code}] (${elementIds.join(', ')}): same failure in ${filepaths.size} slides — fix every copy in one batched edit, then rerun`,
        ]
      : [],
  );
}

function getSlideFilenames(): string[] {
  if (!existsSync(slidesDir)) {
    return [];
  }

  return readdirSync(slidesDir).filter((name) => name.endsWith('.tsx'));
}

function validateDuplicatePositions(issues: ValidationIssue[]) {
  const positions = new Map<number, string[]>();
  for (const slide of slides) {
    const list = positions.get(slide.position) ?? [];
    list.push(slide.title);
    positions.set(slide.position, list);
  }

  for (const [position, titles] of positions) {
    if (titles.length > 1) {
      issues.push({
        message: `Duplicate position ${position} found for slides: ${titles.join(', ')}`,
      });
    }
  }
}

function validateDuplicateIds(issues: ValidationIssue[]) {
  const ids = new Map<string, string[]>();
  for (const slide of slides) {
    const list = ids.get(slide.id) ?? [];
    list.push(slide.title);
    ids.set(slide.id, list);
  }

  for (const [id, titles] of ids) {
    if (titles.length > 1) {
      issues.push({
        message: `Duplicate ID ${id} found for slides: ${titles.join(', ')}`,
      });
    }
  }
}

function validateContiguousPositions(issues: ValidationIssue[]) {
  const sorted = [...slides].sort((a, b) => a.position - b.position);
  for (let index = 0; index < sorted.length; index += 1) {
    const expected = index + 1;
    const actual = sorted[index].position;
    if (actual !== expected) {
      issues.push({
        message: `Position gap: expected ${expected}, found ${actual}`,
      });
    }
  }
}

function jsxSlides(): SlideEntry[] {
  return slides.filter((slide) => slide.kind !== 'sdm');
}

function validateFilepaths(issues: ValidationIssue[]) {
  const knownSlideFiles = new Set(getSlideFilenames());

  for (const slide of jsxSlides()) {
    const filename = path.basename(slide.filepath);
    const expectedFilepath = `src/pages/slides/${filename}`;

    if (!filename.endsWith('.tsx')) {
      issues.push({
        message: `Invalid filepath extension for slide "${slide.title}": ${slide.filepath} (must end with .tsx)`,
      });
      continue;
    }

    if (slide.filepath !== expectedFilepath) {
      issues.push({
        message:
          `Invalid filepath for slide "${slide.title}": ${slide.filepath}. ` +
          `Expected ${expectedFilepath} so it resolves in slideLoader.ts.`,
      });
      continue;
    }

    if (!knownSlideFiles.has(filename)) {
      issues.push({
        message: `File not found: ${slide.filepath} (referenced by slide "${slide.title}")`,
      });
    }
  }
}

function validateOrphanedSlideFiles(issues: ValidationIssue[]) {
  const manifestSet = new Set(
    jsxSlides().map((slide) =>
      path.normalize(path.resolve(projectRoot, slide.filepath)),
    ),
  );

  const files = getSlideFilenames().map((name) => path.join(slidesDir, name));

  for (const file of files) {
    if (!manifestSet.has(path.normalize(file))) {
      issues.push({
        message: `Orphaned slide file: ${relativeToProject(file)} (not referenced in manifest)`,
      });
    }
  }
}

function validateSdmSlides(
  issues: ValidationIssue[],
  warnings: Array<string>,
  rollups: Array<string>,
) {
  const io: SdmValidationIo = {
    readFile: (relativePath) => {
      try {
        return readFileSync(path.join(projectRoot, relativePath), 'utf8');
      } catch {
        return null;
      }
    },
    listFiles: (relativeDir) => {
      try {
        return readdirSync(path.join(projectRoot, relativeDir), {
          recursive: true,
          withFileTypes: true,
        })
          .filter((entry) => entry.isFile())
          .map((entry) =>
            relativeToProject(path.join(entry.parentPath, entry.name)).slice(
              `${relativeDir}/`.length,
            ),
          );
      } catch {
        return [];
      }
    },
  };
  const sdmEntries = slides.filter((slide) => slide.kind === 'sdm');
  const report = validateSdmEntries(sdmEntries, io);
  const messages = [...report.errors, ...findOrphanSdmFiles(slides, io)];
  for (const message of messages) {
    issues.push({ message: formatSdmValidationIssue(message) });
  }
  rollups.push(...sdmRollupMessages(messages));
  warnings.push(...report.warnings.map(formatSdmValidationIssue));
}

function printWarnings(warnings: Array<string>) {
  if (warnings.length === 0) {
    return;
  }
  console.warn(`Slide manifest warnings (${warnings.length} warning(s)):\n`);
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

function pendingSdmRepairs(): Array<PendingRepair> {
  const repairs: Array<PendingRepair> = [];
  for (const slide of slides.filter((entry) => entry.kind === 'sdm')) {
    if (!isRepairableSdmFile(slide.id, slide.filepath)) {
      continue;
    }
    const absolutePath = path.join(projectRoot, slide.filepath);
    let original: string;
    try {
      original = readFileSync(absolutePath, 'utf8');
    } catch {
      continue;
    }
    const decoded = decodeYamlValue(original);
    if (!decoded.ok) {
      continue;
    }
    const repair = pendingRepair(
      slide.filepath,
      absolutePath,
      original,
      repairSlideDocument(decoded.value),
      encodeSlideDocumentText,
    );
    if (repair !== undefined) {
      repairs.push(repair);
    }
  }

  return repairs;
}

async function main() {
  const issues: ValidationIssue[] = [];
  const mode = validationMode(process.argv.slice(2));

  try {
    await access(slidesManifestPath);
  } catch {
    console.error(
      'Slide manifest validation failed (1 issue):\n' +
        '- Missing required manifest file: src/data/slides-manifest.json',
    );
    process.exitCode = 1;
    return;
  }

  let rawManifest: unknown;
  let rawManifestSource: string;
  try {
    rawManifestSource = readFileSync(slidesManifestPath, 'utf8');
    rawManifest = JSON.parse(rawManifestSource) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      'Slide manifest validation failed (1 issue):\n' +
        `- Failed to parse src/data/slides-manifest.json: ${message}`,
    );
    process.exitCode = 1;
    return;
  }

  const repairs: Array<PendingRepair> = [];
  if (mode === 'fix') {
    const repairedManifest = repairSlidesManifest(rawManifest);
    rawManifest = repairedManifest.value;
    const manifestRepair = pendingRepair(
      'src/data/slides-manifest.json',
      slidesManifestPath,
      rawManifestSource,
      repairedManifest,
      (value) => `${JSON.stringify(value, null, 2)}\n`,
    );
    if (manifestRepair !== undefined) {
      repairs.push(manifestRepair);
    }
  }
  const parsedManifest = validateSlidesManifest(rawManifest);
  if (!parsedManifest.ok) {
    const manifestIssues = mappedManifestIssues(
      parsedManifest.issues,
      rawManifest,
    );
    console.error(
      `Slide manifest validation failed (${manifestIssues.length} issue(s)):\n`,
    );
    for (const issue of manifestIssues) {
      const issuePath = formatIssuePath(issue.path);
      console.error(`- Invalid manifest at ${issuePath}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  slides = parsedManifest.entries;
  if (mode === 'fix') {
    repairs.push(...pendingSdmRepairs());
    applyRepairs(repairs);
  }

  validateDuplicatePositions(issues);
  validateDuplicateIds(issues);
  validateContiguousPositions(issues);
  validateFilepaths(issues);
  validateOrphanedSlideFiles(issues);
  const warnings: Array<string> = [];
  const rollups: Array<string> = [];
  validateSdmSlides(issues, warnings, rollups);

  if (issues.length > 0) {
    console.error(
      `Slide manifest validation failed (${issues.length} issue(s)):\n`,
    );
    for (const issue of issues) {
      console.error(`- ${issue.message}`);
    }
    for (const rollup of rollups) {
      console.error(`- ${rollup}`);
    }
    printWarnings(warnings);
    process.exitCode = 1;
    return;
  }

  printWarnings(warnings);
  console.log(`✓ Slide manifest is valid (${slides.length} slides)`);
}

const executedPath = process.argv[1];
if (
  executedPath !== undefined &&
  path.resolve(executedPath) === fileURLToPath(import.meta.url)
) {
  await main();
}
