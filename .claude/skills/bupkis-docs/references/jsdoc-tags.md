# Custom JSDoc Tags Reference

## Overview

Bupkis uses three custom JSDoc block tags to automatically generate redirects for assertion documentation. These tags are processed by the custom TypeDoc plugin at `.config/typedoc-plugin-bupkis.js`.

## Tag Definitions

### `@bupkisAnchor`

**Purpose:** Specifies the unique anchor ID that will be generated in the documentation page.

**Syntax:**

```typescript
@bupkisAnchor <anchor-id>
```

**Rules:**

- Must be kebab-case (lowercase with hyphens)
- Should be unique across all assertions
- Typically follows pattern: `<subject-type>-<assertion-verb>-<parameter-type>`

**Examples:**

```typescript
@bupkisAnchor unknown-to-be-a-string
@bupkisAnchor function-to-throw-any
@bupkisAnchor array-to-contain-any
@bupkisAnchor object-to-have-key-string-number-symbol
```

**Common Patterns:**

- Basic type checks: `unknown-to-be-a-<type>`
- Parametric assertions: `<subject>-<verb>-<parameter>`
- Negations: `<subject>-not-to-<verb>`

---

### `@bupkisAssertionCategory`

**Purpose:** Maps the assertion to a documentation category/page.

**Syntax:**

```typescript
@bupkisAssertionCategory <category-name>
```

**Valid Categories:**

| Category Key         | Document Name                      | Use For                                                      |
| -------------------- | ---------------------------------- | ------------------------------------------------------------ |
| `primitives`         | `Primitive_Assertions`             | Basic type checks (string, number, boolean, null, undefined) |
| `strings`            | `String___Pattern_Assertions`      | String operations, pattern matching, regex                   |
| `numeric`            | `Numeric_Assertions`               | Number comparisons, ranges, NaN, Infinity                    |
| `equality`           | `Equality___Comparison_Assertions` | Equality checks, identity, deep equality                     |
| `collections`        | `Collections_Assertions`           | Arrays, Sets, Maps, object keys                              |
| `object`             | `Object_Assertions`                | Object property checks, structure validation                 |
| `function`           | `Function_Assertions`              | Function behavior, throwing, invocation                      |
| `error`              | `Error_Assertions`                 | Error type checks, error properties                          |
| `date`               | `Date___Time_Assertions`           | Date comparisons, date validation                            |
| `promise` or `async` | `Promise_Assertions`               | Promise resolution, rejection, async behavior                |
| `other`              | `Other_Assertions`                 | Miscellaneous assertions not fitting other categories        |

**Examples:**

```typescript
@bupkisAssertionCategory primitives  // for string, number, boolean checks
@bupkisAssertionCategory collections // for array, set, map operations
@bupkisAssertionCategory function   // for function behavior
@bupkisAssertionCategory promise    // for promise/async operations
```

**Error Handling:**
If you specify an unknown category, the plugin will log a warning:

```
Unknown category "invalid-category" for assertion assertionName
```

---

### `@bupkisRedirect`

**Purpose:** (Optional) Provides a custom redirect path when it should differ from the anchor.

**Syntax:**

```typescript
@bupkisRedirect <custom-path>
```

**When to Use:**

- The assertion has a common shorthand name
- The URL should be more user-friendly than the anchor
- Multiple assertions share the same logical concept

**Examples:**

**Example 1: Shorter alias**

```typescript
/**
 * @bupkisAnchor function-to-throw-any
 * @bupkisAssertionCategory function
 * @bupkisRedirect to-throw
 */
export const functionThrowsAssertion = ...
```

- Redirect path: `assertions/to-throw/`
- Target: `documents/Function_Assertions#function-to-throw-any`

**Example 2: Common shorthand**

```typescript
/**
 * @bupkisAnchor object-to-satisfy-any
 * @bupkisAssertionCategory object
 * @bupkisRedirect satisfies
 */
export const objectSatisfiesAssertion = ...
```

- Redirect path: `assertions/satisfies/`
- Target: `documents/Object_Assertions#object-to-satisfy-any`

**Default Behavior (no `@bupkisRedirect`):**
If `@bupkisRedirect` is omitted, the redirect path defaults to the anchor:

```typescript
/**
 * @bupkisAnchor unknown-to-be-a-string
 * @bupkisAssertionCategory primitives
 */
export const stringAssertion = ...
```

- Redirect path: `assertions/unknown-to-be-a-string/`
- Target: `documents/Primitive_Assertions#unknown-to-be-a-string`

---

## Complete Example

````typescript
/**
 * Asserts that a value is a frozen object.
 *
 * A frozen object cannot have new properties added, existing properties
 * removed, or existing properties modified.
 *
 * @example
 *
 * ```typescript
 * const frozen = Object.freeze({ x: 1 });
 * expect(frozen, 'to be frozen'); // passes
 *
 * const mutable = { y: 2 };
 * expect(mutable, 'to be frozen'); // fails
 * ```
 *
 * @group Esoteric Assertions
 * @bupkisAnchor unknown-to-be-frozen
 * @bupkisAssertionCategory object
 */
export const frozenAssertion = createAssertion(['to be frozen'], (subject) => {
  if (!Object.isFrozen(subject)) {
    return { pass: false, message: 'expected object to be frozen' };
  }
  return { pass: true };
});
````

**Generated Redirect:**

- Path: `assertions/unknown-to-be-frozen/`
- Target: `documents/Object_Assertions#unknown-to-be-frozen`

---

## Validation Checklist

When adding or modifying assertions:

- [ ] JSDoc comment block exists
- [ ] `@bupkisAnchor` is present and follows kebab-case naming
- [ ] `@bupkisAssertionCategory` is present and uses a valid category
- [ ] `@bupkisRedirect` is added (only if needed for a shorter/friendlier URL)
- [ ] Anchor is unique across all assertions
- [ ] `npm run docs:build` runs successfully
- [ ] Build logs show redirect registration: `Registered redirect for <name>: <path> ➡️ <target>`
- [ ] No warnings about unknown categories

---

## Plugin Implementation Details

**Location:** `.config/typedoc-plugin-bupkis.js`

**How it works:**

1. **Event Listener:** Hooks into `Converter.EVENT_CREATE_DECLARATION`
2. **Type Check:** Looks for variable declarations with assertion types:
   - `AssertionSchemaSync`
   - `AssertionFunctionSync`
   - `AssertionSchemaAsync`
   - `AssertionFunctionAsync`
3. **Tag Extraction:** Parses `@bupkisAnchor`, `@bupkisAssertionCategory`, `@bupkisRedirect` from block tags
4. **Validation:** Checks if category exists in `CATEGORY_DOC_MAP`
5. **Redirect Registration:** Adds redirect to TypeDoc's redirect plugin:
   ```javascript
   const redirectPath = `assertions/${redirectName}/`;
   const document = `documents/${CATEGORY_DOC_MAP[category]}#${anchor}`;
   ```
6. **Logging:** Reports successful registrations and warnings for invalid categories

**Category Mapping (from plugin):**

```javascript
const CATEGORY_DOC_MAP = {
  async: 'Promise_Assertions',
  collections: 'Collections_Assertions',
  date: 'Date___Time_Assertions',
  equality: 'Equality___Comparison_Assertions',
  error: 'Error_Assertions',
  function: 'Function_Assertions',
  numeric: 'Numeric_Assertions',
  object: 'Object_Assertions',
  other: 'Other_Assertions',
  primitives: 'Primitive_Assertions',
  promise: 'Promise_Assertions',
  strings: 'String___Pattern_Assertions',
};
```

---

## Troubleshooting

**Issue:** Redirect not appearing in generated docs

**Possible Causes:**

1. Missing or malformed JSDoc tags
2. Variable not exported (`export const`)
3. Variable type doesn't match assertion types
4. Category typo or invalid category name
5. TypeDoc build failed before redirect generation

**Debug Steps:**

1. Check build logs for `Registered redirect for <name>` messages
2. Look for warnings: `Unknown category "<category>" for assertion <name>`
3. Verify the variable is exported and has correct type annotation
4. Ensure `@bupkisAnchor` and `@bupkisAssertionCategory` are both present
5. Rebuild with `npm run docs:build` and review full output

---

## Best Practices

1. **Consistent Naming:** Use kebab-case for anchors, matching the assertion's natural language description
2. **Minimal Redirects:** Only use `@bupkisRedirect` when the anchor is verbose or unnatural for URLs
3. **Accurate Categories:** Choose the most specific category that fits the assertion's primary purpose
4. **Documentation First:** Write clear JSDoc descriptions before adding tags
5. **Validate Builds:** Always run `npm run docs:build` after adding/modifying tags
6. **Check Logs:** Review build output to confirm redirect registration
