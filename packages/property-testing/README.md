# @bupkis/property-testing

Property-based testing harness for [bupkis](https://bupkis.zip) assertions.

This package provides utilities for systematically testing bupkis assertions using [fast-check](https://fast-check.dev). It handles the boilerplate of testing all four assertion variants (valid, invalid, valid-negated, invalid-negated) so you can focus on defining your generators.

## Installation

```bash
npm install @bupkis/property-testing --save-dev
```

**Peer dependencies:**

- `bupkis` >= 0.15.0
- `fast-check` >= 4.0.0

## Quick Start

```ts
import {
  createPropertyTestHarness,
  extractPhrases,
  filteredAnything,
  getVariants,
  type PropertyTestConfig,
} from '@bupkis/property-testing';
import fc from 'fast-check';
import { describe, it } from 'node:test';

import { expect, expectAsync } from './my-assertions.js';
import { myAssertion } from './my-assertion.js';

// Create the harness with your expect functions
const { runVariant } = createPropertyTestHarness({ expect, expectAsync });

// Define test configuration
const testConfig: PropertyTestConfig = {
  valid: {
    generators: [
      fc.integer().filter((n) => n % 2 === 0), // even numbers
      fc.constantFrom(...extractPhrases(myAssertion)),
    ],
  },
  invalid: {
    generators: [
      fc.integer().filter((n) => n % 2 !== 0), // odd numbers
      fc.constantFrom(...extractPhrases(myAssertion)),
    ],
  },
};

describe('myAssertion', () => {
  const { variants, params } = getVariants(testConfig);

  for (const [variantName, variant] of variants) {
    it(`should handle ${variantName} inputs`, async () => {
      await runVariant(variant, {}, params, variantName, myAssertion);
    });
  }
});
```

## Core Concepts

### The Four Variants

Every bupkis assertion can be tested in four ways:

| Variant          | Description                                  |
| ---------------- | -------------------------------------------- |
| `valid`          | Input that should pass the assertion         |
| `invalid`        | Input that should fail the assertion         |
| `validNegated`   | Input that should pass the negated assertion |
| `invalidNegated` | Input that should fail the negated assertion |

For most assertions, `validNegated` defaults to `invalid` and `invalidNegated` defaults to `valid` (since negation inverts the logic). You only need to specify them explicitly when the negated behavior differs.

### PropertyTestConfig

```ts
interface PropertyTestConfig {
  valid: PropertyTestConfigVariant;
  invalid: PropertyTestConfigVariant;
  validNegated?: PropertyTestConfigVariant; // defaults to invalid
  invalidNegated?: PropertyTestConfigVariant; // defaults to valid
  runSize?: 'small' | 'medium' | 'large'; // controls numRuns
}
```

### Variant Types

There are several ways to define a variant:

#### Generator Tuple (Most Common)

```ts
{
  generators: [
    fc.string(), // subject
    fc.constantFrom('to be a string', 'to be str'), // phrase
    // ... additional params for parametric assertions
  ];
}
```

#### Single Generator

```ts
{
  generators: fc.tuple(fc.string(), fc.constantFrom('to be a string'));
}
```

#### Async Generators

```ts
{
  async: true,
  generators: [
    fc.constant(Promise.resolve('value')),
    fc.constantFrom('to resolve to', 'to fulfill with'),
    fc.string(),
  ]
}
```

#### Custom Property

```ts
{
  property: () =>
    fc.property(fc.string(), (s) => {
      expect(s, 'to be a string');
    });
}
```

## API Reference

### `createPropertyTestHarness(context)`

Creates a property test harness with dependency-injected expect functions.

```ts
const { runVariant } = createPropertyTestHarness({
  expect: myExpect,
  expectAsync: myExpectAsync,
});
```

**Returns:**

- `runVariant(variant, defaults, params, variantName, assertion)` - Runs a single variant test
- Plus individual expectation helpers for advanced use cases

### `expectUsing(assertion, args, options?)`

Directly executes a sync assertion, bypassing phrase matching. This is useful for:

- Verifying that generated inputs actually work with the target assertion
- Testing assertion logic independently of the phrase-matching system
- Catching generator bugs that produce invalid inputs

```ts
import {
  expectUsing,
  PropertyTestGeneratorError,
} from '@bupkis/property-testing';
import { myAssertion } from './my-assertion.js';

// Execute the assertion directly
expectUsing(myAssertion, [42, 'to be even']);

// Test negated behavior
expectUsing(myAssertion, [43, 'to be even'], { negated: true });
```

**Throws:**

- `PropertyTestGeneratorError` - If arguments don't parse for the assertion (generator bug)
- `AssertionError` - If assertion fails (in non-negated mode)
- `NegatedAssertionError` - If assertion passes (in negated mode)

### `expectUsingAsync(assertion, args, options?)`

Async version of `expectUsing` for testing async assertions.

```ts
import { expectUsingAsync } from '@bupkis/property-testing';
import { myAsyncAssertion } from './my-assertion.js';

await expectUsingAsync(myAsyncAssertion, [promise, 'to resolve to', 42]);
```

### `extractPhrases(assertion)`

Extracts phrase literals from an assertion definition for use with `fc.constantFrom()`.

```ts
import { myAssertion } from './my-assertion.js';

const phrases = extractPhrases(myAssertion);
// e.g., ['to be even', 'to be an even number']

const phraseGen = fc.constantFrom(...phrases);
```

### `getVariants(config)`

Extracts variants and parameters from a `PropertyTestConfig`, applying defaults for negated variants.

```ts
const { variants, params } = getVariants(testConfig);

for (const [name, variant] of variants) {
  // name: 'valid' | 'invalid' | 'validNegated' | 'invalidNegated'
  // variant: PropertyTestConfigVariant
}
```

### Utility Functions

#### `filteredAnything`

A `fc.anything()` generator that filters out objects with problematic keys (`__proto__`, `valueOf`, `toString`) and empty objects that could break Zod validation.

```ts
{
  generators: [
    filteredAnything.filter((v) => typeof v !== 'string'),
    fc.constantFrom('to not be a string'),
  ];
}
```

#### `filteredObject`

Like `filteredAnything` but only generates objects.

#### `objectFilter(value)`

The filter function used by `filteredAnything` and `filteredObject`. Use it to filter your own generators:

```ts
fc.array(fc.anything()).filter(objectFilter);
```

#### `hasKeyDeep(obj, key)`

Recursively searches for a key in a nested structure. Handles circular references.

```ts
hasKeyDeep({ a: { b: { c: 1 } } }, 'c'); // true
hasKeyDeep({ a: { b: 1 } }, 'c'); // false
```

#### `hasValueDeep(obj, value)`

Recursively searches for a value in a nested structure. Uses strict equality with special handling for empty objects.

```ts
hasValueDeep({ a: { b: 42 } }, 42); // true
hasValueDeep({ a: { b: {} } }, {}); // true (empty objects match)
```

#### `safeRegexStringFilter(str)`

Removes regex metacharacters from a string. Useful when generating strings that will be used in regex patterns.

```ts
fc.string().map(safeRegexStringFilter);
```

#### `calculateNumRuns(runSize?)`

Calculates the number of test runs based on the environment:

- **Wallaby**: 1/10th of base (fast feedback)
- **CI**: 1/5th of base (balanced)
- **Local**: Full base runs

```ts
const numRuns = calculateNumRuns('medium'); // 250 locally, 50 in CI, 25 in Wallaby
```

Run sizes:

- `small`: 50 base runs
- `medium`: 250 base runs (default)
- `large`: 500 base runs

### Error Types

#### `PropertyTestGeneratorError`

Thrown when `expectUsing` or `expectUsingAsync` receives arguments that don't parse for the assertion. This indicates a bug in your property generator—the generated inputs don't match the assertion's schema.

```ts
import { PropertyTestGeneratorError } from '@bupkis/property-testing';

try {
  expectUsing(numberAssertion, ['not a number', 'to be positive']);
} catch (error) {
  if (error instanceof PropertyTestGeneratorError) {
    console.log(error.assertionId); // The assertion that rejected the input
    console.log(error.args); // The invalid arguments
  }
}
```

#### `WrongAssertionError`

Thrown when testing `invalid` or `invalidNegated` variants and a different assertion than expected handles the error. This catches cases where your generator produces inputs that match a different assertion.

```ts
import { WrongAssertionError } from '@bupkis/property-testing';

// If testing stringAssertion but numberAssertion catches the error instead:
// WrongAssertionError: Wrong assertion failed: expected 'string-assertion',
// but 'number-assertion' failed instead.
```

## Assertion Applicability Registry

For testing compositional assertions (like `'and'` chains), the package provides an **applicability registry** system. This maps runtime values to assertions that would pass or fail for them, enabling data-first generation of valid/invalid assertion chains.

### Core Concept

Instead of generating random assertions and hoping they match random values, the registry lets you:

1. Generate a diverse value
2. Query which assertions would pass/fail for that value
3. Build valid or invalid assertion chains accordingly

### Creating a Registry

```ts
import {
  createApplicabilityRegistry,
  type ApplicabilityAssertionMap,
} from '@bupkis/property-testing';
import { assertions } from 'bupkis';

// assertions object must have properties like stringAssertion, numberAssertion, etc.
const registry = createApplicabilityRegistry(
  assertions as ApplicabilityAssertionMap,
);
```

Or use the lazy-loaded default registry:

```ts
import { getApplicabilityRegistry } from '@bupkis/property-testing';

const registry = await getApplicabilityRegistry();
```

### Querying the Registry

```ts
import {
  getApplicableAssertions,
  getInapplicableAssertions,
} from '@bupkis/property-testing';

const value = 42;

// Get assertions that would PASS for this value
const applicable = getApplicableAssertions(value, registry);
// e.g., [numberAssertion, integerAssertion, positiveAssertion, ...]

// Get assertions that would FAIL for this value
const inapplicable = getInapplicableAssertions(value, registry);
// e.g., [stringAssertion, booleanAssertion, nullAssertion, ...]
```

### Chain Generators

For testing `'and'` chains, use the built-in chain arbitraries:

```ts
import {
  diverseValueArbitrary,
  validChainArbitrary,
  invalidChainArbitrary,
  validNegatedChainArbitrary,
  invalidNegatedChainArbitrary,
} from '@bupkis/property-testing';

// Generate values covering many type categories
const valueGen = diverseValueArbitrary();

// Generate valid 'and' chains (all assertions pass)
const validChainGen = validChainArbitrary(registry, { maxChainLength: 4 });

// Generate invalid 'and' chains (at least one assertion fails)
const invalidChainGen = invalidChainArbitrary(registry);

// For negated assertions
const validNegatedGen = validNegatedChainArbitrary(registry);
const invalidNegatedGen = invalidNegatedChainArbitrary(registry);
```

Each chain generator returns `ChainArgs`:

```ts
interface ChainArgs {
  args: readonly unknown[]; // [subject, phrase1, 'and', phrase2, ...]
  chainLength: number; // Number of assertions in the chain
  subject: unknown; // The generated subject value
}

// Use with expect:
const { args } = validChainGen.generate(fc.random(42)).value;
expect(...args);
```

### AssertionApplicability Interface

Each registry entry has this shape:

```ts
interface AssertionApplicability {
  appliesTo: (value: unknown) => boolean; // Predicate for this assertion
  assertion: AnySyncAssertion; // The assertion object
  phrases: readonly [string, ...string[]]; // Phrase literals
}
```

### Extending the Registry

The registry covers non-parametric sync-basic assertions. To add custom assertions:

```ts
import { extractPhrases } from '@bupkis/property-testing';

const customEntries = [
  {
    appliesTo: (v) => typeof v === 'string' && v.startsWith('http'),
    assertion: myUrlAssertion,
    phrases: extractPhrases(myUrlAssertion),
  },
];

const extendedRegistry = [...registry, ...customEntries];
```

## Environment Variables

- `WALLABY` - Set when running in Wallaby.js (reduces runs by 10x)
- `CI` - Set in CI environments (reduces runs by 5x)
- `NUM_RUNS` - Override the number of runs directly

## License

Copyright © 2026 [Christopher "boneskull" Hiller][boneskull]. Licensed under [BlueOak-1.0.0](https://blueoakcouncil.org/license/1.0.0).

[boneskull]: https://github.com/boneskull
