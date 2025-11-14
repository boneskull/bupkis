# Implementation Plan: Add JSDoc Tags to Bupkis Assertion Implementations

## Overview

Add `@bupkisAnchor`, `@bupkisAssertionCategory`, and optionally `@bupkisRedirect` JSDoc tags to all assertion implementations in `src/assertion/impl/` that are missing these tags. This will enable automatic redirect generation in the TypeDoc documentation site.

**Current State:**

- **Total assertions**: 120
- **Already tagged**: 49
- **Need tagging**: 71

## Prerequisites

1. Review the custom JSDoc tag system documentation in `.claude/skills/bupkis-docs/SKILL.md`
2. Understand the valid assertion categories and their corresponding document mappings from `.config/typedoc-plugin-bupkis.js:23-39`

## Valid Categories Reference

The following categories map to documentation pages:

| Category            | Document Page                      |
| ------------------- | ---------------------------------- |
| `primitives`        | `Primitive_Assertions`             |
| `strings`           | `String___Pattern_Assertions`      |
| `numeric`           | `Numeric_Assertions`               |
| `equality`          | `Equality___Comparison_Assertions` |
| `collections`       | `Collections_Assertions`           |
| `object`            | `Object_Assertions`                |
| `function`          | `Function_Assertions`              |
| `error`             | `Error_Assertions`                 |
| `date`              | `Date___Time_Assertions`           |
| `promise` / `async` | `Promise_Assertions`               |
| `snapshot`          | `Snapshot_Assertions`              |
| `other`             | `Other_Assertions`                 |

## Task Breakdown by File

### Task 1: Process `src/assertion/impl/sync-basic.ts`

**Estimated assertions to tag**: ~25

For each assertion exported in this file:

1. **Identify the assertion** - Look for `export const <name>Assertion = createAssertion(...)`
2. **Check for existing tags** - Skip if `@bupkisAnchor` and `@bupkisAssertionCategory` already exist
3. **Determine the anchor** - Based on the assertion signature (subject type, assertion phrase, parameter types):
   - Format: `<subject-type>-<assertion-phrase>-<param-type>`
   - Example: `unknown-to-be-a-string` for string type assertion
   - Example: `number-to-be-positive` for positive number assertion
4. **Assign category** - Based on assertion purpose:
   - Type checks (string, number, boolean, etc.) → `primitives`
   - Complex objects → `object`
   - Collections → `collections`
   - Functions → `function`
5. **Add redirect if needed** - Only if the URL path should differ from the anchor
6. **Add JSDoc tags** to the assertion's JSDoc comment:
   ```typescript
   /**
    * Existing description...
    *
    * @group Basic Assertions
    * @bupkisAnchor <anchor-id>
    * @bupkisAssertionCategory <category>
    */
   ```

**Specific assertions to tag**:

- [ ] `numberAssertion` - Add anchor, category (primitives)
- [ ] `infiniteAssertion` - Add anchor, category (numeric)
- [ ] `positiveInfinityAssertion` - Add anchor, category (numeric)
- [ ] `negativeInfinityAssertion` - Add anchor, category (numeric)
- [ ] `booleanAssertion` - Add anchor, category (primitives)
- [ ] `positiveAssertion` - Add anchor, category (numeric)
- [ ] `positiveIntegerAssertion` - Add anchor, category (numeric)
- [ ] `negativeAssertion` - Add anchor, category (numeric)
- [ ] `negativeIntegerAssertion` - Add anchor, category (numeric)
- [ ] `trueAssertion` - Add anchor, category (primitives)
- [ ] `falseAssertion` - Add anchor, category (primitives)
- [ ] `bigintAssertion` - Add anchor, category (primitives)
- [ ] `symbolAssertion` - Add anchor, category (primitives)
- [ ] `functionAssertion` - Add anchor, category (function)
- [ ] `asyncFunctionAssertion` - Add anchor, category (function)
- [ ] `nanAssertion` - Add anchor, category (numeric)
- [ ] `integerAssertion` - Add anchor, category (numeric)
- [ ] `nullAssertion` - Add anchor, category (primitives)
- [ ] `undefinedAssertion` - Add anchor, category (primitives)
- [ ] `arrayAssertion` - Add anchor, category (collections)
- [ ] `dateAssertion` - Add anchor, category (date)
- [ ] `classAssertion` - Add anchor, category (function)
- [ ] `primitiveAssertion` - Add anchor, category (primitives)
- [ ] `regexpAssertion` - Add anchor, category (strings)
- [ ] `truthyAssertion` - Add anchor, category (primitives)
- [ ] `falsyAssertion` - Add anchor, category (primitives)
- [ ] `objectAssertion` - Add anchor, category (object)
- [ ] `recordAssertion` - Add anchor, category (object)
- [ ] `emptyArrayAssertion` - Add anchor, category (collections)
- [ ] `emptyObjectAssertion` - Add anchor, category (object)
- [ ] `errorAssertion` - Add anchor, category (error)
- [ ] `emptyStringAssertion` - Add anchor, category (strings)
- [ ] `nonEmptyStringAssertion` - Add anchor, category (strings)
- [ ] `definedAssertion` - Add anchor, category (primitives)
- [ ] `setAssertion` - Add anchor, category (collections)
- [ ] `weakMapAssertion` - Add anchor, category (collections)
- [ ] `weakSetAssertion` - Add anchor, category (collections)

### Task 2: Process `src/assertion/impl/sync-collection.ts`

**Estimated assertions to tag**: ~15

This file already has many tags. Review each assertion and add tags for any missing ones.

**Known tagged**:

- ✓ `mapContainsAssertion`
- ✓ `mapSizeAssertion`
- ✓ `emptyMapAssertion`
- ✓ `setContainsAssertion`
- ✓ `setSizeAssertion`
- ✓ `emptySetAssertion`
- ✓ `arrayContainsAssertion`
- ✓ `arraySizeAssertion`
- ✓ `nonEmptyArrayAssertion`
- ✓ `objectKeysAssertion`
- ✓ `objectKeyAssertion`
- ✓ `objectExactKeyAssertion`
- ✓ `objectSizeAssertion`
- ✓ `setEqualityAssertion`
- ✓ `setSubsetAssertion`
- ✓ `setSupersetAssertion`
- ✓ `setIntersectionAssertion`
- ✓ `setDisjointAssertion`
- ✓ `setUnionEqualityAssertion`
- ✓ `setIntersectionEqualityAssertion`
- ✓ `setDifferenceEqualityAssertion`
- ✓ `setSymmetricDifferenceEqualityAssertion`
- ✓ `mapKeyAssertion`
- ✓ `mapValueAssertion`
- ✓ `mapEntryAssertion`
- ✓ `mapEqualityAssertion`
- ✓ `collectionSizeGreaterThanAssertion`
- ✓ `collectionSizeLessThanAssertion`
- ✓ `collectionSizeBetweenAssertion`

**Action**: Verify all assertions in this file already have tags. If any are missing, add them.

### Task 3: Process `src/assertion/impl/sync-parametric.ts`

**Estimated assertions to tag**: ~25

Read the entire file and for each assertion:

1. Check if `@bupkisAnchor` and `@bupkisAssertionCategory` exist
2. Determine appropriate anchor based on assertion signature
3. Assign category based on assertion type:
   - Numeric comparisons → `numeric`
   - String operations → `strings`
   - Type checking → `primitives` or `equality`
   - Function behavior (throw) → `function`
   - Object satisfaction → `object`
   - Deep equality → `equality`

**Assertions to review and tag**:

- [ ] `instanceOfAssertion` - Add anchor, category
- [ ] `typeOfAssertion` - Add anchor, category
- [ ] `lessThanAssertion` - Add anchor, category (numeric)
- [ ] `greaterThanAssertion` - Add anchor, category (numeric)
- [ ] `lessThanOrEqualAssertion` - Add anchor, category (numeric)
- [ ] `greaterThanOrEqualAssertion` - Add anchor, category (numeric)
- [ ] `betweenAssertion` - Add anchor, category (numeric)
- [ ] `closeToAssertion` - Add anchor, category (numeric)
- [ ] `matchAssertion` - Add anchor, category (strings)
- [ ] `containStringAssertion` - Add anchor, category (strings)
- [ ] `startWithAssertion` - Add anchor, category (strings)
- [ ] `endWithAssertion` - Add anchor, category (strings)
- [ ] `throwAssertion` - Add anchor, category (function), possibly add redirect `to-throw`
- [ ] `throwTypeAssertion` - Add anchor, category (function)
- [ ] `throwErrorSatisfyingAssertion` - Add anchor, category (function)
- [ ] `satisfiesAssertion` - Add anchor, category (equality or other)
- [ ] `deepEqualAssertion` - Add anchor, category (equality)
- [ ] Additional assertions as found in the file...

### Task 4: Process `src/assertion/impl/async-parametric.ts`

**Estimated assertions to tag**: ~5

This file contains async/Promise assertions. Already tagged from the file read:

- ✓ `functionResolveAssertion`
- ✓ `promiseResolveAssertion`

**Assertions to review and tag**:

- [ ] `functionRejectAssertion` - Add anchor, category (promise)
- [ ] `promiseRejectAssertion` - Add anchor, category (promise)
- [ ] `functionRejectWithTypeAssertion` - Add anchor, category (promise)
- [ ] `promiseRejectWithTypeAssertion` - Add anchor, category (promise)
- [ ] `functionRejectWithErrorSatisfyingAssertion` - Add anchor, category (promise)
- [ ] `promiseRejectWithErrorSatisfyingAssertion` - Add anchor, category (promise)
- [ ] `promiseResolveWithValueSatisfyingAssertion` - Add anchor, category (promise)
- [ ] `functionFulfillWithValueSatisfyingAssertion` - Add anchor, category (promise)

### Task 5: Process `src/assertion/impl/sync-date.ts`

**Estimated assertions to tag**: ~8

**Assertions to review and tag**:

- [ ] All date-related assertions → category `date`
- [ ] Date comparison assertions
- [ ] Date range assertions
- [ ] Specific date property assertions

### Task 6: Process `src/assertion/impl/sync-esoteric.ts`

**Estimated assertions to tag**: ~5

Review this file for any esoteric or specialized assertions. Assign appropriate categories:

- Likely → `other` category for unusual assertions
- Or specialized categories if they fit better

### Task 7: Process `src/assertion/impl/snapshot.ts`

**Estimated assertions to tag**: ~2

**Assertions to review and tag**:

- [ ] Snapshot assertions → category `snapshot`

## Validation & Testing

### Task 8: Build Documentation and Validate Redirects

After all tags are added:

1. **Build the documentation**:

   ```bash
   npm run docs:build
   ```

2. **Review build output** for:
   - "Registered redirect for..." messages confirming each redirect
   - Any warnings about unknown categories
   - Count of registered redirects should match total assertions

3. **Run validation script** (if exists):

   ```bash
   node .claude/skills/bupkis-docs/scripts/validate-redirects.js --build
   ```

4. **Check for issues**:
   - Invalid redirect paths
   - Missing anchors
   - Malformed redirect structure

### Task 9: Spot-Check Redirects

Manually verify a sample of redirects work correctly:

1. Serve documentation locally
2. Navigate to redirect URLs (e.g., `/assertions/unknown-to-be-a-string/`)
3. Verify redirect to correct target page
4. Verify anchor exists on target page

## Anchor Naming Convention

When creating anchors, follow this pattern:

```
<subject-type>-<verb-phrase>-<param-type?>
```

**Examples**:

- `unknown-to-be-a-string` - Subject type `unknown`, assertion "to be a string"
- `number-to-be-positive` - Subject type `number`, assertion "to be positive"
- `number-to-be-between-number-and-number` - Subject type `number`, assertion "to be between", parameters are numbers
- `function-to-throw` - Subject type `function`, assertion "to throw"
- `function-to-throw-error-satisfying-any` - Subject type `function`, assertion "to throw error satisfying", parameter is `any`

**Guidelines**:

- Use lowercase, hyphen-separated
- Include subject type from assertion signature
- Include main verb phrase
- Include parameter types if significant
- Keep concise but descriptive
- Avoid special characters except hyphens

## Redirect Naming

The `@bupkisRedirect` tag is optional and only needed when the URL path should differ from the anchor.

**When to use `@bupkisRedirect`**:

- Common shorthand names (e.g., `to-throw` instead of `function-to-throw-any`)
- Alternative phrasings users might search for
- Backward compatibility with old URLs

**Example**:

```typescript
/**
 * @bupkisAnchor function-to-throw-any
 * @bupkisAssertionCategory function
 * @bupkisRedirect to-throw
 */
```

This creates redirect from `/assertions/to-throw/` → `/documents/Function_Assertions#function-to-throw-any`

## Edge Cases & Considerations

1. **Multiple assertion phrases**: Some assertions support multiple phrases (e.g., `['to be a string', 'to be string']`). Choose the most common/canonical form for the anchor.

2. **Complex parameter types**: For assertions with complex parameters (like tuples, arrays), simplify in the anchor while keeping it descriptive.

3. **Overloaded assertions**: If multiple assertions serve similar purposes but with different signatures, ensure anchors are distinct.

4. **Category ambiguity**: If an assertion could fit multiple categories, choose based on primary purpose:
   - Type checking → `primitives`
   - Value comparison → `equality` or `numeric`
   - Collection operations → `collections`
   - Behavioral → `function`, `promise`

## Success Criteria

✅ All 120 assertions have `@bupkisAnchor` and `@bupkisAssertionCategory` tags
✅ Documentation builds without errors or warnings
✅ All redirects registered in build logs
✅ Validation script passes with no errors (if available)
✅ Spot-checked redirects work correctly
✅ All categories are valid (no unknown category warnings)

## Estimated Time

- **Task 1 (sync-basic.ts)**: 30-45 minutes
- **Task 2 (sync-collection.ts)**: 10 minutes (verification only)
- **Task 3 (sync-parametric.ts)**: 30-45 minutes
- **Task 4 (async-parametric.ts)**: 15-20 minutes
- **Task 5 (sync-date.ts)**: 15-20 minutes
- **Task 6 (sync-esoteric.ts)**: 10-15 minutes
- **Task 7 (snapshot.ts)**: 5-10 minutes
- **Task 8-9 (Validation)**: 15-20 minutes

**Total**: 2.5-3.5 hours

## Notes

- Work through files systematically to avoid missing assertions
- Commit after each file is complete for easier review
- Test documentation build after every 2-3 files to catch issues early
- Keep the CATEGORY_DOC_MAP in `.config/typedoc-plugin-bupkis.js` as the source of truth for valid categories

## Implementation Order

Recommended order of execution:

1. **Start with sync-basic.ts** - Most straightforward type assertions
2. **Verify sync-collection.ts** - Already mostly complete
3. **Process async-parametric.ts** - Smaller file, clear categories
4. **Process snapshot.ts** - Smallest file
5. **Process sync-date.ts** - Clear category (date)
6. **Process sync-parametric.ts** - Most complex, benefit from experience with others
7. **Process sync-esoteric.ts** - May require most thought for categorization
8. **Validate and test** - Build docs and verify redirects
