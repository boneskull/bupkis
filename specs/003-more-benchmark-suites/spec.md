# Feature Specification: Enhanced Benchmark Suite Partitioning

**Feature Branch**: `003-more-benchmark-suites`  
**Created**: October 12, 2025  
**Status**: Draft  
**Input**: User description: "More benchmark suites. We have a bespoke benchmark runner which has partitioned all of the assertions into "suites" of assertions. These suites need to be further partitioned, while retaining the existing suites. This will necessarily result in overlap of the suites. Our runner should allow the user to choose any of the suites to run, in any combination, while ensuring effort is not duplicated by running the same benchmarks multiple times where overlap between suites exists."

## User Scenarios & Testing

### Primary User Story

As a Bupkis developer, I want to run benchmarks on specific subsets of assertions to analyze performance characteristics at different granularities. I need flexibility to run focused benchmarks for specific use cases while avoiding redundant execution when multiple suites contain the same assertions.

### Acceptance Scenarios

1. **Given** existing implementation-based suites (sync-function, sync-schema, async-function, async-schema), **When** I specify multiple overlapping suites, **Then** each unique assertion benchmarks only once per execution
2. **Given** new categorical suites (type, collection, comparison, pattern), **When** I run a combination like `--suite sync-function --suite type`, **Then** assertions present in both suites execute only once but appear in results for both contexts
3. **Given** any combination of suite selections, **When** I run the benchmark runner, **Then** I receive clear feedback about which suites were executed and which assertions were deduplicated
4. **Given** a desire to run focused benchmarks, **When** I specify granular suites like `--suite string-assertions --suite comparison-numeric`, **Then** only relevant assertions execute without broader suite overhead

### Edge Cases

- What happens when a user specifies all available suites explicitly vs using `--suite all`?
- How does the system handle invalid suite combinations or non-existent suite names?
- What feedback is provided when suite combinations result in no unique assertions to benchmark?

## Requirements

### Functional Requirements

- **FR-001**: System MUST support multiple new categorical benchmark suites organized by assertion functionality (type, collection, comparison, pattern)
- **FR-002**: System MUST support fine-grained suites that further partition categorical suites (e.g., string-type, numeric-comparison, array-collection)
- **FR-003**: System MUST deduplicate assertion execution when multiple selected suites contain the same assertions
- **FR-004**: Users MUST be able to specify any combination of suites using multiple `--suite` flags
- **FR-005**: System MUST maintain existing implementation-based suites (sync-function, sync-schema, async-function, async-schema) without modification
- **FR-006**: System MUST provide clear execution feedback showing which suites ran and how many unique assertions were executed
- **FR-007**: System MUST support both traditional `--suite all` behavior and explicit multi-suite selection
- **FR-008**: Benchmark results MUST maintain traceability to show which suites each assertion belongs to
- **FR-009**: Performance thresholds MUST work correctly with the new suite system
- **FR-010**: System MUST validate suite names and provide helpful error messages for invalid selections

### Key Entities

- **Suite Definition**: Logical grouping of assertions with name, description, and assertion filter criteria
- **Suite Registry**: Central registry mapping suite names to their definitions and maintaining overlap relationships
- **Execution Plan**: Deduplicated set of unique assertions to benchmark based on selected suites
- **Result Context**: Associates benchmark results with the suites that contain each assertion for proper reporting

---

## Review & Acceptance Checklist

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed
