# @bupkis/from-chai

Migrate Chai assertions to [bupkis](https://github.com/boneskull/bupkis) with a single command.

Supports both **BDD style** (`expect/should`) and **TDD style** (`assert`) assertions.

## Installation

```bash
npx @bupkis/from-chai
```

Or install locally:

```bash
npm install -D @bupkis/from-chai
```

## Usage

### CLI

```bash
# Transform all test files in current directory
npx bupkis-from-chai

# Transform specific patterns
npx bupkis-from-chai "src/**/*.test.ts" "test/**/*.spec.ts"

# Dry run (see what would change without writing)
npx bupkis-from-chai --dry-run

# Exclude patterns
npx bupkis-from-chai --exclude "**/fixtures/**"

# Strict mode (fail on any unsupported assertion)
npx bupkis-from-chai --strict
```

### Programmatic API

```typescript
import { transform, transformCode } from '@bupkis/from-chai';

// Transform a code string
const { code, transformCount, warnings } = await transformCode(`
  import { expect } from 'chai';
  expect(foo).to.equal(bar);
`);
// Result: "import { expect } from 'bupkis';\nexpect(foo, 'to be', bar);"

// Transform files
const result = await transform({
  include: ['**/*.test.ts'],
  exclude: ['**/node_modules/**'],
  mode: 'best-effort',
  write: true,
});
```

## Transformations

### BDD Style (expect)

| Chai                              | bupkis                                           |
| --------------------------------- | ------------------------------------------------ |
| `expect(x).to.equal(y)`           | `expect(x, 'to be', y)`                          |
| `expect(x).to.deep.equal(y)`      | `expect(x, 'to deep equal', y)`                  |
| `expect(x).to.be.true`            | `expect(x, 'to be true')`                        |
| `expect(x).to.be.false`           | `expect(x, 'to be false')`                       |
| `expect(x).to.be.null`            | `expect(x, 'to be null')`                        |
| `expect(x).to.be.undefined`       | `expect(x, 'to be undefined')`                   |
| `expect(x).to.be.ok`              | `expect(x, 'to be truthy')`                      |
| `expect(x).to.exist`              | `expect(x, 'to be defined')`                     |
| `expect(x).to.be.a('string')`     | `expect(x, 'to be a', 'string')`                 |
| `expect(x).to.be.instanceof(Y)`   | `expect(x, 'to be an instance of', Y)`           |
| `expect(x).to.have.property('y')` | `expect(x, 'to have property', 'y')`             |
| `expect(x).to.have.length(3)`     | `expect(x, 'to have length', 3)`                 |
| `expect(x).to.contain(y)`         | `expect(x, 'to contain', y)`                     |
| `expect(x).to.match(/foo/)`       | `expect(x, 'to match', /foo/)`                   |
| `expect(x).to.be.above(5)`        | `expect(x, 'to be greater than', 5)`             |
| `expect(x).to.be.below(10)`       | `expect(x, 'to be less than', 10)`               |
| `expect(x).to.be.at.least(5)`     | `expect(x, 'to be greater than or equal to', 5)` |
| `expect(x).to.be.at.most(10)`     | `expect(x, 'to be less than or equal to', 10)`   |
| `expect(fn).to.throw()`           | `expect(fn, 'to throw')`                         |
| `expect(fn).to.throw(Error)`      | `expect(fn, 'to throw', Error)`                  |
| `expect(x).to.be.empty`           | `expect(x, 'to be empty')`                       |

Negation is supported:

| Chai                        | bupkis                      |
| --------------------------- | --------------------------- |
| `expect(x).to.not.equal(y)` | `expect(x, 'not to be', y)` |
| `expect(x).not.to.equal(y)` | `expect(x, 'not to be', y)` |

### TDD Style (assert)

| Chai                         | bupkis                                 |
| ---------------------------- | -------------------------------------- |
| `assert.equal(x, y)`         | `expect(x, 'to be', y)`                |
| `assert.strictEqual(x, y)`   | `expect(x, 'to be', y)`                |
| `assert.deepEqual(x, y)`     | `expect(x, 'to deep equal', y)`        |
| `assert.isTrue(x)`           | `expect(x, 'to be true')`              |
| `assert.isFalse(x)`          | `expect(x, 'to be false')`             |
| `assert.isNull(x)`           | `expect(x, 'to be null')`              |
| `assert.isUndefined(x)`      | `expect(x, 'to be undefined')`         |
| `assert.isOk(x)`             | `expect(x, 'to be truthy')`            |
| `assert.isArray(x)`          | `expect(x, 'to be a', 'array')`        |
| `assert.isString(x)`         | `expect(x, 'to be a', 'string')`       |
| `assert.typeOf(x, 'string')` | `expect(x, 'to be a', 'string')`       |
| `assert.instanceOf(x, Y)`    | `expect(x, 'to be an instance of', Y)` |
| `assert.property(x, 'y')`    | `expect(x, 'to have property', 'y')`   |
| `assert.lengthOf(x, 3)`      | `expect(x, 'to have length', 3)`       |
| `assert.include(x, y)`       | `expect(x, 'to contain', y)`           |
| `assert.match(x, /foo/)`     | `expect(x, 'to match', /foo/)`         |
| `assert.isAbove(x, 5)`       | `expect(x, 'to be greater than', 5)`   |
| `assert.isBelow(x, 10)`      | `expect(x, 'to be less than', 10)`     |
| `assert.throws(fn)`          | `expect(fn, 'to throw')`               |
| `assert.isEmpty(x)`          | `expect(x, 'to be empty')`             |

Negated assertions (`assert.notEqual`, `assert.isNotTrue`, etc.) are also supported.

### Chai Plugins

The following plugins are supported:

**chai-as-promised**:

| Chai                               | bupkis                                 |
| ---------------------------------- | -------------------------------------- |
| `expect(p).to.eventually.equal(y)` | `expect(p, 'to be fulfilled with', y)` |
| `expect(p).to.be.fulfilled`        | `expect(p, 'to be fulfilled')`         |
| `expect(p).to.be.rejected`         | `expect(p, 'to be rejected')`          |
| `expect(p).to.be.rejectedWith(E)`  | `expect(p, 'to be rejected with', E)`  |

**chai-string**:

| Chai                          | bupkis                            |
| ----------------------------- | --------------------------------- |
| `expect(s).to.startWith('x')` | `expect(s, 'to start with', 'x')` |
| `expect(s).to.endWith('x')`   | `expect(s, 'to end with', 'x')`   |

**chai-subset**:

| Chai                            | bupkis                       |
| ------------------------------- | ---------------------------- |
| `expect(x).to.containSubset(y)` | `expect(x, 'to satisfy', y)` |

Plugin imports and `chai.use()` calls are automatically removed.

## Import Handling

The transformer automatically:

- Replaces `import { expect } from 'chai'` with `import { expect } from 'bupkis'`
- Removes `import { assert } from 'chai'` (TDD assertions become `expect()` calls)
- Removes all `chai-*` plugin imports
- Removes all `chai.use()` calls
- Warns about unrecognized plugins passed to `chai.use()`

## Options

| Option            | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `--dry-run`       | Show what would change without writing files                       |
| `--strict`        | Fail on any unsupported assertion                                  |
| `--best-effort`   | Transform what we can, add TODO comments for unsupported (default) |
| `--exclude`, `-e` | Patterns to exclude (default: `**/node_modules/**`)                |

## Handling Unsupported Assertions

In `best-effort` mode (default), unsupported assertions are preserved with a TODO comment:

```typescript
// TODO: Manual migration needed - unsupported matcher 'someObscureMatcher'
expect(x).to.someObscureMatcher(y);
```

Search for `"TODO: Manual migration needed"` in your codebase after running the transform to find items requiring manual review.

## License

[Blue Oak Model License 1.0.0](https://blueoakcouncil.org/license/1.0.0)
