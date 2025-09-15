---
title: Basic Usage
category: Guides
---

<h2><span class="bupkis">Bupkis</span>: Basic Usage</h2>

This guide covers the fundamentals of using <span class="bupkis">BUPKIS</span> for assertions in your tests.

### Installation

Install <span class="bupkis">BUPKIS</span> as a development dependency:

```bash
npm install bupkis -D
```

### Prerequisites

<span class="bupkis">BUPKIS</span> requires Node.js version **^20.19.0 || ^22.12.0 || >=23**.

The library supports both **ESM** and **CommonJS** module systems, so you can use it with any modern Node.js project setup.

### Importing

<span class="bupkis">BUPKIS</span> provides different import strategies depending on your needs:

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

<span class="bupkis">BUPKIS</span> uses a natural language API instead of method chaining. Here's how it works in a typical test:

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

## Embeddable Assertions

<span class="bupkis">BUPKIS</span> provides a powerful feature called **embeddable assertions** through the `expect.it()` function. This allows you to create reusable assertion functions that can be embedded within complex object patterns, particularly useful with the `'to satisfy'` assertion.

### Basic Embeddable Assertions

The `expect.it()` function creates an assertion function that can be used later:

```ts
import { expect } from 'bupkis';

describe('Embeddable assertions', () => {
  it('should create reusable assertion functions', () => {
    // Create an embeddable assertion
    const isString = expect.it('to be a string');
    const isPositiveNumber = expect.it('to be greater than', 0);

    // Use them directly
    isString('hello'); // ✓ Passes
    isPositiveNumber(42); // ✓ Passes

    // These would fail:
    // isString(123); // ✗ AssertionError
    // isPositiveNumber(-5); // ✗ AssertionError
  });
});
```

### Embeddable Assertions in Object Patterns

The real power comes when using embeddable assertions within object patterns for complex validation:

```ts
describe('Object pattern validation', () => {
  it('should validate complex objects with embeddable assertions', () => {
    const user = {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      age: 30,
      roles: ['admin', 'user'],
      metadata: {
        lastLogin: '2024-01-15',
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      },
    };

    // Use embeddable assertions for flexible pattern matching
    expect(user, 'to satisfy', {
      name: expect.it('to be a string'),
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // RegExp patterns also work
      age: expect.it('to be greater than', 18),
      roles: [expect.it('to be a string')], // Each array element must be a string
      metadata: {
        lastLogin: expect.it('to match', /^\d{4}-\d{2}-\d{2}$/),
        preferences: {
          theme: expect.it('to be one of', ['light', 'dark']),
          notifications: expect.it('to be a boolean'),
        },
      },
    });
  });
});
```

### Mixing Pattern Types

You can mix different types of patterns within the same object:

```ts
describe('Mixed pattern validation', () => {
  it('should support mixed pattern types', () => {
    const apiResponse = {
      status: 'success',
      data: {
        id: 12345,
        title: 'Important Document',
        tags: ['urgent', 'review'],
      },
      timestamp: '2024-01-15T10:30:00Z',
    };

    expect(apiResponse, 'to satisfy', {
      status: 'success', // Exact value match
      data: {
        id: expect.it('to be a number'), // Type assertion
        title: expect.it('to contain', 'Document'), // Content assertion
        tags: [expect.it('to be a string')], // Array element assertion
      },
      timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, // RegExp pattern
    });
  });
});
```

### Advanced Embeddable Patterns

Embeddable assertions work with all <span class="bupkis">BUPKIS</span> assertion types, including complex ones:

```ts
describe('Advanced embeddable patterns', () => {
  it('should support complex assertion types', () => {
    const config = {
      database: {
        host: 'localhost',
        port: 5432,
        credentials: {
          username: 'admin',
          password: 'secret123',
        },
      },
      features: ['auth', 'logging', 'monitoring'],
    };

    expect(config, 'to satisfy', {
      database: {
        host: expect.it('to be a string'),
        port: expect.it('to be between', 1024, 65535),
        credentials: expect.it('to be an object'),
      },
      features: expect.it('to have length greater than', 2),
    });
  });

  it('should support nested object assertions', () => {
    const product = {
      name: 'Laptop',
      price: 999.99,
      specs: {
        cpu: 'Intel i7',
        ram: '16GB',
        storage: '512GB SSD',
      },
    };

    expect(product, 'to satisfy', {
      name: expect.it('to be a string'),
      price: expect.it('to be a number'),
      specs: expect.it('to satisfy', {
        cpu: expect.it('to contain', 'Intel'),
        ram: expect.it('to match', /^\d+GB$/),
        storage: expect.it('to be a string'),
      }),
    });
  });
});
```

### Benefits of Embeddable Assertions

1. **Reusability**: Create assertion functions once and use them across multiple tests
2. **Flexibility**: Mix different pattern types (exact values, RegExp, assertions) in the same object
3. **Composability**: Nest assertions within other assertions for complex validation
4. **Type Safety**: Full TypeScript support with proper type inference
5. **Readable Patterns**: Express complex validation rules in a natural, readable way

The embeddable assertions feature makes <span class="bupkis">BUPKIS</span> particularly powerful for API response validation, configuration testing, and any scenario where you need to validate complex nested data structures.

### Assertion Errors

When an assertion fails, <span class="bupkis">BUPKIS</span> throws a standard `AssertionError` that's compatible with all major testing frameworks. Here are real examples of what these errors look like:

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

All <span class="bupkis">BUPKIS</span> assertion errors include these standard properties:

- **`name`**: Always `'AssertionError'` for compatibility with testing frameworks
- **`message`**: Human-readable description of what went wrong
- **`actual`**: The value that was tested (when available)
- **`expected`**: The expected value or pattern (when available)

The error messages are powered by Zod's validation system, providing detailed context about exactly why an assertion failed.

### Next Steps

- **[About Assertions](../reference/assertions.md)** - Learn more about Assertions
- **[Custom Assertions](./custom-assertion.md)** - Learn how to create your own assertion types

The natural language approach makes tests more readable and self-documenting. Instead of remembering method names like `toBeInstanceOf()` or `toHaveProperty()`, you write what you mean: `'to be an instance of'` or `'to have property'`.
