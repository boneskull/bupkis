---
mode: 'agent'
model: Claude Sonnet 4
tools: ['codebase', 'usages', 'think', 'problems', 'testFailure', 'editFiles', 'search', 'runTasks', 'runTerminalCommands', 'createFiles', 'readFiles', 'grep']
description: 'Add phrase aliases to existing Bupkis assertions'
---

Your goal is to add new phrase aliases to existing Bupkis assertions while maintaining test compatibility and documentation.

## Overview

Bupkis uses natural language assertions with phrase-based APIs. When modifying assertion phrases (adding aliases, changing wording), you must handle assertion ID changes that break property-based tests.

## Key Tactics and Workflow

### 1. Locate Assertion Implementation
- Search in `src/assertion/impl/` directory for the assertion category:
  - `sync-basic.ts` - Basic type assertions (string, number, boolean, etc.)
  - `sync-collection.ts` - Array and object assertions (to contain, to have length, etc.)
  - `sync-esoteric.ts` - Advanced assertions (instanceof, satisfies, etc.)
  - `sync-parametric.ts` - Parameterized assertions (greater than, matches, etc.)
  - `async.ts` - Promise-based assertions (to resolve, to reject, etc.)

**Tools**: Use `grep_search` or `semantic_search` to find existing assertions by phrase text.

### 2. Modify Phrase Arrays
- Assertions use `createAssertion()` with phrase arrays like `['to be within', 'to be between']`
- Add new aliases to existing arrays: `[z.number(), ['to be within', 'to be between'], z.number(), z.number()]`

**Tools**: Use `read_file` to examine current implementation, `replace_string_in_file` to add aliases.

### 3. Handle Assertion ID Changes
**Critical**: When phrases change, assertion IDs change, breaking property tests in `test/property/`.

#### Create/Update Debugging Script
- Use `scripts/dump-assertion-ids.js` to extract current assertion IDs
- Script should output mapping of IDs to human-readable representations
- Run script before and after changes to identify ID changes

**Tools**: Use `create_file` or modify existing script, `run_in_terminal` to execute.

#### Update Property Tests
- Property tests in `test/property/` use assertion IDs for test configuration
- When IDs change, update the affected test files (typically `sync-parametric.test.ts`)
- Look for old assertion IDs in test failures and replace with new ones

**Tools**: Use `grep_search` to find old IDs, `replace_string_in_file` to update them.

### 4. Build and Test Workflow
1. **Build the project**: Run `npm run build` to compile changes
2. **Run debugging script**: Execute `node scripts/dump-assertion-ids.js` to get current IDs
3. **Run property tests**: Execute `npm run test:property` to identify failures
4. **Fix failing tests**: Update assertion IDs in property test files
5. **Clear cache if needed**: Run `rm -rf dist && npm run build` if persistent issues
6. **Verify all tests pass**: Re-run property tests to confirm fixes

**Tools**: Use `run_task` for npm scripts, `run_in_terminal` for custom commands.

### 5. Update Documentation
- Check `site/reference/assertions/` directory for relevant documentation files
- Update alias listings in markdown files to include new phrases
- Add usage examples showing the new phrase aliases

**Tools**: Use `read_file` to check existing docs, `replace_string_in_file` to add aliases.

## Common Issues and Solutions

### Property Test Failures
**Problem**: `ReferenceError: Unknown assertion id: [old-id]`
**Solution**:
1. Run `scripts/dump-assertion-ids.js` to get new IDs
2. Search property test files for old ID references
3. Replace with correct new IDs from script output

### Persistent Cache Issues
**Problem**: Tests still fail despite correct file updates
**Solution**: Clear build cache with `rm -rf dist && npm run build`

### Documentation Mismatches
**Problem**: Docs don't reflect new aliases
**Solution**: Update markdown files in `site/reference/assertions/` with new phrase listings

## Essential Tools for This Task

- **`grep_search`**: Find assertion implementations and old test IDs
- **`semantic_search`**: Locate related code and documentation
- **`read_file`**: Examine current implementations and docs
- **`replace_string_in_file`**: Modify assertion phrases and test IDs
- **`run_in_terminal`**: Execute debugging scripts and build commands
- **`run_task`**: Run npm scripts for building and testing
- **`create_file`**: Create or update debugging utilities

## Example Workflow

```bash
# 1. Find and modify assertion implementation
grep_search("to be within", "src/assertion/impl/")
# Edit sync-parametric.ts to add alias

# 2. Build and extract IDs
npm run build
node scripts/dump-assertion-ids.js > ids-after.json

# 3. Run tests to identify failures
npm run test:property

# 4. Fix failing tests with new IDs
grep_search("old-assertion-id", "test/property/")
# Update test files with new IDs

# 5. Verify and document
npm run test:property  # Should pass
# Update documentation files
```

## Success Criteria

- ✅ Assertion implementation includes new phrase aliases
- ✅ All property tests pass (389/389 tests)
- ✅ Documentation reflects new aliases with examples
- ✅ Build completes without errors
- ✅ New phrases work in actual usage
