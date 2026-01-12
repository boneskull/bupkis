/**
 * Fuzz worker module.
 *
 * Runs individual property tests with high iteration counts and reports results
 * back to the parent process.
 *
 * @packageDocumentation
 */

import fc from 'fast-check';

import {
  type FuzzTarget,
  getFuzzTargetById,
} from '../test/property/fuzzing-registry.js';

const NUM_RUNS = process.env.FUZZ_NUM_RUNS
  ? parseInt(process.env.FUZZ_NUM_RUNS, 10)
  : 1_000_000;

/**
 * Message sent from the orchestrator to a worker process to request execution
 * of a fuzz target.
 */
export interface WorkerMessage {
  /** The unique identifier of the fuzz target to run. */
  targetId: string;

  /** Message type discriminator. Currently only 'run' is supported. */
  type: 'run';
}

/**
 * Result sent from a worker process back to the orchestrator after completing
 * (or failing) a fuzz target.
 */
export interface WorkerResult {
  /**
   * If the property check failed, the counterexample that caused the failure.
   * This is the minimal shrunk example produced by fast-check.
   */
  counterexample?: unknown;

  /**
   * Human-readable error message if the test failed.
   */
  error?: string;

  /**
   * Number of test iterations actually executed before the test completed or
   * failed.
   */
  numRuns: number;

  /**
   * The random seed used for this test run. Can be used to reproduce failures.
   */
  seed?: number;

  /** Whether the property check passed all iterations. */
  success: boolean;

  /** The ID of the fuzz target that was executed. */
  targetId: string;
}

const runFuzzTarget = async (target: FuzzTarget): Promise<WorkerResult> => {
  const { id, isAsync, property } = target;

  try {
    let result: fc.RunDetails<unknown>;

    if (isAsync) {
      result = await fc.check(property as fc.IAsyncProperty<unknown>, {
        numRuns: NUM_RUNS,
      });
    } else {
      result = fc.check(property as fc.IProperty<unknown>, {
        numRuns: NUM_RUNS,
      });
    }

    if (result.failed) {
      let errorMessage = 'Property check failed';
      if ('error' in result && result.error) {
        if (result.error instanceof Error) {
          errorMessage = result.error.message;
        } else if (typeof result.error === 'string') {
          errorMessage = result.error;
        } else {
          errorMessage = JSON.stringify(result.error);
        }
      }

      return {
        counterexample: result.counterexample,
        error: errorMessage,
        numRuns: result.numRuns,
        seed: result.seed,
        success: false,
        targetId: id,
      };
    }

    return {
      numRuns: result.numRuns,
      seed: result.seed,
      success: true,
      targetId: id,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      numRuns: 0,
      success: false,
      targetId: id,
    };
  }
};

const handleMessage = async (message: WorkerMessage): Promise<void> => {
  if (message.type !== 'run') {
    return;
  }

  const target = getFuzzTargetById(message.targetId);
  if (!target) {
    process.send?.({
      error: `Unknown target: ${message.targetId}`,
      numRuns: 0,
      success: false,
      targetId: message.targetId,
    } satisfies WorkerResult);
    return;
  }

  const result = await runFuzzTarget(target);
  process.send?.(result);
};

process.on('message', (message: WorkerMessage) => {
  void handleMessage(message);
});
