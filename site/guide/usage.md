---
title: Basic Usage
category: Guides
---

<h2><span class="bupkis">Bupkis</span>: Basic Usage</h2>

This guide covers the fundamentals of using _BUPKIS_ for assertions in your tests.

### Installation

Install _BUPKIS_ as a development dependency:

```bash
npm install bupkis -D
```

### Prerequisites

_BUPKIS_ requires Node.js version **^20.19.0 || ^22.12.0 || >=23**.

The library supports both **ESM** and **CommonJS** module systems, so you can use it with any modern Node.js project setup.

### Importing

_BUPKIS_ provides different import strategies depending on your needs:

#### Quick Start: Just Expect

If you want to start using assertions immediately with the built-in library:

```ts
import { expect } from 'bupkis';
```

#### Full Import: Building Custom Assertions

For creating custom assertions and accessing all utilities:

```ts
import {
  expect,
  expectAsync,
  createAssertion,
  createAsyncAssertion,
  use,
  z,
} from 'bupkis';
```

#### Namespace Imports

You can also import organized namespaces:

```ts
import { expect, assertion, guards, schema, util, error } from 'bupkis';

// Use assertion creation utilities
const myAssertion = assertion.createAssertion(['to be rad'], z.boolean());

// Use type guards
if (guards.isString(value)) {
  // value is guaranteed to be a string
}
```

## Basic Assertion Usage

_BUPKIS_ uses a natural language API instead of method chaining. Here's how it works in a typical test:

```ts
import { expect } from 'bupkis';

describe('Basic assertions', () => {
  it('should validate types', () => {
    expect('hello', 'to be a string');
    expect(42, 'to be a number');
    expect(true, 'to be a boolean');
  });

  it('should validate values', () => {
    expect(5, 'to equal', 5);
    expect('hello world', 'to contain', 'world');
    expect([1, 2, 3], 'to have length', 3);
  });

  it('should support negation', () => {
    expect(42, 'not to be a string');
    expect('hello', 'not to equal', 'goodbye');
  });

  it('should work with objects', () => {
    const user = { name: 'Alice', age: 30 };

    expect(user, 'to be an object');
    expect(user, 'to have property', 'name');
    expect(user, 'to satisfy', { name: 'Alice' });
  });
});
```

### Assertion Errors

When an assertion fails, _BUPKIS_ throws a standard `AssertionError` that's compatible with all major testing frameworks. Here are real examples of what these errors look like:

#### Simple Type Mismatch

```ts
expect(42, 'to be a string');
// AssertionError: Assertion "{unknown} 'to be a string'" failed: Invalid input: expected string, received number
// actual: 42
// expected: []
```

#### Value Comparison

```ts
expect('hello', 'to equal', 'goodbye');
// AssertionError: Expected 'hello' to equal 'goodbye'
// actual: hello
// expected: goodbye
```

#### Array Length Mismatch

```ts
expect([1, 2, 3], 'to have length', 5);
// AssertionError: Assertion "{array} 'to have length' {number}" failed for arguments: [ [ 1, 2, 3 ], 'to have length', 5 ]
```

#### Complex Object Validation

```ts
const user = { name: 'Alice', age: 30, role: 'user' };
expect(user, 'to satisfy', {
  name: 'Bob',
  age: 25,
  role: 'admin',
  department: 'engineering',
});
// AssertionError: Assertion "{object}! 'to satisfy' / 'to be like' {object}" failed: ; department: Invalid input: expected string, received undefined
// actual: {
//   "name": "Alice",
//   "age": 30,
//   "role": "user"
// }
// expected: {
//   "name": "Bob",
//   "age": 25,
//   "role": "admin",
//   "department": "engineering"
// }
```

#### Error Properties

All _BUPKIS_ assertion errors include these standard properties:

- **`name`**: Always `'AssertionError'` for compatibility with testing frameworks
- **`message`**: Human-readable description of what went wrong
- **`actual`**: The value that was tested (when available)
- **`expected`**: The expected value or pattern (when available)

The error messages are powered by Zod's validation system, providing detailed context about exactly why an assertion failed.

### Next Steps

- **[About Assertions](../reference/assertions.md)** - Learn more about Assertions
- **[Custom Assertions](./custom-assertion.md)** - Learn how to create your own assertion types

The natural language approach makes tests more readable and self-documenting. Instead of remembering method names like `toBeInstanceOf()` or `toHaveProperty()`, you write what you mean: `'to be an instance of'` or `'to have property'`.
