# Implementation Plan: Benchmark valueToSchema() Function

**Branch**: `004-benchmark-valuetoschema-we` | **Date**: October 13, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-benchmark-valuetoschema-we/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Primary requirement: Create a dedicated benchmark suite for the `valueToSchema()` function to identify performance bottlenecks across different input types and configurations. Technical approach involves using fast-check generators to produce diverse test data covering all code paths in `valueToSchema()`, with focus on the switch statement branches and recursive handling of arrays/objects.

## Technical Context

**Language/Version**: TypeScript with Node.js (existing project)  
**Primary Dependencies**: fast-check (property-based testing), tinybench (benchmarking), Zod v4 (schema validation)  
**Storage**: N/A  
**Testing**: Node.js built-in test runner with tsx loader (existing project setup)  
**Target Platform**: Node.js server environment  
**Project Type**: single (TypeScript library project)  
**Performance Goals**: Identify bottlenecks in valueToSchema() execution across different input types and complexity levels  
**Constraints**: Generators must not cause valueToSchema() to throw exceptions; benchmarks must test actual execution paths not just schema correctness  
**Scale/Scope**: Comprehensive coverage of all valueToSchema() code paths including primitives, objects, arrays, functions, built-in types, and various ValueToSchemaOptions combinations

**User Implementation Details**: Because there are many code paths within `valueToSchema()`, we need to create generators using `fast-check` to throw random data at it. Unlike other benchmarks, we cannot simply sample the first arbitrary that `fast-check` creates and use it n times - we need to do this for an arbitrary of m different types. We need to research the types based on the large `switch` statement within `valueToSchema`'s body, which contains behavior for many different types. It recursively handles arrays and objects, so we need arbitrary objects and arrays as well. We need to ensure the arbitraries are valid and don't cause `valueToSchema` to throw exceptions - there are only a couple cases where this is possible and they should be easily identifiable by examining the function body.

## Constitution Check

**Code Quality Standards**: ✅ TypeScript with ESLint/Prettier already established. Documentation will be provided for new benchmark generators and their usage patterns.  
**Test-Driven Development**: ✅ Benchmarks will have property-based validation to ensure generators produce valid inputs. Integration with existing test infrastructure using Node.js test runner.  
**User Experience Consistency**: ✅ Benchmark results will follow existing benchmark output format in bench/ directory. CLI integration with existing npm scripts.  
**Performance Requirements**: ✅ This IS a performance benchmarking feature - acceptance criteria include comprehensive coverage of valueToSchema() code paths and identification of bottlenecks.  
**Continuous Integration**: ✅ Benchmarks will integrate with existing CI via npm scripts and task runner infrastructure.

**Post-Design Re-Check**: ✅ All constitutional requirements maintained in design phase. API contracts follow existing patterns, data model aligns with TypeScript best practices, and integration approach preserves existing infrastructure.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
bench/                          # Existing benchmark infrastructure
├── config.ts                  # Benchmark configuration
├── runner.ts                  # Benchmark execution engine
├── comprehensive-suites.ts     # Existing benchmark suites
└── value-to-schema-suite.ts    # NEW: valueToSchema() benchmark suite

test-data/                      # Existing test data generators
├── index.ts                   # Existing generator exports
└── value-to-schema-generators.ts  # NEW: fast-check generators for valueToSchema

src/
├── value-to-schema.ts         # Target function to benchmark
└── (existing structure)

test/
├── bench/                     # NEW: Benchmark validation tests
│   └── value-to-schema-bench.test.ts
└── (existing test structure)
```

**Structure Decision**: Single TypeScript project structure. New benchmark suite will be added to existing `bench/` directory following established patterns. Generators will be added to `test-data/` directory to leverage existing generator infrastructure.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

**Task Generation Strategy**:

1. **Generator Development Tasks**:
   - Create `test-data/value-to-schema-generators.ts` with fast-check generators for each input category
   - Implement primitive type generators (string, number, boolean, bigint, symbol, etc.)
   - Implement builtin object generators (Date, RegExp, Map, Set, Error, etc.)
   - Implement recursive structure generators for nested objects and arrays
   - Add generator validation tests to ensure no exception-causing values

2. **Benchmark Suite Tasks**:
   - Create `bench/value-to-schema-suite.ts` following existing benchmark patterns
   - Implement benchmark execution logic using tinybench
   - Add option combination testing (all ValueToSchemaOptions permutations)
   - Create performance analysis functions for bottleneck identification
   - Add integration with existing benchmark runner

3. **Validation and Testing Tasks**:
   - Create `test/bench/value-to-schema-bench.test.ts` for benchmark validation
   - Add generator validation tests (ensure no **proto** objects, no ExpectItExecutor in strict mode)
   - Add performance regression tests with thresholds
   - Add reproducibility tests with fixed seeds

4. **Documentation and Integration Tasks**:
   - Update `bench/README.md` with valueToSchema benchmark documentation
   - Add npm scripts for running valueToSchema benchmarks
   - Update CI configuration to include benchmark validation
   - Add performance analysis documentation

**Ordering Strategy**:

- TDD order: Generator validation tests → Generator implementation → Benchmark validation tests → Benchmark implementation
- Dependency order: Generators before benchmark suite, validation before integration
- Mark parallel tasks: Generator categories can be implemented in parallel [P]

**Estimated Output**: 20-25 numbered, ordered tasks covering all aspects from test data generation through CI integration

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
