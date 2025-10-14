# Data Model: Suite Definitions and Classification

## Entities

### Suite Definition

Represents a logical grouping of assertions with filtering criteria.

**Fields**:

- `name`: string - Unique identifier (e.g., "sync-function-pure")
- `description`: string - Human-readable description for CLI help
- `filter`: function - Predicate function to determine if assertion belongs to suite
- `parent`: string | null - Parent suite name for hierarchy (e.g., "sync-function")
- `children`: string[] - Child suite names (for parent suites)

**Relationships**:

- Parent-child relationship between sync-function and its sub-suites
- Many-to-many relationship between assertions and suites (overlapping membership)

### Assertion Classification

Represents the categorization of assertions by return type behavior.

**Fields**:

- `assertionId`: string - Unique assertion identifier
- `returnType`: "pure" | "schema" - Classification based on implementation analysis
- `implementationClass`: "sync-function" | "sync-schema" | "async-function" | "async-schema"
- `sourceFile`: string - Path to implementation file for traceability

**Validation Rules**:

- assertionId must be unique across all assertions
- returnType must be either "pure" or "schema"
- All sync-function assertions must have returnType classification

### Execution Plan

Represents the deduplicated set of assertions to benchmark after suite selection.

**Fields**:

- `selectedSuites`: string[] - User-requested suite names
- `resolvedSuites`: string[] - Final suite list after overlap resolution
- `assertions`: AssertionClassification[] - Unique assertions to execute
- `deduplicationLog`: string[] - Messages about which suites were merged/skipped

**State Transitions**:

1. Initial: selectedSuites populated from CLI args
2. Resolved: Parent suites override children, duplicates removed
3. Executed: Assertions run with results tagged by applicable suites

### Suite Registry

Central registry maintaining all available suites and their relationships.

**Fields**:

- `suites`: Map<string, SuiteDefinition> - All available suites
- `hierarchy`: Map<string, string[]> - Parent to children mapping
- `assertionIndex`: Map<string, string[]> - Assertion to suites mapping for fast lookup

**Operations**:

- `resolveSuiteSelection(requestedSuites: string[]): string[]` - Apply overlap logic
- `getAssertionsForSuites(suites: string[]): AssertionClassification[]` - Get unique assertions
- `validateSuiteNames(names: string[]): string[]` - Return invalid suite names

## Implementation Notes

The data model supports the hierarchical suite structure where sync-function acts as a parent to sync-function-pure and sync-function-schema. The classification system enables performance analysis based on assertion behavior patterns while maintaining flexibility for future suite additions.
