# Tasks: Enhanced Benchmark Suite Partitioning

**Input**: Design documents from `/specs/003-more-benchmark-suites/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Extract: TypeScript 5.x, tinybench, fast-check, Zod v4
   → Structure: Single project with bench/ directory focus
2. Load design documents:
   → data-model.md: Suite Definition, Assertion Classification entities
   → contracts/: CLI interface contracts for new suites
   → research.md: Classification strategy and overlap logic decisions
3. Generate tasks by category:
   → Setup: No new dependencies, linting validation
   → Tests: Contract tests for CLI behavior, assertion classification tests
   → Core: Classification logic, suite creation functions, runner updates
   → Integration: CLI help updates, overlap resolution logic
   → Polish: Performance validation, documentation updates
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `bench/`, `src/assertion/`, `test/` at repository root
- Paths based on existing Bupkis benchmark runner structure

## Phase 3.1: Setup

- [x] T001 Validate existing benchmark runner functionality with current sync-function suite
- [x] T002 [P] Run linting validation on bench/ directory to ensure clean baseline
- [x] T003 [P] Verify existing TypeScript configuration supports planned changes

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T004 [P] Contract test for assertion classification logic in `test/assertion/assertion-classification.test.ts`
- [x] T005 [P] Contract test for sync-function-pure suite creation in `test/assertion/sync-function-pure-suite.test.ts`
- [x] T006 [P] Contract test for sync-function-schema suite creation in `test/assertion/sync-function-schema-suite.test.ts`
- [x] T007 [P] Integration test for CLI help output with new suites in `test/bench/cli-help.test.ts`
- [x] T008 [P] Integration test for suite overlap resolution logic in `test/bench/suite-overlap.test.ts`
- [x] T009 [P] Integration test for backward compatibility in `test/bench/backward-compatibility.test.ts`

## Phase 3.3: Core Implementation ✅ (ONLY after tests are failing)

- [x] T010 [P] Create assertion classification utility function in `bench/assertion-classifier.ts` ✅
- [x] T011 [P] Implement sync-function-pure suite creation function in `bench/comprehensive-suites.ts`
- [x] T012 [P] Implement sync-function-schema suite creation function in `bench/comprehensive-suites.ts`
- [x] T013 Update AVAILABLE_SUITES object in `bench/runner.ts` with new suite definitions
- [x] T014 Implement suite overlap resolution logic in `bench/runner.ts`
- [x] T015 Update runBenchmarks function in `bench/runner.ts` to handle new suites
- [x] T016 Update CLI help output generation in `bench/runner.ts`

## Phase 3.4: Integration ✅

- [x] T017 Update performance thresholds in `bench/config.ts` for new suite categories
- [x] T018 Integrate classification logic with existing benchmark execution flow
- [x] T019 Update error handling for invalid suite combinations in `bench/runner.ts`
- [x] T020 Add deduplication logging and user feedback messages

## Phase 3.5: Polish ✅

- [x] T021 [P] Property-based tests for assertion classification in `test/property/assertion-classification.test.ts`
- [x] T022 [P] Performance validation tests comparing pure vs schema assertion speeds
- [x] T023 [P] Update README.md with new suite documentation in `bench/README.md`
- [x] T024 [P] Validate quickstart scenarios from quickstart.md
- [x] T025 Final integration test running all suite combinations

## Phase 3.6: Test Suite Cleanup ✅

- [x] T026 Remove benchmark tests from main test suite by updating package.json test script
- [x] T027 [P] Verify test files contain no emojis in `test/bench/*.test.ts`, `test/assertion/*suite*.test.ts`, and benchmark property tests
- [x] T028 Create separate `test:bench` script for running benchmark-related tests only

## Dependencies

- Setup (T001-T003) before tests (T004-T009)
- Tests (T004-T009) before implementation (T010-T016)
- T010 (classification utility) blocks T011, T012, T018
- T013-T016 (runner updates) must be sequential (same file)
- T017-T020 (integration) after core implementation
- Polish (T021-T025) after all implementation complete

## Parallel Example

```
# Launch T004-T009 together (all different test files):
Task: "Contract test for assertion classification logic in test/assertion/assertion-classification.test.ts"
Task: "Contract test for sync-function-pure suite creation in test/assertion/sync-function-pure-suite.test.ts"
Task: "Contract test for sync-function-schema suite creation in test/assertion/sync-function-schema-suite.test.ts"
Task: "Integration test for CLI help output with new suites in test/bench/cli-help.test.ts"
Task: "Integration test for suite overlap resolution logic in test/bench/suite-overlap.test.ts"
Task: "Integration test for backward compatibility in test/bench/backward-compatibility.test.ts"

# Launch T010-T012 together (different logical components):
Task: "Create assertion classification utility function in bench/assertion-classifier.ts"
Task: "Implement sync-function-pure suite creation function in bench/comprehensive-suites.ts"
Task: "Implement sync-function-schema suite creation function in bench/comprehensive-suites.ts"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- T013-T016 must be sequential (all modify bench/runner.ts)
- Classification logic must analyze existing assertions without breaking current functionality

## Task Generation Rules

_Applied during main() execution_

1. **From CLI Interface Contracts**:
   - Suite selection patterns → CLI integration tests [P]
   - Help output format → CLI help test [P]
   - Error handling → error handling implementation

2. **From Data Model Entities**:
   - Suite Definition → suite creation tasks [P]
   - Assertion Classification → classification utility [P]
   - Execution Plan → overlap resolution logic

3. **From Quickstart Scenarios**:
   - Performance comparison → validation tests [P]
   - Backward compatibility → compatibility test [P]
   - Deduplication behavior → integration test [P]

4. **Ordering**:
   - Setup → Tests → Classification → Suite Creation → Runner Updates → Integration → Polish
   - Classification utility blocks suite creation functions
   - Runner updates are sequential (same file modifications)

## Validation Checklist

_GATE: Checked by main() before returning_

- [x] All CLI contracts have corresponding tests (T007, T008, T009)
- [x] All data model entities have implementation tasks (T010, T011, T012)
- [x] All tests come before implementation (T004-T009 before T010-T016)
- [x] Parallel tasks truly independent (different files or logical components)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task (T013-T016 sequential for bench/runner.ts)

## Feature-Specific Validation

- [ ] Assertion classification covers all sync-function assertions
- [ ] New suites maintain performance characteristics (pure faster than schema)
- [ ] Parent suite overrides child suites (sync-function > sync-function-pure/schema)
- [ ] Backward compatibility preserved for all existing CLI commands
- [ ] Performance thresholds appropriate for pure vs schema assertion types
