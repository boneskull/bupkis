# Assertion Implementations

This dir contains all the built-in assertions that come with _BUPKIS_.

They are sorted into the following files:

- `async.ts`: Assertions concerning asynchronous functions
- `sync-basic.ts`: Basic assertions that don't take parameters, e.g. "to be a string", "to be empty", "to be an Error", etc.
- `sync-collection.ts`: Assertions concerning collections (arrays, `Set`s, `Map`s, objects); may or may not be parametric
- `sync-esoteric.ts`: Arcane assertions
- `sync-parametric.ts`: Assertions that take parameters, e.g. "to be greater than", "to be one of", "to have property", etc.

All sync assertions are collected and re-exported from `sync.ts`.
