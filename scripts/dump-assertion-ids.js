/**
 * This script finds all builtin assertions and dumps a mapping of their IDs to
 * string representations to the console.
 *
 * It can optionally be filtered by collection. The collections are:
 *
 * - `all` (default)
 * - `sync` - maps to `SyncAssertions` from `src/assertion/impl/sync.ts`
 * - `sync-basic` - maps to `BasicAssertions` from
 *   src/assertion/impl/sync-basic.ts`
 * - `sync-parametric` - maps to `ParametricAssertions` from
 *   `src/assertion/impl/sync-parametric.ts`
 * - `sync-collection` - maps to `CollectionAssertions` from
 *   `src/assertion/impl/sync-collection.ts`
 * - `sync-esoteric` - maps to `EsotericAssertions` from
 *   `src/assertion/impl/sync-esoteric.ts`
 * - `async` - maps to `AsyncAssertions` from `src/assertion/impl/async.ts`
 * - `async-callback` - maps to `CallbackAsyncAssertions` from
 *   `src/assertion/impl/callback.ts`
 * - `sync-callback` - maps to `CallbackSyncAssertions` from
 *   `src/assertion/impl/callback.ts`
 *
 * This script uses `parseArgs` from `node:util` and dumps values using
 * `console.dir()`.
 *
 * Usage:
 *
 * ```sh
 * node scripts/dump-assertion-ids.js [--collection <collection>]
 * ```
 *
 * Before modifying or adding an assertion, run this script and pipe the output
 * to a temp file. Then, after your changes, run it again piped to a second temp
 * file. Finally, diff the changes. This will tell you which assertion IDs
 * changed and must be updated in property tests.
 *
 * @packageDocumentation
 */

import { parseArgs } from 'node:util';

// Import assertion collections
import {
  AsyncAssertions,
  CallbackAsyncAssertions,
  PromiseAssertions,
} from '../dist/esm/assertion/impl/async.js';
import {
  BasicAssertions,
  CallbackSyncAssertions,
  CollectionAssertions,
  EsotericAssertions,
  ParametricAssertions,
  SyncAssertions,
} from '../dist/esm/assertion/impl/sync.js';

// Define collection mappings
const collections = /** @type {const} */ ({
  all: [...SyncAssertions, ...AsyncAssertions],
  async: AsyncAssertions,
  'async-callback': CallbackAsyncAssertions,
  promise: PromiseAssertions,
  sync: SyncAssertions,
  'sync-basic': BasicAssertions,
  'sync-callback': CallbackSyncAssertions,
  'sync-collection': CollectionAssertions,
  'sync-esoteric': EsotericAssertions,
  'sync-parametric': ParametricAssertions,
});

// Parse command line arguments
const { values } = parseArgs({
  options: {
    collection: {
      default: 'all',
      short: 'c',
      type: 'string',
    },
  },
});

const { collection } = values;

// Validate collection parameter
if (!(collection in collections)) {
  console.error(
    `Error: Unknown collection "${collection}". Valid collections are: ${Object.keys(collections).join(', ')}`,
  );
  process.exit(1);
}

// Get assertions for the specified collection
const assertions =
  collections[/** @type {keyof typeof collections} */ (collection)];

// Extract IDs and dump them
const ids = Object.fromEntries(
  assertions.map(
    /** @param {(typeof collections)[keyof typeof collections][number]} assertion */ (
      assertion,
    ) => [assertion.id, `${assertion}`],
  ),
);

console.dir(ids, { sorted: true });
