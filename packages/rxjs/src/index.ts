/**
 * RxJS Observable assertions for Bupkis.
 *
 * This package provides type-safe, natural-language assertions for RxJS
 * Observables. All assertions are asynchronous since Observable operations are
 * inherently async.
 *
 * @example
 *
 * ```typescript
 * import { use } from 'bupkis';
 * import { rxjsAssertions } from '@bupkis/rxjs';
 *
 * const { expect, expectAsync } = use(rxjsAssertions);
 *
 * // Completion assertions
 * await expectAsync(of(1, 2, 3), 'to complete');
 * await expectAsync(EMPTY, 'to be empty');
 *
 * // Error assertions
 * await expectAsync(
 *   throwError(() => new Error('oops')),
 *   'to emit error',
 * );
 * await expectAsync(
 *   throwError(() => new Error('oops')),
 *   'to emit error',
 *   'oops',
 * );
 *
 * // Value assertions
 * await expectAsync(of('foo', 'bar'), 'to emit values', ['foo', 'bar']);
 * await expectAsync(of(1, 2, 3), 'to emit times', 3);
 * await expectAsync(of(42), 'to emit once');
 *
 * // Completion value assertions
 * await expectAsync(of(1, 2, 'final'), 'to complete with value', 'final');
 * ```
 *
 * @packageDocumentation
 */

export { rxjsAssertions } from './assertions.js';
export { rxjsAssertions as default } from './assertions.js';
