# @bupkis/sinon

Sinon spy/stub/mock assertions for [Bupkis](https://bupkis.zip).

## Installation

```bash
npm install @bupkis/sinon bupkis sinon
```

## Usage

```typescript
import { use } from 'bupkis';
import { sinonAssertions } from '@bupkis/sinon';
import sinon from 'sinon';

const { expect } = use(sinonAssertions);

// Basic spy assertions
const spy = sinon.spy();
spy(42);
expect(spy, 'was called');
expect(spy, 'was called once');
expect(spy, 'was called with', [42]);

// Call count
spy();
spy();
expect(spy, 'was called times', 3);

// Stub return values
const stub = sinon.stub().returns(100);
stub();
expect(stub.firstCall, 'to have returned', 100);

// Call order
const first = sinon.spy();
const second = sinon.spy();
first();
second();
expect(first, 'was called before', second);
expect([first, second], 'given call order');

// Complex call specifications
const logger = sinon.spy();
logger('info', 'started');
logger('debug', 'processing');
logger('info', 'done');
expect(logger, 'to have calls satisfying', [
  ['info', 'started'],
  ['debug', 'processing'],
  ['info', 'done'],
]);
```

## Available Assertions

### Spy Assertions

| Assertion                        | Alternate Phrase           | Description                                        |
| -------------------------------- | -------------------------- | -------------------------------------------------- |
| `was called`                     | `to have been called`      | Spy was called at least once                       |
| `was not called`                 | `to not have been called`  | Spy was never called                               |
| `was called once`                | `to have been called once` | Spy was called exactly once                        |
| `was called twice`               |                            | Spy was called exactly twice                       |
| `was called thrice`              |                            | Spy was called exactly three times                 |
| `was called times <n>`           |                            | Spy was called exactly n times                     |
| `was called with <args>`         | `to have been called with` | At least one call had matching args (prefix match) |
| `was always called with <args>`  |                            | All calls had matching args                        |
| `was called with exactly <args>` |                            | At least one call had exactly these args           |
| `was never called with <args>`   |                            | No call had matching args                          |
| `was called on <context>`        | `to have been called on`   | At least one call used this context                |
| `was always called on <context>` |                            | All calls used this context                        |
| `threw`                          | `to have thrown`           | Spy threw an exception                             |
| `threw <error>`                  |                            | Spy threw specific error type or object            |
| `always threw`                   |                            | Spy threw on every call                            |
| `was called before <spy>`        |                            | First spy was called before second                 |
| `was called after <spy>`         |                            | First spy was called after second                  |

### SpyCall Assertions

Access individual calls via `spy.firstCall`, `spy.secondCall`, `spy.getCall(n)`, etc.

| Assertion                  | Description                      |
| -------------------------- | -------------------------------- |
| `to have args <array>`     | Call had exactly these arguments |
| `to have returned <value>` | Call returned this value         |
| `to have thrown`           | Call threw an exception          |
| `to have this <context>`   | Call used this context           |

### Array Assertions

| Assertion          | Description                            |
| ------------------ | -------------------------------------- |
| `given call order` | Array of spies were called in sequence |

### Complex Assertions

| Assertion                          | Description                         |
| ---------------------------------- | ----------------------------------- |
| `to have calls satisfying <specs>` | All calls match specification array |

The `to have calls satisfying` assertion accepts an array where each element is either:

- An object with optional `args`, `returned`, `threw`, `thisValue` properties
- An array (shorthand for `{ args: [...] }`)

## Exports

```typescript
// Main assertion array for use()
import { sinonAssertions } from '@bupkis/sinon';

// Individual assertions (for selective use)
import {
  wasCalledAssertion,
  wasCalledWithAssertion /* ... */,
} from '@bupkis/sinon';

// Type guards
import { isSpy, isSpyCall } from '@bupkis/sinon';

// Zod schemas
import { SpySchema, SpyCallSchema } from '@bupkis/sinon';
```

## License

BlueOak-1.0.0
