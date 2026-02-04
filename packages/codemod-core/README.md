# @bupkis/codemod-core

Shared utilities for bupkis codemods.

This package provides common infrastructure used by:

- [`@bupkis/from-jest`](https://npmjs.com/package/@bupkis/from-jest) - Migrate Jest/Vitest assertions
- [`@bupkis/from-chai`](https://npmjs.com/package/@bupkis/from-chai) - Migrate Chai assertions
- [`@bupkis/from-assert`](https://npmjs.com/package/@bupkis/from-assert) - Migrate Node.js assert assertions

## Installation

This package is primarily intended for internal use by bupkis codemod packages. If you're building a custom codemod for bupkis, you can install it:

```bash
npm install @bupkis/codemod-core
```

## Features

- **Types**: Shared type definitions for transform results, errors, warnings, and options
- **CLI Utilities**: Bupkis CLI theme, default patterns, and result printing
- **Parsing**: Argument parsing utilities for handling nested structures
- **Project**: ts-morph Project setup and file handling utilities
- **Imports**: Bupkis import detection and manipulation utilities

## License

[Blue Oak Model License 1.0.0](https://blueoakcouncil.org/license/1.0.0)
