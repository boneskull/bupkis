#!/usr/bin/env node

/**
 * Parse documentation redirects for testing with Playwright.
 *
 * This script:
 *
 * 1. Builds the documentation (npm run docs:build)
 * 2. Parses build logs to extract registered redirects
 * 3. Outputs redirect data for Claude to test with Playwright MCP
 *
 * Usage: node validate-redirects.js [--build] [--port PORT] [--format FORMAT]
 *
 * Options: --build Rebuild documentation before testing --port Port for local
 * server (default: 8080) --format Output format: 'instructions' (default) or
 * 'json'
 *
 * When invoked by Claude Code:
 *
 * - Claude runs this script to get redirect data
 * - Claude starts local server: npx serve docs -p PORT
 * - Claude uses Playwright MCP to test each redirect
 * - Claude verifies redirects and anchors work correctly
 */

/**
 * @typedef {object} Redirect
 * @property {string} name - Assertion name
 * @property {string} redirectPath - Path to redirect from
 * @property {string} targetPath - Full target path with anchor
 * @property {string} targetDocument - Document path without anchor
 * @property {string | null} targetAnchor - Anchor fragment or null
 */

/**
 * @typedef {object} BuildResult
 * @property {boolean} success - Whether build succeeded
 * @property {string[]} logs - Build log lines
 */

/**
 * @typedef {object} CommandResult
 * @property {number} exitCode - Process exit code
 * @property {string} stdout - Standard output
 * @property {string} stderr - Standard error
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '../../../..');

// Terminal colors
const colors = {
  blue: '\x1b[94m',
  cyan: '\x1b[96m',
  green: '\x1b[92m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
  yellow: '\x1b[93m',
};

/**
 * Run a shell command and capture output.
 *
 * @param {string} command - Command to run
 * @param {string[]} args - Command arguments
 * @returns {Promise<CommandResult>}
 */
const runCommand = (command, args = []) =>
  new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += String(data);
    });

    proc.stderr?.on('data', (data) => {
      stderr += String(data);
    });

    proc.on('error', (error) => {
      reject(error);
    });

    proc.on('close', (exitCode) => {
      resolve({ exitCode: exitCode ?? 1, stderr, stdout });
    });
  });

/**
 * Build documentation and return build logs.
 *
 * @returns {Promise<BuildResult>}
 */
const buildDocumentation = async () => {
  console.error(`${colors.blue}Building documentation...${colors.reset}`);

  const { exitCode, stderr, stdout } = await runCommand('npm', [
    'run',
    'docs:build',
  ]);

  const logs = (stdout + stderr).split('\n');

  if (exitCode === 0) {
    console.error(
      `${colors.green}✓ Documentation built successfully${colors.reset}`,
    );
    return { logs, success: true };
  }
  console.error(`${colors.red}✗ Documentation build failed${colors.reset}`);
  return { logs, success: false };
};

/**
 * Parse redirect registration lines from build logs.
 *
 * Expected format: Registered redirect for <name>: <redirect-path> ➡️
 * <target-path>
 *
 * @param {string[]} buildLogs - Build log lines
 * @returns {Redirect[]}
 */
const parseRedirects = (buildLogs) => {
  /** @type {Redirect[]} */
  const redirects = [];
  const pattern = /Registered redirect for (\w+): ([\w\-/]+) ➡️ ([\w\-/#_]+)/;

  for (const line of buildLogs) {
    const match = pattern.exec(line);
    if (match) {
      const [_, name, redirectPath, targetPath] = match;
      if (!targetPath) {
        continue;
      }
      /** @type {string | undefined} */
      let targetDocument = targetPath;
      let targetAnchor = null;

      if (targetPath.includes('#')) {
        [targetDocument, targetAnchor] = targetPath.split('#', 2);
      }

      redirects.push({
        name: /** @type {string} */ (name),
        redirectPath: /** @type {string} */ (redirectPath),
        targetAnchor: /** @type {string | null} */ (targetAnchor),
        targetDocument: /** @type {string} */ (targetDocument),
        targetPath,
      });
    }
  }

  console.error(
    `${colors.blue}Found ${redirects.length} registered redirects${colors.reset}`,
  );
  return redirects;
};

/**
 * Output testing instructions for Claude to follow with Playwright MCP.
 *
 * @param {Redirect[]} redirects - Parsed redirects
 * @param {number} port - Server port
 */
const outputInstructions = (redirects, port) => {
  const baseUrl = `http://localhost:${port}`;

  console.log(`
${colors.cyan}╔═══════════════════════════════════════════════════════════════╗
║         Documentation Redirect Testing Instructions          ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}

${colors.blue}Step 1: Start Documentation Server${colors.reset}
Run in a background shell:
  ${colors.yellow}npx serve docs -p ${port}${colors.reset}

${colors.blue}Step 2: Test Redirects with Playwright MCP${colors.reset}
Found ${colors.cyan}${redirects.length}${colors.reset} redirects to test.

For each redirect below, use Playwright MCP to:
  1. Navigate to the source URL
  2. Verify the page loads successfully (no 404)
  3. Check the final URL matches the expected target
  4. If targetAnchor exists, verify the anchor element is present

${colors.blue}Redirects to Test:${colors.reset}
`);

  for (const redirect of redirects) {
    const sourceUrl = `${baseUrl}/${redirect.redirectPath}`;
    const targetUrl = `${baseUrl}/${redirect.targetPath}`;

    console.log(`${colors.cyan}${redirect.name}${colors.reset}
  Source:  ${colors.yellow}${sourceUrl}${colors.reset}
  Target:  ${colors.green}${targetUrl}${colors.reset}`);

    if (redirect.targetAnchor) {
      console.log(
        `  Anchor:  ${colors.blue}#${redirect.targetAnchor}${colors.reset}`,
      );
    }
    console.log('');
  }

  console.log(`${colors.blue}Step 3: Testing Workflow${colors.reset}
Use Playwright MCP tools:
  • ${colors.yellow}browser_navigate${colors.reset} - Navigate to source URL
  • ${colors.yellow}browser_snapshot${colors.reset} - Check page content
  • Check final URL contains expected target path
  • If anchor exists, verify element with that ID is present

${colors.blue}Step 4: Report Results${colors.reset}
Track:
  ✓ Redirects that work correctly
  ✗ Redirects that fail (404, wrong target, missing anchor)

${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}
`);
};

/**
 * Output redirect data in JSON format.
 *
 * @param {Redirect[]} redirects - Parsed redirects
 * @param {number} port - Server port
 */
const outputJSON = (redirects, port) => {
  const data = {
    baseUrl: `http://localhost:${port}`,
    port,
    redirectCount: redirects.length,
    redirects: redirects.map((r) => ({
      name: r.name,
      source: r.redirectPath,
      sourceUrl: `http://localhost:${port}/${r.redirectPath}`,
      target: r.targetPath,
      targetAnchor: r.targetAnchor,
      targetDocument: r.targetDocument,
      targetUrl: `http://localhost:${port}/${r.targetPath}`,
    })),
  };

  console.log(JSON.stringify(data, null, 2));
};

/**
 * Main entry point.
 *
 * @returns {Promise<number>}
 */
const main = async () => {
  const { values } = parseArgs({
    options: {
      build: {
        default: false,
        type: 'boolean',
      },
      format: {
        default: 'instructions',
        type: 'string',
      },
      port: {
        default: '8080',
        type: 'string',
      },
    },
  });

  const shouldBuild = values.build ?? false;
  const port = parseInt(values.port ?? '8080', 10);
  const format = values.format ?? 'instructions';

  if (isNaN(port)) {
    throw new Error(`Invalid port: ${values.port}`);
  }

  // Check if docs directory exists
  const docsDir = resolve(PROJECT_ROOT, 'docs');
  const docsExist = existsSync(docsDir);

  if (shouldBuild || !docsExist) {
    const { logs, success } = await buildDocumentation();
    if (!success) {
      console.error(
        `${colors.red}Build failed, cannot extract redirects${colors.reset}`,
      );
      return 1;
    }

    // Parse redirects from build logs
    const redirects = parseRedirects(logs);

    if (redirects.length === 0) {
      console.error(
        `${colors.yellow}⚠ No redirects found in build logs${colors.reset}`,
      );
      return 0;
    }

    // Output in requested format
    if (format === 'json') {
      outputJSON(redirects, port);
    } else {
      outputInstructions(redirects, port);
    }

    return 0;
  }
  console.error(
    `${colors.yellow}Documentation exists. Use --build to rebuild and extract redirects.${colors.reset}`,
  );
  console.error(
    `${colors.blue}Hint: node validate-redirects.js --build${colors.reset}`,
  );
  return 0;
};

// Run main and exit with status code
main()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    const message =
      error instanceof Error ? error.message : String(error ?? 'Unknown error');
    console.error(`${colors.red}Error: ${message}${colors.reset}`);
    process.exit(1);
  });
