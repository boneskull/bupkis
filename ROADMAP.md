# Roadmap

In no particular order, here are some things We want to implement:

## High Priority

- ✅ More assertions
  - ✅ Better / more async support
  - ✅ `is true` / `is not true`
  - ✅ `is false` / `is not false`
  - ✅ `is NaN`
  - ✅ Support for more intrinsics; `Set`, `Map`, `WeakSet`, `WeakMap`, `WeakRef`
  - ✅ Random convenience like `is frozen`, `is sealed`, `is extensible`
  - ✅ Deep equality / partial equality, strict and loose
  - Callbacks & async callbacks
  - Whatever else. There's always room for more, within reason!
- Custom assertion improvements
  - Custom diffs
  - ✅ Custom error messages (via Zod)
  - ✅ Custom error metadata (via Zod)
  - ✅ Type safety for custom assertions (may require a significant refactor)
- ✅ Lean on Zod more for builtin assertion implementations and use its error-reporting facilities
- Keypaths / property drilling
- Boolean logic syntax (`and`, `or`, `not`) while still avoiding chainable APIs. Though I might convince myself that chainable APIs are OK for this and this only.

## Maybe Later

- Assertions for all Zod v4 builtins, essentially (which suggests some dynamic generation of assertions)
- Lower-level plugin API for those things which are more involved than custom assertions
- Basic spies (rationale: it is v. common to want to just check that a function gets called)
  - Draw a line in the sand: no stubs, no mocks, no fakes
  - Simple function instrumentation via `Proxy` or something; a way to check if a function was called, how many times, and with what
  - Adapters which generate assertions from 3p spy providers?
- Is snapshot testing the responsibility of an assertion library?
- Drop hard dependency on Node.js and expand support to other environments; as of this writing there are only three (3) bits used from Node.js:
  - `node:test` (dev)
  - `node:util.inspect` (dev)
  - `node:assert.AssertionError`
- Pull in multiple test frameworks into the dev env and assert basic compatibility with all of them
- Codemods for migration
- Support other object validation libraries (or wasn't there one that provided a translation layer?)
- See if there's some way to leverage `asserts` type predicates without too much boilerplate & tedium. Maybe make a TS feature request to allow `asserts` and/or `is` keyword to be used in types (or find out why they didn't want to do that).
