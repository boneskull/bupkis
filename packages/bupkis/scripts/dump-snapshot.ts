import Module from 'node:module';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { fromCharCode } = String;
const { entries } = Object;

const { positionals: filepaths } = parseArgs({
  allowPositionals: true,
});

if (filepaths.length === 0) {
  console.error(
    'Error: Please provide at least one snapshot file path as an argument.',
  );
  process.exit(1);
}

console.error(`Dumping snapshots from files: ${filepaths.join(', ')}`);
const require = Module.createRequire(import.meta.url);

/**
 * Converts escaped unicode sequences and newlines to actual characters
 *
 * @function
 */
const unescapeString = (str: string): string => {
  const processed = str
    .replace(/\\u([0-9a-fA-F]{4})/g, (_match, code: string) =>
      fromCharCode(parseInt(code, 16)),
    )
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .trim();

  // Remove surrounding quotes
  return processed.substring(1, processed.length - 1);
};

for (const filepath of filepaths) {
  try {
    const resolved = path.resolve(filepath);
    const snapshot = require(resolved) as Record<string, string>;
    for (const [key, value] of entries(snapshot)) {
      console.log(`// Snapshot: ${key}`);
      // Unescape the string to convert \u001b[32m to actual ANSI codes
      const unescapedValue = unescapeString(value);
      console.log(`${unescapedValue}\n`);
    }
  } catch (error) {
    console.error(`Error importing snapshot from "${filepath}":`, error);
    process.exit(1);
  }
}
