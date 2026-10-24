import { readFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import type { Plugin, ViteDevServer } from 'vite';

import { decodeYamlValue } from './core/serialization';

const SDM_FILE = /\/src\/data\/slides\/([^/]+)\.sdm\.yaml$/;

/** The Tailwind root, relative to the Vite root. */
const STYLESHEET_ROOT = 'src/index.css';

/** Files Tailwind scans for class candidates. */
const SCANNED_SOURCE = /\.(?:[cm]?[jt]sx?|html|ya?ml|json|md|svg)$/;
const UNSCANNED_DIR = /\/(?:node_modules|dist|\.slide-thumbnails)\//;

const SETTLE_INTERVAL_MS = 25;
const SETTLE_DEADLINE_MS = 600;
const RECENT_WRITE_MS = 250;
const NEW_SOURCE_DEBOUNCE_MS = 100;

function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Vite reads the stylesheet root when the deck re-fetches it after a change,
 * and that read can land mid-write for writers that truncate before writing.
 * An empty or half-written root compiles to a sheet without utilities, and
 * chokidar folds a write that completes within 50ms of the truncation into
 * the same change event, so nothing re-reads the file: the deck stays
 * unstyled until an unrelated source changes or the dev server restarts.
 * Hand Tailwind a non-empty read that is stable across two polls instead.
 */
async function readSettledStylesheet(file: string): Promise<string> {
  let previous = await readFile(file, 'utf8');
  const { mtimeMs } = await stat(file);
  if (previous.length > 0 && Date.now() - mtimeMs > RECENT_WRITE_MS) {
    return previous;
  }
  const deadline = Date.now() + SETTLE_DEADLINE_MS;
  while (Date.now() < deadline) {
    await sleep(SETTLE_INTERVAL_MS);
    const current = await readFile(file, 'utf8');
    if (current.length > 0 && current === previous) {
      return current;
    }
    previous = current;
  }

  return previous;
}

/**
 * Tailwind rescans the deck only when the stylesheet root or a source it has
 * already scanned changes; a file that did not exist at the last scan never
 * invalidates it. Classes used only in a newly created slide are therefore
 * missing until an existing file is edited or the dev server restarts.
 * Re-request the root when a scannable source appears.
 */
function refreshStylesheetOnNewSources(
  server: ViteDevServer,
  stylesheetRoot: string,
): void {
  const root = toPosixPath(server.config.root);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const refresh = () => {
    timer = undefined;
    const modules = server.moduleGraph.getModulesByFile(stylesheetRoot);
    if (!modules || modules.size === 0) {
      return;
    }
    const timestamp = Date.now();
    const updates = [];
    for (const mod of modules) {
      server.moduleGraph.invalidateModule(mod, undefined, timestamp, true);
      updates.push({
        type: 'js-update' as const,
        path: mod.url,
        acceptedPath: mod.url,
        timestamp,
      });
    }
    server.ws.send({ type: 'update', updates });
  };

  server.watcher.on('add', (file: string) => {
    const added = toPosixPath(file);
    if (
      !added.startsWith(`${root}/`) ||
      UNSCANNED_DIR.test(added) ||
      !SCANNED_SOURCE.test(added)
    ) {
      return;
    }
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(refresh, NEW_SOURCE_DEBOUNCE_MS);
  });
}

export function sdmVitePlugin(): Plugin {
  let stylesheetRoot = '';

  return {
    name: 'sdm-documents',
    enforce: 'pre',

    configResolved(config) {
      stylesheetRoot = `${toPosixPath(config.root)}/${STYLESHEET_ROOT}`;
    },

    configureServer(server) {
      refreshStylesheetOnNewSources(server, stylesheetRoot);
    },

    load(id) {
      if (toPosixPath(id) !== stylesheetRoot) {
        return null;
      }

      return readSettledStylesheet(id);
    },

    transform(code, id) {
      if (!SDM_FILE.test(id.replace(/\\/g, '/'))) {
        return null;
      }
      const decoded = decodeYamlValue(code);
      if (!decoded.ok) {
        throw new Error(decoded.message);
      }

      return {
        code: `export default ${JSON.stringify(decoded.value)};`,
        map: null,
      };
    },

    handleHotUpdate(ctx) {
      const match = SDM_FILE.exec(ctx.file.replace(/\\/g, '/'));
      if (!match) {
        return;
      }
      const ownModuleOnly =
        ctx.modules.length > 0 &&
        ctx.modules.every((module) => module.file === ctx.file);
      if (!ownModuleOnly) {
        return;
      }
      const decoded = decodeYamlValue(readFileSync(ctx.file, 'utf8'));
      if (!decoded.ok) {
        return;
      }
      ctx.server.ws.send({
        type: 'custom',
        event: 'sdm:documentChanged',
        data: { slideId: match[1], document: decoded.value },
      });

      return [];
    },
  };
}
