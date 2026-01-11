/**
 * This script finds all builtin assertions and dumps a mapping of their IDs to
 * string representations to the console.
 *
 * It can optionally be filtered by collection. The collections are:
 *
 * - `all` (default)
 * - `sync` - maps to `SyncAssertions`
 * - `sync-basic` - maps to `SyncBasicAssertions`
 * - `sync-parametric` - maps to `SyncParametricAssertions`
 * - `sync-collection` - maps to `SyncCollectionAssertions`
 * - `sync-esoteric` - maps to `SyncEsotericAssertions`
 * - `async` - maps to `AsyncAssertions`
 * - `async-parametric` - maps to `AsyncSyncParametricAssertions`
 *
 * This script uses `parseArgs` from `node:util` and dumps values using
 * `console.dir()`.
 *
 * Usage:
 *
 * ```sh
 * npx tsx scripts/dump-assertion-ids.ts [--collection <collection>]
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
  AsyncParametricAssertions,
} from '../src/assertion/impl/async.js';
import {
  SyncAssertions,
  SyncCollectionAssertions,
  SyncEsotericAssertions,
  SyncParametricAssertions,
} from '../src/assertion/impl/sync.js';

const { fromEntries, keys } = Object;

// Define collection mappings
const collections = /** @type {const} */ {
  all: [...SyncAssertions, ...AsyncAssertions],
  async: AsyncAssertions,
  'async-parametric': AsyncParametricAssertions,
  sync: SyncAssertions,
  'sync-collection': SyncCollectionAssertions,
  'sync-esoteric': SyncEsotericAssertions,
  'sync-parametric': SyncParametricAssertions,
};

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
    `Error: Unknown collection "${collection}". Valid collections are: ${keys(collections).join(', ')}`,
  );
  process.exit(1);
}

// Get assertions for the specified collection
const assertions = collections[collection as keyof typeof collections];

// Extract IDs and dump them
const ids = fromEntries(
  assertions.map(
    (assertion: (typeof collections)[keyof typeof collections][number]) => [
      assertion.id,
      `${assertion}`,
    ],
  ),
);

console.dir(ids, { sorted: true });
