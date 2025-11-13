# Testing Documentation Redirects

## Overview

The Bupkis documentation system generates dynamic redirects based on JSDoc tags. Testing these redirects ensures that:

- All assertion documentation is reachable via user-friendly URLs
- JSDoc tags are correctly formatted
- The custom TypeDoc plugin generates valid redirects
- Users can navigate documentation without broken links

## Validation Script

### Location

`.claude/skills/bupkis-docs/scripts/validate-redirects.js`

### Purpose

Validates that all registered redirects follow the expected structure and format.

### Usage

**Basic validation (uses existing docs):**

```bash
node .claude/skills/bupkis-docs/scripts/validate-redirects.js
```

**Rebuild and validate:**

```bash
node .claude/skills/bupkis-docs/scripts/validate-redirects.js --build
```

**Custom port for local server:**

```bash
node .claude/skills/bupkis-docs/scripts/validate-redirects.js --build --port 3000
```

---

## What the Script Does

### 1. Build Documentation

Runs `npm run docs:build` to generate the documentation site and capture build logs.

**Output:**

```
Building documentation...
✓ Documentation built successfully
```

### 2. Parse Redirect Registrations

Extracts redirect registration lines from build logs:

**Log Pattern:**

```
Registered redirect for <name>: <redirect-path> ➡️ <target-path>
```

**Example:**

```
Registered redirect for functionThrowsAssertion: assertions/to-throw/ ➡️ documents/Function_Assertions#function-to-throw-any
```

**Output:**

```
Found 45 registered redirects
```

### 3. Validate Redirect Structure

Checks each redirect for correct format:

**Validation Rules:**

1. **Redirect paths must start with `assertions/`**
   - ✅ `assertions/to-throw/`
   - ❌ `to-throw/`

2. **Document paths must start with `documents/`**
   - ✅ `documents/Function_Assertions#function-to-throw-any`
   - ❌ `Function_Assertions#function-to-throw-any`

3. **Anchors must be present when using `#` syntax**
   - ✅ `documents/Primitive_Assertions#unknown-to-be-a-string`
   - ❌ `documents/Primitive_Assertions#`

**Output:**

```
Validating redirects...
✓ functionResolveAssertion: assertions/function-to-resolve/ → documents/Promise_Assertions#function-to-resolve
✓ promiseResolveAssertion: assertions/promise-to-resolve/ → documents/Promise_Assertions#promise-to-resolve
✓ snapshotAssertion: assertions/unknown-to-match-snapshot/ → documents/Snapshot_Assertions#unknown-to-match-snapshot
...
```

### 4. Report Results

Summarizes validation results:

**Success:**

```
============================================================
Passed: 45
Failed: 0
Total:  45
============================================================

All redirects validated successfully!
```

**Failure:**

```
✗ brokenAssertion: Invalid redirect path 'to-break/' (should start with 'assertions/')

============================================================
Passed: 44
Failed: 1
Total:  45
============================================================

Some redirects failed validation
```

---

## Playwright Integration

The validation script integrates with Claude Code's Playwright MCP server for complete end-to-end redirect testing.

### Current Implementation

The script provides **two output formats**:

1. **JSON format** (`--format json`): Machine-readable redirect data for programmatic testing
2. **Instructions format** (default): Human-readable testing instructions for Claude to follow

**Example Usage:**

```bash
# Get testing instructions for Claude
node .claude/skills/bupkis-docs/scripts/validate-redirects.js --build

# Get JSON data for parsing
node .claude/skills/bupkis-docs/scripts/validate-redirects.js --build --format json
```

### E2E Testing Workflow

The complete workflow for testing redirects with Playwright:

#### 1. Build Documentation & Parse Redirects

```bash
node .claude/skills/bupkis-docs/scripts/validate-redirects.js --build
```

**What happens:**

- Builds documentation (`npm run docs:build`)
- Parses redirect registrations from build logs
- Outputs structured testing instructions

**Output:**

```
Building documentation...
✓ Documentation built successfully
Found 41 registered redirects

Step 1: Start Documentation Server
Run in a background shell:
  npx serve docs -p 8080

Step 2: Test Redirects with Playwright MCP
Found 41 redirects to test.

For each redirect below, use Playwright MCP to:
  1. Navigate to the source URL
  2. Verify the page loads successfully (no 404)
  3. Check the final URL matches the expected target
  4. If targetAnchor exists, verify the anchor element is present

snapshotAssertion
  Source:  http://localhost:8080/assertions/unknown-to-match-snapshot/
  Target:  http://localhost:8080/documents/Snapshot_Assertions#unknown-to-match-snapshot
  Anchor:  #unknown-to-match-snapshot
...
```

#### 2. Start Local Documentation Server

```bash
# In background
cd docs && npx serve -p 8080 &
```

**Serves the built documentation** on http://localhost:8080

#### 3. Test Redirects with Playwright MCP

Claude uses Playwright MCP to test each redirect:

**For each redirect:**

1. Navigate to source URL (e.g., `/assertions/unknown-to-match-snapshot/`)
2. Verify page loads (status 200, no 404)
3. Check final URL matches target (e.g., `/documents/Snapshot_Assertions#unknown-to-match-snapshot`)
4. Confirm anchor is present in URL if specified

**Playwright MCP Tools Used:**

- `mcp__playwright__browser_navigate` - Navigate to redirect URL
- Check page URL and title from response
- Verify no 404 errors in console

**Example test:**

```javascript
// Navigate to redirect
await browser_navigate(
  'http://localhost:8080/assertions/unknown-to-match-snapshot/',
);

// Response confirms:
// - Page URL: http://localhost:8080/documents/Snapshot_Assertions#unknown-to-match-snapshot
// - Page Title: Snapshot Assertions | BUPKIS
// - Anchor #unknown-to-match-snapshot present
```

#### 4. Report Results

Claude tracks and reports:

- ✅ **Working redirects** - Redirect resolves to correct target with anchor
- ❌ **Failed redirects** - 404 errors, wrong target, or missing anchors
- Success rate percentage

**Example Results:**

```
Tested: 41 redirects
✅ Passed: 41 (100%)
❌ Failed: 0

All redirects working correctly!
```

### Tested Redirect Examples

The following redirects have been verified working:

**Snapshot Assertions:**

- `/assertions/unknown-to-match-snapshot/` → `Snapshot_Assertions#unknown-to-match-snapshot` ✅
- `/assertions/unknown-to-match-snapshot-with-options/` → `Snapshot_Assertions#unknown-to-match-snapshot-with-options` ✅

**Promise Assertions:**

- `/assertions/function-to-resolve/` → `Promise_Assertions#function-to-resolve` ✅
- `/assertions/promise-to-resolve/` → `Promise_Assertions#promise-to-resolve` ✅

**Function Assertions (Custom Redirect):**

- `/assertions/to-throw/` → `Function_Assertions#function-to-throw-any` ✅

**Collection Assertions:**

- `/assertions/map-to-contain-any/` → `Collections_Assertions#map-to-contain-any` ✅
- `/assertions/set-to-have-size-nonnegative-integer/` → `Collections_Assertions#set-to-have-size-nonnegative-integer` ✅
- `/assertions/array-to-contain-any/` → `Collections_Assertions#array-to-contain-any` ✅
- `/assertions/array-to-have-size-nonnegative-integer/` → `Collections_Assertions#array-to-have-size-nonnegative-integer` ✅

### Common Testing Mistakes

❌ **Using shortened URLs:**

```
Wrong: http://localhost:8080/assertions/map-to-contain/
```

✅ **Using full assertion anchor names:**

```
Correct: http://localhost:8080/assertions/map-to-contain-any/
```

The redirect directories use the complete assertion anchor name including type parameters (e.g., `-any`, `-nonnegative-integer`), not shortened versions.

---

## Common Issues

### Issue: Redirect Not Registered

**Symptoms:**

- Assertion doesn't appear in build logs
- Script doesn't validate redirect

**Possible Causes:**

1. **Missing JSDoc tags**

   ```typescript
   // BAD - no tags
   export const myAssertion = createAssertion(...);

   // GOOD - has required tags
   /**
    * @bupkisAnchor my-assertion
    * @bupkisAssertionCategory primitives
    */
   export const myAssertion = createAssertion(...);
   ```

2. **Invalid category name**

   ```typescript
   // BAD - unknown category
   /**
    * @bupkisAssertionCategory invalid
    */

   // GOOD - valid category
   /**
    * @bupkisAssertionCategory primitives
    */
   ```

3. **Incorrect variable type**
   - Must be `AssertionSchemaSync`, `AssertionFunctionSync`, `AssertionSchemaAsync`, or `AssertionFunctionAsync`

**Fix:**

1. Add required JSDoc tags
2. Verify category is in `CATEGORY_DOC_MAP`
3. Rebuild docs and check logs

---

### Issue: Invalid Redirect Path

**Symptoms:**

```
✗ myAssertion: Invalid redirect path 'my-assertion/' (should start with 'assertions/')
```

**Cause:**
The plugin didn't properly format the redirect path.

**Fix:**
Check the TypeDoc plugin code in `.config/typedoc-plugin-bupkis.js`:

```javascript
const redirectPath = `assertions/${redirectName}/`;
```

This should always prepend `assertions/` to the redirect name.

---

### Issue: Missing Anchor

**Symptoms:**

```
✗ myAssertion: Missing anchor in target path 'documents/Primitive_Assertions#'
```

**Cause:**
The `@bupkisAnchor` tag is empty or malformed.

**Fix:**

```typescript
// BAD - empty anchor
/**
 * @bupkisAnchor
 * @bupkisAssertionCategory primitives
 */

// GOOD - anchor provided
/**
 * @bupkisAnchor my-assertion
 * @bupkisAssertionCategory primitives
 */
```

---

## Workflow Integration

### During Development

1. **Add new assertion** with JSDoc tags
2. **Run validation** to check structure:
   ```bash
   node .claude/skills/bupkis-docs/scripts/validate-redirects.js --build
   ```
3. **Fix any issues** before committing

### Before Release

1. **Full rebuild** with validation:

   ```bash
   npm run docs:build
   node .claude/skills/bupkis-docs/scripts/validate-redirects.js
   ```

2. **Verify all redirects pass**

3. **Test with Playwright** (if available):
   - Have Claude run e2e tests
   - Verify redirects work in browser
   - Check anchor navigation

### In CI/CD

Consider adding validation to CI pipeline:

```yaml
# .github/workflows/docs.yml
- name: Validate documentation redirects
  run: node .claude/skills/bupkis-docs/scripts/validate-redirects.js --build
```

This ensures redirects remain valid across all changes.

---

## Script Architecture

### Parse Build Logs

Uses regex to extract redirect registrations:

```javascript
const pattern = /Registered redirect for (\w+): ([\w\-/]+) ➡️ ([\w\-/#_]+)/;
```

**Captures:**

1. Assertion name (e.g., `functionThrowsAssertion`)
2. Redirect path (e.g., `assertions/to-throw/`)
3. Target path (e.g., `documents/Function_Assertions#function-to-throw-any`)

### Validate Structure

Checks each component:

```javascript
// Redirect path validation
if (!redirectPath.startsWith('assertions/')) {
  return { valid: false, error: 'Invalid redirect path' };
}

// Document path validation
if (targetPath.includes('#')) {
  const [document, anchor] = targetPath.split('#', 2);
  if (!document.startsWith('documents/')) {
    return { valid: false, error: 'Invalid document path' };
  }
  if (!anchor) {
    return { valid: false, error: 'Missing anchor' };
  }
}
```

### Report Results

Color-coded output for clarity:

- 🟢 **Green** - Passed validations
- 🔴 **Red** - Failed validations
- 🟡 **Yellow** - Warnings
- 🔵 **Blue** - Info messages

---

## Future Enhancements

### 1. Automated Playwright Testing

Integrate with Playwright MCP to automatically:

- Start local server
- Test each redirect
- Verify anchors exist
- Capture screenshots of failures

### 2. Performance Testing

Test redirect performance:

- Measure redirect response times
- Check for redirect loops
- Validate caching behavior

### 3. Cross-Browser Testing

Test redirects across browsers:

- Chrome/Chromium
- Firefox
- Safari (if available)

### 4. Accessibility Testing

Verify redirects maintain accessibility:

- Check focus management after redirect
- Validate ARIA attributes
- Test keyboard navigation

---

## Best Practices

1. **Run validation after every change** to assertion JSDoc tags
2. **Check build logs** for redirect registration before committing
3. **Use consistent naming** for anchors (kebab-case)
4. **Document custom redirects** when using `@bupkisRedirect`
5. **Test manually** in browser when adding complex redirects
6. **Keep categories organized** - use existing categories when possible
7. **Validate in CI** to catch issues early

---

## Related Documentation

- **SKILL.md** - Main skill documentation
- **jsdoc-tags.md** - Complete JSDoc tag reference
- **build-process.md** - Documentation build pipeline
- **TypeDoc Plugin** (`.config/typedoc-plugin-bupkis.js`) - Redirect generation logic
