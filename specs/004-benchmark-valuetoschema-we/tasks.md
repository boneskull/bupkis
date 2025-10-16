# Tasks: Benchmark valueToSchema() Function

**Input**: Design documents from `/specs/004-benchmark-valuetoschema-we/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Tech stack: TypeScript, fast-check, tinybench, Zod v4
   → Structure: Single TypeScript library project
2. Load optional design documents:
   → data-model.md: ValueToSchemaBenchmarkSuite, InputCategory, TestDataGenerator, PerformanceMetrics, BenchmarkResult
   → contracts/: runValueToSchemaBenchmark, generateTestData, analyzeResults
   → research.md: Comprehensive type coverage, exception avoidance, option combinations
3. Generate tasks by category:
   → Setup: TypeScript, fast-check generators, benchmark integration
   → Tests: Generator validation, benchmark execution validation
   → Core: Generators, benchmark suite, performance analysis
   → Integration: Benchmark runner, npm scripts, CI
   → Polish: Documentation, performance regression tests
4. Apply task rules:
   → Different files = mark [P] for parallel
   → TDD: Tests before implementation
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

Single TypeScript project structure:

- `test-data/` - Fast-check generators
- `bench/` - Benchmark implementation
- `test/bench/` - Benchmark validation tests
- Existing structure preserved per plan.md

## Phase 3.1: Setup

- [x] T001 Create benchmark directory structure in `bench/` and `test-data/`
- [x] T002 [P] Configure TypeScript types for benchmark entities in `src/types.ts` updates
- [x] T003 [P] Add valueToSchema benchmark npm scripts to `package.json`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T004 [P] Generator validation test for primitives in `test/bench/value-to-schema-generators.test.ts`
- [x] T005 [P] Generator validation test for builtin objects in `test/bench/value-to-schema-generators.test.ts`
- [x] T006 [P] Generator validation test for nested structures in `test/bench/value-to-schema-generators.test.ts`
- [x] T007 [P] Exception avoidance test (no **proto**, no ExpectItExecutor in strict mode) in `test/bench/value-to-schema-generators.test.ts`
- [x] T008 [P] Benchmark execution contract test for `runValueToSchemaBenchmark` in `test/bench/value-to-schema-bench.test.ts`
- [x] T009 [P] Test data generation contract test for `generateTestData` in `test/bench/value-to-schema-bench.test.ts`
- [x] T010 [P] Performance analysis contract test for `analyzeResults` in `test/bench/value-to-schema-bench.test.ts`
- [x] **T011**: Integration test for benchmark runner integration ✅

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] **T012**: Implement primitive value generators ✅
- [x] **T013**: Implement benchmark suite orchestration and execution ✅
- [ ] T014 [P] Builtin object generators (Date, RegExp, Map, Set, Error, Promise-like) in `test-data/value-to-schema-generators.ts`
- [ ] T015 [P] Recursive structure generators (nested objects, arrays) in `test-data/value-to-schema-generators.ts`
- [ ] T016 [P] Generator factory and exception filtering logic in `test-data/value-to-schema-generators.ts`
- [ ] T017 [P] InputCategory implementation with generator integration in `bench/value-to-schema-suite.ts`
- [ ] T018 [P] TestDataGenerator factory implementation in `bench/value-to-schema-suite.ts`
- [ ] T019 ValueToSchemaBenchmarkSuite orchestration implementation in `bench/value-to-schema-suite.ts`
- [ ] T020 PerformanceMetrics collection and analysis in `bench/value-to-schema-suite.ts`
- [ ] T021 BenchmarkResult aggregation and reporting in `bench/value-to-schema-suite.ts`

## Phase 3.4: Integration

- [ ] T022 Integrate with existing benchmark runner in `bench/runner.ts`
- [ ] T023 Add valueToSchema suite to comprehensive benchmark system in `bench/comprehensive-suites.ts`
- [ ] T024 Configure performance thresholds in `bench/config.ts`
- [ ] T025 Add CLI options for valueToSchema benchmark execution in `bench/runner.ts`

## Phase 3.5: Polish

- [ ] T026 [P] ValueToSchemaOptions combination testing in `test/bench/value-to-schema-options.test.ts`
- [ ] T027 [P] Performance regression detection tests in `test/bench/value-to-schema-regression.test.ts`
- [ ] T028 [P] Update benchmark documentation in `bench/README.md`
- [ ] T029 [P] Add examples and troubleshooting to documentation
- [ ] T030 [P] Export generator utilities in `test-data/index.ts`
- [ ] T031 Validate quickstart scenarios from `quickstart.md`

## Dependencies

- Setup (T001-T003) before everything
- Tests (T004-T011) before implementation (T012-T021)
- T012-T016 (generators) before T017-T021 (benchmark suite)
- T017-T018 (categories/factory) before T019-T021 (suite/metrics/results)
- Core implementation (T012-T021) before integration (T022-T025)
- Integration before polish (T026-T031)

## Parallel Example

```bash
# Launch generator validation tests together (T004-T007):
Task: "Generator validation test for primitives in test/bench/value-to-schema-generators.test.ts"
Task: "Generator validation test for builtin objects in test/bench/value-to-schema-generators.test.ts"
Task: "Generator validation test for nested structures in test/bench/value-to-schema-generators.test.ts"
Task: "Exception avoidance test in test/bench/value-to-schema-generators.test.ts"

# Launch contract tests together (T008-T010):
Task: "Benchmark execution contract test in test/bench/value-to-schema-bench.test.ts"
Task: "Test data generation contract test in test/bench/value-to-schema-bench.test.ts"
Task: "Performance analysis contract test in test/bench/value-to-schema-bench.test.ts"

# Launch generator implementations together (T012-T015):
Task: "Primitive type generators in test-data/value-to-schema-generators.ts"
Task: "Special primitive generators in test-data/value-to-schema-generators.ts"
Task: "Builtin object generators in test-data/value-to-schema-generators.ts"
Task: "Recursive structure generators in test-data/value-to-schema-generators.ts"
```

## Notes

- [P] tasks target different sections/files and can run in parallel
- All generator tests must validate that generated values don't cause `valueToSchema()` exceptions
- Benchmark suite must integrate with existing tinybench infrastructure
- Performance thresholds should be based on existing benchmark patterns in `config.ts`
- Follow existing naming conventions from `comprehensive-suites.ts`

## Task Generation Rules

**From Contracts (3 main contracts)**:

- `runValueToSchemaBenchmark` → T008 contract test + T019-T021 implementation
- `generateTestData` → T009 contract test + T012-T016 generator implementation
- `analyzeResults` → T010 contract test + T020 analysis implementation

**From Data Model (5 core entities)**:

- `TestDataGenerator` → T018 factory + T012-T016 generators
- `InputCategory` → T017 implementation
- `ValueToSchemaBenchmarkSuite` → T019 orchestration
- `PerformanceMetrics` → T020 collection
- `BenchmarkResult` → T021 aggregation

**From Research Decisions**:

- Exception avoidance → T007 validation + T016 filtering
- Comprehensive type coverage → T012-T015 generators for all switch cases
- Option combinations → T026 testing

**From Quickstart Scenarios**:

- npm script integration → T003 + T031 validation
- CI integration → T022-T025 runner integration
- Troubleshooting → T028-T029 documentation

## Validation Checklist

- [x] All contracts have corresponding tests (T008-T010)
- [x] All entities have implementation tasks (T017-T021)
- [x] All tests come before implementation (T004-T011 before T012-T021)
- [x] Parallel tasks target different files/sections
- [x] Each task specifies exact file path
- [x] No [P] task conflicts with another [P] task on same file
