---
title: Glossary of Terms
category: Reference
---

## A

### Alias

An alternative [phrase].

### Assertion

A validation rule that tests whether a [subject](#subject) meets specific criteria. In _BUPKIS_, assertions are expressed as natural language [phrases](#phrase) combined with optional [parameters](#parameter). Each assertion has an [implementation](#assertion-implementation) ([schema](#zod-schema) or function) that performs the actual validation.

_See also: [Expectation](#expectation)_

### Assertion Engine

The internal system that processes [assertion](#assertion) calls, parses arguments into [slots](#slot), matches them against registered assertions, and executes the validation logic. _BUPKIS_ has separate [sync](#synchronous-assertion) and [async](#asynchronous-assertion) assertion engines.

### Assertion Failure

An object returned by [function-based assertions](#function-based-assertion) to indicate failure with detailed context:

```ts
type AssertionFailure = {
  actual?: unknown;
  expected?: unknown;
  message?: string;
};
```

### Assertion ID

A unique identifier automatically generated for each [assertion](#assertion) based on its [parts](#assertion-parts). Used internally for assertion matching and in property test configurations. Example: `'string-to-contain-string-3s1p'`.

### Assertion Implementation

The logic that performs the actual validation for an [assertion](#assertion). Can be either a [Zod schema](#zod-schema) or a function that returns a boolean, void, Zod schema, or [AssertionFailure](#assertion-failure) object.

### Assertion Parts

The raw definition of an [assertion](#assertion)'s structure, including [phrases](#phrase) and [Zod schemas](#zod-schema). Example: `[z.string(), 'to contain', z.string()]`. These are converted into [slots](#slot) for runtime processing.

### AssertionError

The standard Node.js error thrown when an [assertion](#assertion) fails. _BUPKIS_ uses this for compatibility with testing frameworks.

### Asynchronous Assertion

An [assertion](#assertion) designed to work with Promises and async operations. Created using `createAsyncAssertion()` and used with [`expectAsync()`](#expectasync). Examples include `'to resolve'` and `'to reject'`.

## E

### Expectation

A statement about what should be true about a value or behavior. This term is used interchangeably with "assertion" in the context of _BUPKIS_. For example, "I expect this value to be a string" expresses the same concept as "I assert this value is a string."

_See also: [Assertion](#assertion)_

### expect()

The primary function for making [synchronous assertions](#synchronous-assertion). Takes a [subject](#subject) and [assertion](#assertion) arguments: `expect(value, 'to be a string')`. Cannot be used with custom assertions directly - must use the result of [`expect.use()`](#use).

### expectAsync()

The function for making [asynchronous assertions](#asynchronous-assertion) with Promises. Returns a Promise that resolves if the [assertion](#assertion) passes or rejects if it fails.

## F

### Function-Based Assertion

An [assertion](#assertion) implemented using a JavaScript function rather than a [Zod schema](#zod-schema). The function receives the [subject](#subject) and any [parameters](#parameter), and can return various types to indicate success or failure.

## N

### Natural Language API

_BUPKIS_'s approach to [assertion](#assertion) syntax that uses human-readable [phrases](#phrase) instead of method chaining. For example, `expect(value, 'to be greater than', 5)` instead of `expect(value).toBeGreaterThan(5)`.

### Negation

The ability to invert an [assertion](#assertion) using `'not'`. For example, `expect(5, 'not to be a string')`. _BUPKIS_ automatically supports negation for all assertions.

## P

### Parameter

Additional values passed to parameterized assertions. In `expect(10, 'to be greater than', 5)`, the value `5` is a parameter. Parameters are validated against Zod schemas defined in the assertion parts.

### Parametric Assertion

An [assertion](#assertion) that accepts additional [parameters](#parameter) beyond the [subject](#subject). These assertions have variable behavior based on the parameters provided. Example: `'to be greater than'` requires a number parameter.

### Phrase

A string literal that forms part of an [assertion](#assertion)'s natural language expression. Phrases are the human-readable parts between [parameters](#parameter). In `[z.string(), 'to contain', z.string()]`, `'to contain'` is a phrase.

### Phrase Literal

The internal representation of a [phrase](#phrase) as a branded Zod literal type. Used in the type system to ensure compile-time validation of [assertion](#assertion) usage.

## S

### Schema-Based Assertion

An [assertion](#assertion) implemented using a [Zod schema](#zod-schema) directly. The schema defines both the validation logic and error handling. This is the recommended approach for most assertions.

### Slot

The processed representation of [assertion parts](#assertion-parts) used for runtime argument matching. Slots are derived from assertion parts by converting [phrases](#phrase) to Zod literals and keeping [Zod schemas](#zod-schema) as-is.

### Static Assertion/Expectation

An [assertion](#assertion) that tests the current state or properties of a value, as opposed to testing behavior. Examples include type checks (`'to be a string'`) and value comparisons (`'to equal'`).

### Subject

The first argument to [`expect()`](#expect) - the value being tested. In `expect(42, 'to be a number')`, the subject is `42`. The subject is what the [assertion](#assertion) validates against.

### Synchronous Assertion

An [assertion](#assertion) that completes immediately without waiting for Promises or async operations. Used with the standard [`expect()`](#expect) function. Most built-in assertions are synchronous.

## U

### use()

The method for registering custom [assertions](#assertion) with _BUPKIS_. Called as `expect.use([customAssertions])` and returns new [`expect`](#expect) and [`expectAsync`](#expectasync) functions that include the custom assertions.

## Z

### Zod Schema

A validation schema from the Zod library used to define [assertion implementations](#assertion-implementation) and [parameter](#parameter) types. _BUPKIS_ is built around Zod v4 and uses schemas extensively for both validation and type inference.
