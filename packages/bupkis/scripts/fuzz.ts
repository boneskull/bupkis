#!/usr/bin/env -S node --import tsx --no-warnings
/**
 * Fuzzing orchestrator for bupkis property tests.
 *
 * Creates a process pool and distributes property tests across available CPU
 * cores, running each test with 1 million iterations.
 *
 * @packageDocumentation
 */

import { type ChildProcess, fork } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { WorkerMessage, WorkerResult } from './fuzz-worker.js';

import { getFuzzTargetIds } from '../test/property/fuzzing-registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(__dirname, '..', '.fuzzing-results');
const WORKER_PATH = join(__dirname, 'fuzz-worker.ts');

/**
 * Runtime statistics for the fuzzing session.
 *
 * Tracks progress, pass/fail counts, and timing information displayed in the
 * progress output and final summary.
 */
interface FuzzStats {
  /** Total number of fuzz targets that have finished (passed or failed). */
  completed: number;

  /** Number of fuzz targets that failed. */
  failed: number;

  /**
   * Set of target IDs currently being executed by worker processes. Used to
   * track active work and calculate overall progress.
   */
  inProgress: Set<string>;

  /** Number of fuzz targets that passed all iterations. */
  passed: number;

  /** Timestamp (ms since epoch) when fuzzing began. Used for duration display. */
  startTime: number;
}

const stats: FuzzStats = {
  completed: 0,
  failed: 0,
  inProgress: new Set(),
  passed: 0,
  startTime: Date.now(),
};

const failures: WorkerResult[] = [];
let targetQueue: string[] = [];
let shuttingDown = false;

const ensureResultsDir = async (): Promise<void> => {
  await mkdir(RESULTS_DIR, { recursive: true });
};

const writeFailure = async (result: WorkerResult): Promise<void> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `failure-${result.targetId.replace(/[:/]/g, '_')}-${timestamp}.log`;
  const filepath = join(RESULTS_DIR, filename);

  const content = [
    `Target: ${result.targetId}`,
    `Timestamp: ${new Date().toISOString()}`,
    `Seed: ${result.seed}`,
    `Runs: ${result.numRuns}`,
    '',
    'Error:',
    result.error ?? 'Unknown error',
    '',
    'Counterexample:',
    JSON.stringify(result.counterexample, null, 2),
  ].join('\n');

  await writeFile(filepath, content, 'utf-8');
  console.log(`  📝 Failure logged: ${filename}`);
};

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

const printProgress = (): void => {
  const elapsed = Date.now() - stats.startTime;
  const total = targetQueue.length + stats.completed + stats.inProgress.size;
  const percent =
    total > 0 ? ((stats.completed / total) * 100).toFixed(1) : '0';

  process.stdout.write(
    `\r⏳ Progress: ${stats.completed}/${total} (${percent}%) | ` +
      `✅ ${stats.passed} passed | ❌ ${stats.failed} failed | ` +
      `⏱️  ${formatDuration(elapsed)}   `,
  );
};

const printSummary = (): void => {
  const elapsed = Date.now() - stats.startTime;
  const total = stats.completed;

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  FUZZING SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Total tests run:  ${total}`);
  console.log(`  Passed:           ${stats.passed}`);
  console.log(`  Failed:           ${stats.failed}`);
  console.log(`  Duration:         ${formatDuration(elapsed)}`);
  console.log('═'.repeat(60));

  if (failures.length > 0) {
    console.log('\n  Failed tests:');
    for (const failure of failures) {
      console.log(`    ❌ ${failure.targetId}`);
    }
    console.log(`\n  See ${RESULTS_DIR} for failure details.`);
  }
};

const createWorkerProcess = (): ChildProcess =>
  fork(WORKER_PATH, [], {
    execArgv: ['--import', 'tsx', '--no-warnings'],
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });

const runWorkerProcess = async (child: ChildProcess): Promise<void> =>
  new Promise((resolve) => {
    const processNext = (): void => {
      if (shuttingDown || targetQueue.length === 0) {
        child.kill();
        resolve();
        return;
      }

      const targetId = targetQueue.shift()!;
      stats.inProgress.add(targetId);

      const message: WorkerMessage = { targetId, type: 'run' };
      child.send(message);
    };

    child.on('message', (result: WorkerResult) => {
      stats.inProgress.delete(result.targetId);
      stats.completed++;

      if (result.success) {
        stats.passed++;
      } else {
        stats.failed++;
        failures.push(result);
        void writeFailure(result);
      }

      printProgress();
      processNext();
    });

    child.on('error', (err) => {
      console.error(`\nWorker error: ${err.message}`);
      processNext();
    });

    child.on('exit', (code) => {
      if (code !== 0 && !shuttingDown) {
        console.error(`\nWorker exited with code ${code}`);
      }
      resolve();
    });

    child.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('ExperimentalWarning')) {
        console.error(`\nWorker stderr: ${msg}`);
      }
    });

    processNext();
  });

const main = async (): Promise<void> => {
  if (process.env.CI) {
    console.error('⚠️  Fuzzing is not intended to run in CI environments.');
    console.error('   Set CI=false or run locally for fuzzing.');
    process.exit(1);
  }

  console.log('🔥 Bupkis Property Test Fuzzer');
  console.log('═'.repeat(60));

  await ensureResultsDir();

  const allTargets = getFuzzTargetIds();
  targetQueue = [...allTargets];
  const totalTargets = targetQueue.length;

  console.log(`  Found ${totalTargets} fuzz targets`);

  const numCores = cpus().length;
  const numWorkers = Math.min(numCores - 1, totalTargets, 8);

  console.log(
    `  Using ${numWorkers} worker processes (${numCores} cores available)`,
  );
  console.log(`  Each test runs 1,000,000 iterations`);
  console.log('═'.repeat(60));
  console.log('');

  process.on('SIGINT', () => {
    if (shuttingDown) {
      console.log('\n\nForce quit.');
      process.exit(1);
    }
    shuttingDown = true;
    console.log('\n\n⚠️  Shutting down gracefully... (Ctrl+C again to force)');
  });

  const workers = Array.from({ length: numWorkers }, () =>
    createWorkerProcess(),
  );
  const workerPromises = workers.map((worker) => runWorkerProcess(worker));

  await Promise.all(workerPromises);

  printSummary();

  process.exit(stats.failed > 0 ? 1 : 0);
};

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
