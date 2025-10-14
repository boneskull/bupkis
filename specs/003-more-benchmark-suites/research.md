# Phase 0: Research - Assertion Analysis for Suite Partitioning

## Sync-Function Assertion Return Type Analysis

### Research Questions

1. **What are the current sync-function assertions and their return types?**
2. **How do we distinguish between pure assertions (AssertionFailure/boolean) and schema-based assertions (Zod schema/AssertionParseRequest)?**
3. **What is the performance impact difference between these two categories?**

### Decision: Assertion Classification Strategy

**Method**: Analyze assertion implementation source code to determine return types for categorization into pure vs schema-based suites.

**Rationale**: The user specified that sync-function assertions fall into two categories based on return behavior:

- Pure assertions: Return `AssertionFailure` objects or `boolean` on failure, `void` on success
- Schema-based assertions: Return Zod schemas or `AssertionParseRequest` objects that trigger additional parsing

**Implementation Analysis Required**:

- Examine `src/assertion/assertion-sync.ts` for `BupkisAssertionFunctionSync` implementations
- Review assertion implementations in `src/assertion/impl/` files
- Categorize each assertion by analyzing its callback function return type

### Decision: Suite Overlap Logic

**Method**: Implement hierarchical suite selection where parent suite (`sync-function`) overrides child suites (`sync-function-pure`, `sync-function-schema`).

**Rationale**: Prevents duplication when users select overlapping suites. If user specifies both `sync-function` and one of its sub-suites, only run `sync-function` to avoid redundant execution.

**Logic Pattern**:

```
if ('sync-function' in selectedSuites) {
  remove('sync-function-pure', 'sync-function-schema') from selectedSuites
}
```

### Decision: Performance Threshold Strategy

**Method**: Maintain existing threshold system but allow different thresholds for pure vs schema-based assertions.

**Rationale**: Schema-based assertions are expected to be "an order of magnitude slower" than pure assertions according to the user specification.

**Threshold Categories**:

- `sync-function-pure`: Lower threshold (faster expected performance)
- `sync-function-schema`: Higher threshold (parsing overhead expected)

### Alternatives Considered

**Alternative 1**: Tag-based system instead of separate suites

- **Rejected**: Doesn't provide clean CLI interface for targeted benchmarking

**Alternative 2**: Complete replacement of sync-function suite

- **Rejected**: Breaks backward compatibility requirement

**Alternative 3**: Dynamic runtime detection of return types

- **Rejected**: Adds complexity and runtime overhead to benchmarking

### Research Findings Summary

The implementation approach will:

1. Analyze existing sync-function assertions by examining their implementation source code
2. Create two new suite creation functions in comprehensive-suites.ts
3. Update AVAILABLE_SUITES with clear descriptions
4. Implement overlap prevention logic in runner.ts
5. Maintain backward compatibility while enabling granular performance analysis

**Next Phase**: Design contracts and data models for suite definitions and assertion classification.
